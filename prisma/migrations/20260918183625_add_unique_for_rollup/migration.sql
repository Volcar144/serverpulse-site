/*
  Warnings:

  - A unique constraint covering the columns `[serverId,bucketStart]` on the table `metrics_hourly` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[serverId,bucketStart]` on the table `metrics_minute` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "metrics_hourly_serverId_bucketStart_key" ON "metrics_hourly"("serverId", "bucketStart");

-- CreateIndex
CREATE UNIQUE INDEX "metrics_minute_serverId_bucketStart_key" ON "metrics_minute"("serverId", "bucketStart");
