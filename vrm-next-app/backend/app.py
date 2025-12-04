from flask import Flask, request, jsonify
from flask_cors import CORS
from pinecone import Pinecone
from dotenv import load_dotenv
from groq import Groq
from sentence_transformers import SentenceTransformer
import os
import sys
import re
from difflib import get_close_matches

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Load environment variables
load_dotenv()

# -------------------------
# CONFIG
# -------------------------
PINECONE_API_KEY = os.getenv("PINECONE_API_KEY")
GROQ_API_KEY = os.getenv("GROQ_API_KEY")

# Initialize clients
pc = Pinecone(api_key=PINECONE_API_KEY)
index = pc.Index("nutrition-myths")
client = Groq(api_key=GROQ_API_KEY)

# Initialize embedding model - use 1024 dimensions to match Pinecone index
embedding_model = SentenceTransformer("BAAI/bge-large-en-v1.5")

# -------------------------
# FLASK SETUP
# -------------------------
app = Flask(__name__)
CORS(app)

# -------------------------
# SPELL CORRECTION DICTIONARY
# -------------------------
# Common nutrition terms for spell checking
NUTRITION_VOCABULARY = [
    'protein', 'carbs', 'carbohydrates', 'fat', 'fats', 'calories', 'diet', 
    'weight', 'muscle', 'loss', 'gain', 'healthy', 'nutrition', 'food',
    'vegan', 'vegetarian', 'keto', 'ketogenic', 'diabetes', 'diabetic',
    'pregnant', 'pregnancy', 'vitamins', 'minerals', 'fiber', 'sugar',
    'sodium', 'cholesterol', 'gluten', 'dairy', 'lactose', 'organic',
    'processed', 'whole', 'grain', 'fruit', 'vegetable', 'meat', 'chicken',
    'fish', 'eggs', 'milk', 'cheese', 'bread', 'rice', 'pasta', 'beans',
    'nuts', 'seeds', 'oil', 'butter', 'water', 'juice', 'coffee', 'tea',
    'breakfast', 'lunch', 'dinner', 'snack', 'meal', 'eating', 'drink',
    'good', 'bad', 'better', 'worse', 'best', 'worst', 'should', 'could',
    'myth', 'fact', 'true', 'false', 'really', 'actually', 'always', 'never'
]

def correct_spelling(text):
    """
    Correct spelling mistakes in user input using fuzzy matching
    """
    words = text.split()
    corrected_words = []
    corrections_made = []
    
    for word in words:
        # Keep short words and common words as-is
        if len(word) <= 3:
            corrected_words.append(word)
            continue
        
        # Remove punctuation for matching
        clean_word = re.sub(r'[^\w\s]', '', word.lower())
        
        # Try to find close match in vocabulary
        matches = get_close_matches(clean_word, NUTRITION_VOCABULARY, n=1, cutoff=0.7)
        
        if matches and matches[0] != clean_word:
            # Found a correction
            corrected_words.append(matches[0])
            corrections_made.append(f"{word} → {matches[0]}")
        else:
            # No correction needed or found
            corrected_words.append(word)
    
    corrected_text = ' '.join(corrected_words)
    return corrected_text, corrections_made

# -------------------------
# EMBEDDING
# -------------------------
def embed(text):
    emb = embedding_model.encode(text)
    return emb.tolist()

# -------------------------
# EXTRACT USER CONTEXT
# -------------------------
def extract_user_context(message):
    """
    Extract user goals, dietary preferences, and conditions from the message
    Returns a context string to personalize responses
    """
    message_lower = message.lower()
    context_parts = []
    
    # Detect goals
    if any(word in message_lower for word in ['lose weight', 'weight loss', 'fat loss', 'slim down', 'cut']):
        context_parts.append("User wants to lose weight")
    elif any(word in message_lower for word in ['gain muscle', 'build muscle', 'bulk', 'get stronger', 'bodybuilding']):
        context_parts.append("User wants to gain muscle")
    elif any(word in message_lower for word in ['maintain', 'stay healthy', 'general health']):
        context_parts.append("User focused on general health")
    
    # Detect dietary preferences
    if any(word in message_lower for word in ['vegan', "i'm vegan", "i am vegan"]):
        context_parts.append("User is vegan")
    elif any(word in message_lower for word in ['vegetarian', "i'm vegetarian", "i am vegetarian"]):
        context_parts.append("User is vegetarian")
    
    if any(word in message_lower for word in ['keto', 'ketogenic', 'low carb']):
        context_parts.append("User follows keto/low-carb diet")
    
    # Detect health conditions
    if any(word in message_lower for word in ['diabetic', 'diabetes', 'blood sugar']):
        context_parts.append("User has diabetes concerns")
    elif any(word in message_lower for word in ['pregnant', 'pregnancy', "i'm pregnant"]):
        context_parts.append("User is pregnant")
    
    if context_parts:
        return ". ".join(context_parts) + "."
    return ""

