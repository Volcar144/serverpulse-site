import {NextRequest, NextResponse} from "next/server";
import {Ratelimit} from "@upstash/ratelimit";
import {Redis} from "@upstash/redis";
import {gzip} from "node:zlib";
import {decompressGzip, streamToString} from "@/lib/utils.ts";
import {db} from "@/prisma/db.ts";
import {createHash} from "crypto";

const ratelimit = new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(5, "1 m"), // 5 attempts per IP per minute
});

export async function POST(req: NextRequest){
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    const {success, reset} = await ratelimit.limit(ip)
    const authHeader = req.headers.get("Authorization");
    if(!authHeader){
        return NextResponse.json({error: "No token provided"}, {status:401})
    }

    if(!success) {
        const retryAfterSeconds = Math.max(1, Math.ceil((reset - Date.now()) / 1000));
        return NextResponse.json(
            { error: "rate_limited" },
            { status: 429, headers: { "Retry-After": String(retryAfterSeconds) } }
        );
    }

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return NextResponse.json(
            { error: 'Missing or malformed authorization header' },
            { status: 401 }
        );
    }

    interface crashReportedBody {
        serverId: string
        logs: string
    }

    //Logs come in gzipped
    const body = await streamToString(req.body)
    let parsed:crashReportedBody = {serverId: "", logs: ""}
    try{
        parsed = JSON.parse(body);
    } catch(err){
        return NextResponse.json({error:"Unable to parse body"}, {status:400})
    }


    //Decode the logs (Postgres compresses them at rest)
    const encoder = new TextEncoder();

    const uint8Array: Uint8Array = encoder.encode(parsed.logs);

    parsed.logs = await decompressGzip(uint8Array);

    try {
        const server = await db.server.findUnique({
            where: {id: parsed.serverId},
        })

        if(!server){
            return NextResponse.json({error: "Server not found"}, {status: 404})
        }

        if(server.status == "PENDING"){
            return NextResponse.json({error: "Server not initialised yet"}, {status: 422})
        }

        const keyHash = server.keyHash;

        if(!keyHash){
            return NextResponse.json({error: "Server not initialised yet"}, {status: 422})
        }

        const token = authHeader.split(' ')[1];
        const hashedToken = createHash('sha256').update(token).digest('base64')

        if(hashedToken != keyHash){
            return NextResponse.json({error: "Key Invalid"}, {status: 401})
        }

        db.crashReport.create({
            data: {
                serverId: parsed.logs,
                uploadedLogs: parsed.logs,
            }
        })

        return NextResponse.json({body: "Sucessfully uploaded"}, {status: 200})
    } catch (e) {
        return NextResponse.json({error: "Failed to fetch server logs: " + e}, {status: 500})
    }
}