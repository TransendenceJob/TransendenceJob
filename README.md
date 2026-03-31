

Primsa ORM command to run to generate migrations:

docker exec -it <container_name> npx prisma migrate dev --name <migration name>

docker exec -it auth_service sh -lc "cd /app && npx prisma migrate dev --name <change_name>"


model UserCredential {
  id           String   @id @default(cuid())
  email        String   @unique
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  sessions     Session[]
}

model Session {
  id               String   @id @default(cuid())
  userCredentialId String
  refreshTokenHash String?
  expiresAt        DateTime
  createdAt        DateTime @default(now())

  userCredential   UserCredential @relation(fields: [userCredentialId], references: [id], onDelete: Cascade)

  @@index([userCredentialId])
}