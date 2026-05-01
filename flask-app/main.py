import os
import time
import requests
import psycopg2
from functools import wraps
from flask import Flask, request, jsonify, g
from jose import jwt, JWTError

REGION = "us-east-1"
USER_POOL_ID = "us-east-1_MYKonC7aG"
CLIENT_ID = "m44ooj0he619o3cj6a0hvk8qi"
ISSUER = f"https://cognito-idp.{REGION}.amazonaws.com/{USER_POOL_ID}"
JWKS_URL = f"{ISSUER}/.well-known/jwks.json"

_jwks_cache = {"data": None, "fetched_at": 0}

def get_jwks():
    now = time.time()
    if _jwks_cache["data"] is None or now - _jwks_cache["fetched_at"] > 3600:
        resp = requests.get(JWKS_URL, timeout=5)
        resp.raise_for_status()
        _jwks_cache["data"] = resp.json()
        _jwks_cache["fetched_at"] = now
    return _jwks_cache["data"]

def get_signing_key(token: str):
    unverified_header = jwt.get_unverified_header(token)
    kid = unverified_header.get("kid")
    if not kid:
        raise JWTError("Missing kid in token header")

    jwks = get_jwks()
    for key in jwks["keys"]:
        if key["kid"] == kid:
            return key

    raise JWTError("No matching JWK found")

def verify_token(token: str) -> dict:
    signing_key = get_signing_key(token)

    claims = jwt.decode(
        token,
        signing_key,
        algorithms=["RS256"],
        issuer=ISSUER,
        options={
            "verify_aud": False
        }
    )

    token_use = claims.get("token_use")

    if token_use != "access":
        raise JWTError(f"Expected access token, got {token_use}")

    if claims.get("client_id") != CLIENT_ID:
        raise JWTError("Invalid client_id")

    return claims

# ── Auth Decorator ────────────────────────────────────────────
def require_auth(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get("Authorization", "")
        if not auth_header.startswith("Bearer "):
            return jsonify({"error": "No token"}), 401
        try:
            g.user = verify_token(auth_header.split(" ")[1])
        except JWTError as e:
            return jsonify({"error": "Ungültiger Token", "detail": str(e)}), 403
        return f(*args, **kwargs)
    return decorated

# ── DB ────────────────────────────────────────────────────────
conn = psycopg2.connect(
    host=os.getenv("DB_HOST"),
    user=os.getenv("DB_USER"),
    password=os.getenv("DB_PASSWORD"),
    dbname=os.getenv("DB_NAME"),
    port=5432
)

app = Flask(__name__)


@app.route("/api/health")
def health():
    return jsonify({"status": "ok"}), 200


@app.route("/api/items", methods=["POST"])
@require_auth
def save_item():
    user_id = g.user["sub"]
    ensure_user_exists(user_id)  # ← add this
    data = request.get_json()
    cur = conn.cursor()
    cur.execute(
        "INSERT INTO items (user_id, title, username, password, url, notes) VALUES (%s, %s, %s, %s, %s, %s)",
        (user_id, data["title"], data.get("username"), data["password"], data.get("url"), data.get("notes"))
    )
    conn.commit()
    cur.close()
    return jsonify({"message": "Item saved", "data": data, "user": user_id}), 201


@app.route("/api/items/<item_id>", methods=["DELETE"])
@require_auth
def delete_item(item_id):
    user_id = g.user["sub"]
    ensure_user_exists(user_id)  # ← add this
    cur = conn.cursor()
    cur.execute(
        "DELETE FROM items WHERE id = %s AND user_id = %s",
        (item_id, user_id)
    )
    conn.commit()
    cur.close()
    return jsonify({"message": f"Item {item_id} deleted", "user": user_id}), 200


@app.route("/api/items", methods=["GET"])
@require_auth
def list_items():
    user_id = g.user["sub"]
    ensure_user_exists(user_id)  # ← add this
    print(f"User {user_id} is listing items")
    cur = conn.cursor()
    cur.execute("SELECT id, title, username, password, url, notes, created_at FROM items WHERE user_id = %s", (user_id,))
    rows = cur.fetchall()
    cur.close()
    items = [
        {"id": r[0], "title": r[1], "username": r[2], "password": r[3], "url": r[4], "notes": r[5], "created_at": r[6]}
        for r in rows
    ]
    return jsonify(items), 200


# ── DB Helper ─────────────────────────────────────────────────
def ensure_user_exists(user_id: str):
    cur = conn.cursor()
    cur.execute(
        "INSERT INTO users (id) VALUES (%s) ON CONFLICT (id) DO NOTHING",
        (user_id,)
    )
    conn.commit()
    cur.close()

# Under normal port 80: just display hello world
@app.route("/")
@app.route("/api/")
def hello():
    return "Hello, World!", 200

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=80, debug=True)
