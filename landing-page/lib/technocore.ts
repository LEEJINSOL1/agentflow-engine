import { createHash, createPrivateKey, sign as cryptoSign } from "crypto";

const TECHNOCORE_BASE =
  process.env.TECHNOCORE_BASE_URL ?? "https://technocore.chat";

const B58 = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
const INVISIBLE = /[\p{Cc}\p{Cf}\p{Cs}\p{Co}\p{Zl}\p{Zp}]/gu;

export type TechnocoreMessage = {
  seq: number;
  from: string;
  text: string;
  ts?: string;
  signed?: boolean;
};

export type TechnocoreRoomSummary = {
  name: string;
  lastSeq?: number;
  size?: number;
  idleSeconds?: number;
  topic?: string;
};

function multibaseEncodeEd25519PublicKey(publicKeyBytes: Buffer): string {
  const prefix = Buffer.from([0xed, 0x01]);
  const data = Buffer.concat([prefix, publicKeyBytes]);
  let num = BigInt(`0x${data.toString("hex")}`);
  let encoded = "";
  while (num > BigInt(0)) {
    const rem = Number(num % BigInt(58));
    num = num / BigInt(58);
    encoded = B58[rem] + encoded;
  }
  let pad = 0;
  for (const b of data) {
    if (b === 0) pad += 1;
    else break;
  }
  return "z" + "1".repeat(pad) + encoded;
}

function privateKeyFromHex(privateKeyHex: string) {
  return createPrivateKey({
    key: Buffer.concat([
      Buffer.from("302e020100300506032b657004220420", "hex"),
      Buffer.from(privateKeyHex, "hex"),
    ]),
    format: "der",
    type: "pkcs8",
  });
}

export function didFromPrivateKeyHex(privateKeyHex: string): string {
  const key = privateKeyFromHex(privateKeyHex);
  const jwk = key.export({ format: "jwk" }) as { x: string };
  const publicBytes = Buffer.from(jwk.x, "base64url");
  return `did:key:${multibaseEncodeEd25519PublicKey(publicBytes)}`;
}

export function sweepText(text: string, limit = 4096): string {
  const cleaned = text.replace(INVISIBLE, " ").trim();

  if (!cleaned) {
    throw new Error("메시지에 표시 가능한 문자가 없습니다.");
  }
  if (cleaned.length > limit) {
    throw new Error(`메시지가 ${limit}자 제한을 초과합니다.`);
  }
  return cleaned;
}

export function didFingerprint(did: string): string {
  return createHash("sha256").update(did, "utf8").digest("hex").slice(0, 16);
}

export function didShardPath(did: string): { shard: string; key: string; fingerprint: string } {
  const fingerprint = didFingerprint(did);
  return { shard: fingerprint.slice(0, 2), key: fingerprint.slice(2), fingerprint };
}

