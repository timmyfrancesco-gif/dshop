"use client";

import DOMPurify from "dompurify";
import { useSyncExternalStore } from "react";

interface SafeHtmlProps {
  html: string;
  className?: string;
}

const ALLOWED_TAGS = ["p", "br", "strong", "em", "b", "i", "u", "a", "ul", "ol", "li", "h1", "h2", "h3", "h4", "h5", "h6", "blockquote", "code", "pre", "span", "div", "hr", "sub", "sup", "table", "thead", "tbody", "tr", "th", "td"];
const ALLOWED_ATTR = ["href", "target", "rel", "class", "id"];

// Stable identities — re-creating these per render would make
// useSyncExternalStore loop.
const subscribe = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

/**
 * Tag-stripped fallback used for the server/hydration render. It is handed to
 * React as a plain text child (so React escapes it) and never through
 * innerHTML, so it cannot execute anything even if the regex leaves markup
 * behind.
 */
function toPlainText(html: string): string {
  return html.replace(/<[^>]*>/g, "");
}

export default function SafeHtml({ html, className }: SafeHtmlProps) {
  // DOMPurify needs a real DOM. On the server it reports isSupported === false
  // and `sanitize` is not even defined, so calling it throws and 500s the whole
  // page. That is not hypothetical: a "use client" component is still rendered
  // on the server for the initial HTML, so every server-rendered page passing
  // server-fetched content here died — notably the tenant product page, whose
  // product arrives as a prop and is therefore always non-empty during SSR.
  //
  // useSyncExternalStore is the supported way to render differently on the
  // server: it returns the server snapshot during SSR *and* during hydration
  // (so the markup matches), then re-renders with the client snapshot once
  // mounted, at which point a DOM exists and sanitizing is safe.
  const hasDom = useSyncExternalStore(subscribe, getClientSnapshot, getServerSnapshot);

  if (!hasDom) {
    return <div className={className}>{toPlainText(html)}</div>;
  }

  const clean = DOMPurify.sanitize(html, { ALLOWED_TAGS, ALLOWED_ATTR });
  return <div className={className} dangerouslySetInnerHTML={{ __html: clean }} />;
}
