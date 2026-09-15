import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export async function streamToString(stream: any) {
  const chunks = [];
  for await (const chunk of stream) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString('utf8');
}

export async function streamGzipToString(stream: any): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk as any));
  }
  const compressed = Buffer.concat(chunks);
  if (compressed.length === 0) return "";
  return decompressGzip(compressed);
}

export async function decompressGzip(compressedData: Uint8Array): Promise<string> {
  const decompressionStream = new DecompressionStream("gzip");

  const bytes = new Uint8Array(compressedData); // fresh copy backed by a plain ArrayBuffer
  const blob = new Blob([bytes.buffer]);
  const stream = blob.stream().pipeThrough(decompressionStream);

  const response = new Response(stream);
  return await response.text();
}

