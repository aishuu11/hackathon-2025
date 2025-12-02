#!/usr/bin/env python3
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import os
import sys

# Add the nutrition_bot directory to the path so we can import chatbot
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'nutrition_bot'))
from chatbot import NutritionChatbot

app = Flask(__name__, static_folder='nutrition_bot')
CORS(app)  # Enable CORS for all routes

# Initialize the chatbot
nutrition_bot_dir = os.path.join(os.path.dirname(__file__), 'nutrition_bot')
chatbot = NutritionChatbot(data_dir=nutrition_bot_dir)

@app.route('/')
def index():
    """Serve the main HTML page"""
    return send_from_directory('nutrition_bot', 'index.html')

@app.route('/<path:path>')
def serve_static(path):
    """Serve static files (CSS, JS, JSON, etc.)"""
    return send_from_directory('nutrition_bot', path)

@app.route('/api/chat', methods=['POST'])
def chat():
    """Handle chat messages from the frontend"""
    try:
        data = request.get_json()
        user_message = data.get('message', '')
        
        if not user_message:
            return jsonify({
                'error': 'No message provided'
            }), 400
        
        # Process the message using the chatbot
        response = chatbot.process_message(user_message)
        
        return jsonify(response)
    
    except Exception as e:
        print(f"Error processing message: {e}")
        return jsonify({
            'error': str(e),
            'type': 'error',
            'response': 'Sorry, something went wrong processing your message.'
        }), 500

@app.route('/api/profile', methods=['GET', 'POST'])
def profile():
    """Handle user profile updates"""
    try:
        if request.method == 'POST':
            profile_data = request.get_json()
            chatbot.set_user_profile(profile_data)
            return jsonify({
                'success': True,
                'profile': chatbot.get_user_profile()
            })
        else:
            return jsonify(chatbot.get_user_profile())
    
    except Exception as e:
        print(f"Error handling profile: {e}")
        return jsonify({
            'error': str(e)
        }), 500

if __name__ == "__main__":
    PORT = 5000
    print(f"🚀 Server running at http://localhost:{PORT}/")
    print(f"📁 Serving files from: nutrition_bot/")
    print(f"🤖 Chatbot API endpoint: http://localhost:{PORT}/api/chat")
    print("Press Ctrl+C to stop the server\n")
    app.run(host='0.0.0.0', port=PORT, debug=True)
