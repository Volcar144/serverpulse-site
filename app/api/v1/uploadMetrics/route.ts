import {NextRequest, NextResponse} from "next/server";
import {streamGzipToString, streamToString} from "@/lib/utils.ts";
import {Ratelimit} from "@upstash/ratelimit";
import {Redis} from "@upstash/redis";
import {db} from "@/prisma/db.ts";
import {createHash} from "crypto";
import {serverActionReducer} from "next/dist/client/components/router-reducer/reducers/server-action-reducer";

const ratelimit = new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(5, "1 m"), // 5 attempts per IP per minute
});

interface columnarBatch {
    serverId:string,
    start: number,
    interval: number,
    tps: number[],
    mspt: number[],
    players: number[],
    usedMemory: number[],
    entities: number[],
    chunks: number[]
}


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

    //Logs come in decompressed
    const body = await streamGzipToString(req.body)
    let parsed:columnarBatch = {serverId: "", start: 0, interval: 0, tps: [], mspt: [], players: [], usedMemory: [], entities: [], chunks: []}

    try{
        parsed = JSON.parse(body);
        console.log(parsed)
    } catch(err) {
        return NextResponse.json({error: "Unable to parse body"}, {status: 400})
    }

    try {
        const server = await db.server.findUnique({ where: { id: parsed.serverId } })

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

        const body = buildMetricsRows(parsed);
        db.metric.createMany({data: body});

        console.log(body)
        return NextResponse.json({message: "Success"}, {status: 200})

    } catch (e) {
        console.log(e)
        return NextResponse.json({error: "Internal Server Error"}, {status: 500})
    }
}

function buildMetricsRows(batch: columnarBatch){
    const { serverId, start, interval, tps, mspt, players, usedMemory, entities, chunks } = batch;
    const length = tps.length
    const arrays = {tps, mspt, players, usedMemory, entities, chunks}

    for(const [key, arr] of Object.entries(arrays)){
        if(length != arr.length){
            console.log("Array length do not match. Dropping req for next packet")
        }
    }

    return Array.from({ length }, (_, i) => ({
        serverId,
        createdAt: new Date(start + i * interval),
        tps: tps[i],
        mspt: mspt[i],
        players: players[i],
        memory: usedMemory[i],
        entities: entities[i],
        chunks: chunks[i],
    }));

}