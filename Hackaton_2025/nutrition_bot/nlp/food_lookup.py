# nlp/food_lookup.py

"""
Food lookup logic for nutrition chatbot.
Matches user text to food entries and returns structured lookup results.
"""

from typing import Dict, List, Tuple, Optional
from .similarity import best_match
from .preprocessing import preprocess


def match_food(query: str, foods: List[Dict], threshold: float) -> Tuple[Optional[Dict], float]:
    """
    Fuzzy match user query to a food item in foods.json.
    """
    return best_match(
        query=query,
        candidates=foods,
        key=lambda f: f["name"],
        threshold=threshold
    )


def get_food_response(food: Dict) -> Dict:
    """
    Convert a matched food entry into a structured dictionary suitable for response builder.
    """
    return {
        "name": food["name"],
        "macros": food.get("macros", {}),
        "healthier_swap": food.get("healthier_swap", None),
        "traffic_light": food.get("traffic_light", "NA"),
        "ui": food.get("ui_effects", {})
    }
