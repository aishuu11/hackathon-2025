# nlp/myth_matching.py

"""
Myth detection & matching for the nutrition chatbot.
"""

import re
from typing import Dict, List, Tuple, Optional

from .similarity import best_match
from .preprocessing import preprocess


# Patterns that signal "myth checking"
MYTH_CLAIM_PATTERNS = [
    r"is it true that (.+)",
    r"does (.+)",
    r"do (.+?) really",
    r"is (.+?) healthy",
    r"is (.+?) bad",
    r"can (.+?) make you",
]


def extract_claim(text: str) -> Optional[str]:
    """
    Extract the core claim from user text using regex patterns.
    """
    lowered = text.lower()

    for pattern in MYTH_CLAIM_PATTERNS:
        match = re.search(pattern, lowered)
        if match:
            return match.group(1).strip()

    return None


def match_myth(query: str, myths: List[Dict], threshold: float) -> Tuple[Optional[Dict], float]:
    """
    Match user text OR extracted claim to myths.json entries.
    """
    # First try exact claim extraction
    claim = extract_claim(query)
    if claim:
        candidate, score = best_match(
            claim,
            myths,
            key=lambda m: m["label"],
            threshold=threshold
        )
        if candidate:
            return candidate, score

    # Fallback — match whole text if no clean claim found
    return best_match(
        query,
        myths,
        key=lambda m: m["label"],
        threshold=threshold
    )
