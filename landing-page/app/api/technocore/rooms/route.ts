import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { listRooms } from "@/lib/technocore";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const rooms = await listRooms(40);
    return NextResponse.json({ rooms });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
