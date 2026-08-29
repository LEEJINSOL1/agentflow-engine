import { readFileSync, existsSync } from "fs";
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
    return parsed.map((item) => ({
      id: item.id,
      label: item.label ?? item.id,
      did: item.did,
      privateKeyHex: item.privateKeyHex ?? item.private_key_hex ?? "",
    }));
  }

  const identityDir = process.env.TECHNOCORE_IDENTITY_DIR;
  if (identityDir) {
    const candidates: Array<[string, string, string]> = [
      ["node_identity.json", "primary", "Primary Node"],
      ["node_identity_02.json", "secondary", "Secondary Node"],
    ];
    const identities: NodeIdentity[] = [];
    for (const [file, id, label] of candidates) {
      const identity = parseIdentityFile(join(identityDir, file), id, label);
      if (identity) identities.push(identity);
    }
    if (identities.length) return identities;
  }

  if (process.env.NODE_ENV === "production") {
    return [];
  }

  const repoRoot = join(process.cwd(), "..");
  const candidates: Array<[string, string, string]> = [
    ["node_identity.json", "primary", "Primary Node"],
    ["node_identity_02.json", "secondary", "Secondary Node"],
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
  return identities;
}

export function getIdentityById(id: string): NodeIdentity | undefined {
  return loadIdentities().find((item) => item.id === id);
}

export function listIdentitySummaries(): Array<{ id: string; label: string; did: string }> {
  return loadIdentities().map(({ id, label, did }) => ({ id, label, did }));
}
