import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { readRoom } from "@/lib/technocore";

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const room = searchParams.get("room") ?? "lobby";
  const since = Number(searchParams.get("since") ?? "0");
  const limit = Number(searchParams.get("limit") ?? "50");

  if (!/^[a-z0-9][a-z0-9_-]{0,47}$/.test(room)) {
    return NextResponse.json({ error: "Invalid room name" }, { status: 400 });
  }

  try {
    const result = await readRoom(room, since, limit);
    return NextResponse.json({ room, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
