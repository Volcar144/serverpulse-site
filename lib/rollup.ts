// lib/rollup.ts
import { db } from "@/prisma/db";

export async function rollupMinute() {
    const now = new Date();
    const upperBound = new Date(Math.floor(now.getTime() / 60_000) * 60_000); // start of current minute
    const lowerBound = new Date(upperBound.getTime() - 40 * 60_000); // 40 min lookback

    await db.$executeRaw`
    INSERT INTO metrics_minute ("serverId", "bucketStart", "tpsAvg", "tpsMin", "msptAvg", "msptMax", "playersAvg", "memoryAvg", "entitiesAvg", "chunksAvg")
    SELECT
      "serverId",
      date_trunc('minute', "createdAt") AS "bucketStart",
      avg(tps)::float8,
      min(tps)::float8,
      avg(mspt)::float8,
      max(mspt)::float8,
      round(avg(players))::int,
      round(avg(memory))::bigint,
      round(avg(entities))::int,
      round(avg(chunks))::int
    FROM metrics
    WHERE "createdAt" >= ${lowerBound} AND "createdAt" < ${upperBound}
    GROUP BY "serverId", date_trunc('minute', "createdAt")
    ON CONFLICT ("serverId", "bucketStart") DO NOTHING;
  `;
}

export async function rollupHourly() {
    const now = new Date();
    const upperBound = new Date(now);
    upperBound.setMinutes(0, 0, 0); // start of current hour
    const lowerBound = new Date(upperBound.getTime() - 3 * 60 * 60_000); // 3 hr lookback — covers multiple 30-min cycles

    await db.$executeRaw`
    INSERT INTO metrics_hourly ("serverId", "bucketStart", "tpsAvg", "tpsMin", "msptAvg", "msptMax", "playersAvg", "memoryAvg", "entitiesAvg", "chunksAvg")
    SELECT
      "serverId",
      date_trunc('hour', "bucketStart") AS "bucketStart",
      avg("tpsAvg")::float8,
      min("tpsMin")::float8,
      avg("msptAvg")::float8,
      max("msptMax")::float8,
      round(avg("playersAvg"))::int,
      round(avg("memoryAvg"))::bigint,
      round(avg("entitiesAvg"))::int,
      round(avg("chunksAvg"))::int
    FROM metrics_minute
    WHERE "bucketStart" >= ${lowerBound} AND "bucketStart" < ${upperBound}
    GROUP BY "serverId", date_trunc('hour', "bucketStart")
    ON CONFLICT ("serverId", "bucketStart") DO NOTHING;
  `;
}

export async function purgeExpiredMetrics() {
    await db.$executeRaw`
    DELETE FROM metrics m
    USING servers s
    WHERE m."serverId" = s.id
      AND m."createdAt" < now() - (s."retentionDays" || ' days')::interval;
  `;

    await db.$executeRaw`
    DELETE FROM metrics_minute mm
    USING servers s
    WHERE mm."serverId" = s.id
      AND mm."bucketStart" < now() - (s."retentionDays" || ' days')::interval;
  `;
}