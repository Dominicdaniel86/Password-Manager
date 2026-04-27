from flask import Flask, request, jsonify

app = Flask(__name__)


@app.route("/health")
def health():
    return jsonify({"status": "ok"}), 200


@app.route("/items", methods=["POST"])
def save_item():
    # TODO: save item to database
    pass


@app.route("/items/<item_id>", methods=["DELETE"])
def delete_item(item_id):
    # TODO: delete item from database
    pass


@app.route("/items", methods=["GET"])
def list_items():
    # TODO: fetch all items from database
    pass


if __name__ == "__main__":
    app.run(debug=True)
