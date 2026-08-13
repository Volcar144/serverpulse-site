import {NextRequest, NextResponse} from "next/server";
import {streamToString} from "@/lib/utils.ts";
import {db} from "@/prisma/db.ts";
import { randomBytes } from "crypto";
import { createHash } from "crypto";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const ratelimit = new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(5, "1 m"), // 5 attempts per IP per minute
});

export async function POST(req: NextRequest) {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    const {success, reset} = await ratelimit.limit(ip)

    if(!success) {
        const retryAfterSeconds = Math.max(1, Math.ceil((reset - Date.now()) / 1000));
        return NextResponse.json(
            { error: "rate_limited" },
            { status: 429, headers: { "Retry-After": String(retryAfterSeconds) } }
        );
    }

    interface registerBody {
        id: string;
    }
    const body = await streamToString(req.body)
    let parsed:registerBody = {id: ""}
    try{
        parsed = JSON.parse(body);
    } catch(err){
        return NextResponse.json({error:"Unable to parse body"}, {status:400})
    }

    try{
        const server = await db.orm.public.Server.where({id: parsed.id}).first();
        if(!server){
            return NextResponse.json({ error: "Unable to find server with that id"}, {status: 404})
        }

        if(server.status == "ACTIVE"){
            return NextResponse.json({ error: "Server is already linked" }, { status:422 })
        }

        const secretKey = "sp_secret_" + randomBytes(32).toString("base64url")
        const keyHash:string = createHash('sha265').update(secretKey).digest('base64')

        await db.orm.public.Server.where({id: parsed.id}).update({keyHash: keyHash});

        return NextResponse.json({secret: secretKey, server_name: server.name, server_id: server.id })
    } catch(err){
        console.log(err)
        return NextResponse.json({ error: "Internal error occurred while processing db records" }, {status:500})
    }
}