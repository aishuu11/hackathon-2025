# nlp/response_builder.py

"""
Response-building logic for the nutrition misinformation chatbot.
Takes matched myths/foods + supportive messages + UI metadata and produces
the final structured chatbot output.
"""

from typing import Dict, Optional
import random


# ---------------------------------------------------------------------
# SUPPORTIVE RESPONSES
# ---------------------------------------------------------------------

def choose_supportive_message(messages: Dict[str, list], mood: str) -> str:
    """
    Select an emotional response (encouraging, gentle correction, praise, etc.).
    Fallbacks gracefully if mood not found.
    """
    if mood in messages:
        return random.choice(messages[mood])
    return random.choice(messages.get("neutral", ["Let's take a closer look!"]))


# ---------------------------------------------------------------------
# MYTH RESPONSE BUILDER
# ---------------------------------------------------------------------

def build_myth_response(
    myth: Dict,
    supportive_msgs: Dict[str, list],
) -> Dict:
    """
    Build full structured response for a nutrition myth.
    """
    ui = myth.get("ui_effects", {})

    mood = ui.get("avatar_mood", "neutral")
    supportive_text = choose_supportive_message(supportive_msgs, mood)

    evidence = myth.get("evidence", {})
    tips = myth.get("tips", {})

    return {
        "type": "myth",
        "verdict": myth.get("verdict", "unknown"),
        "strength": myth.get("verdict_strength", "medium"),
        "harm_level": myth.get("harm_level", "unknown"),
        "explanation": myth.get("explanation", ""),
        "evidence": {
            "quote": evidence.get("quote", ""),
            "source": evidence.get("source", ""),
            "statistic": evidence.get("statistic", "")
        },
        "tips": tips,
        "ui": {
            "hologram_color": ui.get("hologram_color", "blue"),
            "meter_value": ui.get("meter_value", 50),
            "avatar_mood": ui.get("avatar_mood", "neutral")
        },
        "supportive_message": supportive_text
    }


# ---------------------------------------------------------------------
# FOOD RESPONSE BUILDER
# ---------------------------------------------------------------------

def build_food_response(
    food: Dict,
    supportive_msgs: Dict[str, list]
) -> Dict:
    """
    Build structured response for a food lookup.
    """
    ui = food.get("ui", {})
    mood = ui.get("avatar_mood", "informative")

    supportive_text = choose_supportive_message(supportive_msgs, mood)

    return {
        "type": "food",
        "food_name": food.get("name", ""),
        "macros": food.get("macros", {}),
        "healthier_swap": food.get("healthier_swap", ""),
        "traffic_light": food.get("traffic_light", ""),
        "ui": {
            "hologram_color": ui.get("hologram_color", "blue"),
            "meter_value": ui.get("meter_value", 40),
            "avatar_mood": ui.get("avatar_mood", "informative")
        },
        "supportive_message": supportive_text
    }
