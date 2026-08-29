import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getIdentityById } from "@/lib/identities";
import { keepaliveNote, publishIdentityNote, saySigned } from "@/lib/technocore";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as {
    identityId?: string;
    room?: string;
    withCheckin?: boolean;
  };

  const { identityId, room = "lobby", withCheckin = true } = body;
  if (!identityId) {
    return NextResponse.json({ error: "identityId is required" }, { status: 400 });
  }

  const identity = getIdentityById(identityId);
  if (!identity) {
    return NextResponse.json({ error: "Identity not found" }, { status: 404 });
  }

  try {
    const keepalive = await keepaliveNote(identity.did);
    let checkin: Awaited<ReturnType<typeof saySigned>> | null = null;

    if (withCheckin) {
      const stamp = new Date().toISOString();
      checkin = await saySigned(
        room,
        `AgentFlow keepalive ${stamp}`,
        identity.privateKeyHex,
      );
    }

    return NextResponse.json({
      ok: true,
      did: identity.did,
      keepalive,
      checkin: checkin
        ? { room, response: checkin.body, record: checkin.record }
        : null,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
