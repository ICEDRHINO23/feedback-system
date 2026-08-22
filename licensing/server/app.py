from __future__ import annotations

import base64
import hashlib
import os
import secrets
import sqlite3
import uuid
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any

from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey
from fastapi import Depends, FastAPI, Header, HTTPException
from pydantic import BaseModel, Field

BASE_DIR = Path(__file__).resolve().parent
DB_PATH = Path(os.getenv("RAS_LICENSE_DB", BASE_DIR / "license.db"))
MANAGER_API_KEY = os.getenv("RAS_LICENSE_MANAGER_KEY", "dev-manager-key")
PRIVATE_KEY_B64 = os.getenv("RAS_LICENSE_PRIVATE_KEY_B64", "")

app = FastAPI(
    title="RAS Licensing API",
    version="0.1.0",
    description="Dynamic licensing platform for all RAS products.",
)


def db() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db() -> None:
    conn = db()
    try:
        conn.executescript(
            """
            CREATE TABLE IF NOT EXISTS products (
                id TEXT PRIMARY KEY,
                product_code TEXT UNIQUE NOT NULL,
                name TEXT NOT NULL,
                description TEXT,
                version TEXT,
                status TEXT NOT NULL DEFAULT 'active'
            );

            CREATE TABLE IF NOT EXISTS features (
                id TEXT PRIMARY KEY,
                feature_code TEXT UNIQUE NOT NULL,
                name TEXT NOT NULL,
                description TEXT,
                value_type TEXT NOT NULL DEFAULT 'boolean',
                status TEXT NOT NULL DEFAULT 'active'
            );

            CREATE TABLE IF NOT EXISTS customers (
                id TEXT PRIMARY KEY,
                customer_code TEXT UNIQUE NOT NULL,
                name TEXT NOT NULL,
                contact_person TEXT,
                email TEXT,
                phone TEXT,
                address TEXT,
                status TEXT NOT NULL DEFAULT 'active'
            );

            CREATE TABLE IF NOT EXISTS plans (
                id TEXT PRIMARY KEY,
                product_id TEXT NOT NULL,
                plan_code TEXT NOT NULL,
                name TEXT NOT NULL,
                billing_type TEXT NOT NULL DEFAULT 'subscription',
                duration_days INTEGER,
                price REAL NOT NULL DEFAULT 0,
                currency TEXT NOT NULL DEFAULT 'INR',
                max_activations INTEGER NOT NULL DEFAULT 1,
                max_students INTEGER,
                max_teachers INTEGER,
                status TEXT NOT NULL DEFAULT 'active',
                UNIQUE(product_id, plan_code)
            );

            CREATE TABLE IF NOT EXISTS plan_features (
                plan_id TEXT NOT NULL,
                feature_id TEXT NOT NULL,
                enabled INTEGER NOT NULL DEFAULT 1,
                limit_value TEXT,
                PRIMARY KEY(plan_id, feature_id)
            );

            CREATE TABLE IF NOT EXISTS licenses (
                id TEXT PRIMARY KEY,
                license_key_hash TEXT UNIQUE NOT NULL,
                license_key_hint TEXT,
                customer_id TEXT NOT NULL,
                product_id TEXT NOT NULL,
                plan_id TEXT,
                starts_at TEXT NOT NULL,
                expires_at TEXT,
                status TEXT NOT NULL DEFAULT 'active',
                allowed_activations INTEGER NOT NULL DEFAULT 1,
                metadata_json TEXT NOT NULL DEFAULT '{}'
            );

            CREATE TABLE IF NOT EXISTS instances (
                id TEXT PRIMARY KEY,
                instance_code TEXT UNIQUE NOT NULL,
                product_id TEXT NOT NULL,
                customer_id TEXT,
                domain TEXT,
                platform TEXT NOT NULL,
                installation_name TEXT,
                fingerprint_hash TEXT,
                first_seen TEXT NOT NULL,
                last_seen TEXT NOT NULL,
                status TEXT NOT NULL DEFAULT 'active'
            );

            CREATE TABLE IF NOT EXISTS activations (
                id TEXT PRIMARY KEY,
                license_id TEXT NOT NULL,
                instance_id TEXT NOT NULL,
                activated_at TEXT NOT NULL,
                last_seen TEXT NOT NULL,
                status TEXT NOT NULL DEFAULT 'active',
                UNIQUE(license_id, instance_id)
            );

            CREATE TABLE IF NOT EXISTS audit_logs (
                id TEXT PRIMARY KEY,
                actor TEXT NOT NULL,
                action TEXT NOT NULL,
                entity_type TEXT NOT NULL,
                entity_id TEXT,
                details_json TEXT NOT NULL DEFAULT '{}',
                created_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS signing_keys (
                id INTEGER PRIMARY KEY CHECK (id = 1),
                private_key_b64 TEXT NOT NULL
            );
            """
        )

        conn.execute(
            "INSERT OR IGNORE INTO signing_keys(id, private_key_b64) VALUES(1, ?)",
            (get_or_create_private_key_b64(),),
        )

        seed_products(conn)
        conn.commit()
    finally:
        conn.close()


