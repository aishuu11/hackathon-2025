from flask import Flask, request, jsonify
from flask_cors import CORS
from pinecone import Pinecone
from dotenv import load_dotenv
from openai import OpenAI
import os
import sys

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Load environment variables
load_dotenv()

# -------------------------
# CONFIG
# -------------------------
PINECONE_API_KEY = os.getenv("PINECONE_API_KEY")
DEEPSEEK_API_KEY = os.getenv("DEEPSEEK_API_KEY")

# Initialize clients
pc = Pinecone(api_key=PINECONE_API_KEY)
index = pc.Index("nutrition-myths")
client = OpenAI(
    api_key=DEEPSEEK_API_KEY,
    base_url="https://api.deepseek.com"
)

# -------------------------
# FLASK SETUP
# -------------------------
app = Flask(__name__)
CORS(app)

# -------------------------
# EMBEDDING (DeepSeek)
# -------------------------
def embed(text):
    response = client.embeddings.create(
        model="deepseek-embedding",
        input=text
    )
    return response.data[0].embedding

# -------------------------
# PINECONE SEARCH
# -------------------------
def pinecone_search(query):
    query_vec = embed(query)

    result = index.query(
        vector=query_vec,
        top_k=5,
        include_metadata=True,
        namespace=""     # you said no namespace
    )

    chunks = []
    for m in result.matches:
        chunks.append({
            "id": m.id,
            "score": m.score,
            "text": m.metadata.get("text", "")
        })

    return chunks

# -------------------------
# -------------------------
# CLASSIFY MYTH OR FACT
# -------------------------
def classify_myth_or_fact(query):
    prompt = f"Classify the following nutrition question as either a MYTH or a FACT.\nQuestion: '{query}'\nReply with EXACTLY ONE WORD: either 'myth' or 'fact'."
    response = client.chat.completions.create(
        model="deepseek-chat",
        messages=[{"role": "user", "content": prompt}]
    )
    result = response.choices[0].message.content.strip().lower()
    if "myth" in result:
        return "myth"
    return "fact"
# -------------------------
# FORMAT FINAL ANSWER
# -------------------------
def build_answer(result_type, chunks):
    if result_type == "myth":
        prefix = "❌ This looks like a myth based on my nutrition notes:\n\n"
    else:
        prefix = "✅ This is generally true based on nutrition evidence:\n\n"

    body = ""
    for c in chunks:
        body += f"- {c['text']}\n\n"

    return prefix + body.strip()

# -------------------------
# /chat ENDPOINT
# -------------------------
@app.route('/api/chat', methods=['POST'])
def chat():
    data = request.json
    user_msg = data.get("message", "").strip()

    if not user_msg:
        return jsonify({"error": "Message is required"}), 400

    try:
        # Pinecone search only
        chunks = pinecone_search(user_msg)
        
        # Build simple answer from chunks
        answer = "Here's what I found about your nutrition question:\n\n"
        for c in chunks:
            answer += f"- {c['text']}\n\n"
        
        return jsonify({
            "answer": answer.strip(),
            "type": "info",
            "source": "pinecone_only",
            "chunks_used": chunks
        })
    except Exception as e:
        print(f"!! ERROR in /api/chat: {e}")
        return jsonify({"error": str(e)}), 500

# -------------------------
# RUN
# -------------------------
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5002, debug=True)

