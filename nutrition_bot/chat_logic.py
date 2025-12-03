from typing import List, Dict
from my_pinecone_client import search_pinecone_from_llm


def build_answer_from_chunks(
    user_msg: str,
    intent: str,
    chunks: List[Dict],
) -> Dict:
    """
    Use retrieved chunks + intent to build a clean, user-facing answer.
    """

    if not chunks:
        return {
            "answer": (
                "I couldn't find anything in my nutrition notes for that.\n\n"
                "Try asking about a specific food or a common myth like "
                "'Is rice at night bad for weight loss?' or 'Are carbs always bad?'."
            ),
            "type": "general",
            "source": "pinecone_only",
        }

    # Best scoring match
    best = max(chunks, key=lambda c: c.get("score", 0.0))
    base_text = best.get("text", "").strip()
    doc_type = best.get("type", "info")  # myth / fact / info

    prefix = ""
    out_type = "general"

    if intent == "myth_check" and doc_type in ["myth", "fact"]:
        out_type = doc_type
        if doc_type == "myth":
            prefix = (
                "🚨 This looks like a *myth* based on my nutrition notes:\n\n"
            )
        else:  # fact
            prefix = (
                "✅ This is generally supported by my nutrition notes:\n\n"
            )
    elif doc_type in ["myth", "fact"]:
        out_type = doc_type

    answer_text = prefix + (base_text or "I found some related information but it was empty.")

    return {
        "answer": answer_text,
        "type": out_type,           # 'myth' | 'fact' | 'general'
        "source": "pinecone_only",
        "chunks_used": chunks[:3],  # optional, for debugging
    }


def answer_nutrition_question(user_msg: str) -> Dict:
    """
    Main entry point used by app.py.
    """
    intent, chunks = search_pinecone_from_llm(user_msg)
    return build_answer_from_chunks(user_msg, intent, chunks)
