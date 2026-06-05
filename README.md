

Primsa ORM command to run to generate migrations:

docker exec -it <container_name> npx prisma migrate dev --name <migration name>

docker exec -it auth_service sh -lc "cd /app && npx prisma migrate dev --name <change_name>"



-admin panel (frontend) ( CRUD)
(disable user account)
(change roles for account)
(force logout)
(admin should be able to search up user's profile)++

-user profile page currently doesn't display any of the accounts data (frontend)
-fetch stats from user , we have a stats service 
-clan/friend list + chat/ social.

