-- CreateEnum
CREATE TYPE "ServerStatus" AS ENUM ('PENDING', 'ACTIVE');

-- CreateTable
CREATE TABLE "user" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "image" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "session" (
    "id" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "token" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "userId" TEXT NOT NULL,

    CONSTRAINT "session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "account" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "idToken" TEXT,
    "accessTokenExpiresAt" TIMESTAMP(3),
    "refreshTokenExpiresAt" TIMESTAMP(3),
    "scope" TEXT,
    "password" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "verification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "passkey" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "publicKey" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "credentialID" TEXT NOT NULL,
    "counter" INTEGER NOT NULL,
    "deviceType" TEXT NOT NULL,
    "backedUp" BOOLEAN NOT NULL,
    "transports" TEXT,
    "createdAt" TIMESTAMP(3),
    "aaguid" TEXT,

    CONSTRAINT "passkey_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "server" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" "ServerStatus" NOT NULL DEFAULT 'PENDING',
    "keyHash" TEXT,
    "retentionDays" INTEGER NOT NULL DEFAULT 2,
    "mcVersion" TEXT,
    "pluginVersion" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "registeredAt" TIMESTAMP(3),

    CONSTRAINT "server_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "metrics" (
    "id" BIGSERIAL NOT NULL,
    "serverId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tps" DOUBLE PRECISION NOT NULL,
    "mspt" DOUBLE PRECISION NOT NULL,
    "players" INTEGER NOT NULL,
    "memory" BIGINT NOT NULL,
    "entities" INTEGER NOT NULL,
    "chunks" INTEGER NOT NULL,

    CONSTRAINT "metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "metrics_minute" (
    "id" BIGSERIAL NOT NULL,
    "serverId" TEXT NOT NULL,
    "bucketStart" TIMESTAMP(3) NOT NULL,
    "tpsAvg" DOUBLE PRECISION NOT NULL,
    "tpsMin" DOUBLE PRECISION NOT NULL,
    "msptAvg" DOUBLE PRECISION NOT NULL,
    "msptMax" DOUBLE PRECISION NOT NULL,
    "playersAvg" INTEGER NOT NULL,
    "memoryAvg" BIGINT NOT NULL,
    "entitiesAvg" INTEGER NOT NULL,
    "chunksAvg" INTEGER NOT NULL,

    CONSTRAINT "metrics_minute_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "metrics_hourly" (
    "id" BIGSERIAL NOT NULL,
    "serverId" TEXT NOT NULL,
    "bucketStart" TIMESTAMP(3) NOT NULL,
    "tpsAvg" DOUBLE PRECISION NOT NULL,
    "tpsMin" DOUBLE PRECISION NOT NULL,
    "msptAvg" DOUBLE PRECISION NOT NULL,
    "msptMax" DOUBLE PRECISION NOT NULL,
    "playersAvg" INTEGER NOT NULL,
    "memoryAvg" BIGINT NOT NULL,
    "entitiesAvg" INTEGER NOT NULL,
    "chunksAvg" INTEGER NOT NULL,

    CONSTRAINT "metrics_hourly_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crash_reports" (
    "id" TEXT NOT NULL,
    "serverId" TEXT NOT NULL,
    "uploadedLogs" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "crash_reports_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");

-- CreateIndex
CREATE INDEX "session_userId_idx" ON "session"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "session_token_key" ON "session"("token");

-- CreateIndex
CREATE INDEX "account_userId_idx" ON "account"("userId");

-- CreateIndex
CREATE INDEX "verification_identifier_idx" ON "verification"("identifier");

-- CreateIndex
CREATE INDEX "passkey_userId_idx" ON "passkey"("userId");

-- CreateIndex
CREATE INDEX "passkey_credentialID_idx" ON "passkey"("credentialID");

-- CreateIndex
CREATE UNIQUE INDEX "server_keyHash_key" ON "server"("keyHash");

-- CreateIndex
CREATE INDEX "metrics_serverId_createdAt_idx" ON "metrics"("serverId", "createdAt");

-- CreateIndex
CREATE INDEX "metrics_minute_serverId_bucketStart_idx" ON "metrics_minute"("serverId", "bucketStart");

-- CreateIndex
CREATE INDEX "metrics_hourly_serverId_bucketStart_idx" ON "metrics_hourly"("serverId", "bucketStart");

-- AddForeignKey
ALTER TABLE "session" ADD CONSTRAINT "session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account" ADD CONSTRAINT "account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "passkey" ADD CONSTRAINT "passkey_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "server" ADD CONSTRAINT "server_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "metrics" ADD CONSTRAINT "metrics_serverId_fkey" FOREIGN KEY ("serverId") REFERENCES "server"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "metrics_minute" ADD CONSTRAINT "metrics_minute_serverId_fkey" FOREIGN KEY ("serverId") REFERENCES "server"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "metrics_hourly" ADD CONSTRAINT "metrics_hourly_serverId_fkey" FOREIGN KEY ("serverId") REFERENCES "server"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crash_reports" ADD CONSTRAINT "crash_reports_serverId_fkey" FOREIGN KEY ("serverId") REFERENCES "server"("id") ON DELETE CASCADE ON UPDATE CASCADE;
