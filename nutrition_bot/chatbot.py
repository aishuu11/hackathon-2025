"""
Nutrition Chatbot Logic
Handles NLP processing, myth detection, food queries, and personalized responses

DESIGN BRIEF:
- Stay strictly on nutrition topics
- Debunk online diet myths with evidence
- Give personalized advice using user_profile
- Focus on social media misinformation
- Feel friendly, engaging, and supportive
"""

import json
import re
from pathlib import Path
from typing import Dict, List, Optional, Tuple
from difflib import SequenceMatcher


class NutritionChatbot:
    """Main chatbot class for nutrition advice and myth-busting"""
    
    def __init__(self, data_dir: str = "."):
        """Initialize chatbot with JSON data files"""
        self.data_dir = Path(data_dir)
        self.foods = self._load_json("foods.json")
        self.myths = self._load_json("myths.json")
        self.supportive_messages = self._load_json("supportive_messages.json")
        self.personalization_questions = self._load_json("personalization_questions.json")
        self.config = self._load_json("config.json")
        
        # User profile (can be expanded with database storage)
        self.user_profile = {
            "goal": None,  # weight_loss / muscle_gain / general_health
            "diet_preference": None,
            "allergies": [],
            "health_conditions": [],
            "activity_level": None,
            "onboarding_complete": False,
            "onboarding_step": 0
        }
        
    def _load_json(self, filename: str) -> Dict:
        """Load JSON file from data directory"""
        try:
            with open(self.data_dir / filename, 'r', encoding='utf-8') as f:
                return json.load(f)
        except FileNotFoundError:
            print(f"Warning: {filename} not found")
            return {}
    
    def process_message(self, user_message: str) -> Dict:
        """
        Main message processing function
        Returns: dict with response, type, data, and ui_effects
        """
        user_message = user_message.strip()
        
        # Check for empty message
        if not user_message:
            return self._confused_response()
        
        # Normalize for intent detection
        normalized = user_message.lower()
        
        # Check if onboarding in progress
        if not self.user_profile.get("onboarding_complete") and self.user_profile.get("onboarding_step", 0) > 0:
            return self._handle_profile_update(user_message)
        
        # Detect message type and route to appropriate handler
        message_type = self._detect_message_type(normalized)
        
        if message_type == "greeting":
            return self._handle_greeting()
        elif message_type == "food_query":
            return self._handle_food_query(normalized)
        elif message_type == "myth_query":
            return self._handle_myth_query(normalized)
        elif message_type == "general_advice":
            return self._handle_general_advice(normalized)
        elif message_type == "emotion":
            return self._handle_emotion(normalized)
        elif message_type == "profile_update":
            return self._handle_profile_update(user_message)
        elif message_type == "off_topic":
            return self._handle_off_topic()
        else:
            return self._confused_response()
    
    def _detect_message_type(self, message: str) -> str:
        """Detect what type of query the user is asking"""
        
        # Off-topic detection (jokes, weather, etc.)
        off_topic_patterns = [
            r'\bjoke\b', r'\bfunny\b', r'\bweather\b', r'\bmovie\b', 
            r'\bsong\b', r'\bgame\b', r'\bsports team\b', r'\bpolitics\b'
        ]
        if any(re.search(pattern, message) for pattern in off_topic_patterns):
            return "off_topic"
        
        # Greeting patterns
        greeting_patterns = [
            r'^(hi|hello|hey|hiya|sup|yo)\b',
            r'\bhow are you\b', r'\bwhat\'s up\b', r'\bwhats up\b'
        ]
        if any(re.search(pattern, message) for pattern in greeting_patterns):
            return "greeting"
        
        # Profile update / onboarding patterns
        profile_patterns = [
            r'\bstart\b', r'\bbegin\b', r'\bget started\b',
            r'\bset.*goal\b', r'\bmy goal\b', r'\bchange.*goal\b',
            r'\bupdate.*profile\b', r'\bset.*preference\b',
            r'\bi want to\b.*\b(lose weight|gain muscle|get healthy|build muscle)\b'
        ]
        if any(re.search(pattern, message) for pattern in profile_patterns):
            return "profile_update"
        
        # Emotion / guilt / stress patterns
        emotion_patterns = [
            r'\bi feel (bad|guilty|terrible|awful|ashamed)\b',
            r'\bi (binged|overate|ate too much|messed up|failed)\b',
            r'\bcheat day\b', r'\bcheat meal\b', r'\bgave in\b',
            r'\bstress eat', r'\bemotional eating\b', r'\bcan\'t stop eating\b'
        ]
        if any(re.search(pattern, message) for pattern in emotion_patterns):
            return "emotion"
        
        # Food query patterns - check specific foods first
        for food_key, food_data in self.foods.items():
            display_name = food_data['display_name'].lower()
            food_key_normalized = food_key.replace('_', ' ')
            
            # Check display name, key, and keywords
            if (display_name in message or 
                food_key in message or 
                food_key_normalized in message):
                return "food_query"
            
            # Check keywords if they exist
            if 'keywords' in food_data:
                for keyword in food_data['keywords']:
                    if keyword.lower() in message:
                        return "food_query"
        
        # Myth query patterns - check for myth-specific phrases
        for myth in self.myths:
            # Check main label
            if myth['label'].lower() in message:
                return "myth_query"
            
            # Check alternative phrases
            if 'alt_phrases' in myth:
                for phrase in myth['alt_phrases']:
                    if phrase.lower() in message:
                        return "myth_query"
        
        # General myth question patterns
        myth_question_patterns = [
            r'\bis it true\b', r'\bis this true\b', r'\btruth about\b',
            r'\bmyth\b.*\bfact\b', r'\bfact\b.*\bmyth\b',
            r'\bheard that\b', r'\bsomeone (said|told)\b',
            r'\bsocial media\b.*\b(claim|says|said)\b',
            r'\btiktok\b', r'\binstagram\b.*\b(says|said)\b',
            r'\binfluencer\b.*\b(says|said)\b',
            r'\bdoes.*really\b', r'\bdo.*really\b', r'\bcan.*really\b'
        ]
        if any(re.search(pattern, message) for pattern in myth_question_patterns):
            return "myth_query"
        
        # General advice patterns
        advice_patterns = [
            r'\bhow (can|do|should) i\b.*\b(lose weight|gain weight|eat better|get healthy)\b',
            r'\bwhat should i eat\b', r'\bhow to\b.*\b(lose|gain|build|reduce)\b',
            r'\badvice\b.*\b(weight|diet|nutrition|eating|muscle)\b',
            r'\bhelp me\b.*\b(lose|gain|eat|diet)\b',
            r'\btips for\b', r'\bways to\b.*\b(lose|gain|improve)\b',
            r'\bhow much.*should i\b', r'\bshould i eat\b', r'\bshould i avoid\b',
            r'\bbest (food|diet|way)\b', r'\bhealthy.*for\b'
        ]
        if any(re.search(pattern, message) for pattern in advice_patterns):
            return "general_advice"
        
        # General nutrition keywords (but lower priority)
        nutrition_keywords = [
            r'\bsugar\b', r'\bprotein\b', r'\bcarb', r'\bfat\b',
            r'\bcalories\b', r'\bfiber\b', r'\bvitamin\b', r'\bwater\b',
            r'\bnutrition\b', r'\bhealthy\b', r'\bunhealthy\b'
        ]
        if any(re.search(pattern, message) for pattern in nutrition_keywords):
            return "general_advice"
        
        return "unknown"
    
    def _handle_food_query(self, message: str) -> Dict:
        """Handle queries about specific foods"""
        # Find which food the user is asking about
        matched_food = None
        food_key = None
        
        # Normalize message for better matching (spaces vs underscores)
        normalized_message = message.replace('_', ' ')
        
        for key, food_data in self.foods.items():
            # Check display name
            display_name = food_data['display_name'].lower()
            if display_name in normalized_message:
                matched_food = food_data
                food_key = key
                break
            
            # Check keywords array if present
            if 'keywords' in food_data:
                for keyword in food_data['keywords']:
                    if keyword.lower() in normalized_message:
                        matched_food = food_data
                        food_key = key
                        break
            
            # Fallback: check key with underscores replaced by spaces
            normalized_key = key.replace('_', ' ')
            if normalized_key in normalized_message:
                matched_food = food_data
                food_key = key
                break
            
            if matched_food:
                break
        
        if not matched_food:
            return self._confused_response()
        
        # Build response based on food verdict
        response_text = self._build_food_response(matched_food)
        
        return {
            "type": "food_info",
            "response": response_text,
            "food_key": food_key,
            "food_data": matched_food,
            "ui_effects": matched_food.get("ui_effects", {}),
            "supportive_message": self._get_supportive_message(matched_food['verdict'])
        }
    
    def _build_food_response(self, food: Dict) -> str:
        """Build detailed food information response"""
        response = f"**{food['display_name']}**\n\n"
        response += f"📊 **Nutrition (per serving):**\n"
        response += f"• Calories: {food['calories_per_serving']} kcal\n"
        response += f"• Protein: {food['macros']['protein_g']}g | "
        response += f"Carbs: {food['macros']['carbs_g']}g | "
        response += f"Fat: {food['macros']['fat_g']}g\n"
        response += f"• Sugar: {food['sugar_g']}g | Fiber: {food['fibre_g']}g | "
        response += f"Sodium: {food['sodium_mg']}mg\n\n"
        
        response += f"🔍 **My take:** {food['notes']}\n\n"
        
        # Add verdict-specific messaging
        if food['verdict'] == 'good_choice':
            response += "✅ This is a solid choice for your goals!\n\n"
        elif food['verdict'] == 'treat':
            response += "⚠️ Keep this as an occasional treat.\n\n"
        elif food['verdict'] == 'occasional_indulgence':
            response += "🟡 Enjoy occasionally, not regularly.\n\n"
        
        # Add healthier swaps
        if food.get('healthier_swaps'):
            response += "💡 **Healthier tips:**\n"
            for swap in food['healthier_swaps'][:3]:  # Show top 3
                response += f"• {swap}\n"
            response += "\n"
        
        # Add evidence
        if food.get('evidence'):
            evidence = food['evidence']
            response += f"📚 **Evidence:** {evidence['statistic']}\n"
            response += f"Source: {evidence['source_name']} ({evidence['year']})\n"
        
        return response
    
    def _similarity_score(self, str1: str, str2: str) -> float:
        """Calculate similarity score between two strings"""
        return SequenceMatcher(None, str1.lower(), str2.lower()).ratio()
    
    def _find_best_myth_match(self, message: str) -> Optional[Dict]:
        """Find the best matching myth using fuzzy matching"""
        best_match = None
        best_score = 0.0
        threshold = 0.5
        
        for myth in self.myths:
            # Check label
            label_score = self._similarity_score(message, myth['label'])
            if label_score > best_score and label_score >= threshold:
                best_score = label_score
                best_match = myth
            
            # Check alt phrases
            if 'alt_phrases' in myth:
                for phrase in myth['alt_phrases']:
                    phrase_score = self._similarity_score(message, phrase)
                    if phrase_score > best_score and phrase_score >= threshold:
                        best_score = phrase_score
                        best_match = myth
                    
                    # Also check if phrase is contained in message
                    if phrase.lower() in message and phrase_score > 0.3:
                        if phrase_score > best_score:
                            best_score = phrase_score
                            best_match = myth
        
        return best_match
    
    def _handle_myth_query(self, message: str) -> Dict:
        """Handle queries about nutrition myths with evidence-based debunking"""
        # Try to find matching myth
        matched_myth = self._find_best_myth_match(message)
        
        if not matched_myth:
            # No specific myth found, but user is asking about myths
            return {
                "type": "myth_info",
                "response": "I specialize in debunking common nutrition myths! Try asking about:\n\n"
                           "• 'Do carbs make you fat?'\n"
                           "• 'Does eating late cause weight gain?'\n"
                           "• 'Are detox teas effective?'\n"
                           "• 'Will weights make women bulky?'\n\n"
                           "Or ask me about a specific food like bubble tea or chicken rice!",
                "ui_effects": {
                    "avatar_mood": "coach",
                    "hologram_color": "#4CAF50"
                },
                "supportive_message": "Let's bust some myths together! 💪"
            }
        
        # Build myth response with evidence
        response = self._build_myth_response(matched_myth)
        
        # Determine UI effects based on verdict and harm level
        harm_level = matched_myth.get('harm_level', 0)
        verdict = matched_myth['verdict']
        
        if verdict == 'myth' and harm_level >= 4:
            avatar_mood = "serious"
            hologram_color = "#FF4B6E"
            meter_value = 0.2
        elif verdict == 'myth':
            avatar_mood = "warning"
            hologram_color = "#FF9800"
            meter_value = 0.5
        elif verdict == 'partially_true':
            avatar_mood = "explaining"
            hologram_color = "#FFC857"
            meter_value = 0.6
        else:
            avatar_mood = "happy"
            hologram_color = "#4CAF50"
            meter_value = 0.8
        
        # Get supportive message
        supportive_message = self._get_myth_supportive_message(matched_myth)
        
        return {
            "type": "myth_info",
            "response": response,
            "myth_data": matched_myth,
            "ui_effects": {
                "avatar_mood": avatar_mood,
                "hologram_color": hologram_color,
                "meter_value": meter_value
            },
            "supportive_message": supportive_message
        }
    
    def _build_myth_response(self, myth: Dict) -> str:
        """Build detailed myth-busting response with personalization"""
        response = f"**Myth: {myth['label']}**\n\n"
        
        # Mention if it's from social media
        tags = myth.get('tags', [])
        if 'tiktok' in tags or 'instagram' in tags or 'social_media' in tags:
            response += "🎯 **Common TikTok/Instagram claim**\n\n"
        
        # Add verdict with clear visual indicators
        verdict = myth['verdict']
        if verdict == 'myth':
            response += "❌ **Verdict: MYTH** - This is NOT true\n\n"
        elif verdict == 'partially_true':
            response += "⚠️ **Verdict: PARTIALLY TRUE** - There's more to it\n\n"
        else:
            response += "✅ **Verdict: TRUE**\n\n"
        
        # Add explanation in simple language
        response += f"💬 **The Truth:** {myth['explanation']}\n\n"
        
        # Add evidence with credible sources
        if myth.get('evidence'):
            evidence = myth['evidence']
            response += f"📚 **Evidence:** {evidence['statistic']}\n"
            if evidence.get('quote'):
                response += f"\n_{evidence['quote']}_\n"
            response += f"\nSource: {evidence['source_name']} ({evidence['year']})\n\n"
        
        # Add personalized tips based on user goal
        user_goal = self.user_profile.get('goal')
        if myth.get('tips'):
            if user_goal and user_goal in myth['tips']:
                response += f"💡 **For your {user_goal.replace('_', ' ')} goal:**\n{myth['tips'][user_goal]}\n\n"
            elif 'general' in myth['tips']:
                response += f"💡 **Tip:** {myth['tips']['general']}\n\n"
        
        # Add warning if high risk
        harm_level = myth.get('harm_level', 0)
        if harm_level >= 4:
            response += "⚠️ **WARNING:** This myth can be harmful to your health. Please be very careful!\n\n"
        elif harm_level >= 3:
            response += "⚠️ **Caution:** Following this advice may negatively impact your health goals.\n\n"
        
        # Add follow-up suggestion
        response += "Want to check another myth? Ask me about detox teas, eating late, or any other nutrition claim!"
        
        return response
    
    def _handle_fact_query(self, message: str) -> Dict:
        """Handle general nutrition fact queries"""
        # Redirect to general_advice
        return self._handle_general_advice(message)
    
    def _handle_general_advice(self, message: str) -> Dict:
        """Handle general nutrition advice questions with personalization"""
        response = ""
        user_goal = self.user_profile.get('goal')
        
        # Weight loss questions
        if re.search(r'\b(lose|losing|loss).*weight\b|\bweight.*loss\b|\bslim\b|\bshed\b', message):
            response = "**Weight Loss Advice:**\n\n"
            response += "Sustainable weight loss is about consistent habits, not quick fixes:\n\n"
            response += "• Create a moderate calorie deficit (300-500 cal/day)\n"
            response += "• Focus on whole, unprocessed foods\n"
            response += "• Include protein at each meal (keeps you full)\n"
            response += "• Stay hydrated - drink water before meals\n"
            response += "• Get enough sleep (affects hunger hormones)\n"
            response += "• Move more, but don't over-exercise\n\n"
            response += "🎯 **Realistic goal:** 0.5-1 kg per week\n\n"
            response += "Want me to analyze a specific food? Try asking about bubble tea or nasi lemak!"
            
            avatar_mood = "coach"
            supportive = "Small, consistent changes beat crash diets every time! 💪"
        
        # Muscle gain / building questions
        elif re.search(r'\b(gain|build|grow).*muscle\b|\bmuscle.*(gain|build)\b|\bbulk\b', message):
            response = "**Muscle Building Advice:**\n\n"
            response += "Building muscle requires the right nutrition + training:\n\n"
            response += "• Eat in a slight calorie surplus (200-300 cal/day)\n"
            response += "• Protein: 1.6-2.2g per kg body weight daily\n"
            response += "• Don't fear carbs - they fuel your workouts!\n"
            response += "• Strength train 3-5x per week\n"
            response += "• Get 7-9 hours of sleep (recovery is key)\n"
            response += "• Be patient - muscle grows slowly\n\n"
            response += "💡 **Good protein sources:** Chicken, fish, eggs, Greek yogurt, tofu, legumes\n\n"
            response += "Ask me about specific high-protein foods!"
            
            avatar_mood = "coach"
            supportive = "Consistency in the gym AND the kitchen = gains! 💪"
        
        # General healthy eating
        elif re.search(r'\beat.*health|\bhealthy.*eat|\beat.*better|\bclean.*eat', message):
            response = "**Eating Healthier:**\n\n"
            response += "Here's a simple framework:\n\n"
            response += "• Fill half your plate with vegetables\n"
            response += "• Choose whole grains over refined (brown rice > white)\n"
            response += "• Include lean protein at each meal\n"
            response += "• Add healthy fats (nuts, avocado, olive oil)\n"
            response += "• Limit added sugars and ultra-processed foods\n"
            response += "• Stay hydrated with water, not sugary drinks\n\n"
            response += "💡 **80/20 rule:** Be mindful 80% of the time, enjoy treats 20%\n\n"
            response += "Want to know about a specific food? Just ask!"
            
            avatar_mood = "happy"
            supportive = "Progress, not perfection! Every healthy choice counts. 🌟"
        
        # Sugar reduction
        elif re.search(r'\breduce.*sugar\b|\bsugar.*reduc|\bcut.*sugar\b|\bless.*sugar\b', message):
            response = "**Reducing Sugar Intake:**\n\n"
            response += "The WHO recommends less than 10% of calories from added sugars (ideally <5%):\n\n"
            response += "• **For 2000 cal diet:** Max 50g, ideally 25g added sugar/day\n"
            response += "• Read labels - sugar hides in sauces, bread, yogurt\n"
            response += "• Choose water or unsweetened tea over soft drinks\n"
            response += "• Reduce sugar in bubble tea (0-25% instead of full)\n"
            response += "• Eat fruit instead of fruit juice\n"
            response += "• Natural sugars in whole fruits are OK!\n\n"
            response += "🍬 **One can of soft drink = ~10 teaspoons of sugar**\n\n"
            response += "Want me to check the sugar in bubble tea or other drinks?"
            
            avatar_mood = "coach"
            supportive = "Small swaps make a big difference! You've got this! 💚"
        
        # Protein questions
        elif re.search(r'\bprotein\b.*\bhow much\b|\bhow much.*protein\b', message):
            response = "**Protein Needs:**\n\n"
            response += "Depends on your activity level and goals:\n\n"
            response += "• Sedentary: 0.8g per kg body weight/day\n"
            response += "• Active: 1.2-1.6g per kg\n"
            response += "• Building muscle: 1.6-2.2g per kg\n"
            response += "• Losing weight: 1.6-2.0g per kg (preserves muscle)\n\n"
            
            if user_goal == 'muscle_gain':
                response += "🎯 **For muscle gain:** Aim for the higher end (1.8-2.2g/kg)\n\n"
            elif user_goal == 'weight_loss':
                response += "🎯 **For weight loss:** Higher protein helps maintain muscle (1.6-2.0g/kg)\n\n"
            
            response += "**Good sources:** Chicken breast, fish, eggs, Greek yogurt, tofu, lentils\n\n"
            response += "Ask me about specific high-protein foods!"
            
            avatar_mood = "explaining"
            supportive = "Protein is your friend for any fitness goal! 💪"
        
        # Intermittent fasting
        elif re.search(r'\bintermittent fasting\b|\bIF\b|\b16.8\b|\bfasting\b', message):
            response = "**Intermittent Fasting (IF):**\n\n"
            response += "IF is an eating pattern (time-restricted), not a diet. Common methods:\n\n"
            response += "• 16:8 - Fast 16 hours, eat within 8 hours\n"
            response += "• 5:2 - Eat normally 5 days, restrict 2 days\n\n"
            response += "📊 **What research shows:**\n"
            response += "• May help weight loss (mainly through calorie reduction)\n"
            response += "• Some metabolic benefits reported\n"
            response += "• NOT superior to regular calorie restriction\n"
            response += "• Doesn't \"boost metabolism\" as claimed on social media\n\n"
            response += "⚠️ **Not for everyone:**\n"
            response += "• History of eating disorders\n"
            response += "• Pregnant/breastfeeding\n"
            response += "• Certain medical conditions\n\n"
            response += "💡 The best diet is one you can sustain long-term!"
            
            avatar_mood = "explaining"
            supportive = "Listen to your body - what works for influencers may not work for you! 🎯"
        
        # Default general response
        else:
            response = "**General Nutrition Guidance:**\n\n"
            response += "Here are evidence-based nutrition principles:\n\n"
            response += "• Eat mostly whole, minimally processed foods\n"
            response += "• Include plenty of vegetables and fruits\n"
            response += "• Choose whole grains over refined grains\n"
            response += "• Include lean proteins and healthy fats\n"
            response += "• Stay hydrated with water\n"
            response += "• Limit added sugars and ultra-processed foods\n"
            response += "• Practice portion awareness\n"
            response += "• Be consistent, not perfect\n\n"
            
            if user_goal:
                response += f"🎯 **Based on your {user_goal.replace('_', ' ')} goal:** "
                if user_goal == 'weight_loss':
                    response += "Focus on calorie control and filling, nutritious foods.\n\n"
                elif user_goal == 'muscle_gain':
                    response += "Ensure adequate protein and calories to support growth.\n\n"
                else:
                    response += "Maintain a balanced, varied diet.\n\n"
            
            response += "Want specific advice? Ask about a food, myth, or your goal!"
            avatar_mood = "happy"
            supportive = "Small, sustainable changes lead to lasting results! 🌟"
        
        return {
            "type": "general_advice",
            "response": response,
            "ui_effects": {
                "avatar_mood": avatar_mood,
                "hologram_color": "#4CAF50"
            },
            "supportive_message": supportive
        }
    
    def _handle_emotion(self, message: str) -> Dict:
        """Handle emotional/guilt-related messages with compassion"""
        emotion_messages = self.supportive_messages.get('guilt_or_relapse', [
            "It's okay to have setbacks. One meal doesn't define you. What matters is what you do next."
        ])
        
        response = "**Hey, I hear you. Let's talk about this. 💚**\n\n"
        
        if re.search(r'\bbinged\b|\boverate\b|\bate too much\b', message):
            response += "First: **One episode of overeating doesn't undo your progress.**\n\n"
            response += "What to do now:\n"
            response += "• Don't try to \"make up for it\" by skipping meals\n"
            response += "• Drink water and get back to normal eating\n"
            response += "• Reflect: Were you overly hungry? Stressed? Bored?\n"
            response += "• Learn from it, then move forward\n\n"
            response += "💡 **Normal eating includes flexibility.** Overeating sometimes is part of being human.\n\n"
        
        elif re.search(r'\bfeel (bad|guilty|terrible)\b|\bashamed\b', message):
            response += "**Please don't feel guilty about food.** Food is not moral - it's not \"good\" or \"bad\".\n\n"
            response += "• You're not a failure for enjoying food\n"
            response += "• Restriction often leads to cravings and guilt cycles\n"
            response += "• Balance and flexibility are healthier than perfection\n\n"
            response += "💡 **Try this mindset:** \"I ate [food], enjoyed it, and now I'm moving on.\"\n\n"
        
        elif re.search(r'\bcheat (day|meal)\b', message):
            response += "Let's reframe this: **There's no such thing as \"cheating\" with food.**\n\n"
            response += "• Using terms like \"cheat\" creates an unhealthy relationship with food\n"
            response += "• A balanced approach includes all foods in moderation\n"
            response += "• Enjoy treats without guilt - just be mindful of portions\n\n"
            response += "💡 **Better mindset:** Call it a \"treat\" or \"fun food\", not a cheat.\n\n"
        
        response += "Want practical tips? Ask me: 'How can I eat healthier?' or check a specific food!"
        
        supportive_message = emotion_messages[0] if emotion_messages else "You're doing great. Progress, not perfection. 💚"
        
        return {
            "type": "emotion",
            "response": response,
            "ui_effects": {
                "avatar_mood": "coach",
                "hologram_color": "#8BC34A"
            },
            "supportive_message": supportive_message
        }
    
    def _handle_off_topic(self) -> Dict:
        """Handle off-topic queries and redirect to nutrition"""
        off_topic_responses = [
            "Haha, that's not my area! I'm your **nutrition expert** - I specialize in food, diets, and busting nutrition myths.",
            "That's a fun question, but I'm here to help with **nutrition and healthy eating!**",
            "I'd love to chat about that, but I'm a **nutrition bot** - I stick to food and health topics!"
        ]
        
        import random
        response = random.choice(off_topic_responses)
        response += "\n\n**I can help you with:**\n"
        response += "• Analyzing specific foods (bubble tea, chicken rice, etc.)\n"
        response += "• Debunking nutrition myths from TikTok/Instagram\n"
        response += "• General nutrition advice for your goals\n\n"
        response += "What nutrition topic interests you?"
        
        return {
            "type": "off_topic",
            "response": response,
            "ui_effects": {
                "avatar_mood": "happy",
                "hologram_color": "#2196F3"
            }
        }
    
    def _handle_greeting(self) -> Dict:
        """Handle greeting messages with clear bot capabilities"""
        # Check if this is first time user
        if not self.user_profile.get("onboarding_complete"):
            greeting_messages = self.supportive_messages.get('first_time_user', [
                "Hi! I'm your nutrition chatbot, here to help you make informed food choices!"
            ])
            
            response = greeting_messages[0] + "\n\n"
            response += "**I specialize in:**\n"
            response += "🍽️ Analyzing specific foods (nutrition, healthier swaps)\n"
            response += "❌ Debunking nutrition myths from TikTok/Instagram\n"
            response += "💡 Giving personalized advice for your goals\n\n"
            response += "**Want personalized tips?** Type 'start' to set your goal!\n\n"
            response += "**Or just ask me:**\n"
            response += "• 'Tell me about bubble tea'\n"
            response += "• 'Is it true that carbs make you fat?'\n"
            response += "• 'How can I lose weight healthily?'\n"
            
            return {
                "type": "greeting",
                "response": response,
                "ui_effects": {
                    "avatar_mood": "happy",
                    "hologram_color": "#4CAF50"
                },
                "supportive_message": "Let's make nutrition simple and science-based! 🌟"
            }
        else:
            # Returning user
            user_goal = self.user_profile.get('goal', '')
            goal_text = f" with your {user_goal.replace('_', ' ')} goal" if user_goal else ""
            
            response = f"Welcome back! Ready to continue{goal_text}?\n\n"
            response += "Ask me about any food, nutrition myth, or health question!"
            
            return {
                "type": "greeting",
                "response": response,
                "ui_effects": {
                    "avatar_mood": "happy",
                    "hologram_color": "#4CAF50"
                }
            }
    
    def _handle_profile_update(self, message: str) -> Dict:
        """Handle user profile updates and onboarding flow"""
        # Start onboarding
        if not self.user_profile.get("onboarding_step") or self.user_profile["onboarding_step"] == 0:
            questions = self.personalization_questions.get('questions', [])
            if not questions:
                # Fallback if no questions file
                self.user_profile["onboarding_step"] = 1
                return {
                    "type": "profile_update",
                    "response": "**Let's personalize your experience!**\n\n"
                               "What's your main goal?\n\n"
                               "Type:\n"
                               "• **1** for Weight Loss\n"
                               "• **2** for Muscle Gain\n"
                               "• **3** for General Health",
                    "ui_effects": {
                        "avatar_mood": "coach",
                        "hologram_color": "#2196F3"
                    }
                }
            
            # Start with first question
            self.user_profile["onboarding_step"] = 1
            first_q = questions[0]
            response = f"**Let's personalize your experience!**\n\n{first_q['question']}\n\n"
            if 'options' in first_q:
                for i, opt in enumerate(first_q['options'], 1):
                    response += f"{i}. {opt}\n"
            
            return {
                "type": "profile_update",
                "response": response,
                "ui_effects": {
                    "avatar_mood": "coach",
                    "hologram_color": "#2196F3"
                }
            }
        
        # Process onboarding responses
        step = self.user_profile["onboarding_step"]
        questions = self.personalization_questions.get('questions', [])
        
        if step == 1:
            # Goal question
            message_lower = message.lower()
            if '1' in message or 'weight loss' in message_lower or 'lose' in message_lower:
                self.user_profile["goal"] = "weight_loss"
            elif '2' in message or 'muscle' in message_lower or 'gain' in message_lower:
                self.user_profile["goal"] = "muscle_gain"
            elif '3' in message or 'health' in message_lower or 'general' in message_lower:
                self.user_profile["goal"] = "general_health"
            else:
                self.user_profile["goal"] = "general_health"
            
            goal_name = self.user_profile["goal"].replace('_', ' ').title()
            
            # Move to next question or complete
            if len(questions) > 1:
                self.user_profile["onboarding_step"] = 2
                next_q = questions[1]
                response = f"Great! **{goal_name}** it is! 🎯\n\n{next_q['question']}\n\n"
                if 'options' in next_q:
                    for i, opt in enumerate(next_q['options'], 1):
                        response += f"{i}. {opt}\n"
                
                return {
                    "type": "profile_update",
                    "response": response,
                    "ui_effects": {
                        "avatar_mood": "coach",
                        "hologram_color": "#2196F3"
                    }
                }
            else:
                # Complete onboarding
                self.user_profile["onboarding_complete"] = True
                response = f"Perfect! **{goal_name}** goal set! 🎯\n\n"
                response += "I'll now tailor my advice to help you achieve this goal.\n\n"
                response += "**Ready to start?** Ask me:\n"
                response += "• About any specific food\n"
                response += "• To debunk a nutrition myth\n"
                response += f"• 'How can I {goal_name.lower()}?'\n"
                
                return {
                    "type": "profile_update",
                    "response": response,
                    "ui_effects": {
                        "avatar_mood": "happy",
                        "hologram_color": "#4CAF50"
                    },
                    "supportive_message": "Let's crush your goals together! 💪"
                }
        
        elif step == 2:
            # Diet preference question
            message_lower = message.lower()
            if 'vegetarian' in message_lower or 'veg' in message_lower:
                self.user_profile["diet_preference"] = "vegetarian"
            elif 'no pork' in message_lower or 'halal' in message_lower:
                self.user_profile["diet_preference"] = "no_pork"
            elif 'vegan' in message_lower:
                self.user_profile["diet_preference"] = "vegan"
            
            # Complete onboarding
            self.user_profile["onboarding_complete"] = True
            goal_name = self.user_profile["goal"].replace('_', ' ').title()
            
            response = f"All set! Your profile is ready for **{goal_name}**! 🎯\n\n"
            response += "I'll give you personalized advice tailored to your goals.\n\n"
            response += "**Ask me anything:**\n"
            response += "• 'Tell me about chicken rice'\n"
            response += "• 'Do carbs make you fat?'\n"
            response += f"• 'Tips for {goal_name.lower()}?'\n"
            
            return {
                "type": "profile_update",
                "response": response,
                "ui_effects": {
                    "avatar_mood": "happy",
                    "hologram_color": "#4CAF50"
                },
                "supportive_message": "Let's make healthy choices together! 💪"
            }
        
        # Fallback
        self.user_profile["onboarding_complete"] = True
        return {
            "type": "profile_update",
            "response": "Profile updated! Ask me anything about nutrition!",
            "ui_effects": {"avatar_mood": "happy", "hologram_color": "#4CAF50"}
        }
    
    def _confused_response(self) -> Dict:
        """Return a confused/help message"""
        confused_messages = self.supportive_messages.get('confused', [
            "I'm not sure what you're asking. Try asking about a specific food or myth!"
        ])
        
        response = confused_messages[0] if confused_messages else "I'm not quite sure what you're asking about."
        response += "\n\n**Here are some things you can ask me:**\n\n"
        response += "🍽️ **About specific foods:**\n"
        response += "• 'Tell me about bubble tea'\n"
        response += "• 'What about chicken rice?'\n"
        response += "• 'Is nasi lemak healthy?'\n\n"
        response += "❓ **About nutrition myths:**\n"
        response += "• 'Is it true that carbs make you fat?'\n"
        response += "• 'Does eating late at night cause weight gain?'\n\n"
        response += "💡 **General nutrition:**\n"
        response += "• 'How much sugar should I take?'\n"
        response += "• 'Tell me about protein'\n"
        response += "• 'What about intermittent fasting?'\n"
        
        return {
            "type": "confused",
            "response": response,
            "ui_effects": {
                "avatar_mood": "confused",
                "hologram_color": "#FFC857"
            }
        }
    
    def _get_supportive_message(self, verdict: str) -> str:
        """Get appropriate supportive message based on food verdict"""
        if verdict == "good_choice":
            messages = self.supportive_messages.get('healthy_choice', [])
        elif verdict in ["treat", "occasional_indulgence"]:
            messages = self.supportive_messages.get('encouragement', [])
        else:
            messages = self.supportive_messages.get('encouragement', [])
        
        return messages[0] if messages else ""
    
    def _get_myth_supportive_message(self, myth: Dict) -> str:
        """Get appropriate supportive message based on myth properties"""
        if myth.get('harm_level', 0) >= 4:
            messages = self.supportive_messages.get('dangerous_myth', [])
        else:
            messages = self.supportive_messages.get('encouragement', [])
        
        return messages[0] if messages else ""
    
    def set_user_profile(self, profile_data: Dict):
        """Update user profile with personalization data"""
        self.user_profile.update(profile_data)
    
    def get_user_profile(self) -> Dict:
        """Get current user profile"""
        return self.user_profile.copy()


# For testing
if __name__ == "__main__":
    chatbot = NutritionChatbot()
    
    print("Nutrition Chatbot - Test Mode")
    print("Type 'quit' to exit\n")
    
    while True:
        user_input = input("You: ")
        if user_input.lower() in ['quit', 'exit', 'bye']:
            print("Thanks for chatting! Stay healthy!")
            break
        
        response = chatbot.process_message(user_input)
        print(f"\nBot: {response['response']}\n")
        
        if response.get('supportive_message'):
            print(f"💚 {response['supportive_message']}\n")
