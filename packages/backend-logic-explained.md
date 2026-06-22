# Backend Logic Explained

This document explains the implemented backend logic for every app under `apps/` except `frontend`, then goes deeper on websocket packages, OAuth, stored data, and the difference between what exists today and what is still planned or missing.

The backend is organized as a small service-oriented system:

- `apps/BFF`: browser-facing API facade.
- `apps/auth-user`: identity, sessions, roles, OAuth exchange, audit logs.
- `apps/game`: realtime game/lobby websocket service and server-side game state machine.
- `apps/social`: profiles, privacy, presence, friends, blocks, clans, chat, uploads.
- `apps/stats`: player statistics, match history, achievements, weapons, audit.
- `apps/nginx`: container/static asset delivery layer.

The highest-priority services are `auth-user`, `BFF`, and `game`, because they define who the user is, how public requests enter the system, and how realtime play currently works.

## 1. System Shape

The codebase is not a single monolith. It is closer to a group of NestJS services with separate responsibilities.

The `BFF` is the public HTTP entry point for normal frontend calls. It does not own most business data. Instead, it forwards requests to internal services and normalizes their responses. It also hides internal URL shapes from the frontend.

The `auth-user` service owns identity and session truth. It stores users, roles, provider links, sessions, password hashes, and audit logs. Other services trust access tokens issued by this service, or call it to verify tokens.

The `game` service owns realtime lobby/game state in memory. It uses Socket.IO for packets. It does not currently persist matches, damage, game outcomes, or lobby state to a database.

The `social` service owns social graph and chat persistence. It stores profile data, privacy settings, presence state, friendships, blocks, clans, chat threads, messages, and file metadata.

The `stats` service owns player statistics and match records. It is not yet fully integrated with the realtime game service.

The `nginx` app is not really business logic. It packages/serves static assets such as `.obj`, `.mtl`, `.png`, and `.glb` files used by the game.

## 2. `apps/BFF`

### Role

`BFF` means Backend For Frontend. Its job is to provide frontend-friendly HTTP routes and call the internal services behind the scenes.

It exists so the frontend does not need to know the internal service topology:

- auth service URLs
- social service URLs
- stats service URLs
- internal route prefixes
- service-to-service headers
- downstream error formats

### Main technical choices

The BFF is a NestJS app using controllers and injectable services. It uses `axios` to call other internal services.

It forwards:

- `Authorization` bearer tokens
- `x-request-id`
- `x-service-name: bff`

That is important because the downstream services can audit or validate the request context.

The BFF mostly does not store data. Its logic is orchestration and translation.

### Auth facade

The auth facade is implemented in:

- `apps/BFF/src/modules/auth/auth.controller.ts`
- `apps/BFF/src/modules/auth/auth.service.ts`
- `apps/BFF/src/modules/auth/google-auth.service.ts`

Public auth routes include:

- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/google/exchange`
- `GET /auth/google/start`
- `GET /auth/google/callback`
- `POST /auth/logout`
- `POST /auth/refresh`
- `POST /auth/password/set`
- `GET /auth/verify`
- `GET /auth/me`

The BFF forwards these to `auth-user` internal routes. It also maps internal auth responses into public auth response DTOs.

For protected calls, it checks that the `Authorization` header exists and begins with `Bearer `. That is a lightweight gateway check. The actual token verification happens in `auth-user`.

### Google OAuth facade

The BFF owns the browser-facing OAuth redirect flow.

When the frontend starts Google OAuth, BFF generates a Google authorization URL with:

- `client_id`
- `redirect_uri`
- `response_type=code`
- `scope=openid email profile`
- `state`
- `access_type=offline`
- `include_granted_scopes=true`
- `prompt=select_account`

The `state` value is signed by the BFF:

- payload contains a random nonce and issue time
- payload is base64url encoded
- signature is HMAC SHA-256
- the max age is 300 seconds

This protects the callback against forged or stale OAuth state values.

On callback, BFF:

1. Checks if Google returned an error.
2. Requires both `code` and `state`.
3. Verifies the signed state.
4. Sends the authorization code to `auth-user` through `googleExchange`.
5. Redirects back to the frontend callback URL.

Tokens are placed in the URL hash, not the query string. That means the tokens are not normally sent back to servers as part of HTTP requests after the redirect. This is a deliberate browser-flow choice, but it still means the frontend receives and stores/handles tokens client-side.

### Social facade

The social facade is implemented in:

- `apps/BFF/src/modules/social/social.controller.ts`
- `apps/BFF/src/modules/social/social.service.ts`

It exposes frontend-friendly routes such as:

- `GET /users/me/profile`
- `PATCH /users/me/profile`
- `POST /users/me/avatar`
- `DELETE /users/me/avatar`
- `GET /friends`
- `GET /friends/requests/incoming`
- `POST /friends/requests`
- `GET /clans`
- `POST /clans`
- `GET /chats`
- `POST /chats/:threadId/messages`

For routes using `me`, the BFF first calls auth verification and extracts the current user id from the token claims. It then calls the social service using the explicit user id in the internal route.

This is a useful technical choice: the frontend gets ergonomic routes, while the internal service still receives explicit resource identifiers.

### Stats facade

The stats facade is implemented in:

- `apps/BFF/src/modules/stats/stats.controller.ts`
- `apps/BFF/src/modules/stats/stats.service.ts`

It forwards stats reads to the stats service and computes small derived values:

- total matches = wins + losses
- win rate = wins / total matches
- K/D = kills / deaths, or kills if deaths is zero

There is also admin-only stats access in the BFF auth service. The BFF verifies the caller through auth, checks for an admin role, and only then calls internal stats update/read endpoints.

### What BFF stores

Nothing durable in the code shown.

The BFF does not own a database schema. It stores only transient request data in memory during request handling.

### What is missing or limited

- BFF does not deeply validate all proxied social payloads. Many are passed through as `unknown`.
- BFF does not hide tokens in secure HTTP-only cookies. Tokens are returned to the frontend.
- BFF does not provide a websocket proxy for the game or social sockets in the code shown.
- BFF does not own service discovery; service URLs come from config.

## 3. `apps/auth-user`

### Role

`auth-user` is the identity authority.

It owns:

- local registration
- local login
- Google OAuth exchange
- access token issuing
- refresh token issuing and rotation
- logout/session revocation
- token verification
- role management
- user enable/disable
- audit logs
- user directory search

### Data stored

The Prisma schema stores the following.

#### `User`

Stores the account core:

- `id`: UUID
- `email`: unique
- `username`: optional unique display/login handle
- `passwordHash`: optional, null for OAuth-only users until they set a password
- `status`: `ACTIVE`, `DISABLED`, or `PENDING_VERIFICATION`
- `createdAt`
- `updatedAt`
- `disabledAt`

The optional password hash is important. It lets the same user model support:

- local accounts with passwords
- OAuth-created accounts without passwords
- OAuth accounts that later set a password

#### `Role` and `UserRole`

Stores role names and many-to-many user role assignment.

The Google OAuth flow assigns the default `USER` role when creating a new account, and also backfills `USER` if an existing user has no roles.

#### `Session`

Stores refresh-session state:

- `id`: UUID session id
- `userId`
- `refreshTokenHash`
- `userAgent`
- `ipAddress`
- `expiresAt`
- `revokedAt`
- `createdAt`

The raw refresh token is not stored. The database only stores the hash.

#### `AuthProvider`

Stores OAuth provider links:

- `provider`: `LOCAL`, `GOOGLE`, `GITHUB`, `FORTY_TWO`
- `providerUserId`: provider-side stable id
- `userId`
- `createdAt`

Today, Google is implemented. The enum anticipates GitHub and 42, but the implementation shown only handles Google exchange.

For Google, `providerUserId` is Google `sub`.

#### `PasswordResetToken`

Stores reset token hashes:

- `tokenHash`
- `expiresAt`
- `usedAt`
- `createdAt`

The schema exists. The surrounding implementation appears prepared, but the main flow in the inspected code focused on register/login/refresh/logout/password set/OAuth.

#### `AuditLog`

Stores security-relevant events:

- target `userId`
- `actorUserId`
- action enum
- IP
- user agent
- metadata JSON
- created timestamp

Actions include:

- user registration
- verification
- login success/failure
- refresh success/failure
- logout
- session revocation
- Google exchange
- role changes
- password reset events
- user enable/disable

### Access token choice

Access tokens are signed JWTs.

Claims include:

- `sub`: user id
- `email`
- `roles`
- `sessionId`
- standard issuer/audience/iat/exp

The implementation verifies:

- signature
- issuer
- audience
- required claims
- timestamps through the JWT library

This is a common service-oriented choice. Other services can verify user identity from the token without constantly calling the database, while still retaining session linkage through `sessionId`.

### Refresh token choice

Refresh tokens are opaque random values.

The raw token is generated with cryptographic random bytes and sent to the client once. The service stores only:

- SHA-256 hash of token plus pepper
- session id
- expiry
- revoked timestamp if revoked

Verification uses timing-safe comparison.

This is a stronger choice than storing refresh tokens directly. If the session table leaks, attackers do not immediately get usable refresh tokens.

Refresh rotation updates the stored refresh token hash and expiry for the existing session.

### Redis session cache

Auth caches session data in Redis under keys like:

`auth:session:<sessionId>`

The cached value includes:

- user id
- user status
- roles
- request id, if present
- service name, if present

The TTL is derived from the session expiry.

This cache allows session verification to avoid repeatedly loading everything from the database. The database remains the durable source of truth.

### Google OAuth flow in depth

The OAuth flow is split into two parts.

#### BFF responsibility

BFF handles the browser and redirect UX:

- builds the Google authorization URL
- signs and validates `state`
- receives Google callback
- calls auth-user with authorization code
- redirects the browser back to frontend

This keeps the frontend simpler and avoids putting Google client secrets in browser code.

#### auth-user responsibility

`auth-user` handles identity proof and account mutation:

1. Requires provider to be `google`.
2. Accepts either an `idToken` or an authorization code plus redirect URI.
3. If using an authorization code, exchanges it with Google token endpoint.
4. Verifies the resulting ID token using Google token info.
5. Checks issuer is Google.
6. Checks audience equals configured Google client id.
7. Requires `sub` and email.
8. Requires Google email to be verified.
9. Looks for an existing provider link by `GOOGLE + sub`.
10. If no provider link exists, looks for an existing local user by email.
11. If email exists, links Google to that user.
12. If email does not exist, creates a new active OAuth user.
13. Assigns `USER` role if needed.
14. Creates a session with hashed refresh token.
15. Writes audit logs.
16. Issues an access token.
17. Caches the session in Redis.
18. Best-effort initializes stats for newly created users.

The email-linking behavior is a product/security choice. It means a Google login with the same verified email can attach to an existing local account. That is convenient, but it depends on trusting Google's verified email claim.

The service does not store Google access tokens or Google refresh tokens. It uses Google only as an identity proof.

### What auth-user stores for OAuth

For a Google-created account:

- `User.email`
- `User.status = ACTIVE`
- optional `User.username = null`
- `User.passwordHash = null`
- `AuthProvider.provider = GOOGLE`
- `AuthProvider.providerUserId = Google sub`
- `Role/UserRole = USER`
- `Session.refreshTokenHash`
- `Session.ipAddress`
- `Session.userAgent`
- audit events for registration, Google exchange, and login success

What it does not store:

- Google profile picture
- Google display name
- Google access token
- Google refresh token
- OAuth scopes granted
- raw ID token
- raw refresh token

### What is missing or limited

- GitHub and 42 provider enum values exist, but flows are not implemented.
- OAuth state is owned by BFF and is stateless HMAC-signed, not stored server-side. This is fine, but no one-time-use state replay table exists.
- No HTTP-only cookie session transport is implemented in the inspected code.
- Google token verification uses Google's token info endpoint rather than local JWKS verification.
- New OAuth-created users have no username by default.
- Stats initialization is best effort and uses an internal HTTP call. Failure is logged but does not fail login.

## 4. `apps/game`

### Role

The game service owns realtime lobby and gameplay flow.

It uses:

- NestJS websocket gateway
- Socket.IO
- in-memory lobby state
- BabylonJS `NullEngine` server-side
- state machine classes for game phases

The service currently creates one lobby in `LobbyManager`.

### Main technical choice: in-memory realtime state

Game state is not persisted. Lobbies are created in memory when the service starts.

This makes the current implementation simple and fast:

- no database round trip per packet
- server can tick in memory
- lobby/game object model is direct

The tradeoff is that state is lost on process restart and cannot scale horizontally without a shared state model or sticky sessions.

### Socket.IO gateway

The gateway listens at:

`/socket.io/`

Client-to-server event:

`msgToServer`

Server-to-client event:

`msgToClient`

The payload is a JSON string, not a raw object.

On `CS_JoinLobby`, the socket stores:

- `client.data.userId`
- `client.data.lobbyId`

This lets disconnect cleanup find the correct lobby and user later.

When the lobby emits data, the gateway broadcasts:

`this.server.emit('msgToClient', payload)`

That sends to all connected sockets. There is not yet socket-room targeting or per-player packet delivery.

### LobbyManager

`LobbyManager` owns the array of lobbies.

Today:

- `amount = 1`
- creates one `Lobby`
- listens for lobby outgoing data
- emits `dataToEmit`
- logs client/server packets unless hidden by config

Incoming packets are validated only at a basic envelope level:

- packet must have `type`
- `lobbyId` must exist
- `lobbyId` must be in range

Then the packet goes to the lobby.

### Lobby

A `Lobby` stores:

- `id`
- lobby state
- `ClientManager`
- Babylon `NullEngine`
- sequence handler
- game object
- message queue

The lobby owns the main loop:

1. Read queued packets.
2. Handle them according to lobby state.
3. Tick the game.
4. Render the server-side scene.

The server-side `msgToClient` helper:

- increments sequence
- creates packet with `type`, `lobbyId`, `seq`, and data
- stringifies it
- emits it through the gateway callback

The sequence handler is currently configured as if all players are one logical target:

- `SeqHandler(1)`
- register player `unused`

That matches the current broadcast-only implementation.

### Lobby states

Lobby state is separate from game state.

Lobby states include:

- open lobby
- loading
- game
- end screen

When lobby state changes:

- the service sends a corresponding server-client state packet
- clients are reset for readiness/loading
- game state is moved if appropriate
- end screen disposes the old game and creates a new one

### Game state machine

The game has numeric states:

- `GAME_PENDING = 0`
- `GAME_LOADING = 1`
- `GAME_START = 2`
- `ROUND_START = 3`
- `TURN_START = 4`
- `PICK_WORM = 5`
- `MOVEMENT = 6`
- `AIMING = 7`
- `TURN_END = 8`
- `GAME_END = 9`

Each state has a class implementing the state interface.

The `Game` object stores:

- Babylon engine
- scene
- camera
- state map
- current state
- lobby reference
- turn order
- aiming data

The game tick keeps ticking while state changes, so one tick can advance through immediate transition states.

### Data stored in game memory

The game stores only in memory:

- connected clients
- client lobby slots
- readiness
- loading progress
- active player
- generated game data
- map points
- player spawn data
- worm spawn data
- chosen worm
- chosen weapon on frontend side after packets
- current aiming data on server
- lobby state
- game state
- sequence counter

There is no database storage for:

- lobby records
- match records
- turn history
- damage
- projectile hits
- winner
- replay
- reconnect state

### Game websocket package model

The implemented game packet source of truth is in:

- `shared/game/packets/ClientServerPackets.ts`
- `shared/game/packets/ServerClientPackets.ts`
- `shared/game/packets/util.ts`
- `shared/game/packets/Client.ts`

The contracts under `packages/contracts/game` have been updated to match these implemented packet names.

#### Base client-to-server shape

All client-to-server packets include:

```json
{
  "lobbyId": 0,
  "userId": "user-uuid"
}
```

They also include a `type`.

#### Base server-to-client shape

All server-to-client packets include:

```json
{
  "lobbyId": 0,
  "seq": [1]
}
```

They also include a `type`.

`seq` is an array because the sequence handler is shaped for per-player sequence data, even though today it is used as a single broadcast sequence.

### Client-to-server packets currently implemented

#### `CS_JoinLobby`

Sent when a user joins a lobby slot.

Data:

- `lobbyId`
- `userId`
- `userName`

Server behavior:

- stores user id/lobby id on socket data
- rejects duplicate user id
- rejects if lobby has more than 4 players
- assigns first free slot
- assigns slot color
- sends `SC_ConnectSuccess`
- sends `SC_LobbyData`

Stored data:

- in-memory client entry with id, name, slot, color, ready status, loading status

#### `CS_ReadyChange`

Sent when user toggles ready.

Data:

- `ready`

Server behavior:

- finds client by user id
- updates `client.ready`
- broadcasts `SC_ReadyChange`

Stored data:

- in-memory readiness only

#### `CS_LoadingProgress`

Sent while the frontend is loading assets.

Data:

- `percentage`
- `msg`

Server behavior:

- updates client loading progress and message

Stored data:

- in-memory loading progress and loading message

#### `CS_FinishedLoading`

Sent when the client finishes loading.

Server behavior:

- marks loading message as finished
- marks loading done

Stored data:

- in-memory loading done flag

#### `CS_FailedLoading`

Sent when the client fails loading.

Data:

- `msg`

Server behavior:

- marks loading failed
- stores failure message

Stored data:

- in-memory loading failed flag and message

#### `CS_GetGameState`

Requests the current game state.

Server behavior:

- sends `SC_DEV_GameState`

This is effectively debug/helper behavior.

#### `CS_RequestChangeGameState`

Requests a game state change.

Data:

- `state`

Server behavior:

- only active player can request it
- calls `game.setState`

Limitation:

- validation is very broad. It checks active user but does not fully validate whether the requested transition is legal.

#### `CS_WormChosen`

Sent when player chooses a worm.

Data:

- `wormId`

Server behavior:

- broadcasts `SC_WormChosen`

Limitation:

- server currently trusts it
- no ownership validation yet
- no state validation yet

#### `CS_WeaponChosen`

Sent when player chooses a weapon.

Data:

- `id`: numeric weapon id

Server behavior:

- broadcasts `SC_WeaponChosen`

Limitation:

- no inventory count checking
- no weapon ownership/availability check

#### `CS_AimAngle`

Sent when weapon aim angle changes.

Data:

- `angle`

Server behavior:

- broadcasts `SC_AimAngle`

This is hidden from logs because it may be high-frequency.

#### `CS_AimTargetAngle`

Sent when target direction angle changes.

Data:

- `angle`

Server behavior:

- broadcasts `SC_AimTargetAngle`

#### `CS_AimMoveTarget`

Sent when aiming target point moves.

Data:

- `point: { x, y }`

Server behavior:

- broadcasts `SC_AimMoveTarget`

This is also hidden from logs as a likely high-frequency packet.

#### `CS_SwitchAimState`

Sent when an aim sub-state enters or exits.

Data:

- `entering`
- `stateId`

`stateId` values:

- `0`: `AimAngle`
- `1`: `PianoPickPosition`
- `2`: `PickPosition`
- `3`: `SwitchTargetAngle`

Server behavior:

- broadcasts `SC_SwitchAimState`

#### `CS_CancelAiming`

Sent when client wants to reset/cancel aiming.

Server behavior:

- broadcasts `SC_CancelAiming`

#### `CS_EndAimState`

Final aiming commit.

Data:

- `wormAngle`
- `position: { x, y }`
- `targetAngle`
- `force`

Server behavior:

- active player check
- stores data in `game.aimingData`
- requests change to `TURN_END`
- emits `SC_ExplosionOccurs`

Current placeholder behavior:

- the server does not simulate the projectile
- the server does not calculate hit
- the server does not calculate damage
- the server sends an explosion at the submitted position with radius `3`

### Dev-only client packets

These exist and should not be treated as production protocol:

- `CS_DEV_StartLobby`
- `CS_DEV_StartLoading`
- `CS_DEV_StartGame`
- `CS_DEV_StartEndscreen`
- `CS_DEV_ButtonPress`
- `CS_DEV_SetGameState`

They let clients force state changes or test packet echo behavior.

### Server-to-client packets currently implemented

#### State packets

- `SC_StartLobby`
- `SC_StartLoading`
- `SC_StartGame`
- `SC_GameFinished`
- `SC_InvalidState`

These tell clients which high-level frontend/lobby/game page/state to show.

#### `SC_ConnectSuccess`

Sent after successful lobby join.

Data:

- `userId`

#### `SC_ConnectFail`

Sent after failed lobby join.

Data:

- `userId`
- `msg`

Reasons today:

- duplicate user id
- lobby full

#### `SC_ClientDisconnect`

Sent when a client disconnects from open lobby.

Data:

- `userId`

Server also sends `SC_LobbyData` afterward as insurance to keep clients synced.

#### `SC_LobbyData`

Full lobby sync.

Data:

- `lobbyData`: array of clients

Each client has:

- `id`
- `name`
- `slot`
- `color`
- `ready`
- `loading.progress`
- `loading.msg`
- `loading.done`
- `loading.failed`

#### `SC_ReadyChange`

Broadcast when a user changes readiness.

Data:

- `userId`
- `ready`

#### Loading packets

Defined server packets include:

- `SC_FinishedLoading`
- `SC_FailedLoading`
- `SC_LoadingProgress`

These exist in shared packet definitions. Loading tick helpers decide when to send some of these based on lobby loading state.

#### `SC_DEV_GameState`

Debug/helper packet.

Data:

- `gameState`

Frontend uses this to update UI and state machine.

#### `SC_GameData`

Initial game load data.

Data:

- `players`
- `map`

Player data:

- player id
- slot
- name
- worms

Worm data:

- worm id
- position `{ x, y }`

Map data:

- points as `{ x, y }`

This is the closest thing to a game-start snapshot.

#### `SC_ActivePlayerChanged`

Sent when active player changes.

Data:

- `activeId`

Frontend stores this as the active player id.

#### `SC_WormChosen`

Broadcast after worm chosen.

Data:

- `wormId`

Frontend finds that worm and stores it as current chosen worm.

#### `SC_WeaponChosen`

Broadcast after weapon chosen.

Data:

- `id`

Frontend resolves this id against loaded weapons.

#### Aiming mirror packets

The server broadcasts the client's aiming updates:

- `SC_AimAngle`
- `SC_AimTargetAngle`
- `SC_AimMoveTarget`
- `SC_SwitchAimState`
- `SC_CancelAiming`

These mostly synchronize visual state across clients.

#### `SC_ExplosionOccurs`

Current shooting-resolution placeholder.

Data:

- `point: { x, y }`
- `radius`

Frontend behavior:

- only handles it during `TURN_END`
- affects terrain visually

What it does not include:

- projectile id
- weapon id
- hit normal
- damaged worms
- damage amounts
- knockback vectors
- death info
- next turn info
- state hash

### Game packets that are not implemented

The contracts now mark these explicitly as not implemented:

- inventory data
- worm movement input
- worm movement result
- projectile simulation
- knockback simulation
- damage application
- timer over
- rematch click
- winner payload on game finished

There is also a legacy planned event-stream file:

- `packages/contracts/game/stefans_packets.json`

It now contains valid JSON, but it is explicitly marked as planned/legacy and not implemented.

The live implemented packet catalog is:

- `packages/contracts/game/implemented.websocket.packets.json`

### Game implementation gaps

The biggest gaps are:

- no authentication on the game socket itself
- user id comes from packet payload, not verified token claims
- no room-based targeted sends
- no persisted lobby/match state
- no authoritative physics result
- no projectile simulation on server
- no damage/winner calculation
- no stats integration at game end
- no reconnect model
- no matchmaking
- no anti-cheat validation beyond a few active-player checks

The current game is a working realtime state/packet skeleton, not yet a fully authoritative game server.

## 5. `apps/social`

### Role

The social service owns user-facing social data:

- profiles
- avatars
- privacy
- presence
- friends
- friend requests
- blocks
- clans
- clan members
- clan invites
- clan join requests
- chats
- chat messages
- websocket chat

### Technical choices

The social service uses:

- NestJS controllers/services
- Prisma/PostgreSQL
- Redis for realtime presence
- RabbitMQ event publishing
- Socket.IO for chat/presence
- bearer token guards

It verifies callers using bearer access tokens. It also has an `AuthDirectoryService` for searching identity data from auth-user.

### Data stored

#### `StoredFile`

Stores uploaded file metadata:

- owner user id
- file kind
- original name
- MIME type
- size
- storage path
- public path
- SHA-256
- created/deleted timestamps

Actual files are written to disk under configured uploads root.

#### `UserProfile`

Stores social profile data:

- user id
- display name
- avatar file id
- bio
- country
- timestamps

The profile is keyed by auth user id. Social does not own the auth identity itself.

#### `UserPrivacySetting`

Stores privacy choices:

- profile visibility
- friends visibility
- last seen visibility
- DM policy

DM policy can restrict messages to friends or block DMs.

#### `UserPresence`

Stores presence status and last-seen data:

- status
- last seen timestamp
- updated timestamp

Redis is used to track active socket connections. The DB stores durable presence/last seen state.

#### Friend data

`FriendRequest` stores:

- from user
- to user
- status
- optional message
- created/responded timestamps

`Friendship` stores the accepted friend pair using sorted ids:

- `userLowId`
- `userHighId`

The sorted-pair choice prevents duplicate friendship rows in opposite directions.

#### Block data

`Block` stores:

- blocker id
- blocked id
- created timestamp

Blocking removes friendships and cancels pending friend requests between the users.

#### Clan data

`Clan` stores:

- name
- tag
- owner
- visibility
- join policy
- description
- avatar
- timestamps

`ClanMember` stores:

- clan id
- user id
- role
- joined timestamp
- muted until

`ClanInvite` and `ClanJoinRequest` store request flows around clan membership.

When a clan is created, the service also creates a clan chat thread and adds the owner as a participant.

#### Chat data

`ChatThread` stores:

- type: DM or clan
- clan id if clan thread
- creator
- created timestamp
- last message timestamp

`ChatParticipant` stores:

- thread id
- user id
- joined timestamp
- last read timestamp
- mute flag

`Message` stores:

- thread id
- sender user id
- content
- content type
- optional client message id
- created/edited/deleted timestamps

`MessageDeletion` stores per-user deletion markers.

### Social REST behavior

The controller exposes many internal routes. Important behaviors:

- profiles are lazily ensured with default privacy and offline presence
- users can only update self unless admin
- private profiles/friends/presence are visibility-gated
- friend requests cannot be self-directed
- blocks prevent friend requests and DMs
- DMs respect target user's DM policy
- clan private visibility requires membership unless admin
- clan admin actions require owner/admin role unless service admin
- chat reads/writes require participant membership

### Social websocket packages

Socket.IO path:

`/social/socket.io/`

Authentication:

- token from `handshake.auth.token`, or
- token from `Authorization: Bearer`

On connection:

1. Extract bearer token.
2. Verify active principal.
3. Store token/principal/user id on socket data.
4. Join room `user:<userId>`.
5. Mark socket online in Redis.
6. Update DB presence to online.
7. Schedule periodic active-session checks.
8. Emit `presence.updated` to the connected client.

On disconnect:

1. Clear session check timer.
2. Remove socket connection from Redis.
3. If user has no active sockets left, mark DB presence offline.
4. Broadcast `presence.updated` offline.

Implemented socket events:

#### `clan.join`

Payload:

```json
{
  "clanId": "clan-uuid"
}
```

Checks:

- active socket principal
- clan id exists in payload
- user is member of clan

Effect:

- joins socket room `clan:<clanId>`

Response:

```json
{
  "ok": true
}
```

#### `thread.join`

Payload:

```json
{
  "threadId": "thread-uuid"
}
```

Checks:

- active socket principal
- thread id exists
- user can access thread

Effect:

- joins socket room `thread:<threadId>`

#### `clan.message`

Payload:

```json
{
  "clanId": "clan-uuid",
  "content": "hello",
  "clientMessageId": "optional-client-id"
}
```

Checks:

- active principal
- clan id and content exist
- clan chat exists
- sender can write to clan chat

Effect:

- creates a persisted message
- emits `message.created` to `clan:<clanId>`

#### `thread.message`

Payload:

```json
{
  "threadId": "thread-uuid",
  "content": "hello",
  "clientMessageId": "optional-client-id"
}
```

Checks:

- active principal
- thread membership
- participant not muted

Effect:

- creates persisted message
- updates thread `lastMessageAt`
- emits `message.created` to `thread:<threadId>`

#### `typing.start`

Payload:

```json
{
  "threadId": "thread-uuid"
}
```

Checks:

- active principal
- thread access

Effect:

- emits `typing.updated` to everyone else in the thread room

### What social does not currently show

- no typing stop event in inspected gateway
- no websocket message edit/delete broadcast in gateway code, though REST publishes events
- no file attachments in message payload despite file schema supporting attachments
- no advanced notification delivery shown
- no read receipts over websocket beyond REST `markThreadRead`

## 6. `apps/stats`

### Role

The stats service owns game/player stat persistence.

It stores:

- player stats
- achievements
- weapon usage
- matches
- match participants
- audit logs

### Data stored

#### `PlayerStats`

Stores aggregate player counters:

- user id
- XP
- level
- wins
- losses
- kills
- deaths
- damage dealt
- damage taken
- timestamps

It relates to achievements, weapon usage, and match history.

#### `Achievement`

Stores:

- user id
- achievement type
- achieved timestamp

The spelling in the schema/code uses `Achievement`, while some module names use `achivements`.

#### `WeaponUsage`

Stores per-user weapon stats:

- weapon name/id string
- shots fired
- hits
- kills
- damage
- timestamps

#### `Match`

Stores:

- status: pending, in progress, finished
- duration
- created timestamp
- participants

#### `MatchParticipant`

Stores user participation in a match:

- match id
- user id
- winner flag
- kills
- deaths

It enforces uniqueness by match/user pair.

#### `AuditLog`

Stores stats-service audit records:

- request id
- actor id
- action
- entity type
- entity id
- before JSON
- after JSON
- source
- timestamp

### Implemented stats behavior

The player stats controller supports:

- create stats for user
- update stats
- get all stats
- get stats by id
- get match history

The match controller supports:

- create match
- get all matches
- get match by id
- get participants
- update match
- add participant
- update participant
- remove participant
- delete match
- delete all matches

Match creation validates:

- no duplicate participants
- all participant users exist as player stats
- no duplicate match with the same participants

### Integration with auth-user

When Google OAuth creates a new user, auth-user calls stats service best-effort:

```json
{
  "userId": "user-uuid",
  "xp": 50,
  "level": 1,
  "wins": 0,
  "losses": 0,
  "kills": 0,
  "deaths": 0
}
```

This initializes a stats row for new Google-created accounts.

The call is best effort:

- auth login succeeds even if stats init fails
- failure is logged

### What stats does not currently get

The realtime game service does not currently write finished matches into stats.

Missing integration:

- game end to match creation/update
- winner detection
- kills/deaths from game logic
- weapon usage from actual shots
- damage dealt/taken from authoritative damage
- achievements from gameplay

The stats service can store this data, but the live game service does not produce it yet.

## 7. `apps/nginx`

`nginx` contains the Dockerfile and static game assets.

Stored assets include:

- `.obj`
- `.mtl`
- `.png`
- `.glb`

There is no TypeScript business logic in this app.

Its role is infrastructure/static delivery, likely for frontend or game assets.

## 8. Package Contracts

The package contracts are under:

`packages/contracts`

### REST contracts

REST OpenAPI files exist for:

- auth
- bff
- chat
- clan
- public API
- social
- stats
- user

These are contract artifacts, not service implementations.

### Chat contracts

Chat package examples exist:

- `packages/contracts/chat/client.packages.examples.json`
- `packages/contracts/chat/server.packages.examples.json`

These are separate from the implemented social Socket.IO gateway.

### Game contracts

The game contracts were updated to match the implemented `CS_*` and `SC_*` packet names.

Important file:

`packages/contracts/game/implemented.websocket.packets.json`

This file now catalogs:

- transport path
- socket event names
- shared shapes
- implemented client-to-server packets
- implemented server-to-client packets
- dev-only packets
- not-implemented-yet features

Individual older phase files now include:

- `implemented: true` for live packets
- `implemented: false` for planned packets
- `direction`
- `socketEvent`
- current `type` or planned type
- notes explaining gaps

`stefans_packets.json` is now valid JSON and marked as `legacy_planned_event_stream`. It preserves the idea of a future event-stream protocol with `turn.events`, `turn.command`, command acknowledgements, projectiles, damage, terrain ops, and state hashes, but it is not the implemented protocol.

## 9. Cross-Service Data Ownership

### Auth owns identity

Auth owns:

- email
- username
- password hash
- status
- roles
- sessions
- provider links
- auth audit

Other services should not duplicate auth identity truth.

### Social owns profile/social graph

Social owns:

- display name
- avatar
- bio
- country
- privacy
- presence
- friends
- blocks
- clans
- chat

It references auth users by `userId`.

### Stats owns gameplay aggregates

Stats owns:

- XP
- level
- wins/losses
- kills/deaths
- damage
- weapon usage
- achievements
- match history

It references auth users by `userId`.

### Game owns ephemeral realtime state

Game currently owns only in-memory state:

- lobby slots
- readiness
- loading
- current game state
- generated game data
- aiming data

It does not yet persist its results into stats.

## 10. Current Biggest Risks

### Game socket identity is weak

The game socket accepts user id inside the packet. The socket connection is not shown verifying a bearer token. That means identity is currently packet-asserted rather than auth-derived.

Recommended direction:

- require bearer token on socket handshake
- verify token through auth logic/shared JWT
- set `client.data.userId` from token claims
- reject packets whose `userId` does not match socket principal

### Game is broadcast-only

All server packets are emitted to all sockets.

Recommended direction:

- join sockets to lobby rooms
- emit to `lobby:<id>`
- optionally emit private packets to `user:<id>` or socket id

### Game authority is incomplete

Current server behavior mostly mirrors client visual intent.

Recommended direction:

- validate active player
- validate chosen worm belongs to active player
- validate weapon availability
- server-calculate projectile trajectory/hit
- server-calculate damage/knockback/death
- persist final match result

### OAuth token handling is frontend-owned

The browser receives access and refresh tokens through the callback hash.

Recommended direction if stronger browser security is wanted:

- BFF stores refresh token in secure HTTP-only SameSite cookie
- frontend keeps only short-lived access token in memory, or BFF performs authenticated requests server-side

### Stats is not connected to game results

Stats schema exists, but game does not write results.

Recommended direction:

- define game-end event payload
- include winner, participants, kills, deaths, damage, weapon usage
- have game service call stats service or publish an event
- make stats idempotent using match id

## 11. What Exists Versus What Does Not

### Exists

- BFF public facade
- auth registration/login/refresh/logout/verify
- Google OAuth code/id-token exchange
- signed OAuth state in BFF
- JWT access tokens
- opaque hashed refresh tokens
- session DB records
- Redis auth session cache
- auth audit logs
- social profiles/privacy/presence/friends/blocks/clans/chat
- social websocket chat and presence
- stats storage for users/matches/weapons/achievements
- game lobby websocket skeleton
- game state machine
- game loading/lobby packets
- game aim synchronization packets
- placeholder explosion packet
- updated game websocket contracts

### Does not exist yet

- implemented GitHub OAuth
- implemented 42 OAuth
- storage of Google access/refresh tokens
- HTTP-only cookie auth flow
- game socket bearer authentication
- targeted game websocket sends
- authoritative movement packets
- authoritative projectile simulation
- damage and winner packets
- rematch packet
- game-to-stats match result integration
- persistent lobby/game state
- reconnect/replay model
- production removal of dev game packets