function signCanonical(message: string, privateKeyHex: string): string {
  const key = privateKeyFromHex(privateKeyHex);
  const sig = cryptoSign(null, Buffer.from(message, "utf8"), key);
  return sig
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export function newNonce(): string {
  return String(Date.now());
}

export function signRoomMessage(
  room: string,
  text: string,
  privateKeyHex: string,
  nonce = newNonce(),
): { did: string; sig: string; nonce: string; text: string } {
  const swept = sweepText(text);
  const did = didFromPrivateKeyHex(privateKeyHex);
  const canonical = `${room}|${nonce}|${swept}`;
  const sig = signCanonical(canonical, privateKeyHex);
  return { did, sig, nonce, text: swept };
}

async function technocoreFetch(path: string, init?: RequestInit): Promise<Response> {
  const url = `${TECHNOCORE_BASE}${path}`;
  const res = await fetch(url, {
    ...init,
    headers: { Accept: "text/plain, application/json", ...init?.headers },
    cache: "no-store",
  });
  return res;
}

export async function readRoom(
  room: string,
  since?: number,
  limit = 30,
): Promise<{ messages: TechnocoreMessage[]; latestSeq: number; raw?: string }> {
  const params = new URLSearchParams({
    limit: String(Math.min(Math.max(limit, 1), 200)),
    format: "json",
  });
  if (since != null && since > 0) {
    params.set("since", String(since));
  }
  const res = await technocoreFetch(`/r/${encodeURIComponent(room)}?${params}`);
  const body = await res.text();

  if (!res.ok) {
    throw new Error(`Technocore read failed (${res.status}): ${body.slice(0, 200)}`);
  }

  if (body.startsWith("Service Unavailable") || body.startsWith("<!")) {
    throw new Error("Technocore 서버가 일시적으로 unavailable 상태입니다. 잠시 후 다시 시도하세요.");
  }

  try {
    const parsed = JSON.parse(body) as {
      messages?: Array<Record<string, unknown>>;
      latest_seq?: number;
      last_seq?: number;
    };
    const messages: TechnocoreMessage[] = (parsed.messages ?? []).map((m) => ({
      seq: Number(m.seq ?? 0),
      from: String(m.from ?? m.author ?? "unknown"),
      text: String(m.text ?? ""),
      ts: m.ts ? String(m.ts) : undefined,
      signed: Boolean(
        m.signed ?? String(m.from ?? "").startsWith("did:key:"),
      ),
    }));
    const latestSeq =
      parsed.last_seq ?? parsed.latest_seq ?? messages.at(-1)?.seq ?? since ?? 0;
    return { messages, latestSeq };
  } catch {
    const messages = parseTextRoom(body);
    const latestSeq = messages.at(-1)?.seq ?? since ?? 0;
    return { messages, latestSeq, raw: body };
  }
}

function parseTextRoom(body: string): TechnocoreMessage[] {
  const messages: TechnocoreMessage[] = [];
  for (const line of body.split("\n")) {
    const bracket = line.match(/^\[(\d+)\]\s+(\S+)\s+<([^>]+)>\s+(.*)$/);
    if (bracket) {
      const from = bracket[3];
      messages.push({
        seq: Number(bracket[1]),
        from,
        text: bracket[4],
        ts: bracket[2],
        signed: from.startsWith("did:key:") || from.startsWith("z6Mk"),
      });
      continue;
    }
    const plain = line.match(/^\[(\d+)\]\s+(\S+)\s+(.*)$/);
    if (plain) {
      messages.push({
        seq: Number(plain[1]),
        from: plain[2],
        text: plain[3],
        signed: plain[2].includes("did:key") || plain[2].startsWith("<z6Mk"),
      });
    }
  }
  return messages;
}

export async function listRooms(limit = 30): Promise<TechnocoreRoomSummary[]> {
  const res = await technocoreFetch(`/rooms?format=json&limit=${limit}`);
  const body = await res.text();
  if (!res.ok) {
    throw new Error(`Technocore rooms failed (${res.status}): ${body.slice(0, 200)}`);
  }
  const parsed = JSON.parse(body) as {
    rooms?: Array<Record<string, unknown>>;
  };
  return (parsed.rooms ?? []).map((r) => ({
    name: String(r.room ?? r.name ?? ""),
    lastSeq: r.last_seq != null ? Number(r.last_seq) : undefined,
    size: r.bytes != null ? Number(r.bytes) : r.size != null ? Number(r.size) : undefined,
    idleSeconds: r.idle_seconds != null ? Number(r.idle_seconds) : undefined,
    topic: r.topic ? String(r.topic) : undefined,
  }));
}

export async function saySigned(
  room: string,
  text: string,
  privateKeyHex: string,
  nonce?: string,
): Promise<{ ok: boolean; body: string; record: ReturnType<typeof signRoomMessage> }> {
  const record = signRoomMessage(room, text, privateKeyHex, nonce);
  const path = [
    `/r/${encodeURIComponent(room)}/say-signed`,
    encodeURIComponent(record.did),
    record.sig,
    record.nonce,
    encodeURIComponent(record.text),
  ].join("/");

  const res = await technocoreFetch(path, { method: "GET" });
  const body = await res.text();
  if (!res.ok) {
    throw new Error(`Technocore say-signed failed (${res.status}): ${body.slice(0, 300)}`);
  }
  return { ok: true, body, record };
}

export async function readNote(ns: string, key: string): Promise<string | null> {
  const res = await technocoreFetch(`/kv/${encodeURIComponent(ns)}/${encodeURIComponent(key)}`);
  const body = await res.text();
  if (res.status === 404) return null;
  if (!res.ok) {
    throw new Error(`Note read failed (${res.status}): ${body.slice(0, 200)}`);
  }
  return body;
}

export async function publishIdentityNote(
  did: string,
  profileLine?: string,
): Promise<{ path: string; body: string }> {
  const { shard, key } = didShardPath(did);
  const value = sweepText(
    profileLine ?? `${did} agent registered via AgentFlow admin (primary)`,
    8192,
  );
  const path = `/kv/did-${shard}/${key}/set/${encodeURIComponent(value)}?if_absent=1`;
  const res = await technocoreFetch(path, { method: "GET" });
  const body = await res.text();
  if (!res.ok && res.status !== 409) {
    throw new Error(`Identity note failed (${res.status}): ${body.slice(0, 300)}`);
  }
  return { path: `/kv/did-${shard}/${key}`, body };
}

/** Official presence convention: /kv/did-{shard}/hb-{fingerprint}/set/ (llms.txt) */
export async function keepaliveNote(did: string): Promise<{ path: string; body: string }> {
  const { shard, fingerprint } = didShardPath(did);
  const stamp = new Date().toISOString();
  const value = sweepText(`heartbeat ${stamp}`, 8192);
  const hbKey = `hb-${fingerprint}`;
  const path = `/kv/did-${shard}/${hbKey}/set/${encodeURIComponent(value)}`;
  const res = await technocoreFetch(path, { method: "GET" });
  const body = await res.text();
  if (!res.ok) {
    throw new Error(`Keepalive failed (${res.status}): ${body.slice(0, 300)}`);
  }
  return { path: `/kv/did-${shard}/${hbKey}`, body };
}

export async function checkHealth(): Promise<boolean> {
  try {
    const res = await technocoreFetch("/healthz");
    return res.ok;
  } catch {
    return false;
  }
}
