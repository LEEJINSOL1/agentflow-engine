import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getIdentityById } from "@/lib/identities";
import { publishIdentityNote, saySigned } from "@/lib/technocore";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as {
    identityId?: string;
    room?: string;
    withIntro?: boolean;
  };

  const { identityId, room = "lobby", withIntro = true } = body;
  if (!identityId) {
    return NextResponse.json({ error: "identityId is required" }, { status: 400 });
  }

  const identity = getIdentityById(identityId);
  if (!identity) {
    return NextResponse.json({ error: "Identity not found" }, { status: 404 });
  }

  try {
    const registration = await publishIdentityNote(identity.did);
    let intro: Awaited<ReturnType<typeof saySigned>> | null = null;

    if (withIntro) {
      intro = await saySigned(
        room,
        `AgentFlow node online. DID registered for FLOP testnet prep.`,
        identity.privateKeyHex,
      );
    }

    return NextResponse.json({
      ok: true,
      did: identity.did,
      registration,
      intro: intro ? { room, response: intro.body, record: intro.record } : null,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
