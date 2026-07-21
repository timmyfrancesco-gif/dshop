import { NextRequest, NextResponse } from "next/server";
import { hasAdminSession } from "@/lib/adminSession";
import { bcFetch } from "@/lib/crypto/blockcypher";

/**
 * Live balance of the platform fee wallet (PLATFORM_LTC_ADDRESS) via
 * BlockCypher. This is the wallet that receives the platform's cut on
 * every tenant sale.
 */
export async function GET(req: NextRequest) {
  if (!hasAdminSession(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const address = process.env.PLATFORM_LTC_ADDRESS;
  if (!address) {
    return NextResponse.json({ configured: false });
  }

  try {
    const res = await bcFetch(
      `https://api.blockcypher.com/v1/ltc/main/addrs/${address}/balance`,
      { cache: "no-store" }
    );
    if (!res.ok) {
      return NextResponse.json({ configured: true, address, balanceLtc: null });
    }
    const data = await res.json();
    return NextResponse.json({
      configured: true,
      address,
      balanceLtc: Number(data?.balance ?? 0) / 1e8,
      unconfirmedLtc: Number(data?.unconfirmed_balance ?? 0) / 1e8,
      totalReceivedLtc: Number(data?.total_received ?? 0) / 1e8,
      txCount: Number(data?.n_tx ?? 0),
    });
  } catch {
    return NextResponse.json({ configured: true, address, balanceLtc: null });
  }
}
