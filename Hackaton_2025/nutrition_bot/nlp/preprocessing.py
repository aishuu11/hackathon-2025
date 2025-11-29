# nlp/preprocessing.py

import re
from typing import List, Dict

import nltk
from nltk.corpus import stopwords
from nltk.stem import WordNetLemmatizer

# ---------------------------------------------------------------------
# One-time NLTK setup helpers
# ---------------------------------------------------------------------

def _ensure_nltk_data() -> None:
    """
    Ensure required NLTK data packages are downloaded.
    Call this once at notebook startup (or lazily from preprocess()).
    """
    try:
        nltk.data.find("tokenizers/punkt")
    except LookupError:
        nltk.download("punkt")

    try:
        nltk.data.find("corpora/stopwords")
    except LookupError:
        nltk.download("stopwords")

    try:
        nltk.data.find("corpora/wordnet")
    except LookupError:
        nltk.download("wordnet")


# initialise tools (stopwords + lemmatiser)
_ensure_nltk_data()
_STOPWORDS = set(stopwords.words("english"))
_LEMMATISER = WordNetLemmatizer()

# You can extend this with nutrition-specific stop words if needed
_EXTRA_STOPWORDS = {
    "uh", "um", "pls", "please", "lol", "haha"
}
_STOPWORDS = _STOPWORDS.union(_EXTRA_STOPWORDS)


# ---------------------------------------------------------------------
# Basic text normalisation
# ---------------------------------------------------------------------

def normalise_text(text: str) -> str:
    """
    Lowercase + strip + collapse whitespace.
    We DO NOT remove all punctuation here so that regex can still see it
    if needed. For similarity we will clean further later.
    """
    if not isinstance(text, str):
        text = str(text)

    text = text.strip().lower()
    # collapse multiple spaces / newlines to single space
    text = re.sub(r"\s+", " ", text)
    return text


# ---------------------------------------------------------------------
# Tokenisation, stopword removal, lemmatisation
# ---------------------------------------------------------------------

def tokenize(text: str) -> List[str]:
    """
    Tokenise using NLTK word_tokenize after basic normalisation.
    """
    text = normalise_text(text)
    from nltk.tokenize import word_tokenize  # imported here to avoid surprises
    tokens = word_tokenize(text)
    return tokens


def clean_tokens(tokens: List[str]) -> List[str]:
    """
    Remove stopwords + non-word tokens and lemmatise.
    Keeps only alphabetic tokens like 'carb', 'detox', 'tea'.
    """
    cleaned: List[str] = []

    for tok in tokens:
        # remove pure punctuation / numbers
        if not re.match(r"^[a-zA-Z]+$", tok):
            continue

        if tok in _STOPWORDS:
            continue

        lemma = _LEMMATISER.lemmatize(tok)
        cleaned.append(lemma)

    return cleaned


def preprocess(text: str) -> Dict[str, object]:
    """
    Full preprocessing pipeline for general NLP logic.

    Returns:
        {
            "raw": original text,
            "normalised": lowercased + trimmed,
            "tokens": original tokens,
            "clean_tokens": tokens with stopwords removed + lemmatised,
            "clean_string": "clean tokens joined by space"
        }
    """
    normalised = normalise_text(text)
    tokens = tokenize(normalised)
    clean_tok = clean_tokens(tokens)
    clean_str = " ".join(clean_tok)

    return {
        "raw": text,
        "normalised": normalised,
        "tokens": tokens,
        "clean_tokens": clean_tok,
        "clean_string": clean_str
    }


# ---------------------------------------------------------------------
# Simple helpers for intent detection / pattern checks
# ---------------------------------------------------------------------

def contains_any(text: str, keywords: List[str]) -> bool:
    """
    Case-insensitive check if any of the keywords appear in the text.
    """
    t = normalise_text(text)
    return any(kw.lower() in t for kw in keywords)


def regex_search(pattern: str, text: str):
    """
    Wrapper around re.search with case-insensitive flag.
    """
    return re.search(pattern, normalise_text(text), flags=re.IGNORECASE)
