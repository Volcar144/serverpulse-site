import {NextRequest, NextResponse} from "next/server";
import {Ratelimit} from "@upstash/ratelimit";
import {Redis} from "@upstash/redis";

interface version {
    fileName: string,
    version: string,
    sha256: string,
}

interface payload {
    version: string,
    url: string,
    sha256: string,
}

const versions:version[] = [

]

const ratelimit = new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(5, "1 m"), // 5 attempts per IP per minute
});


export async function GET(req: NextRequest){
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    const {success, reset} = await ratelimit.limit(ip)
    if(versions.length == 0){
        return NextResponse.json({error: "No versions exist"}, {status: 404})
    }

    if(!success) {
        const retryAfterSeconds = Math.max(1, Math.ceil((reset - Date.now()) / 1000));
        return NextResponse.json(
            { error: "rate_limited" },
            { status: 429, headers: { "Retry-After": String(retryAfterSeconds) } }
        );
    }

    const mostRecent = versions[0];
    if(!mostRecent){
        return NextResponse.json({error: "Most recent version not found"}, {status:404})
    }

    const toReturn: payload = {
        version: mostRecent.version,
        url: `${process.env.BETTER_AUTH_URL}/downloads/${mostRecent.fileName}`,
        sha256: mostRecent.sha256,
    }

}