def get_or_create_private_key_b64() -> str:
    if PRIVATE_KEY_B64:
        return PRIVATE_KEY_B64
    key = Ed25519PrivateKey.generate()
    raw = key.private_bytes(
        encoding=serialization.Encoding.Raw,
        format=serialization.PrivateFormat.Raw,
        encryption_algorithm=serialization.NoEncryption(),
    )
    return base64.b64encode(raw).decode("ascii")


def private_key() -> Ed25519PrivateKey:
    conn = db()
    try:
        row = conn.execute(
            "SELECT private_key_b64 FROM signing_keys WHERE id = 1"
        ).fetchone()
    finally:
        conn.close()
    if not row:
        raise RuntimeError("Signing key is not initialized")
    return Ed25519PrivateKey.from_private_bytes(
        base64.b64decode(row["private_key_b64"])
    )


def public_key_b64() -> str:
    public = private_key().public_key()
    raw = public.public_bytes(
        encoding=serialization.Encoding.Raw,
        format=serialization.PublicFormat.Raw,
    )
    return base64.b64encode(raw).decode("ascii")


def seed_products(conn: sqlite3.Connection) -> None:
    product_id = str(uuid.uuid4())
    conn.execute(
        """
        INSERT OR IGNORE INTO products
        (id, product_code, name, description, version)
        VALUES(?, 'RAS-ASSESS', 'RAS Assessment',
               'Online and local examination platform', '1.0')
        """,
        (product_id,),
    )
    existing = conn.execute(
        "SELECT id FROM products WHERE product_code='RAS-ASSESS'"
    ).fetchone()
    pid = existing["id"] if existing else product_id

    seeds = [
        ("ASSESSMENTS", "Assessments"),
        ("QUESTION_MANAGER", "Question Manager"),
        ("LIVE_MONITOR", "Live Monitor"),
        ("REPORTS", "Reports"),
        ("RESULT_ANALYSIS", "Result Analysis"),
    ]
    for code, name in seeds:
        conn.execute(
            "INSERT OR IGNORE INTO features(id, feature_code, name) VALUES(?, ?, ?)",
            (str(uuid.uuid4()), code, name),
        )


def manager_guard(x_ras_manager_key: str | None = Header(default=None)) -> None:
    if not x_ras_manager_key or not secrets.compare_digest(
        x_ras_manager_key, MANAGER_API_KEY
    ):
        raise HTTPException(status_code=401, detail="RAS manager authentication required")


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def hash_value(value: str) -> str:
    return hashlib.sha256(value.strip().upper().encode("utf-8")).hexdigest()


def make_license_key() -> str:
    parts = [secrets.token_hex(2).upper() for _ in range(4)]
    return "RAS-" + "-".join(parts)


def sign_payload(payload: dict[str, Any]) -> str:
    import json

    encoded = json.dumps(payload, separators=(",", ":"), sort_keys=True).encode()
    signature = private_key().sign(encoded)
    return base64.urlsafe_b64encode(signature).decode().rstrip("=")


class ProductIn(BaseModel):
    product_code: str = Field(min_length=2)
    name: str = Field(min_length=2)
    description: str = ""
    version: str = "1.0"


