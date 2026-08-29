#!/usr/bin/env python3
"""Generate Ed25519 key pair and W3C did:key identity for node authentication."""

import json
import sys
from pathlib import Path

try:
    from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey
    from cryptography.hazmat.primitives.serialization import (
        Encoding,
        NoEncryption,
        PrivateFormat,
        PublicFormat,
    )
except ImportError:
    print("Install: pip install cryptography", file=sys.stderr)
    sys.exit(1)


def multibase_encode_ed25519_public_key(public_key_bytes: bytes) -> str:
    """Encode Ed25519 public key as did:key multibase (base58btc with 'z' prefix)."""
    alphabet = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz"
    prefix = bytes([0xED, 0x01])
    data = prefix + public_key_bytes

    num = int.from_bytes(data, "big")
    encoded = ""
    while num > 0:
        num, rem = divmod(num, 58)
        encoded = alphabet[rem] + encoded

    pad = 0
    for b in data:
        if b == 0:
            pad += 1
        else:
            break
    return "z" + ("1" * pad) + encoded


def generate_identity(output_path: Path) -> dict:
    private_key = Ed25519PrivateKey.generate()
    public_key = private_key.public_key()
    public_bytes = public_key.public_bytes(Encoding.Raw, PublicFormat.Raw)

    did = f"did:key:{multibase_encode_ed25519_public_key(public_bytes)}"

    identity = {
        "did": did,
        "public_key_hex": public_bytes.hex(),
        "private_key_hex": private_key.private_bytes(
            Encoding.Raw, PrivateFormat.Raw, NoEncryption()
        ).hex(),
    }

    output_path.write_text(json.dumps(identity, indent=2))
    output_path.chmod(0o600)
    return identity


def main() -> None:
    output = Path(sys.argv[1] if len(sys.argv) > 1 else "node_identity.json")
    identity = generate_identity(output)
    print(f"DID: {identity['did']}")
    print(f"Saved to: {output}")


if __name__ == "__main__":
    main()
