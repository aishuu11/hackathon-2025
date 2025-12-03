from flask import Flask, request, jsonify
from flask_cors import CORS
from pinecone import Pinecone
from sentence_transformers import SentenceTransformer
from groq import Groq
import os
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app)  # Allow all origins for development

# Initialize Pinecone
PINECONE_API_KEY = os.getenv("PINECONE_API_KEY")
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
pc = Pinecone(api_key=PINECONE_API_KEY)
index = pc.Index("nutrition-myths")

# Initialize Groq client
groq_client = Groq(api_key=GROQ_API_KEY)

# Initialize embedding model - use 1024 dimensions to match Pinecone index
_model = SentenceTransformer("BAAI/bge-large-en-v1.5")  # 1024 dimensions

def embed_text(text):
    """Generate embeddings for text"""
    emb = _model.encode(text)
    return emb.tolist()

def pinecone_search(query, top_k=5):
    """Search Pinecone for relevant nutrition information"""
    try:
        query_vec = embed_text(query)
        
        result = index.query(
            vector=query_vec,
            top_k=top_k,
            include_metadata=True,
            namespace="default"  # Add the namespace where data is stored
        )
        
        print(f"Pinecone search results: {len(result.matches)} matches found")
        
        chunks = []
        for m in result.matches:
            # Extract myth, fact, and explanation from metadata
            myth = m.metadata.get("myth", "")
            fact = m.metadata.get("fact", "")
            explanation = m.metadata.get("explanation", "")
            
            # Combine into readable text
            if myth and fact:
                text = f"**Myth**: {myth}\n\n**Fact**: {fact}"
                if explanation:
                    text += f"\n\n**Explanation**: {explanation}"
            else:
                # Fallback to other fields
                text = (m.metadata.get("text", "") or 
                       m.metadata.get("chunk_text", "") or 
                       m.metadata.get("raw_text", ""))
            
            print(f"Match score: {m.score}, has content: {bool(text)}")
            if text and len(text) > 10:
                chunks.append({
                    "id": m.id,
                    "score": m.score,
                    "text": text,
                    "category": m.metadata.get("category", ""),
                    "tags": m.metadata.get("tags", [])
                })
        
        return chunks
    except Exception as e:
        print(f"Error in pinecone_search: {e}")
        import traceback
        traceback.print_exc()
        return []

@app.route("/", methods=["GET"])
def home():
    return jsonify({
        "status": "running",
        "message": "Nutrition Bot Backend API",
        "endpoints": {
            "POST /api/chat": "Send nutrition questions"
        }
    })

@app.route("/api/chat", methods=["POST"])
def chat():
    data = request.get_json() or {}
    user_msg = data.get("message", "").lower()

    if not user_msg:
        return jsonify({"error": "No message provided"}), 400

    try:
        # Search Pinecone for relevant nutrition data
        chunks = pinecone_search(user_msg)
        
        if chunks and len(chunks) > 0:
            # Use Groq to generate a natural response based on the retrieved data
            context = "\n\n".join([f"Source {i+1}:\n{c['text']}" for i, c in enumerate(chunks[:3])])
            
            prompt = f"""You are a nutrition expert. Based on the following verified nutrition information, answer the user's question naturally and conversationally.

Retrieved Information:
{context}

User Question: {user_msg}

Provide a clear, concise answer based on the information above. If the information clearly states something is a myth, explain why. Keep your response under 3 paragraphs."""

            completion = groq_client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[
                    {"role": "system", "content": "You are a helpful nutrition expert who provides evidence-based answers."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.3,
                max_tokens=500
            )
            
            answer = completion.choices[0].message.content
        else:
            # Fallback responses for common topics
            fallback_responses = {
                "rice": "Rice is a nutritious grain that provides energy through carbohydrates. Eating rice at night won't directly cause weight gain - total calorie intake matters most. Brown rice has more fiber and nutrients than white rice.",
                "chicken": "Chicken is an excellent source of lean protein. A 100g serving of chicken breast contains about 165 calories and 31g of protein. It's great for muscle building and weight management.",
                "carb": "Carbohydrates are not inherently bad! They're your body's primary energy source. The key is choosing complex carbs (whole grains, vegetables) over refined carbs (white bread, sugary foods).",
                "protein": "Protein is essential for building and repairing tissues. Adults need about 0.8g per kg of body weight daily. Good sources include chicken, fish, eggs, legumes, and dairy.",
            }
            
            answer = None
            for keyword, response in fallback_responses.items():
                if keyword in user_msg:
                    answer = response
                    break
            
            if not answer:
                answer = "I'd be happy to help with nutrition questions! Try asking about specific foods (rice, chicken), macronutrients (carbs, protein, fats), or nutrition myths."
        
        return jsonify({
            "answer": answer,
            "type": "info",
            "source": "groq_enhanced" if chunks else "fallback"
        })
            
    except Exception as e:
        print(f"!! ERROR in /api/chat: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({
            "answer": "I'm here to help with nutrition questions! Try asking about common foods, macronutrients, or nutrition myths.",
            "type": "info"
        }), 200

if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5001, debug=True)
