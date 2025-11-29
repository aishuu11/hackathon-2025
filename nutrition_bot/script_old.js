// Nutrition Bot JavaScript
class NutritionBot {
    constructor() {
        this.foods = {};
        this.myths = {};
        this.supportiveMessages = {};
        this.config = {};
        
        this.initializeBot();
        this.loadData();
        this.setupEventListeners();
    }

    async loadData() {
        try {
            // Load all JSON data files
            const [foodsData, mythsData, messagesData, configData] = await Promise.all([
                fetch('./foods.json').then(res => res.json()),
                fetch('./myths.json').then(res => res.json()),
                fetch('./supportive_messages.json').then(res => res.json()),
                fetch('./config.json').then(res => res.json())
            ]);

            this.foods = foodsData;
            this.myths = mythsData;
            this.supportiveMessages = messagesData;
            this.config = configData;

            console.log('Data loaded successfully');
        } catch (error) {
            console.error('Error loading data:', error);
            this.showMessage('Error loading bot data. Please refresh the page.', 'error');
        }
    }

    initializeBot() {
        this.chatMessages = document.getElementById('chatMessages');
        this.addBotMessage('Hello! I\'m your nutrition bot. I can help you understand food facts and debunk nutrition myths. What would you like to know?');
    }

    setupEventListeners() {
        // Chat functionality
        document.getElementById('sendMessage').addEventListener('click', () => {
            this.sendChatMessage();
        });

        document.getElementById('chatInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.sendChatMessage();
            }
        });
    }

    findFoodKey(query) {
        // Direct match
        if (this.foods[query]) return query;

        // Search in display names and partial matches
        for (const [key, food] of Object.entries(this.foods)) {
            if (food.display_name.toLowerCase().includes(query) || 
                key.includes(query) ||
                query.includes(key.replace(/_/g, ' '))) {
                return key;
            }
        }
        return null;
    }

    analyzeFood(foodQuery) {
        // Search for food in database
        const foodKey = this.findFoodKey(foodQuery);
        
        if (foodKey && this.foods[foodKey]) {
            const food = this.foods[foodKey];
            const trafficLightColors = {
                green: '🟢',
                amber: '🟡', 
                red: '🔴'
            };

            const analysisMessage = `
🍽️ **${food.display_name}** Analysis:

**Serving:** ${food.serving_description}
**Calories:** ${food.calories_per_serving} kcal
**Category:** ${food.verdict}

**Nutrition Traffic Lights:**
Sugar: ${trafficLightColors[food.traffic_light.sugar]} | Fat: ${trafficLightColors[food.traffic_light.fat]} | Sodium: ${trafficLightColors[food.traffic_light.sodium]}

**Macros:** ${food.macros.protein_g}g protein, ${food.macros.carbs_g}g carbs, ${food.macros.fat_g}g fat

**Analysis:** ${food.notes}

${food.healthier_swaps && food.healthier_swaps.length > 0 ? 
`**Healthier Options:**
${food.healthier_swaps.map(swap => `• ${swap}`).join('\n')}` : ''}
            `;
            
            this.addBotMessage(analysisMessage);
        } else {
            this.addBotMessage(`Sorry, I don't have specific data for "${foodQuery}" in my database yet. Try asking about bubble tea, nasi lemak, or oats. You can also ask me general nutrition questions!`);
        }
    }

    sendChatMessage() {
        const chatInput = document.getElementById('chatInput');
        const message = chatInput.value.trim();

        if (!message) return;

        this.addUserMessage(message);
        chatInput.value = '';

        // Simple response logic - can be enhanced with AI/NLP
        setTimeout(() => {
            this.processUserMessage(message);
        }, 1000);
    }

    processUserMessage(message) {
        const lowerMessage = message.toLowerCase();
        
        // Simple keyword-based responses
        if (lowerMessage.includes('sugar') || lowerMessage.includes('sweet')) {
            this.addBotMessage('Sugar can be part of a balanced diet, but it\'s important to be mindful of added sugars. Natural sugars in fruits come with fiber and nutrients, while added sugars in processed foods provide empty calories.');
        } else if (lowerMessage.includes('carb') || lowerMessage.includes('carbohydrate')) {
            this.addBotMessage('Carbohydrates are not the enemy! They\'re your body\'s preferred energy source. Focus on complex carbs like whole grains, which provide sustained energy and important nutrients.');
        } else if (lowerMessage.includes('fat') || lowerMessage.includes('oil')) {
            this.addBotMessage('Healthy fats are essential for your body! Foods like avocados, nuts, and olive oil provide important fatty acids. It\'s trans fats and excessive saturated fats you should limit.');
        } else if (lowerMessage.includes('detox') || lowerMessage.includes('cleanse')) {
            this.addBotMessage('Your liver and kidneys are amazing detox organs that work 24/7! There\'s no scientific evidence that detox diets or cleanses provide additional benefits beyond what your body already does naturally.');
        } else if (lowerMessage.includes('protein')) {
            this.addBotMessage('Protein is crucial for muscle maintenance and many body functions. Most people get enough protein, but if you\'re active, you might need a bit more. Good sources include lean meats, fish, eggs, legumes, and dairy.');
        } else {
            // Generic helpful response
            const responses = [
                'That\'s an interesting nutrition question! Could you be more specific so I can provide better guidance?',
                'I\'d love to help with that! Nutrition science is constantly evolving, and I try to base my advice on current evidence.',
                'Great question! Remember, the best diet is one that\'s sustainable, balanced, and fits your lifestyle.',
                'Thanks for asking! If you have specific foods you\'d like to know about, try the food analysis panel above.'
            ];
            this.addBotMessage(responses[Math.floor(Math.random() * responses.length)]);
        }
    }

    addUserMessage(message) {
        const messageElement = document.createElement('div');
        messageElement.className = 'message user-message';
        messageElement.innerHTML = `
            <div class="message-content">
                <p>${message}</p>
            </div>
        `;
        this.chatMessages.appendChild(messageElement);
        this.scrollChatToBottom();
    }

    addBotMessage(message) {
        const messageElement = document.createElement('div');
        messageElement.className = 'message bot-message';
        messageElement.innerHTML = `
            <div class="message-content">
                <p>${message}</p>
            </div>
        `;
        this.chatMessages.appendChild(messageElement);
        this.scrollChatToBottom();
    }

    scrollChatToBottom() {
        this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
    }

    showMessage(message, type = 'info') {
        // You can implement toast notifications here
        console.log(`${type}: ${message}`);
    }
}

