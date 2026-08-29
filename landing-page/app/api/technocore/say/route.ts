import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getIdentityById } from "@/lib/identities";
import { saySigned } from "@/lib/technocore";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as {
    identityId?: string;
    room?: string;
    text?: string;
  };

  const { identityId, room = "lobby", text } = body;
  if (!identityId || !text?.trim()) {
    return NextResponse.json({ error: "identityId and text are required" }, { status: 400 });
  }
  if (!/^[a-z0-9][a-z0-9_-]{0,47}$/.test(room)) {
    return NextResponse.json({ error: "Invalid room name" }, { status: 400 });
  }

  const identity = getIdentityById(identityId);
  if (!identity) {
    return NextResponse.json({ error: "Identity not found" }, { status: 404 });
  }

  try {
    const result = await saySigned(room, text, identity.privateKeyHex);
    return NextResponse.json({
      ok: true,
      room,
      response: result.body,
      record: result.record,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
