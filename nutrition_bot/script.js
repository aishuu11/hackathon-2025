// VRM Manager Class
class VRMManager {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.vrm = null;
        this.controls = null;
        this.clock = new THREE.Clock();
        this.mixer = null;
        
        this.init();
    }

    async init() {
        const canvas = document.getElementById('vrmCanvas');
        const container = document.getElementById('vrmContainer');
        const loading = document.getElementById('vrmLoading');

        if (!canvas) {
            console.error('VRM Canvas not found');
            return;
        }

        try {
            // Scene setup
            this.scene = new THREE.Scene();
            this.scene.background = new THREE.Color(0x212121);

            // Camera setup
            this.camera = new THREE.PerspectiveCamera(
                75,
                container.clientWidth / container.clientHeight,
                0.1,
                1000
            );
            this.camera.position.set(0, 1.4, 1.5);

            // Renderer setup
            this.renderer = new THREE.WebGLRenderer({ 
                canvas: canvas, 
                antialias: true 
            });
            this.renderer.setSize(container.clientWidth, container.clientHeight);
            this.renderer.setPixelRatio(window.devicePixelRatio);
            this.renderer.shadowMap.enabled = true;
            this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

            // Lighting
            const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
            this.scene.add(ambientLight);

            const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
            directionalLight.position.set(1, 1, 1);
            directionalLight.castShadow = true;
            this.scene.add(directionalLight);

            // Controls
            this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
            this.controls.target.set(0, 1, 0);
            this.controls.enableDamping = true;
            this.controls.dampingFactor = 0.05;
            this.controls.minDistance = 1;
            this.controls.maxDistance = 10;

            // Load VRM
            await this.loadVRM('./avaturn_avatar.vrm');
            
            if (loading) loading.classList.add('hidden');
            this.animate();

            // Handle window resize
            window.addEventListener('resize', () => this.onWindowResize());

        } catch (error) {
            console.error('Error initializing VRM viewer:', error);
            if (loading) {
                loading.innerHTML = '<p>Failed to load VRM Avatar</p><div class="upload-hint"><span>Check console for details</span></div>';
            }
        }
    }

    async loadVRM(url) {
        const loader = new THREE.GLTFLoader();
        
        if (typeof THREE.VRMLoaderPlugin !== 'undefined') {
            loader.register((parser) => {
                return new THREE.VRMLoaderPlugin(parser);
            });
        }

        return new Promise((resolve, reject) => {
            loader.load(
                url,
                (gltf) => {
                    try {
                        if (gltf.userData.vrm) {
                            // VRM model
                            this.vrm = gltf.userData.vrm;
                            this.scene.add(this.vrm.scene);
                            console.log('VRM loaded successfully');
                        } else {
                            // Regular GLTF model
                            this.scene.add(gltf.scene);
                            this.vrm = { scene: gltf.scene };
                            console.log('GLTF model loaded successfully');
                        }

                        // Set up animations if available
                        if (gltf.animations && gltf.animations.length > 0) {
                            this.mixer = new THREE.AnimationMixer(gltf.scene);
                            gltf.animations.forEach((clip) => {
                                const action = this.mixer.clipAction(clip);
                                action.play();
                            });
                        }

                        resolve(this.vrm);
                    } catch (error) {
                        reject(error);
                    }
                },
                (progress) => {
                    const percent = (progress.loaded / progress.total * 100).toFixed(2);
                    console.log(`Loading progress: ${percent}%`);
                },
                (error) => {
                    console.error('Error loading VRM:', error);
                    reject(error);
                }
            );
        });
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        const deltaTime = this.clock.getDelta();

        // Update mixer for animations
        if (this.mixer) {
            this.mixer.update(deltaTime);
        }

        // Update VRM
        if (this.vrm && this.vrm.update) {
            this.vrm.update(deltaTime);
        }

        // Update controls
        if (this.controls) {
            this.controls.update();
        }

        // Render
        if (this.renderer && this.scene && this.camera) {
            this.renderer.render(this.scene, this.camera);
        }
    }

    onWindowResize() {
        const container = document.getElementById('vrmContainer');
        if (!container || !this.camera || !this.renderer) return;

        const width = container.clientWidth;
        const height = container.clientHeight;

        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
    }

    triggerExpression(expressionName) {
        if (this.vrm && this.vrm.expressionManager) {
            try {
                // Reset all expressions first
                const expressionManager = this.vrm.expressionManager;
                Object.keys(expressionManager.expressionMap || {}).forEach(key => {
                    expressionManager.setValue(key, 0);
                });
                
                // Set the desired expression
                expressionManager.setValue(expressionName, 1.0);
                
                // Reset after 3 seconds
                setTimeout(() => {
                    if (this.vrm && this.vrm.expressionManager) {
                        expressionManager.setValue(expressionName, 0);
                    }
                }, 3000);
            } catch (error) {
                console.log('Expression not available:', expressionName);
            }
        }
    }
}

// Nutrition Bot JavaScript
class NutritionBot {
    constructor() {
        this.foods = {};
        this.myths = {};
        this.supportiveMessages = {};
        this.config = {};
        this.vrmManager = null;
        
        this.initializeBot();
        this.loadData();
        this.setupEventListeners();
        this.initVRM();
    }

