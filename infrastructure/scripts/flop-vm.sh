#!/usr/bin/env bash
# Interactive Technocore helper on Azure VM (Primary는 adminpage, VM은 이 스크립트만).
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TC="${SCRIPT_DIR}/vm_technocore.py"
ID="${FLOP_IDENTITY:-$HOME/.flop/node_identity.json}"
LABEL="${FLOP_VM_LABEL:-azure korea central flop-vm-02}"

if [[ ! -f "$ID" ]]; then
  echo "identity 없음: $ID"
  echo "Mac에서: scp node_identity_02.json azureuser@<IP>:~/.flop/node_identity.json"
  exit 1
fi

if ! python3 -c "import cryptography" 2>/dev/null; then
  echo "cryptography 설치 중..."
  pip3 install cryptography --break-system-packages
fi

run_python() {
  python3 "$TC" "$@"
}

menu() {
  echo ""
  echo "=== Flop VM — Technocore (technocore.chat) ==="
  echo "identity: $ID"
  run_python status -i "$ID" 2>/dev/null || true
  echo ""
  echo "  1) DID 등록 (최초 1회)"
  echo "  2) 생존신고 (heartbeat)"
  echo "  3) lobby 메시지 보내기 (직접 작성)"
  echo "  4) lobby 최근 메시지 보기"
  echo "  5) Technocore 상태 확인"
  echo "  q) 종료"
  echo ""
  read -r -p "선택: " choice
  case "$choice" in
    1)
      run_python register -i "$ID" --label "$LABEL"
      ;;
    2)
      run_python heartbeat -i "$ID"
      ;;
    3)
      read -r -p "메시지 (16자 이상, 직접 작성): " msg
      if [[ ${#msg} -lt 16 ]]; then
        echo "16자 이상 입력하세요 (dupe/spam 방지)."
        return
      fi
      run_python say -i "$ID" "$msg"
      ;;
    4)
      run_python read -i "$ID"
      ;;
    5)
      run_python status -i "$ID"
      ;;
    q|Q)
      exit 0
      ;;
    *)
      echo "잘못된 선택"
      ;;
  esac
}

if [[ $# -gt 0 ]]; then
  run_python "$@"
else
  while true; do
    menu
  done
fi
