#!/usr/bin/env bash
# Mac에서 flop-vm-02로 identity + 스크립트 배포
# Usage: ./deploy_vm02.sh <VM_PUBLIC_IP>
set -euo pipefail

if [[ $# -lt 1 ]]; then
  echo "Usage: $0 <VM_PUBLIC_IP>"
  echo "예:   $0 20.x.x.x"
  exit 1
fi

IP="$1"
SSH_KEY="${FLOP_SSH_KEY:-$HOME/.ssh/flop_azure}"
USER="${FLOP_SSH_USER:-azureuser}"
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

IDENT_SRC="${REPO_ROOT}/node_identity_02.json"
if [[ ! -f "$IDENT_SRC" ]]; then
  echo "없음: $IDENT_SRC"
  exit 1
fi

echo "→ ${USER}@${IP} 배포 중..."
ssh -i "$SSH_KEY" -o StrictHostKeyChecking=accept-new "${USER}@${IP}" "mkdir -p ~/.flop && chmod 700 ~/.flop"

scp -i "$SSH_KEY" "$IDENT_SRC" "${USER}@${IP}:~/.flop/node_identity.json"
scp -i "$SSH_KEY" \
  "${REPO_ROOT}/infrastructure/scripts/vm_technocore.py" \
  "${REPO_ROOT}/infrastructure/scripts/flop-vm.sh" \
  "${USER}@${IP}:~/"

ssh -i "$SSH_KEY" "${USER}@${IP}" bash -s <<'REMOTE'
set -euo pipefail
chmod 600 ~/.flop/node_identity.json
chmod +x ~/vm_technocore.py ~/flop-vm.sh
sudo apt-get update -qq
sudo apt-get install -y -qq python3 python3-pip
pip3 install cryptography --break-system-packages -q
echo ""
echo "✓ 설치 완료. 접속 후: ~/flop-vm.sh"
REMOTE

echo ""
echo "완료. 실행:"
echo "  ssh -i $SSH_KEY ${USER}@${IP}"
echo "  ~/flop-vm.sh"
