import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { listIdentitySummaries } from "@/lib/identities";
import { checkHealth } from "@/lib/technocore";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const identities = listIdentitySummaries();
  const online = await checkHealth();

  return NextResponse.json({
    identities,
    technocoreOnline: online,
    technocoreBase: process.env.TECHNOCORE_BASE_URL ?? "https://technocore.chat",
  });
}
