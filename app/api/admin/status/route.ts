import { NextResponse } from "next/server";
import { adminSessionValue } from "@/lib/adminSession";

// Reports whether the server-side admin token is configured, without ever
// exposing the secret itself to the client bundle.
export async function GET() {
  return NextResponse.json({ configured: Boolean(adminSessionValue()) });
}
