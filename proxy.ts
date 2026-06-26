import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const BASE_DOMAIN = process.env.NEXT_PUBLIC_BASE_DOMAIN ?? "localhost:3000";

export function proxy(request: NextRequest) {
  const host = request.headers.get("host") ?? "";
  const h = host.toLowerCase().replace(/:\d+$/, "");
  const base = BASE_DOMAIN.toLowerCase().replace(/:\d+$/, "");

  if (h === base || h === `www.${base}` || !h.endsWith(`.${base}`)) {
    return NextResponse.next();
  }

  const sub = h.slice(0, -(base.length + 1));
  if (!sub || sub.includes(".") || sub === "www" || sub === "api") {
    return NextResponse.next();
  }

  const url = request.nextUrl.clone();
  url.pathname = `/s/${sub}${url.pathname}`;

  const response = NextResponse.rewrite(url);
  response.headers.set("x-tenant-slug", sub);
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon\\.ico|api/).*)"],
};
