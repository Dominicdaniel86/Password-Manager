import os
import psycopg2
from flask import Flask, request, jsonify

conn = psycopg2.connect(
    host=os.getenv("DB_HOST"),
    user=os.getenv("DB_USER"),
    password=os.getenv("DB_PASSWORD"),
    dbname=os.getenv("DB_NAME"),
    port=5432
)

app = Flask(__name__)


@app.route("/health")
def health():
    return jsonify({"status": "ok"}), 200


@app.route("/items", methods=["POST"])
def save_item():
    data = request.get_json()
    return jsonify({"message": "Item saved", "data": data}), 201


@app.route("/items/<item_id>", methods=["DELETE"])
def delete_item(item_id):
    # TODO: delete item from database
    return jsonify({"message": f"Item {item_id} deleted"}), 200


@app.route("/items", methods=["GET"])
def list_items():
    cur = conn.cursor()
    cur.execute("SELECT * FROM items")
    rows = cur.fetchall()
    return jsonify(rows), 200

# Under normal port 80: just display hello world
@app.route("/")
def hello():
    return "Hello, World!", 200

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=80, debug=True)
