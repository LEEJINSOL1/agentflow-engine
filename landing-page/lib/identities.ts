import { readFileSync, existsSync, readdirSync } from "fs";
import { join } from "path";

export type NodeIdentity = {
  id: string;
  label: string;
  did: string;
  privateKeyHex: string;
};

type IdentityFile = {
  did: string;
  private_key_hex: string;
};

export function abbreviateDid(did: string): string {
  if (!did.startsWith("did:key:z6Mk") || did.length < 16) return "did:key:…";
  return `did:key:z6Mk…${did.slice(-4)}`;
}

function parseIdentityFile(filePath: string, id: string, label: string): NodeIdentity | null {
  if (!existsSync(filePath)) return null;
  const raw = JSON.parse(readFileSync(filePath, "utf8")) as IdentityFile;
  if (!raw.did || !raw.private_key_hex) return null;
  return {
    id,
    label,
    did: raw.did,
    privateKeyHex: raw.private_key_hex,
  };
}

function activeIdentityFilter(): string | null {
  return process.env.TECHNOCORE_ACTIVE_IDENTITY?.trim() || null;
}

function applyActiveFilter(identities: NodeIdentity[]): NodeIdentity[] {
  const activeId = activeIdentityFilter();
  if (!activeId) {
    // Production default: use only the first identity to avoid multi-DID from one IP.
    if (process.env.NODE_ENV === "production" && identities.length > 1) {
      return [identities[0]];
    }
    return identities;
  }
  const match = identities.find((item) => item.id === activeId);
  return match ? [match] : identities.slice(0, 1);
}

export function loadIdentities(): NodeIdentity[] {
  const envJson = process.env.TECHNOCORE_IDENTITIES;
  if (envJson) {
    const parsed = JSON.parse(envJson) as Array<{
      id: string;
      label?: string;
      did: string;
      private_key_hex?: string;
      privateKeyHex?: string;
    }>;
    const identities = parsed.map((item) => ({
      id: item.id,
      label: item.label ?? item.id,
      did: item.did,
      privateKeyHex: item.privateKeyHex ?? item.private_key_hex ?? "",
    }));
    return applyActiveFilter(identities);
  }

  const identityDir = process.env.TECHNOCORE_IDENTITY_DIR;
  if (identityDir) {
    const identities: NodeIdentity[] = [];
    for (const file of readdirSync(identityDir).filter((f) => f.endsWith(".json")).sort()) {
      const id = file.replace(/\.json$/, "");
      const identity = parseIdentityFile(join(identityDir, file), id, id);
      if (identity) identities.push(identity);
    }
    if (identities.length) return applyActiveFilter(identities);
  }

  if (process.env.NODE_ENV === "production") {
    return [];
  }

  const repoRoot = join(process.cwd(), "..");
  const candidates: Array<[string, string, string]> = [
    ["node_identity.json", "primary", "Primary Node"],
  ];

  const identities: NodeIdentity[] = [];
  for (const [file, id, label] of candidates) {
    const identity = parseIdentityFile(
      join(/* turbopackIgnore: true */ repoRoot, file),
      id,
      label,
    );
    if (identity) identities.push(identity);
  }
  return applyActiveFilter(identities);
}

export function getIdentityById(id: string): NodeIdentity | undefined {
  return loadIdentities().find((item) => item.id === id);
}

export function listIdentitySummaries(): Array<{
  id: string;
  label: string;
  didHint: string;
}> {
  return loadIdentities().map(({ id, label, did }) => ({
    id,
    label,
    didHint: abbreviateDid(did),
  }));
}