// Initialize the bot when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new NutritionBot();
});

// Add some CSS for the new elements via JavaScript
const additionalCSS = `
    .food-analysis {
        color: #ffffff;
    }
    
    .food-analysis h3 {
        color: #00ffff;
        margin-bottom: 1rem;
        font-family: 'Orbitron', monospace;
    }
    
    .food-analysis h4 {
        color: #ff00ff;
        margin: 1.5rem 0 0.5rem 0;
        font-size: 1.1rem;
    }
    
    .food-category {
        display: flex;
        gap: 1rem;
        align-items: center;
        margin-bottom: 1rem;
    processUserMessage(message) {
        const lowerMessage = message.toLowerCase();
        
        // Check if user is asking about a specific food
        const foodKey = this.findFoodKey(lowerMessage);
        if (foodKey && this.foods[foodKey]) {
            this.analyzeFood(lowerMessage);
            return;
        }

        // Simple keyword-based responses
        if (lowerMessage.includes('sugar') || lowerMessage.includes('sweet')) {
            this.addBotMessage('Sugar can be part of a balanced diet, but it\'s important to be mindful of added sugars. Natural sugars in fruits come with fiber and nutrients, while added sugars in processed foods provide empty calories.');
        } else if (lowerMessage.includes('carb') || lowerMessage.includes('carbohydrate')) {
            this.addBotMessage('Carbohydrates are not the enemy! They\'re your body\'s preferred energy source. Focus on complex carbs like whole grains, which provide sustained energy and important nutrients.');
        } else if (lowerMessage.includes('fat') || lowerMessage.includes('oil')) {
            this.addBotMessage('Healthy fats are essential for your body! Foods like avocados, nuts, and olive oil provide important fatty acids. It\'s trans fats and excessive saturated fats you should limit.');
        } else if (lowerMessage.includes('detox') || lowerMessage.includes('cleanse')) {
            this.addBotMessage('Your liver and kidneys are amazing detox organs that work 24/7! There\'s no scientific evidence that detox diets or cleanses provide additional benefits beyond what your body already does naturally.');
        } else if (lowerMessage.includes('protein')) {
            this.addBotMessage('Protein is crucial for muscle maintenance and many body functions. Most people get enough protein, but if you\'re active, you might need a bit more. Good sources include lean meats, fish, eggs, legumes, and dairy.');
        } else {
            // Generic helpful response
            const responses = [
                'That\'s an interesting nutrition question! Could you be more specific so I can provide better guidance?',
                'I\'d love to help with that! Nutrition science is constantly evolving, and I try to base my advice on current evidence.',
                'Great question! Remember, the best diet is one that\'s sustainable, balanced, and fits your lifestyle.',
                'Thanks for asking! If you have specific foods you\'d like to know about, just mention them in your message and I\'ll analyze them for you!'
            ];
            this.addBotMessage(responses[Math.floor(Math.random() * responses.length)]);
        }
    }
    
    .traffic-lights {
        margin-bottom: 1rem;
    }
    
    .lights {
        display: flex;
        gap: 1rem;
    }
    
    .light {
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }
    
    .light-dot {
        width: 12px;
        height: 12px;
        border-radius: 50%;
        display: inline-block;
    }
    
    .macro-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 1rem;
        background: rgba(255, 255, 255, 0.05);
        padding: 1rem;
        border-radius: 10px;
    }
    
    .healthier-swaps ul {
        list-style-type: none;
        padding-left: 0;
    }
    
    .healthier-swaps li {
        background: rgba(0, 255, 0, 0.1);
        margin: 0.5rem 0;
        padding: 0.5rem;
        border-left: 3px solid #00ff00;
        border-radius: 5px;
    }
    
    .message {
        margin-bottom: 1rem;
    }
    
    .message-content {
        max-width: 80%;
        padding: 1rem;
        border-radius: 15px;
    }
    
    .user-message .message-content {
        background: linear-gradient(135deg, #00ffff, #0099cc);
        color: #000;
        margin-left: auto;
    }
    
    .bot-message .message-content {
        background: rgba(255, 255, 255, 0.1);
        color: #ffffff;
        border: 1px solid rgba(255, 255, 255, 0.2);
    }
    
    .error {
        color: #ff4444;
        font-style: italic;
    }
    
    .no-result {
        text-align: center;
        color: rgba(255, 255, 255, 0.7);
    }
    
    .myth-analysis {
        color: #ffffff;
    }
    
    .myth-analysis h3 {
        color: #ff00ff;
        margin-bottom: 1rem;
        font-family: 'Orbitron', monospace;
    }
    
    .query {
        background: rgba(255, 0, 255, 0.1);
        padding: 1rem;
        border-radius: 10px;
        margin-bottom: 1rem;
        border: 1px solid rgba(255, 0, 255, 0.3);
    }
    
    .response {
        background: rgba(255, 255, 255, 0.05);
        padding: 1rem;
        border-radius: 10px;
        border: 1px solid rgba(255, 255, 255, 0.2);
    }
`;

// Inject the additional CSS
const style = document.createElement('style');
style.textContent = additionalCSS;
document.head.appendChild(style);