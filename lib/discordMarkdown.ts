/**
 * Renders Discord-flavored markdown (as typed in a Discord message) to safe
 * HTML. Everything is escaped before any tag is emitted -- we only ever
 * produce a small whitelisted set of tags ourselves, so the output is safe
 * to insert via dangerouslySetInnerHTML even though the source text comes
 * from an untrusted bot command.
 *
 * Supports: bold (double asterisk), italic (single asterisk or underscore),
 * bold+italic (triple asterisk), underline (double underscore), strikethrough
 * (double tilde), inline code (backtick), fenced code blocks (triple
 * backtick), quote lines (greater-than prefix, single and rest-of-message),
 * headers (1-3 hashes), bullet and numbered lists, [text](url) links, bare
 * https:// autolinks, and spoilers (double pipe).
 */

const CODE_MARK = "\x01C";
const LINK_MARK = "\x01L";
const FENCE_MARK = "\x01F";
const MARK_END = "\x02";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function renderInline(raw: string): string {
  const codes: string[] = [];
  let s = raw.replace(/`([^`]+)`/g, (_m, code: string) => {
    const idx = codes.push("<code>" + escapeHtml(code) + "</code>") - 1;
    return CODE_MARK + idx + MARK_END;
  });

  const links: string[] = [];
  s = s.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, (_m, label: string, url: string) => {
    const idx =
      links.push(
        '<a href="' + escapeHtml(url) + '" target="_blank" rel="noopener noreferrer">' + escapeHtml(label) + "</a>"
      ) - 1;
    return LINK_MARK + idx + MARK_END;
  });

  s = escapeHtml(s);

  s = s.replace(/\*\*\*([\s\S]+?)\*\*\*/g, "<strong><em>$1</em></strong>");
  s = s.replace(/\*\*([\s\S]+?)\*\*/g, "<strong>$1</strong>");
  s = s.replace(/__([\s\S]+?)__/g, "<u>$1</u>");
  s = s.replace(/\*([\s\S]+?)\*/g, "<em>$1</em>");
  s = s.replace(/(?<![\w])_([^_\s][\s\S]*?)_(?![\w])/g, "<em>$1</em>");
  s = s.replace(/~~([\s\S]+?)~~/g, "<del>$1</del>");
  s = s.replace(/\|\|([\s\S]+?)\|\|/g, '<span class="discord-spoiler">$1</span>');

  s = s.replace(/(https?:\/\/[^\s<]+)/g, function (m) {
    return '<a href="' + m + '" target="_blank" rel="noopener noreferrer">' + m + "</a>";
  });

  s = s.replace(new RegExp(CODE_MARK + "(\\d+)" + MARK_END, "g"), function (_m, i) {
    return codes[Number(i)];
  });
  s = s.replace(new RegExp(LINK_MARK + "(\\d+)" + MARK_END, "g"), function (_m, i) {
    return links[Number(i)];
  });
  return s;
}

export function renderDiscordMarkdown(raw: string): string {
  if (!raw.trim()) return "";

  const codeBlocks: string[] = [];
  const withoutFences = raw.replace(/```(?:\w+\n)?([\s\S]*?)```/g, (_m, code: string) => {
    const trimmed = code.replace(/^\n/, "").replace(/\n$/, "");
    const idx = codeBlocks.push('<pre class="discord-codeblock"><code>' + escapeHtml(trimmed) + "</code></pre>") - 1;
    return "\n" + FENCE_MARK + idx + MARK_END + "\n";
  });

  const lines = withoutFences.split("\n");
  const blocks: string[] = [];

  let quoteRest = false;
  let quoteBuf: string[] = [];
  let list: { ordered: boolean; items: string[] } | null = null;
  let para: string[] = [];

  const flushPara = () => {
    if (para.length) {
      blocks.push("<p>" + para.map(renderInline).join("<br>") + "</p>");
      para = [];
    }
  };
  const flushList = () => {
    if (list) {
      const tag = list.ordered ? "ol" : "ul";
      blocks.push(
        "<" + tag + ">" + list.items.map((it) => "<li>" + renderInline(it) + "</li>").join("") + "</" + tag + ">"
      );
      list = null;
    }
  };
  const flushQuote = () => {
    if (quoteBuf.length) {
      blocks.push("<blockquote>" + quoteBuf.map(renderInline).join("<br>") + "</blockquote>");
      quoteBuf = [];
    }
  };

  const fenceLineRe = new RegExp("^" + FENCE_MARK + "(\\d+)" + MARK_END + "$");

  for (const line of lines) {
    if (quoteRest) {
      quoteBuf.push(line);
      continue;
    }

    const mFence = line.trim().match(fenceLineRe);
    if (mFence) {
      flushPara();
      flushList();
      flushQuote();
      blocks.push(codeBlocks[Number(mFence[1])]);
      continue;
    }

    const mAll = line.match(/^>>>\s?(.*)$/);
    if (mAll) {
      flushPara();
      flushList();
      flushQuote();
      quoteRest = true;
      quoteBuf.push(mAll[1]);
      continue;
    }

    const mQuote = line.match(/^>\s?(.*)$/);
    if (mQuote) {
      flushPara();
      flushList();
      quoteBuf.push(mQuote[1]);
      continue;
    }
    if (quoteBuf.length) flushQuote();

    const mHeader = line.match(/^(#{1,3})\s+(.*)$/);
    if (mHeader) {
      flushPara();
      flushList();
      const level = mHeader[1].length;
      blocks.push("<h" + level + ">" + renderInline(mHeader[2]) + "</h" + level + ">");
      continue;
    }

    const mUl = line.match(/^[-*]\s+(.*)$/);
    const mOl = line.match(/^\d+\.\s+(.*)$/);
    if (mUl || mOl) {
      flushPara();
      const ordered = !!mOl;
      const itemText = (mUl || mOl)![1];
      if (!list || list.ordered !== ordered) {
        flushList();
        list = { ordered: ordered, items: [] };
      }
      list.items.push(itemText);
      continue;
    }
    if (list) flushList();

    if (line.trim() === "") {
      flushPara();
      continue;
    }

    para.push(line);
  }
  flushPara();
  flushList();
  flushQuote();

  return blocks.join("\n");
}
