import {NextRequest, NextResponse} from "next/server";
import {streamGzipToString, streamToString} from "@/lib/utils.ts";
import {Ratelimit} from "@upstash/ratelimit";
import {Redis} from "@upstash/redis";

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

    interface columnarBatch {
        serverId:string,
        start: bigint,
        interval: number,
        tps: number[],
        mspt: number[],
        players: number[],
        usedMemory: bigint[],
        entities: number[],
        chunks: number[]
    }

    //Logs come in decompressed
    const body = await streamGzipToString(req.body)
    let parsed:columnarBatch = {serverId: "", start: BigInt(0), interval: 0, tps: [], mspt: [], players: [], usedMemory: [], entities: [], chunks: []}
    try{
        parsed = JSON.parse(body);
        console.log(parsed)
    } catch(err) {
        return NextResponse.json({error: "Unable to parse body"}, {status: 400})
    }
    return NextResponse.json({message: "YESS"}, {status:200})
}