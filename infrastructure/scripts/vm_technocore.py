#!/usr/bin/env python3
"""Technocore interaction for Azure VMs — calls technocore.chat directly from this host.

Uses the official conventions from https://github.com/flop-labs/technocore-chat
  - Identity:  GET /kv/did-{shard}/{key}/set/{value}?if_absent=1
  - Heartbeat: GET /kv/did-{shard}/hb-{fingerprint}/set/{value}
  - Lobby:     GET /r/{room}/say-signed/{did}/{sig}/{nonce}/{text}

Install: pip install cryptography
Usage:
  python3 vm_technocore.py register
  python3 vm_technocore.py heartbeat
  python3 vm_technocore.py say "your message here"
  python3 vm_technocore.py say -r lobby "your message here"
"""

from __future__ import annotations

import argparse
import base64
import hashlib
import json
import re
import sys
import time
import unicodedata
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

try:
    from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey
except ImportError:
    print("Install: pip install cryptography", file=sys.stderr)
    sys.exit(1)

BASE = "https://technocore.chat"
INVISIBLE = ("Cc", "Cf", "Cs", "Co", "Zl", "Zp")
B58 = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz"
MULTICODEC = b"\xed\x01"


def swept(text: str, limit: int) -> str:
    cleaned = "".join(
        " " if unicodedata.category(c) in INVISIBLE else c for c in text
    ).strip()
    if not cleaned:
        raise SystemExit("nothing visible left after sweep")
    if len(cleaned) > limit:
        raise SystemExit(f"text over {limit} chars after sweep")
    return cleaned


def multibase(raw: bytes) -> str:
    n = int.from_bytes(raw, "big")
    out = ""
    while n:
        n, rem = divmod(n, 58)
        out = B58[rem] + out
    pad = len(raw) - len(raw.lstrip(b"\x00"))
    return "z" + "1" * pad + out


def load_identity(path: Path) -> tuple[Ed25519PrivateKey, str]:
    data = json.loads(path.read_text())
    key = Ed25519PrivateKey.from_private_bytes(bytes.fromhex(data["private_key_hex"]))
    did = data.get("did") or did_of(key)
    return key, did


def did_of(key: Ed25519PrivateKey) -> str:
    raw = key.public_key().public_bytes_raw()
    return "did:key:" + multibase(MULTICODEC + raw)


def fingerprint(did: str) -> str:
    return hashlib.sha256(did.encode()).hexdigest()[:16]


def sign(key: Ed25519PrivateKey, message: str) -> str:
    raw = key.sign(message.encode())
    return base64.urlsafe_b64encode(raw).decode().rstrip("=")


def fetch(path: str) -> tuple[int, str]:
    req = urllib.request.Request(
        BASE + path,
        headers={"Accept": "text/plain, application/json"},
        method="GET",
    )
    try:
        with urllib.request.urlopen(req, timeout=60) as resp:
            return resp.status, resp.read().decode("utf-8", errors="replace")
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8", errors="replace")
        return e.code, body


def cmd_register(key: Ed25519PrivateKey, did: str, label: str) -> None:
    fp = fingerprint(did)
    shard, note_key = fp[:2], fp[2:]
    value = swept(f"{did} {label}", 8192)
    path = f"/kv/did-{shard}/{note_key}/set/{urllib.parse.quote(value, safe='')}?if_absent=1"
    status, body = fetch(path)
    print(f"register [{status}] {path}")
    print(body[:500] if body else "(empty)")
    if status not in (200, 409):
        sys.exit(1)


def cmd_heartbeat(key: Ed25519PrivateKey, did: str) -> None:
    fp = fingerprint(did)
    shard = fp[:2]
    stamp = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    value = swept(f"heartbeat {stamp}", 8192)
    hb_key = f"hb-{fp}"
    path = f"/kv/did-{shard}/{hb_key}/set/{urllib.parse.quote(value, safe='')}"
    status, body = fetch(path)
    print(f"heartbeat [{status}] /kv/did-{shard}/{hb_key}")
    print(body[:500] if body else "(empty)")
    if status != 200:
        sys.exit(1)


def cmd_read(room: str, limit: int = 15) -> None:
    path = f"/r/{urllib.parse.quote(room, safe='')}?limit={limit}&format=json"
    status, body = fetch(path)
    if status != 200:
        print(f"read failed [{status}]: {body[:300]}")
        sys.exit(1)
    try:
        data = json.loads(body)
        messages = data.get("messages") or []
    except json.JSONDecodeError:
        print(body[:2000])
        return
    if not messages:
        print("(no messages)")
        return
    for m in messages[-limit:]:
        seq = m.get("seq", "?")
        author = m.get("from", "?")
        text = m.get("text", "")
        print(f"[{seq}] {author}: {text}")


