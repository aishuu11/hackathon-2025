# nlp/similarity.py

from typing import Callable, Iterable, Tuple, Any, Optional

from rapidfuzz import fuzz

from .preprocessing import preprocess


def similarity(a: str, b: str) -> float:
    """
    Compute similarity between two strings in the range 0.0–1.0
    using token_sort_ratio from rapidfuzz.
    """
    if not a or not b:
        return 0.0

    # Use cleaned strings for more robust matching
    pa = preprocess(a)["clean_string"]
    pb = preprocess(b)["clean_string"]

    score = fuzz.token_sort_ratio(pa, pb) / 100.0
    return score


def best_match(
    query: str,
    candidates: Iterable[Any],
    key: Callable[[Any], str],
    threshold: float
) -> Tuple[Optional[Any], float]:
    """
    Generic helper to find the best matching item in `candidates`
    for a given text `query`.

    - `key` extracts the text from each candidate (e.g. myth["label"])
    - `threshold` is the minimum similarity required to accept a match

    Returns (best_candidate_or_None, similarity_score).
    """
    best_item = None
    best_score = 0.0

    for item in candidates:
        text = key(item)
        score = similarity(query, text)
        if score > best_score:
            best_score = score
            best_item = item

    if best_score >= threshold:
        return best_item, best_score

    return None, best_score
