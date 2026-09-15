import {NextRequest, NextResponse} from "next/server";

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
    {
        fileName: "splink-1.1.0.jar",
        version: "1.1.1",
        sha256: "5c4d4e996c8830cd4f85a9748fd1e741aaeaf41ab51aed3e5ef5290a0dfb2cce"
    }
]

export async function GET(req: NextRequest){
    if(versions.length == 0){
        return NextResponse.json({error: "No versions exist"}, {status: 404})
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

    return NextResponse.json(toReturn, {status: 200})

}