from __future__ import annotations

import base64
import json
from typing import Any

from cryptography.exceptions import InvalidSignature
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PublicKey


def canonical_json(value: dict[str, Any]) -> bytes:
    return json.dumps(value, separators=(",", ":"), sort_keys=True).encode("utf-8")


def verify_activation_payload(payload: dict[str, Any], public_key_b64: str) -> bool:
    signature_b64 = payload.get("signature")
    if not signature_b64:
        return False

    unsigned = dict(payload)
    unsigned.pop("signature", None)

    try:
        signature = base64.urlsafe_b64decode(signature_b64 + "===")
        public_key = Ed25519PublicKey.from_public_bytes(
            base64.b64decode(public_key_b64)
        )
        public_key.verify(signature, canonical_json(unsigned))
        return True
    except (InvalidSignature, ValueError):
        return False