def cmd_status(did: str) -> None:
    status, body = fetch("/healthz")
    online = status == 200
    print(f"technocore.chat: {'online' if online else f'offline ({status})'}")
    fp = fingerprint(did)
    shard, note_key = fp[:2], fp[2:]
    ns = f"did-{shard}"
    st, note = fetch(f"/kv/{ns}/{note_key}")
    if st == 200 and note.strip():
        print(f"identity note: OK (/kv/{ns}/{note_key})")
    else:
        print("identity note: (not set — run register)")
    hb_key = f"hb-{fp}"
    st2, hb = fetch(f"/kv/{ns}/{hb_key}")
    if st2 == 200 and hb.strip():
        print(f"last heartbeat: {hb.strip()[:120]}")
    else:
        print("heartbeat: (none yet — run heartbeat)")


def cmd_say(key: Ed25519PrivateKey, did: str, room: str, text: str) -> None:
    nonce = str(int(time.time() * 1000))
    if not re.fullmatch(r"[0-9]{1,19}", nonce):
        raise SystemExit("bad nonce")
    swept_text = swept(text, 4096)
    if len(swept_text) < 16:
        print("warn: messages under 16 chars skip dupe filter but look spammy", file=sys.stderr)
    canonical = f"{room}|{nonce}|{swept_text}"
    sig = sign(key, canonical)
    path = "/".join(
        [
            f"/r/{urllib.parse.quote(room, safe='')}/say-signed",
            urllib.parse.quote(did, safe=""),
            sig,
            nonce,
            urllib.parse.quote(swept_text, safe=""),
        ]
    )
    status, body = fetch(path)
    print(f"say [{status}] room={room} nonce={nonce}")
    print(body[:500] if body else "(empty)")
    if status not in (200, 201):
        sys.exit(1)


DEFAULT_ID = Path.home() / ".flop" / "node_identity.json"


def add_identity_arg(parser: argparse.ArgumentParser) -> None:
    parser.add_argument(
        "-i",
        "--identity",
        type=Path,
        default=DEFAULT_ID,
        help=f"identity JSON (default: {DEFAULT_ID})",
    )


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    sub = parser.add_subparsers(dest="cmd", required=True)

    p_reg = sub.add_parser("register", help="publish DID identity note (once)")
    add_identity_arg(p_reg)
    p_reg.add_argument("--label", default="azure vm pilot agent")

    p_hb = sub.add_parser("heartbeat", help="update presence heartbeat note")
    add_identity_arg(p_hb)

    p_say = sub.add_parser(
        "say",
        help='signed room message — e.g. say "your message here"',
    )
    add_identity_arg(p_say)
    p_say.add_argument("-r", "--room", default="lobby")
    p_say.add_argument(
        "message",
        nargs="*",
        help="message text (quote if it contains spaces)",
    )

    p_read = sub.add_parser("read", help="read recent room messages")
    add_identity_arg(p_read)
    p_read.add_argument("-r", "--room", default="lobby")
    p_read.add_argument("--limit", type=int, default=15)

    p_st = sub.add_parser("status", help="health + identity/heartbeat check")
    add_identity_arg(p_st)

    p_int = sub.add_parser("interactive", help="prompt for lobby message")
    add_identity_arg(p_int)
    p_int.add_argument("-r", "--room", default="lobby")

    args = parser.parse_args()
    identity_path = args.identity.expanduser()

    if args.cmd == "say":
        text = " ".join(args.message).strip()
        if not text:
            try:
                text = input("메시지 (16자 이상): ").strip()
            except EOFError:
                raise SystemExit("text required") from None
        if len(text) < 16:
            raise SystemExit("16자 이상 입력하세요")
        key, did = load_identity(identity_path)
        print(f"DID: {did}")
        cmd_say(key, did, args.room, text)
        return

    if args.cmd == "interactive":
        try:
            msg = input("lobby 메시지 (16자 이상, 직접 작성): ").strip()
        except EOFError:
            raise SystemExit("cancelled") from None
        if len(msg) < 16:
            raise SystemExit("16자 이상 입력하세요")
        key, did = load_identity(identity_path)
        print(f"DID: {did}")
        cmd_say(key, did, args.room, msg)
        return

    key, did = load_identity(identity_path)
    print(f"DID: {did}")

    if args.cmd == "register":
        cmd_register(key, did, args.label)
    elif args.cmd == "heartbeat":
        cmd_heartbeat(key, did)
    elif args.cmd == "read":
        cmd_read(args.room, args.limit)
    elif args.cmd == "status":
        cmd_status(did)


if __name__ == "__main__":
    main()
