-- CreateTable
CREATE TABLE "UserCredential" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserCredential_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "userCredentialId" TEXT NOT NULL,
    "refreshTokenHash" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserCredential_email_key" ON "UserCredential"("email");

-- CreateIndex
CREATE INDEX "Session_userCredentialId_idx" ON "Session"("userCredentialId");

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userCredentialId_fkey" FOREIGN KEY ("userCredentialId") REFERENCES "UserCredential"("id") ON DELETE CASCADE ON UPDATE CASCADE;