class CustomerIn(BaseModel):
    customer_code: str = Field(min_length=2)
    name: str = Field(min_length=2)
    contact_person: str = ""
    email: str = ""
    phone: str = ""
    address: str = ""


class PlanIn(BaseModel):
    product_code: str
    plan_code: str
    name: str
    billing_type: str = "subscription"
    duration_days: int | None = None
    price: float = 0
    currency: str = "INR"
    max_activations: int = 1
    max_students: int | None = None
    max_teachers: int | None = None


class IssueLicenseIn(BaseModel):
    customer_code: str
    product_code: str
    plan_code: str | None = None
    starts_at: str | None = None
    expires_at: str | None = None
    allowed_activations: int = 1
    metadata: dict[str, Any] = {}


class ActivationIn(BaseModel):
    license_key: str
    product_code: str
    instance_code: str | None = None
    platform: str = "online"
    domain: str | None = None
    installation_name: str | None = None
    fingerprint: str | None = None


class ValidateIn(BaseModel):
    license_key: str
    product_code: str
    instance_code: str | None = None
    platform: str = "online"
    domain: str | None = None
    fingerprint: str | None = None


@app.on_event("startup")
def startup() -> None:
    init_db()


@app.get("/health")
def health() -> dict[str, Any]:
    return {"ok": True, "service": "ras-licensing", "version": app.version}


@app.get("/public-key")
def public_key() -> dict[str, str]:
    return {"algorithm": "Ed25519", "public_key": public_key_b64()}


@app.get("/products")
def products(_: None = Depends(manager_guard)) -> list[dict[str, Any]]:
    conn = db()
    try:
        return [dict(row) for row in conn.execute("SELECT * FROM products ORDER BY name")]
    finally:
        conn.close()


@app.post("/products")
def create_product(payload: ProductIn, _: None = Depends(manager_guard)) -> dict[str, Any]:
    conn = db()
    try:
        row = {
            "id": str(uuid.uuid4()),
            "product_code": payload.product_code.upper(),
            "name": payload.name,
            "description": payload.description,
            "version": payload.version,
        }
        conn.execute(
            "INSERT INTO products(id, product_code, name, description, version) VALUES(?,?,?,?,?)",
            tuple(row.values()),
        )
        conn.commit()
        return row
    except sqlite3.IntegrityError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc
    finally:
        conn.close()


@app.post("/customers")
def create_customer(payload: CustomerIn, _: None = Depends(manager_guard)) -> dict[str, Any]:
    conn = db()
    try:
        row = {
            "id": str(uuid.uuid4()),
            "customer_code": payload.customer_code.upper(),
            "name": payload.name,
            "contact_person": payload.contact_person,
            "email": payload.email,
            "phone": payload.phone,
            "address": payload.address,
        }
        conn.execute(
            """INSERT INTO customers
            (id, customer_code, name, contact_person, email, phone, address)
            VALUES(?,?,?,?,?,?,?)""",
            tuple(row.values()),
        )
        conn.commit()
        return row
    except sqlite3.IntegrityError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc
    finally:
        conn.close()


@app.post("/plans")
def create_plan(payload: PlanIn, _: None = Depends(manager_guard)) -> dict[str, Any]:
    conn = db()
    try:
        product = conn.execute(
            "SELECT id FROM products WHERE product_code = ?",
            (payload.product_code.upper(),),
        ).fetchone()
        if not product:
            raise HTTPException(status_code=404, detail="Product not found")

        row = {
            "id": str(uuid.uuid4()),
            "product_id": product["id"],
            "plan_code": payload.plan_code.upper(),
            "name": payload.name,
            "billing_type": payload.billing_type,
            "duration_days": payload.duration_days,
            "price": payload.price,
            "currency": payload.currency.upper(),
            "max_activations": payload.max_activations,
            "max_students": payload.max_students,
            "max_teachers": payload.max_teachers,
        }
        conn.execute(
            """INSERT INTO plans
            (id, product_id, plan_code, name, billing_type, duration_days,
             price, currency, max_activations, max_students, max_teachers)
            VALUES(?,?,?,?,?,?,?,?,?,?,?)""",
            tuple(row.values()),
        )
        conn.commit()
        return row
    except sqlite3.IntegrityError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc
    finally:
        conn.close()


