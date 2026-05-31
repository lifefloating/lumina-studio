import { getObjectFromR2 } from "@/server/r2";
import { NextResponse } from "next/server";

type RouteContext = {
  params: Promise<{
    key?: string[];
  }>;
};

async function streamToUint8Array(stream: ReadableStream | Blob | undefined) {
  if (!stream) {
    return new Uint8Array();
  }

  if (stream instanceof Blob) {
    return new Uint8Array(await stream.arrayBuffer());
  }

  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
  }

  const length = chunks.reduce((total, chunk) => total + chunk.length, 0);
  const result = new Uint8Array(length);
  let offset = 0;

  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }

  return result;
}

export async function GET(_request: Request, context: RouteContext) {
  const { key: keySegments } = await context.params;
  const key = keySegments?.join("/");

  if (!key) {
    return NextResponse.json({ error: "Missing R2 object key" }, { status: 400 });
  }

  try {
    const object = await getObjectFromR2(key);
    const body = await streamToUint8Array(
      object.Body?.transformToWebStream(),
    );

    return new Response(body, {
      headers: {
        "Cache-Control": "public, max-age=31536000, immutable",
        "Content-Type": object.ContentType ?? "application/octet-stream",
      },
    });
  } catch (error) {
    console.error("Failed to read R2 object:", error);
    return NextResponse.json({ error: "Image not found" }, { status: 404 });
  }
}
