"use client";

import DOMPurify from "dompurify";

interface SafeHtmlProps {
  html: string;
  className?: string;
}

export default function SafeHtml({ html, className }: SafeHtmlProps) {
  const clean = DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ["p", "br", "strong", "em", "b", "i", "u", "a", "ul", "ol", "li", "h1", "h2", "h3", "h4", "h5", "h6", "blockquote", "code", "pre", "span", "div", "hr", "sub", "sup", "table", "thead", "tbody", "tr", "th", "td"],
    ALLOWED_ATTR: ["href", "target", "rel", "class", "id"],
  });

  return (
    <div
      className={className}
      dangerouslySetInnerHTML={{ __html: clean }}
    />
  );
}
