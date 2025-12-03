from flask import Flask, request, jsonify
from flask_cors import CORS
from chat_logic import answer_nutrition_question

app = Flask(__name__)
CORS(app, origins=["http://localhost:3000"])  # if you’re using Next.js on 3000

@app.route("/api/chat", methods=["POST"])
def chat():
    data = request.get_json() or {}
    user_msg = data.get("message", "")

    if not user_msg:
        return jsonify({"error": "No message provided"}), 400

    try:
        result = answer_nutrition_question(user_msg)
        return jsonify(result)
    except Exception as e:
        print("!! ERROR in /api/chat:", repr(e), flush=True)
        return jsonify(
            {"error": "Internal server error", "details": str(e)}
        ), 500

if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5001, debug=True)
