from groq import Groq
from config import GROQ_API_KEY
import json

client = Groq(api_key=GROQ_API_KEY)

def llm_understand_query(user_msg: str) -> dict:
    """
    Use Groq ONLY to understand the question.
    It must return JSON: { intent, keywords, diet_topic }.
    It does NOT answer the nutrition question.
    """
    system_prompt = (
        "You are an assistant for a nutrition chatbot.\n"
        "Your ONLY job is to analyze the user's question and return JSON.\n"
        "Return a JSON object with keys: intent, keywords, diet_topic.\n"
        "Examples of intent: 'myth_check', 'calories', 'general_info'.\n"
        "keywords should be a list of important food words or concepts.\n"
        "diet_topic can be something like 'carbs', 'protein', 'fat', 'general'.\n"
        "VERY IMPORTANT: Respond with ONLY valid JSON. No text before or after."
    )

    resp = client.chat.completions.create(
        model="llama-3.1-70b-versatile",
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_msg},
        ],
        temperature=0,
    )

    raw = resp.choices[0].message.content.strip()

    try:
        data = json.loads(raw)
    except json.JSONDecodeError:
        # fallback if model ever returns something weird
        data = {
            "intent": "general_info",
            "keywords": [user_msg],
            "diet_topic": "general",
        }

    return data
