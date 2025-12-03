from pinecone import Pinecone
from config import (
    PINECONE_API_KEY,
    PINECONE_INDEX_NAME,
)
from embeddings import embed_text
from llm_client import llm_understand_query


# --- Initialise Pinecone client (v3 style, no .init) ---
pc = Pinecone(api_key=PINECONE_API_KEY)
index = pc.Index(PINECONE_INDEX_NAME)


def search_pinecone_from_llm(user_msg: str, top_k: int = 5):
    """
    1) Use Groq to analyse the user's question.
    2) Build a metadata filter based on intent + keywords.
    3) Query Pinecone and return a list of relevant chunks.

    Returns: (intent: str, chunks: list[dict])
    """

    analysis = llm_understand_query(user_msg)

    intent = analysis.get("intent", "general_info")
    keywords = analysis.get("keywords") or []
    diet_topic = analysis.get("diet_topic", "general")  # not used yet, but kept for future

    # ---- Build metadata filter ----
    pine_filter: dict = {}

    # Your metadata uses chunk_type, so filter on that
    if intent == "myth_check":
        pine_filter["chunk_type"] = {"$in": ["myth", "fact"]}

    # If your metadata has a "food" field, use the detected keywords
    if keywords:
        pine_filter["food"] = {"$in": keywords}

    # ---- Embed the user's full question ----
    query_vec = embed_text(user_msg)

    # Pinecone v3 query
    res = index.query(
        vector=query_vec,
        top_k=top_k,
        include_metadata=True,
        filter=pine_filter or None,
    )

    chunks: list[dict] = []

    # v3: res.matches is a list of Match objects
    for match in res.matches:
        meta = match.metadata or {}

        chunks.append(
            {
                # your main text field
                "text": (
                    meta.get("chunk_text")
                    or meta.get("text")
                    or meta.get("raw_text")
                    or ""
                ),
                # your myth/fact/info field
                "type": meta.get("chunk_type", "info"),
                "food": meta.get("food", ""),
                "score": float(match.score) if match.score is not None else 0.0,
            }
        )

    return intent, chunks
