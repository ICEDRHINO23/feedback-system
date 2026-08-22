# RAS License Platform

Dynamic, product-agnostic licensing platform for all RAS products.

## Architecture

- `server/` — FastAPI licensing service. The private signing key lives only here.
- `desktop/` — PySide6 RAS License Manager used by the RAS licensing operator.
- `database/` — PostgreSQL-compatible schema; SQLite is used by the development server.

## Design principles

1. Products, editions, plans, features and limits are data-driven.
2. Licenses are bound to a customer plus product and plan.
3. Activations are tracked independently from licenses.
4. Online products bind to a domain/instance.
5. Windows/LAN products bind to a machine/installation fingerprint.
6. License payloads are Ed25519 signed by the server.
7. The private signing key is never shipped to customer products.
8. Product apps validate licenses through the API/SDK rather than reading the licensing database directly.

## Development

Server:

```bash
cd licensing/server
python -m venv .venv
# Windows: .venv\\Scripts\\activate
# Linux/macOS: source .venv/bin/activate
pip install -r requirements.txt
uvicorn app:app --reload --port 8743
```

Desktop manager:

```bash
cd licensing/desktop
pip install -r requirements.txt
python app.py
```

The desktop manager defaults to `http://127.0.0.1:8743` and `dev-manager-key` for development. Change these before production.
