import {NextRequest, NextResponse} from "next/server";
import {rollupMinute} from "@/lib/rollup.ts";


export async function POST(req: NextRequest){
    const authHeader = req.headers.get("Authorization");

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return NextResponse.json(
            { error: 'Missing or malformed authorization header' },
            { status: 401 }
        );
    }

    if(authHeader !== `Bearer ${process.env.CRON_SECRET}`){
        return NextResponse.json(
            {error: 'Invalid auth header'},
            { status: 401 }
        )
    }

    console.log("Starting minute rollup");
    try{
        await rollupMinute();
    } catch (e){
        console.log(e)
        return NextResponse.json({error: "Minute rollup failed"}, {status: 500})
    }

    return NextResponse.json({message: "Success"}, {status:200});
}