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

  // Fetch both HTML content and JSON metadata in parallel
  const [htmlResult, jsonResult] = await Promise.all([
    list({ prefix: `transcripts/${id}.html` }),
    list({ prefix: `transcripts/${id}.json` }),
  ]);

  const htmlBlob = htmlResult.blobs.find((b) => b.pathname === `transcripts/${id}.html`);

  if (!htmlBlob) {
    return new NextResponse(wrapPage("404 — Not Found", "", null,
      `<div class="empty-state"><div class="empty-icon">🗂️</div><h2>Transcript not found</h2><p>This transcript does not exist or has been deleted.</p></div>`, ""
    ), {
      status: 404,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }

  const jsonBlob = jsonResult.blobs.find((b) => b.pathname === `transcripts/${id}.json`);

  const [htmlContent, meta] = await Promise.all([
    fetch(htmlBlob.url).then((r) => r.text()),
    jsonBlob
      ? fetch(jsonBlob.url).then((r) => r.json()).catch(() => null)
      : Promise.resolve(null),
  ]);

  const title = meta?.ticketName ?? `Transcript ${id}`;
  const { styles: transcriptStyles, body: transcriptBody } = extractTranscriptParts(htmlContent)
  const wrapped = wrapPage(title, id, meta, transcriptBody, transcriptStyles);

  return new NextResponse(wrapped, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
      "Content-Security-Policy":
        "default-src 'self'; script-src 'none'; style-src 'self' 'unsafe-inline'; img-src * data:;",
    },
  });
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString("it-IT", {
      day: "2-digit", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  } catch { return iso; }
}