@app.post("/licenses/issue")
def issue_license(payload: IssueLicenseIn, _: None = Depends(manager_guard)) -> dict[str, Any]:
    conn = db()
    try:
        customer = conn.execute(
            "SELECT * FROM customers WHERE customer_code = ?",
            (payload.customer_code.upper(),),
        ).fetchone()
        product = conn.execute(
            "SELECT * FROM products WHERE product_code = ?",
            (payload.product_code.upper(),),
        ).fetchone()
        if not customer or not product:
            raise HTTPException(status_code=404, detail="Customer or product not found")

        plan = None
        if payload.plan_code:
            plan = conn.execute(
                """SELECT * FROM plans
                WHERE product_id = ? AND plan_code = ?""",
                (product["id"], payload.plan_code.upper()),
            ).fetchone()
            if not plan:
                raise HTTPException(status_code=404, detail="Plan not found")

        starts = datetime.fromisoformat(payload.starts_at) if payload.starts_at else datetime.now(timezone.utc)
        expiry = payload.expires_at
        if not expiry and plan and plan["duration_days"]:
            expiry = (starts + timedelta(days=plan["duration_days"])).isoformat()

        license_key = make_license_key()
        license_id = str(uuid.uuid4())
        allowed = plan["max_activations"] if plan else payload.allowed_activations

        conn.execute(
            """INSERT INTO licenses
            (id, license_key_hash, license_key_hint, customer_id, product_id,
             plan_id, starts_at, expires_at, allowed_activations, metadata_json)
            VALUES(?,?,?,?,?,?,?,?,?,?)""",
            (
                license_id,
                hash_value(license_key),
                license_key[-4:],
                customer["id"],
                product["id"],
                plan["id"] if plan else None,
                starts.isoformat(),
                expiry,
                allowed,
                __import__("json").dumps(payload.metadata),
            ),
        )
        conn.execute(
            "INSERT INTO audit_logs(id, actor, action, entity_type, entity_id, details_json, created_at) VALUES(?,?,?,?,?,?,?)",
            (
                str(uuid.uuid4()),
                "RAS_LICENSE_MANAGER",
                "LICENSE_ISSUED",
                "license",
                license_id,
                __import__("json").dumps({"product": product["product_code"], "customer": customer["customer_code"]}),
                now_iso(),
            ),
        )
        conn.commit()
        return {
            "license_id": license_id,
            "license_key": license_key,
            "license_hint": license_key[-4:],
            "customer": customer["name"],
            "product": product["name"],
            "plan": plan["name"] if plan else None,
            "starts_at": starts.isoformat(),
            "expires_at": expiry,
            "allowed_activations": allowed,
        }
    finally:
        conn.close()


def lookup_license(conn: sqlite3.Connection, license_key: str, product_code: str) -> sqlite3.Row:
    row = conn.execute(
        """SELECT l.*, p.product_code, p.name product_name,
                  c.customer_code, c.name customer_name
           FROM licenses l
           JOIN products p ON p.id = l.product_id
           JOIN customers c ON c.id = l.customer_id
           WHERE l.license_key_hash = ? AND p.product_code = ?""",
        (hash_value(license_key), product_code.upper()),
    ).fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="License not found")
    return row


def license_state(row: sqlite3.Row) -> None:
    now = datetime.now(timezone.utc)
    starts = datetime.fromisoformat(row["starts_at"])
    if now < starts:
        raise HTTPException(status_code=403, detail="License has not started")
    if row["status"] != "active":
        raise HTTPException(status_code=403, detail=f"License status is {row['status']}")
    if row["expires_at"]:
        expires = datetime.fromisoformat(row["expires_at"])
        if now >= expires:
            raise HTTPException(status_code=403, detail="License has expired")


