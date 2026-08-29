const SESSION_MAX_AGE_MS = 60 * 60 * 24 * 7 * 1000;

function sessionSecret(): string {
  return (
    process.env.ADMIN_SESSION_SECRET ??
    process.env.ADMIN_PASSWORD ??
    "dev-insecure-secret-change-me"
  );
}

function decodeToken(token: string): { payload: string; sig: string } | null {
  try {
    const decoded = Buffer.from(token, "base64url").toString("utf8");
    const lastColon = decoded.lastIndexOf(":");
    if (lastColon <= 0) return null;
    return {
      payload: decoded.slice(0, lastColon),
      sig: decoded.slice(lastColon + 1),
    };
  } catch {
    return null;
  }
}

async function hmacHex(secret: string, message: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(message));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function verifySessionTokenEdge(
  token: string,
): Promise<{ username: string } | null> {
  const parts = decodeToken(token);
  if (!parts) return null;

  const expected = await hmacHex(sessionSecret(), parts.payload);
  if (parts.sig.length !== expected.length) return null;

  let match = true;
  for (let i = 0; i < expected.length; i += 1) {
    if (parts.sig.charCodeAt(i) !== expected.charCodeAt(i)) match = false;
  }
  if (!match) return null;

  const [username, issuedAtRaw] = parts.payload.split(":");
  const issuedAt = Number(issuedAtRaw);
  if (!username || !Number.isFinite(issuedAt)) return null;
  if (Date.now() - issuedAt > SESSION_MAX_AGE_MS) return null;
  return { username };
}