function wrapPage(
  title: string,
  id: string,
  meta: Record<string, string> | null,
  bodyHtml: string,
  transcriptStyles: string = ""
): string {
  const category = meta?.category ? `<span class="badge">${esc(meta.category)}</span>` : "";
  const header = meta ? `
    <div class="header">
      <div class="header-inner">
        <div class="header-top">
          <div class="header-brand">
            <svg class="logo-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            <span class="brand-name">Transcript</span>
          </div>
          ${category}
        </div>
        <h1 class="ticket-title">${esc(meta.ticketName ?? title)}</h1>
        <div class="meta-grid">
          <div class="meta-item">
            <span class="meta-label">Ticket ID</span>
            <span class="meta-value mono">${esc(meta.ticketId ?? "—")}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">Opened by</span>
            <span class="meta-value">${esc(meta.ownerName ?? "—")}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">Date</span>
            <span class="meta-value">${meta.createdAt ? formatDate(meta.createdAt) : "—"}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">ID</span>
            <span class="meta-value mono">${esc(id)}</span>
          </div>
        </div>
      </div>
    </div>` : `
    <div class="header">
      <div class="header-inner">
        <div class="header-top">
          <div class="header-brand">
            <svg class="logo-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            <span class="brand-name">Transcript</span>
          </div>
        </div>
        <h1 class="ticket-title">${esc(title)}</h1>
      </div>
    </div>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="robots" content="noindex,nofollow" />
  <title>${esc(title)} — Transcript</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    :root {
      --bg: #09090b;
      --bg-elevated: #111113;
      --bg-card: #18181b;
      --border: #27272a;
      --border-subtle: #1f1f22;
      --text: #fafafa;
      --text-muted: #71717a;
      --text-dim: #52525b;
      --accent: #6366f1;
      --accent-light: #818cf8;
      --green: #22c55e;
      --radius: 12px;
    }

    html { background: var(--bg); color: var(--text); font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif; font-size: 15px; line-height: 1.6; }

    body { min-height: 100vh; background: var(--bg); }

    /* ── Header ── */
    .header { background: var(--bg-elevated); border-bottom: 1px solid var(--border); position: sticky; top: 0; z-index: 10; }
    .header-inner { max-width: 900px; margin: 0 auto; padding: 20px 24px; }
    .header-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
    .header-brand { display: flex; align-items: center; gap: 8px; }
    .logo-icon { width: 18px; height: 18px; color: var(--accent-light); }
    .brand-name { font-size: 13px; font-weight: 600; color: var(--text-muted); letter-spacing: .03em; text-transform: uppercase; }
    .badge { background: rgba(99,102,241,.15); color: var(--accent-light); border: 1px solid rgba(99,102,241,.3); border-radius: 20px; padding: 3px 10px; font-size: 11px; font-weight: 600; letter-spacing: .04em; text-transform: uppercase; }
    .ticket-title { font-size: 20px; font-weight: 700; color: var(--text); margin-bottom: 16px; }
    .meta-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 12px; }
    .meta-item { display: flex; flex-direction: column; gap: 2px; }
    .meta-label { font-size: 11px; font-weight: 600; color: var(--text-dim); text-transform: uppercase; letter-spacing: .06em; }
    .meta-value { font-size: 13px; color: var(--text-muted); }
    .mono { font-family: 'SF Mono', 'Fira Code', monospace; font-size: 12px; }

    /* ── Content wrapper ── */
    .content-wrap { max-width: 900px; margin: 0 auto; padding: 32px 24px 64px; }

    /* ── Transcript content reset & styling ── */
    .transcript-body { background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius); overflow: hidden; }
    .transcript-body * { color: inherit; }

    /* Style common Discord transcript patterns */
    .transcript-body a { color: var(--accent-light); text-decoration: none; }
    .transcript-body a:hover { text-decoration: underline; }
    .transcript-body img { max-width: 100%; border-radius: 8px; }
    .transcript-body code { background: rgba(255,255,255,.06); border-radius: 4px; padding: 1px 5px; font-family: 'SF Mono', 'Fira Code', monospace; font-size: 0.9em; }
    .transcript-body pre { background: rgba(0,0,0,.4); border: 1px solid var(--border-subtle); border-radius: 8px; padding: 14px 16px; overflow-x: auto; margin: 8px 0; }
    .transcript-body pre code { background: none; padding: 0; }

    /* Message styling overrides for common transcript formats */
    .transcript-body [class*="message"] { border-color: var(--border-subtle) !important; }
    .transcript-body [class*="username"], .transcript-body [class*="author"] { color: var(--accent-light) !important; }
    .transcript-body [class*="timestamp"], .transcript-body [class*="time"] { color: var(--text-dim) !important; }
    .transcript-body [class*="content"], .transcript-body p { color: #d4d4d8 !important; }
    .transcript-body [class*="bot-tag"], .transcript-body [class*="bot"] { background: var(--accent) !important; }

    /* Scrollable inner content */
    .transcript-inner { overflow: auto; }

    /* ── Empty state ── */
    .empty-state { text-align: center; padding: 80px 24px; color: var(--text-muted); }
    .empty-icon { font-size: 48px; margin-bottom: 16px; }
    .empty-state h2 { font-size: 20px; font-weight: 700; color: var(--text); margin-bottom: 8px; }

    /* ── Footer ── */
    .footer { text-align: center; padding: 24px; font-size: 12px; color: var(--text-dim); border-top: 1px solid var(--border-subtle); margin-top: 32px; }

    @media (max-width: 640px) {
      .header-inner, .content-wrap { padding-left: 16px; padding-right: 16px; }
      .ticket-title { font-size: 17px; }
      .meta-grid { grid-template-columns: 1fr 1fr; }
    }
  </style>
  ${transcriptStyles ? `<style>${transcriptStyles}</style>` : ""}
</head>
<body>
  ${header}
  <div class="content-wrap">
    <div class="transcript-body">
      <div class="transcript-inner">
        ${bodyHtml}
      </div>
    </div>
  </div>
  <div class="footer">Heaven Market &mdash; Transcript Archive</div>
</body>
</html>`;
}

function esc(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

/**
 * discord-html-transcripts (and similar libs) generate a full HTML document.
 * Embedding that directly inside our wrapper causes the browser to discard
 * nested <html>/<head>/<style> tags, stripping all transcript CSS.
 * We extract the <style> blocks and <body> content separately so both render.
 */
function extractTranscriptParts(html: string): { styles: string; body: string } {
  // Collect all <style>...</style> blocks from anywhere in the document
  const styleMatches = [...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)]
  const styles = styleMatches.map((m) => m[1]).join("\n")

  // Extract inner content of <body>
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i)
  const body = bodyMatch ? bodyMatch[1] : html

  return { styles, body }
}