def is_general_question(query):
    """
    Detect if a question is too general and needs clarification
    Returns True if question needs personalization options
    """
    query_lower = query.lower()
    
    # General nutrition terms that need context
    general_terms = [
        'protein', 'carbs', 'carbohydrates', 'fat', 'fats', 
        'calories', 'diet', 'food', 'eat', 'nutrition',
        'healthy', 'good', 'bad', 'should i', 'can i'
    ]
    
    # Check if it's a general question (contains general terms but no specific context)
    has_general_term = any(term in query_lower for term in general_terms)
    has_no_context = not extract_user_context(query)
    
    # Questions like "is protein good?" or "should I eat carbs?"
    is_vague = any(pattern in query_lower for pattern in [
        'is protein good', 'are carbs good', 'are fats good',
        'should i eat protein', 'should i eat carbs', 'should i eat fats',
        'is diet good', 'how much protein', 'how much carbs',
        'protein intake', 'carb intake', 'fat intake'
    ])
    
    return (has_general_term and has_no_context) or is_vague

def get_context_specific_buttons(query):
    """
    Return relevant button options based on the specific question asked
    """
    query_lower = query.lower()
    
    # Protein-related questions
    if any(word in query_lower for word in ['protein', 'meat', 'chicken', 'fish', 'eggs', 'tofu']):
        return [
            {"label": "💪 Build Muscle", "value": "I want to gain muscle"},
            {"label": "🏃‍♀️ Lose Weight", "value": "I want to lose weight"},
            {"label": "🌱 I'm Vegan", "value": "I'm vegan"},
            {"label": "🏋️ Athletic Performance", "value": "I'm an athlete"},
            {"label": "👶 Pregnancy", "value": "I'm pregnant"},
            {"label": "🥗 General Health", "value": "I want to maintain general health"}
        ]
    
    # Carbs-related questions
    elif any(word in query_lower for word in ['carbs', 'carbohydrate', 'rice', 'bread', 'pasta', 'sugar', 'glucose']):
        return [
            {"label": "🏃‍♀️ Lose Weight", "value": "I want to lose weight"},
            {"label": "💪 Build Muscle", "value": "I want to gain muscle"},
            {"label": "🥑 Low-Carb/Keto", "value": "I follow a keto diet"},
            {"label": "🩺 Diabetic", "value": "I have diabetes"},
            {"label": "🏋️ Athletic Training", "value": "I'm an athlete"},
            {"label": "🧠 Mental Focus", "value": "I want better energy and focus"}
        ]
    
    # Fat-related questions
    elif any(word in query_lower for word in ['fat', 'fats', 'oil', 'butter', 'cheese', 'avocado', 'omega']):
        return [
            {"label": "❤️ Heart Health", "value": "I'm concerned about heart health"},
            {"label": "🏃‍♀️ Lose Weight", "value": "I want to lose weight"},
            {"label": "🥑 Low-Carb/Keto", "value": "I follow a keto diet"},
            {"label": "🧠 Brain Health", "value": "I want to improve cognitive function"},
            {"label": "💪 Build Muscle", "value": "I want to gain muscle"},
            {"label": "🩺 High Cholesterol", "value": "I have high cholesterol"}
        ]
    
    # Dairy-related questions
    elif any(word in query_lower for word in ['milk', 'dairy', 'lactose', 'yogurt', 'cheese']):
        return [
            {"label": "🦴 Bone Health", "value": "I'm concerned about bone health"},
            {"label": "🌱 Dairy-Free", "value": "I'm lactose intolerant or vegan"},
            {"label": "🏃‍♀️ Lose Weight", "value": "I want to lose weight"},
            {"label": "💪 Build Muscle", "value": "I want to gain muscle"},
            {"label": "🥗 General Health", "value": "I want to maintain general health"}
        ]
    
    # Sugar-related questions
    elif any(word in query_lower for word in ['sugar', 'sweet', 'dessert', 'candy', 'artificial sweetener']):
        return [
            {"label": "🩺 Diabetic", "value": "I have diabetes"},
            {"label": "🏃‍♀️ Lose Weight", "value": "I want to lose weight"},
            {"label": "🦷 Dental Health", "value": "I'm concerned about teeth health"},
            {"label": "🧠 Energy Levels", "value": "I want stable energy throughout the day"},
            {"label": "🥑 Low-Carb", "value": "I follow a keto or low-carb diet"}
        ]
    
    # Diet-specific questions
    elif any(word in query_lower for word in ['diet', 'dieting', 'eating plan', 'meal plan']):
        return [
            {"label": "🏃‍♀️ Lose Weight", "value": "I want to lose weight"},
            {"label": "💪 Build Muscle", "value": "I want to gain muscle"},
            {"label": "🌱 Plant-Based", "value": "I'm vegan or vegetarian"},
            {"label": "🥑 Low-Carb/Keto", "value": "I follow a keto diet"},
            {"label": "🩺 Medical Diet", "value": "I have specific health conditions"},
            {"label": "⚖️ Balanced Approach", "value": "I want sustainable healthy eating"}
        ]
    
    # Calorie/weight questions
    elif any(word in query_lower for word in ['calorie', 'calories', 'weight', 'lose', 'gain', 'metabolism']):
        return [
            {"label": "🏃‍♀️ Lose Weight", "value": "I want to lose weight"},
            {"label": "💪 Gain Muscle", "value": "I want to gain muscle"},
            {"label": "⚖️ Maintain Weight", "value": "I want to maintain my weight"},
            {"label": "🏋️ Athletic Goals", "value": "I'm training for sports"},
            {"label": "🩺 Medical Reasons", "value": "I need to manage weight for health"},
            {"label": "🥗 General Health", "value": "I want to eat healthier overall"}
        ]
    
    # Fruit/vegetable questions
    elif any(word in query_lower for word in ['fruit', 'vegetable', 'veggie', 'salad', 'greens', 'produce']):
        return [
            {"label": "🥗 General Health", "value": "I want to maintain general health"},
            {"label": "🏃‍♀️ Lose Weight", "value": "I want to lose weight"},
            {"label": "🌱 Vegan", "value": "I'm vegan or vegetarian"},
            {"label": "🩺 Disease Prevention", "value": "I want to prevent chronic diseases"},
            {"label": "💪 Athletic Nutrition", "value": "I'm an athlete"},
            {"label": "🧒 Family Nutrition", "value": "I'm planning meals for my family"}
        ]
    
    # Vitamin/supplement questions
    elif any(word in query_lower for word in ['vitamin', 'supplement', 'mineral', 'nutrient', 'deficiency']):
        return [
            {"label": "🥗 General Health", "value": "I want to optimize my nutrition"},
            {"label": "🌱 Vegan/Vegetarian", "value": "I follow a plant-based diet"},
            {"label": "👶 Pregnancy", "value": "I'm pregnant or planning to be"},
            {"label": "👴 Aging Health", "value": "I'm concerned about aging"},
            {"label": "🏋️ Athletic Performance", "value": "I'm an athlete"},
            {"label": "🩺 Health Condition", "value": "I have specific health concerns"}
        ]
    
    # Meal timing questions
    elif any(word in query_lower for word in ['breakfast', 'lunch', 'dinner', 'snack', 'fasting', 'meal timing', 'when to eat']):
        return [
            {"label": "🏃‍♀️ Lose Weight", "value": "I want to lose weight"},
            {"label": "💪 Build Muscle", "value": "I want to gain muscle"},
            {"label": "🏋️ Athletic Performance", "value": "I'm training for sports"},
            {"label": "🧠 Energy & Focus", "value": "I want better energy throughout the day"},
            {"label": "⏰ Intermittent Fasting", "value": "I practice intermittent fasting"},
            {"label": "🥗 General Health", "value": "I want healthy eating habits"}
        ]
    
    # Water/hydration questions
    elif any(word in query_lower for word in ['water', 'hydration', 'drink', 'fluid', 'juice', 'beverage']):
        return [
            {"label": "🏋️ Athletic Performance", "value": "I'm an athlete"},
            {"label": "🏃‍♀️ Lose Weight", "value": "I want to lose weight"},
            {"label": "🧠 Better Focus", "value": "I want improved mental clarity"},
            {"label": "🦴 Kidney Health", "value": "I'm concerned about kidney health"},
            {"label": "🩺 Health Condition", "value": "I have specific medical needs"},
            {"label": "🥗 General Health", "value": "I want to stay healthy"}
        ]
    
    # Default options for general questions
    else:
        return [
            {"label": "🏃‍♀️ Lose Weight", "value": "I want to lose weight"},
            {"label": "💪 Build Muscle", "value": "I want to gain muscle"},
            {"label": "🥗 Stay Healthy", "value": "I want to maintain general health"},
            {"label": "🌱 I'm Vegan", "value": "I'm vegan"},
            {"label": "🥑 Low-Carb/Keto", "value": "I follow a keto diet"},
            {"label": "🩺 Health Condition", "value": "I have specific health concerns"}
        ]

