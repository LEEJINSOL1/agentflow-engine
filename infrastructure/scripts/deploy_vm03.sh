#!/usr/bin/env bash
# Mac에서 flop-vm-03으로 node_identity_03 + 스크립트 배포
# Usage: ./deploy_vm03.sh <VM_PUBLIC_IP>
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

IDENT_SRC="${REPO_ROOT}/node_identity_03.json"
if [[ ! -f "$IDENT_SRC" ]]; then
  echo "없음: $IDENT_SRC"
  exit 1
fi

echo "→ flop-vm-03 (${USER}@${IP}) 배포 중..."
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
grep -q FLOP_VM_LABEL ~/.bashrc 2>/dev/null || echo 'export FLOP_VM_LABEL="flop-vm-03 japan east pilot"' >> ~/.bashrc
export FLOP_VM_LABEL="flop-vm-03 japan east pilot"
sudo apt-get update -qq
sudo apt-get install -y -qq python3 python3-pip
pip3 install cryptography --break-system-packages -q
python3 ~/vm_technocore.py register --label "$FLOP_VM_LABEL"
python3 ~/vm_technocore.py heartbeat
python3 ~/vm_technocore.py status
echo ""
echo "✓ VM03 설치+등록+heartbeat 완료"
echo "  lobby 메시지: python3 ~/vm_technocore.py say \"직접 작성한 메시지\""
REMOTE

echo ""
echo "완료."
echo "  ssh -i $SSH_KEY ${USER}@${IP}"
echo "  python3 ~/vm_technocore.py say \"16자 이상 직접 작성\""