    initVRM() {
        // Initialize VRM after a short delay to ensure DOM is ready
        setTimeout(() => {
            this.vrmManager = new VRMManager();
        }, 500);
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

    async sendChatMessage() {
        const chatInput = document.getElementById('chatInput');
        const message = chatInput.value.trim();

        if (!message) return;

        this.addUserMessage(message);
        chatInput.value = '';

        // Add a typing indicator
        const typingIndicator = this.addTypingIndicator();

        try {
            // Call the Python backend API
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ message: message })
            });

            if (!response.ok) {
                throw new Error('Network response was not ok');
            }

            const data = await response.json();
            
            // Remove typing indicator
            typingIndicator.remove();
            
            // Display the response from the Python chatbot
            this.displayChatbotResponse(data);

        } catch (error) {
            console.error('Error communicating with chatbot:', error);
            typingIndicator.remove();
            this.addBotMessage('Sorry, I\'m having trouble connecting to my brain right now. Please try again in a moment.');
        }
    }

    displayChatbotResponse(data) {
        // Display the main response
        this.addBotMessage(data.response);

        // Display supportive message if available
        if (data.supportive_message) {
            setTimeout(() => {
                this.addBotMessage(`💚 ${data.supportive_message}`);
            }, 500);
        }

        // Apply UI effects if available
        if (data.ui_effects) {
            this.applyUIEffects(data.ui_effects);
        }
    }

    addTypingIndicator() {
        const messageElement = document.createElement('div');
        messageElement.className = 'message bot-message typing-indicator';
        messageElement.innerHTML = `
            <div class="message-content">
                <p>Thinking<span class="dots"><span>.</span><span>.</span><span>.</span></span></p>
            </div>
        `;
        this.chatMessages.appendChild(messageElement);
        this.scrollChatToBottom();
        return messageElement;
    }

    applyUIEffects(effects) {
        // Apply visual effects based on chatbot response
        if (effects.hologram_color) {
            console.log('UI Effect: hologram_color =', effects.hologram_color);
        }
        if (effects.avatar_mood) {
            console.log('UI Effect: avatar_mood =', effects.avatar_mood);
        }
    }

    addUserMessage(message) {
        const messageElement = document.createElement('div');
        messageElement.className = 'message user-message';
        messageElement.innerHTML = `
            <div class="message-content">
                <p>${this.escapeHtml(message)}</p>
            </div>
        `;
        this.chatMessages.appendChild(messageElement);
        this.scrollChatToBottom();
    }

    addBotMessage(message) {
        const messageElement = document.createElement('div');
        messageElement.className = 'message bot-message';
        
        // Convert markdown-style formatting to HTML
        const formattedMessage = this.formatMessage(message);
        
        messageElement.innerHTML = `
            <div class="message-content">
                ${formattedMessage}
            </div>
        `;
        this.chatMessages.appendChild(messageElement);
        this.scrollChatToBottom();
        
        // Trigger VRM expression when bot responds
        if (this.vrmManager) {
            // Trigger expressions based on message content
            if (message.includes('👍') || message.includes('✅') || message.includes('great') || message.includes('excellent')) {
                this.vrmManager.triggerExpression('happy');
            } else {
                this.vrmManager.triggerExpression('neutral');
            }
        }
    }

    formatMessage(message) {
        // Convert **bold** to <strong>
        message = message.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        
        // Convert bullet points • to proper list items
        const lines = message.split('\n');
        let formatted = '';
        let inList = false;
        
        for (let line of lines) {
            line = line.trim();
            if (line.startsWith('•')) {
                if (!inList) {
                    formatted += '<ul>';
                    inList = true;
                }
                formatted += `<li>${line.substring(1).trim()}</li>`;
            } else {
                if (inList) {
                    formatted += '</ul>';
                    inList = false;
                }
                if (line) {
                    formatted += `<p>${line}</p>`;
                }
            }
        }
        
        if (inList) {
            formatted += '</ul>';
        }
        
        return formatted;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    scrollChatToBottom() {
        this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
    }

    showMessage(message, type = 'info') {
        console.log(`${type}: ${message}`);
    }
}

// Initialize the bot when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new NutritionBot();
});

// Add additional CSS for typing indicator and better formatting
const additionalCSS = `
    .typing-indicator .dots span {
        animation: blink 1.4s infinite;
        opacity: 0;
    }
    
    .typing-indicator .dots span:nth-child(1) {
        animation-delay: 0s;
    }
    
    .typing-indicator .dots span:nth-child(2) {
        animation-delay: 0.2s;
    }
    
    .typing-indicator .dots span:nth-child(3) {
        animation-delay: 0.4s;
    }
    
    @keyframes blink {
        0%, 20% {
            opacity: 0;
        }
        50% {
            opacity: 1;
        }
        100% {
            opacity: 0;
        }
    }
    
    .message-content ul {
        margin: 0.5rem 0;
        padding-left: 1.5rem;
    }
    
    .message-content li {
        margin: 0.3rem 0;
    }
    
    .message-content p {
        margin: 0.5rem 0;
    }
    
    .message-content p:first-child {
        margin-top: 0;
    }
    
    .message-content p:last-child {
        margin-bottom: 0;
    }
    
    .message-content strong {
        color: #00ffff;
        font-weight: 600;
    }
    
    .bot-message .message-content strong {
        color: #00ffff;
    }
    
    .user-message .message-content strong {
        color: #000;
    }
`;

// Inject the additional CSS
const style = document.createElement('style');
style.textContent = additionalCSS;
document.head.appendChild(style);