@app.post("/activations")
def activate(payload: ActivationIn) -> dict[str, Any]:
    conn = db()
    try:
        license_row = lookup_license(conn, payload.license_key, payload.product_code)
        license_state(license_row)

        existing = conn.execute(
            """SELECT a.*, i.instance_code, i.domain, i.platform, i.fingerprint_hash
               FROM activations a
               JOIN instances i ON i.id = a.instance_id
               WHERE a.license_id = ? AND a.status = 'active'""",
            (license_row["id"],),
        ).fetchall()

        if payload.instance_code:
            instance = conn.execute(
                "SELECT * FROM instances WHERE instance_code = ?",
                (payload.instance_code,),
            ).fetchone()
        else:
            instance = None

        fingerprint_hash = hash_value(payload.fingerprint) if payload.fingerprint else None

        if instance:
            if instance["fingerprint_hash"] and fingerprint_hash and instance["fingerprint_hash"] != fingerprint_hash:
                raise HTTPException(status_code=409, detail="Instance fingerprint mismatch")
            conn.execute(
                "UPDATE instances SET last_seen=?, domain=?, platform=?, fingerprint_hash=?, status='active' WHERE id=?",
                (now_iso(), payload.domain, payload.platform, fingerprint_hash, instance["id"]),
            )
            activation = conn.execute(
                "SELECT * FROM activations WHERE license_id=? AND instance_id=?",
                (license_row["id"], instance["id"]),
            ).fetchone()
            if not activation:
                conn.execute(
                    "INSERT INTO activations(id, license_id, instance_id, activated_at, last_seen, status) VALUES(?,?,?,?,?, 'active')",
                    (str(uuid.uuid4()), license_row["id"], instance["id"], now_iso(), now_iso()),
                )
        else:
            if len(existing) >= int(license_row["allowed_activations"]):
                raise HTTPException(status_code=409, detail="No activation slots available")
            instance_id = str(uuid.uuid4())
            instance_code = "inst_" + secrets.token_hex(8)
            conn.execute(
                """INSERT INTO instances
                (id, instance_code, product_id, customer_id, domain, platform,
                 installation_name, fingerprint_hash, first_seen, last_seen)
                VALUES(?,?,?,?,?,?,?,?,?,?)""",
                (
                    instance_id,
                    instance_code,
                    license_row["product_id"],
                    license_row["customer_id"],
                    payload.domain,
                    payload.platform,
                    payload.installation_name,
                    fingerprint_hash,
                    now_iso(),
                    now_iso(),
                ),
            )
            conn.execute(
                "INSERT INTO activations(id, license_id, instance_id, activated_at, last_seen, status) VALUES(?,?,?,?,?, 'active')",
                (str(uuid.uuid4()), license_row["id"], instance_id, now_iso(), now_iso()),
            )
            instance = conn.execute(
                "SELECT * FROM instances WHERE id = ?", (instance_id,)
            ).fetchone()

        conn.commit()

        payload_out = {
            "license_id": license_row["id"],
            "product_code": license_row["product_code"],
            "customer_code": license_row["customer_code"],
            "instance_code": instance["instance_code"],
            "platform": instance["platform"],
            "domain": instance["domain"],
            "expires_at": license_row["expires_at"],
            "issued_at": now_iso(),
        }
        payload_out["signature"] = sign_payload(payload_out)
        return payload_out
    finally:
        conn.close()


@app.post("/validate")
def validate(payload: ValidateIn) -> dict[str, Any]:
    conn = db()
    try:
        row = lookup_license(conn, payload.license_key, payload.product_code)
        license_state(row)
        active = conn.execute(
            """SELECT a.id, i.instance_code, i.domain, i.platform
               FROM activations a
               JOIN instances i ON i.id = a.instance_id
               WHERE a.license_id=? AND a.status='active'""",
            (row["id"],),
        ).fetchall()
        matched = None
        for item in active:
            if payload.instance_code and item["instance_code"] == payload.instance_code:
                matched = item
                break
            if payload.domain and item["domain"] == payload.domain:
                matched = item
                break
        if active and not matched:
            raise HTTPException(status_code=403, detail="License is not activated for this instance")

        return {
            "valid": True,
            "license_id": row["id"],
            "product_code": row["product_code"],
            "product_name": row["product_name"],
            "customer_name": row["customer_name"],
            "expires_at": row["expires_at"],
            "allowed_activations": row["allowed_activations"],
            "active_activations": len(active),
            "public_key": public_key_b64(),
        }
    finally:
        conn.close()