# -------------------------
# PINECONE SEARCH
# -------------------------
def pinecone_search(query):
    query_vec = embed(query)

    result = index.query(
        vector=query_vec,
        top_k=5,
        include_metadata=True,
        namespace="default"  # Use the correct namespace
    )

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
        
        if text and len(text) > 10:
            chunks.append({
                "id": m.id,
                "score": m.score,
                "text": text
            })

    return chunks

# -------------------------
# -------------------------
# CLASSIFY MYTH OR FACT
# -------------------------
def classify_myth_or_fact(query):
    prompt = f"Classify the following nutrition question as either a MYTH or a FACT.\nQuestion: '{query}'\nReply with EXACTLY ONE WORD: either 'myth' or 'fact'."
    response = client.chat.completions.create(
        model="llama3-8b-8192",
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
    user_selection = data.get("userSelection", None)
    user_preferences = data.get("userPreferences", [])

    if not user_msg:
        return jsonify({"error": "Message is required"}), 400

    try:
        print(f"📩 Received message: {user_msg}")
        print(f"👆 User selection: {user_selection}")
        print(f"💾 Stored preferences: {user_preferences}")
        
        # Apply spell correction to user message
        corrected_msg, corrections = correct_spelling(user_msg)
        if corrections:
            print(f"✏️ Spell corrections: {', '.join(corrections)}")
            correction_note = f"*(I understood: {corrected_msg})*\n\n"
        else:
            correction_note = ""
        
        # Use corrected message for processing
        processed_msg = corrected_msg
        
        # Build context from stored preferences
        preference_context = ""
        if user_preferences:
            preference_context = " ".join(user_preferences) + ". "
        
        # Check if this is a general question that needs clarification
        # Only show buttons if user hasn't selected preferences yet (first time only)
        if not user_selection and not user_preferences and is_general_question(processed_msg):
            print("❓ Detected general question - returning context-specific options")
            dynamic_buttons = get_context_specific_buttons(processed_msg)
            return jsonify({
                "answer": f"{correction_note}🤔 Great question! To give you the most helpful answer, what's your situation?",
                "buttons": dynamic_buttons,
                "originalQuery": processed_msg
            })
        
        # Combine user selection with original query if provided
        if user_selection:
            combined_query = f"{preference_context}{user_selection}. {processed_msg}"
            print(f"🔄 Combined query: {combined_query}")
        else:
            # Use stored preferences for context
            combined_query = f"{preference_context}{processed_msg}"
            print(f"🔄 Query with preferences: {combined_query}")
        
        # Extract user context for personalization
        user_context = extract_user_context(combined_query)
        if user_context:
            print(f"🎯 Detected context: {user_context}")
        
        # Pinecone search
        chunks = pinecone_search(combined_query)
        print(f"🔍 Found {len(chunks)} chunks from Pinecone")
        
        if chunks and len(chunks) > 0:
            # Use Groq to generate a natural response based on the retrieved data
            context = "\n\n".join([f"Source {i+1}:\n{c['text']}" for i, c in enumerate(chunks[:3])])
            
            # Add personalization note if context detected
            context_note = ""
            if user_context:
                context_note = f"\n\n⚠️ IMPORTANT PERSONALIZATION: {user_context}\nTailor your advice specifically for this user's situation. Make recommendations that align with their goals/diet/conditions."
            
            prompt = f"""You are a friendly, helpful nutrition expert. Based on the verified nutrition information below, answer the user's question in a warm, conversational way.

Retrieved Information:
{context}{context_note}

User Question: {user_msg}

Instructions:
1. Start directly with the myth/fact assessment - NO greetings like "Hey there, friend!" or "Hello!"
2. If it's a myth, start with "❌ Myth Alert!" followed by what's wrong
3. If it's a fact, start with "✅ That's Right!" or similar positive affirmation
4. ALWAYS reference the specific information from the Retrieved Information above - cite the myths/facts/explanations provided
5. Use clear sections with headers like:
   - **The Truth:** (directly quote or paraphrase from the retrieved information)
   - **The Science:** (explain using the evidence from the database)
   - **Bottom Line:** (practical takeaway based on the evidence)
6. Include phrases like "According to nutrition research..." or "Studies show..." to emphasize evidence-based answers
7. Add relevant food emojis where appropriate (🍚 for rice, 🍗 for chicken, 🥦 for vegetables, etc.)
8. Keep it friendly and encouraging - use "you" to make it personal
9. Keep response under 250 words but make it engaging
10. If personalization context is provided, prioritize advice relevant to their specific needs (e.g., for weight loss focus on calories/portions, for vegans suggest plant alternatives, for diabetes mention blood sugar impact)
11. NEVER start with greetings - jump straight into the answer
12. Base your ENTIRE answer on the Retrieved Information - don't make up facts

Make it feel like evidence-based advice from a knowledgeable friend, not a textbook!"""

            completion = client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[
                    {"role": "system", "content": "You are a friendly, supportive nutrition expert who makes healthy eating feel approachable and fun. Use emojis naturally and structure your responses clearly with markdown formatting. NEVER use greetings like 'Hey there, friend!' or 'Hello!' - start directly with the answer. Always base your answers strictly on the provided Retrieved Information from the nutrition database - cite specific myths, facts, and explanations from the sources."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.3,
                max_tokens=600
            )
            
            answer = completion.choices[0].message.content
            print(f"✅ Generated answer from Groq")
            
            # Detect if this is a myth or fact based on the answer content
            answer_lower = answer.lower()
            if '❌' in answer or 'myth alert' in answer_lower or 'this is a myth' in answer_lower or "that's not quite right" in answer_lower or 'not true' in answer_lower or 'false' in answer_lower:
                answer_type = "myth"
            elif '✅' in answer or "that's right" in answer_lower or "this is true" in answer_lower or "this is correct" in answer_lower or 'correct' in answer_lower or 'yes' in answer_lower:
                answer_type = "fact"
            else:
                answer_type = "general"
            
            # Generate a short myTake for the speech bubble
            my_take_prompt = f"Based on this nutrition answer, write ONE SHORT sentence (max 15 words) that's a friendly personal take or key insight. Make it conversational and fun.\n\nAnswer: {answer[:200]}\n\nYour short take:"
            
            my_take_completion = client.chat.completions.create(
                model="llama-3.1-8b-instant",
                messages=[
                    {"role": "user", "content": my_take_prompt}
                ],
                temperature=0.7,
                max_tokens=50
            )
            
            my_take = my_take_completion.choices[0].message.content.strip()
            # Remove quotes if present
            my_take = my_take.strip('"\'')
            
            print(f"🏷️ Detected answer type: {answer_type}")
            print(f"💭 Generated myTake: {my_take}")
            print(f"📝 Answer preview: {answer[:100]}...")
            
            # Prepend correction note if spelling was corrected
            if correction_note:
                answer = correction_note + answer
        else:
            answer = f"{correction_note}🤔 Hmm, I don't have specific information about that topic in my nutrition database yet.\n\n**Try asking about:**\n• Common nutrition myths (carbs, fats, protein)\n• Specific foods (rice, chicken, fruits)\n• Weight management questions\n• Healthy eating tips\n\nI'm here to help separate nutrition facts from fiction! 💪"
            answer_type = "general"
            my_take = "Let me know what nutrition topic you'd like to explore!"
        
        return jsonify({
            "answer": answer,
            "type": answer_type,
            "myTake": my_take,
            "source": "groq_enhanced" if chunks else "fallback"
        })
    except Exception as e:
        print(f"!! ERROR in /api/chat: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({
            "answer": "😅 Oops! I ran into a technical hiccup. Please try asking your nutrition question again!",
            "error": str(e)
        }), 500

# -------------------------
# RUN
# -------------------------
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5002, debug=False)

