#!/usr/bin/env bash
# Railway 환경변수 설정 (로컬에서 1회 실행)
# 사용: ./scripts/deploy-railway-env.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
IDENTITY_JSON="$(
  node -e "
const fs = require('fs');
const path = require('path');
const root = path.join('$ROOT', '..');
const files = [
  ['node_identity.json', 'primary', 'Primary Node'],
  ['node_identity_02.json', 'secondary', 'Secondary Node'],
];
const out = [];
for (const [file, id, label] of files) {
  const p = path.join(root, file);
  if (!fs.existsSync(p)) continue;
  const d = JSON.parse(fs.readFileSync(p, 'utf8'));
  out.push({ id, label, did: d.did, private_key_hex: d.private_key_hex });
}
process.stdout.write(JSON.stringify(out));
"
)"

if [[ -z "$IDENTITY_JSON" || "$IDENTITY_JSON" == "[]" ]]; then
  echo "node_identity.json 파일을 찾을 수 없습니다."
  exit 1
fi

: "${ADMIN_USERNAME:?ADMIN_USERNAME required}"
: "${ADMIN_PASSWORD:?ADMIN_PASSWORD required}"
: "${ADMIN_SESSION_SECRET:?ADMIN_SESSION_SECRET required}"

echo "Setting Railway variables for landing-page service..."
npx @railway/cli variables set \
  "ADMIN_USERNAME=$ADMIN_USERNAME" \
  "ADMIN_PASSWORD=$ADMIN_PASSWORD" \
  "ADMIN_SESSION_SECRET=$ADMIN_SESSION_SECRET" \
  "TECHNOCORE_IDENTITIES=$IDENTITY_JSON" \
  --service landing-page

echo "Done. Redeploy if needed: npx @railway/cli up --service landing-page"
