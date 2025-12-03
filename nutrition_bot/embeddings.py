from sentence_transformers import SentenceTransformer

# Load embedding model once at startup
_model = SentenceTransformer("all-MiniLM-L6-v2")

def embed_text(text: str) -> list[float]:
    """
    Returns a list[float] embedding for the given text.
    IMPORTANT: use the same model you used when indexing into Pinecone.
    """
    emb = _model.encode(text)
    return emb.tolist()
