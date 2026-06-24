import { NextRequest, NextResponse } from "next/server";
import { list } from "@vercel/blob";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!id || !/^[a-z0-9]+$/.test(id)) {
    return new NextResponse("Not Found", { status: 404 });
  }

  const result = await list({ prefix: `transcripts/${id}.html` });
  const blob = result.blobs.find((b) => b.pathname === `transcripts/${id}.html`);

  if (!blob) {
    return new NextResponse(
      `<!DOCTYPE html><html><head><title>404</title><style>body{background:#09090b;color:#a1a1aa;font-family:system-ui;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0}div{text-align:center}h1{color:#fff;font-size:2rem}p{margin-top:.5rem}</style></head><body><div><h1>Transcript not found</h1><p>This transcript does not exist or has been deleted.</p></div></body></html>`,
      {
        status: 404,
        headers: { "Content-Type": "text/html; charset=utf-8" },
      }
    );
  }

  const res = await fetch(blob.url);
  const html = await res.text();

  return new NextResponse(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
