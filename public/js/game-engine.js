// ==========================================
//   WORLD DOMINION - GAME ENGINE
// ==========================================

class GameEngine {
    constructor() {
        this.gameState = {
            currentPlayer: null,
            players: new Map(),
            gameSettings: {
                tickRate: 5000, // 5 saniye
                maxPlayers: 50,
                worldAge: 0
            },
            resources: {
                GOLD: 'gold',
                PRODUCTION: 'production',
                SCIENCE: 'science',
                MILITARY: 'military'
            },
            technologies: new Map(),
            gameStarted: false
        };
        
        this.eventHandlers = new Map();
        this.gameTimer = null;
        this.socket = null;
        
        this.initializeTechnologies();
        this.initializeEventHandlers();
    }

    // ==========================================
    //   INITIALIZATION
    // ==========================================

    initializeTechnologies() {
        const techs = [
            {
                id: 'gunpowder',
                name: 'Barut',
                category: 'military',
                cost: { science: 50 },
                effects: { military: 15 },
                prerequisites: [],
                unlocked: false
            },
            {
                id: 'artillery',
                name: 'Topçuluk',
                category: 'military',
                cost: { science: 100 },
                effects: { military: 25 },
                prerequisites: ['gunpowder'],
                unlocked: false
            },
            {
                id: 'steam',
                name: 'Buhar Gücü',
                category: 'industrial',
                cost: { science: 75 },
                effects: { production: 20 },
                prerequisites: [],
                unlocked: false
            },
            {
                id: 'electricity',
                name: 'Elektrik',
                category: 'industrial',
                cost: { science: 150 },
                effects: { production: 35, science: 10 },
                prerequisites: ['steam'],
                unlocked: false
            }
        ];

        techs.forEach(tech => {
            this.gameState.technologies.set(tech.id, tech);
        });
    }

    initializeEventHandlers() {
        // DOM event handlers
        document.addEventListener('DOMContentLoaded', () => {
            this.setupUIEventListeners();
        });
    }

    setupUIEventListeners() {
        // Start game button
        const startBtn = document.getElementById('start-game-btn');
        if (startBtn) {
            startBtn.addEventListener('click', () => this.startGame());
        }

        // Modal controls
        this.setupModalControls();
        
        // Building buttons
        this.setupBuildingControls();
        
        // Tech tree
        this.setupTechTreeControls();
        
        // Chat
        this.setupChatControls();
    }

    setupModalControls() {
        // Tech tree modal
        document.getElementById('tech-tree-btn')?.addEventListener('click', () => {
            this.showModal('tech-modal');
        });

        // Diplomacy modal
        document.getElementById('diplomacy-btn')?.addEventListener('click', () => {
            this.showModal('diplomacy-modal');
        });

        // Close modal buttons
        document.querySelectorAll('.close-modal').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const modal = e.target.closest('.modal');
                if (modal) {
                    this.hideModal(modal.id);
                }
            });
        });

        // Click outside to close
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.hideModal(modal.id);
                }
            });
        });
    }

    setupBuildingControls() {
        document.querySelectorAll('.build-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const buildingType = e.target.dataset.building;
                this.buildStructure(buildingType);
            });
        });
    }

    setupTechTreeControls() {
        document.querySelectorAll('.tech-item.available').forEach(item => {
            item.addEventListener('click', (e) => {
                const techId = e.target.closest('.tech-item').dataset.tech;
                this.researchTechnology(techId);
            });
        });
    }

    setupChatControls() {
        const chatInput = document.getElementById('chat-input');
        const sendBtn = document.getElementById('send-message');

        if (chatInput && sendBtn) {
            chatInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.sendChatMessage();
                }
            });

            sendBtn.addEventListener('click', () => {
                this.sendChatMessage();
            });
        }

        // Chat tabs
        document.querySelectorAll('.chat-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                this.switchChatTab(e.target.dataset.tab);
            });
        });
    }

    // ==========================================
    //   GAME FLOW
    // ==========================================

    startGame() {
        const playerName = document.getElementById('player-name').value.trim();
        const selectedCountry = document.getElementById('country-select').value;

        if (!playerName || !selectedCountry) {
            this.showNotification('Lütfen isminizi ve ülkenizi seçin!', 'warning');
            return;
        }

        // Initialize player
        this.gameState.currentPlayer = this.createPlayer(playerName, selectedCountry);
        
        // Switch to game screen
        this.switchScreen('login-screen', 'game-screen');
        
        // Initialize game components
        this.initializeGame();
        
        // Start game loop
        this.startGameLoop();
        
        this.showNotification(`🎉 ${playerName} dünya sahnesine çıktı!`, 'success');
    }

    createPlayer(name, country) {
        const player = {
            id: this.generatePlayerId(),
            name: name,
            country: country,
            resources: {
                gold: 1000,
                production: 100,
                science: 50,
                military: 75
            },
            buildings: {
                factories: 5,
                labs: 3,
                barracks: 2
            },
            technologies: new Set(),
            stats: {
                population: 50000000,
                happiness: 85,
                powerScore: 1250
            },
            alliances: new Set(),
            wars: new Set(),
            joinedAt: Date.now()
        };

        this.gameState.players.set(player.id, player);
        return player;
    }

    initializeGame() {
        // Update UI with player data
        this.updatePlayerUI();
        
        // Initialize world map
        if (typeof WorldMap !== 'undefined') {
            this.worldMap = new WorldMap('world-canvas');
            this.worldMap.initialize();
        }
        
        // Connect to server (if available)
        this.connectToServer();
        
        // Update leaderboard
        this.updateLeaderboard();
        
        this.gameState.gameStarted = true;
    }

    startGameLoop() {
        this.gameTimer = setInterval(() => {
            this.gameLoop();
        }, this.gameState.gameSettings.tickRate);
    }

    gameLoop() {
        // Resource generation
        this.generateResources();
        
        // Update world age
        this.gameState.gameSettings.worldAge++;
        
        // Update UI
        this.updatePlayerUI();
        
        // Check win conditions
        this.checkWinConditions();
        
        // Emit game state update
        this.emitGameStateUpdate();
    }

    generateResources() {
        const player = this.gameState.currentPlayer;
        if (!player) return;

        // Base resource generation
        const goldGain = player.buildings.factories * 20;
        const productionGain = player.buildings.factories * 5;
        const scienceGain = player.buildings.labs * 8;
        const militaryGain = player.buildings.barracks * 3;

        // Apply technology bonuses
        player.technologies.forEach(techId => {
            const tech = this.gameState.technologies.get(techId);
            if (tech && tech.effects) {
                Object.keys(tech.effects).forEach(resource => {
                    if (player.resources[resource] !== undefined) {
                        player.resources[resource] += tech.effects[resource];
                    }
                });
            }
        });

        // Add resources
        player.resources.gold += goldGain;
        player.resources.production += productionGain;
        player.resources.science += scienceGain;
        player.resources.military += militaryGain;

        // Update power score
        player.stats.powerScore = Math.floor(
            (player.resources.gold * 0.1) +
            (player.resources.production * 2) +
            (player.resources.science * 5) +
            (player.resources.military * 3)
        );
    }

    // ==========================================
    //   BUILDING SYSTEM
    // ==========================================

    buildStructure(buildingType) {
        const player = this.gameState.currentPlayer;
        if (!player) return;

        const buildingCosts = {
            factory: { gold: 500, production: 50 },
            lab: { gold: 800, science: 30 },
            barracks: { gold: 600, military: 25 }
        };

        const cost = buildingCosts[buildingType];
        if (!cost) return;

        // Check if player can afford
        let canAfford = true;
        Object.keys(cost).forEach(resource => {
            if (player.resources[resource] < cost[resource]) {
                canAfford = false;
            }
        });

        if (!canAfford) {
            this.showNotification('Yeterli kaynağınız yok!', 'error');
            return;
        }

        // Deduct resources
        Object.keys(cost).forEach(resource => {
            player.resources[resource] -= cost[resource];
        });

        // Add building
        const buildingNames = {
            factory: 'factories',
            lab: 'labs',
            barracks: 'barracks'
        };

        const buildingName = buildingNames[buildingType];
        if (buildingName) {
            player.buildings[buildingName]++;
            this.updatePlayerUI();
            this.showNotification(`🏗️ ${this.getBuildingDisplayName(buildingType)} inşa edildi!`, 'success');
        }
    }

    getBuildingDisplayName(buildingType) {
        const names = {
            factory: 'Fabrika',
            lab: 'Laboratuvar',
            barracks: 'Kışla'
        };
        return names[buildingType] || buildingType;
    }

    // ==========================================
    //   TECHNOLOGY SYSTEM
    // ==========================================

    researchTechnology(techId) {
        const player = this.gameState.currentPlayer;
        const tech = this.gameState.technologies.get(techId);
        
        if (!player || !tech || player.technologies.has(techId)) return;

        // Check prerequisites
        const hasPrerequisites = tech.prerequisites.every(prereqId => 
            player.technologies.has(prereqId)
        );

        if (!hasPrerequisites) {
            this.showNotification('Ön koşullar karşılanmadı!', 'error');
            return;
        }

        // Check cost
        let canAfford = true;
        Object.keys(tech.cost).forEach(resource => {
            if (player.resources[resource] < tech.cost[resource]) {
                canAfford = false;
            }
        });

        if (!canAfford) {
            this.showNotification('Araştırma için yeterli kaynağınız yok!', 'error');
            return;
        }

        // Deduct cost
        Object.keys(tech.cost).forEach(resource => {
            player.resources[resource] -= tech.cost[resource];
        });

        // Add technology
        player.technologies.add(techId);
        tech.unlocked = true;

        this.updatePlayerUI();
        this.updateTechTreeUI();
        this.showNotification(`🔬 ${tech.name} teknolojisi keşfedildi!`, 'success');
    }

    updateTechTreeUI() {
        document.querySelectorAll('.tech-item').forEach(item => {
            const techId = item.dataset.tech;
            const tech = this.gameState.technologies.get(techId);
            const player = this.gameState.currentPlayer;
            
            if (tech && player) {
                if (player.technologies.has(techId)) {
                    item.classList.remove('available', 'locked');
                    item.classList.add('researched');
                } else {
                    const hasPrerequisites = tech.prerequisites.every(prereqId => 
                        player.technologies.has(prereqId)
                    );
                    
                    if (hasPrerequisites) {
                        item.classList.remove('locked', 'researched');
                        item.classList.add('available');
                    } else {
                        item.classList.remove('available', 'researched');
                        item.classList.add('locked');
                    }
                }
            }
        });
    }

    // ==========================================
    //   UI MANAGEMENT
    // ==========================================

    updatePlayerUI() {
        const player = this.gameState.currentPlayer;
        if (!player) return;

        // Update empire name
        const empireElement = document.getElementById('player-empire');
        if (empireElement) {
            empireElement.textContent = `🏰 ${player.name}`;
        }

        // Update resources
        Object.keys(player.resources).forEach(resource => {
            const element = document.getElementById(resource);
            if (element) {
                element.textContent = this.formatNumber(player.resources[resource]);
            }
        });

        // Update buildings
        Object.keys(player.buildings).forEach(building => {
            const element = document.getElementById(building);
            if (element) {
                element.textContent = player.buildings[building];
            }
        });

        // Update stats
        Object.keys(player.stats).forEach(stat => {
            const element = document.getElementById(stat.replace('Score', '-score'));
            if (element) {
                if (stat === 'population') {
                    element.textContent = this.formatNumber(player.stats[stat], true);
                } else if (stat === 'happiness') {
                    element.textContent = `${player.stats[stat]}%`;
                } else {
                    element.textContent = this.formatNumber(player.stats[stat]);
                }
            }
        });
    }

    updateLeaderboard() {
        const rankingsContainer = document.getElementById('player-rankings');
        if (!rankingsContainer) return;

        const players = Array.from(this.gameState.players.values())
            .sort((a, b) => b.stats.powerScore - a.stats.powerScore)
            .slice(0, 10);

        rankingsContainer.innerHTML = '';
        
        players.forEach((player, index) => {
            const rankElement = document.createElement('div');
            rankElement.className = 'rank-item';
            rankElement.innerHTML = `
                <span class="rank">${index + 1}.</span>
                <span class="player-name">${player.name}</span>
                <span class="power-score">${this.formatNumber(player.stats.powerScore)}</span>
            `;
            rankingsContainer.appendChild(rankElement);
        });
    }

    switchScreen(fromScreen, toScreen) {
        document.getElementById(fromScreen)?.classList.remove('active');
        document.getElementById(toScreen)?.classList.add('active');
    }

    showModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('active');
            
            // Update modal content if needed
            if (modalId === 'tech-modal') {
                this.updateTechTreeUI();
            }
        }
    }

    hideModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('active');
        }
    }

    showNotification(message, type = 'info') {
        const container = document.getElementById('notifications');
        if (!container) return;

        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <i class="fas fa-${this.getNotificationIcon(type)}"></i>
            <span>${message}</span>
        `;

        container.appendChild(notification);

        // Auto remove after 5 seconds
        setTimeout(() => {
            notification.remove();
        }, 5000);
    }

    getNotificationIcon(type) {
        const icons = {
            success: 'check-circle',
            error: 'exclamation-triangle',
            warning: 'exclamation-circle',
            info: 'info-circle'
        };
        return icons[type] || 'info-circle';
    }

    // ==========================================
    //   CHAT SYSTEM
    // ==========================================

    sendChatMessage() {
        const input = document.getElementById('chat-input');
        const message = input.value.trim();
        
        if (!message) return;

        const player = this.gameState.currentPlayer;
        if (!player) return;

        const chatMessage = {
            id: Date.now(),
            playerId: player.id,
            playerName: player.name,
            message: message,
            timestamp: Date.now(),
            type: 'player'
        };

        this.addChatMessage(chatMessage);
        input.value = '';

        // Emit to server if connected
        if (this.socket) {
            this.socket.emit('chatMessage', chatMessage);
        }
    }

    addChatMessage(messageData) {
        const container = document.getElementById('chat-messages');
        if (!container) return;

        const messageElement = document.createElement('div');
        messageElement.className = `chat-message ${messageData.type}-message`;
        
        const timestamp = new Date(messageData.timestamp).toLocaleTimeString();
        
        if (messageData.type === 'system') {
            messageElement.innerHTML = `
                <i class="fas fa-info-circle"></i>
                <span>${messageData.message}</span>
            `;
        } else {
            messageElement.innerHTML = `
                <span class="timestamp">[${timestamp}]</span>
                <span class="player-name">${messageData.playerName}:</span>
                <span class="message-text">${messageData.message}</span>
            `;
        }

        container.appendChild(messageElement);
        container.scrollTop = container.scrollHeight;
    }

    switchChatTab(tabName) {
        // Update active tab
        document.querySelectorAll('.chat-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`)?.classList.add('active');

        // Here you could filter messages based on tab
        this.showNotification(`${tabName} sohbetine geçildi`, 'info');
    }

    // ==========================================
    //   NETWORK/SERVER
    // ==========================================

    connectToServer() {
        try {
            if (typeof io !== 'undefined') {
                this.socket = io();
                this.setupSocketEventListeners();
                this.showNotification('Servere bağlanıldı', 'success');
            }
        } catch (error) {
            console.log('Socket.io not available, running in offline mode');
            this.showNotification('Çevrimdışı modda çalışıyor', 'warning');
        }
    }

    setupSocketEventListeners() {
        if (!this.socket) return;

        this.socket.on('connect', () => {
            console.log('Connected to server');
        });

        this.socket.on('playerJoined', (playerData) => {
            this.gameState.players.set(playerData.id, playerData);
            this.addChatMessage({
                type: 'system',
                message: `${playerData.name} oyuna katıldı!`,
                timestamp: Date.now()
            });
            this.updateLeaderboard();
        });

        this.socket.on('playerLeft', (playerId) => {
            const player = this.gameState.players.get(playerId);
            if (player) {
                this.gameState.players.delete(playerId);
                this.addChatMessage({
                    type: 'system',
                    message: `${player.name} oyundan ayrıldı`,
                    timestamp: Date.now()
                });
            }
            this.updateLeaderboard();
        });

        this.socket.on('chatMessage', (messageData) => {
            this.addChatMessage(messageData);
        });

        this.socket.on('gameStateUpdate', (gameState) => {
            // Handle server-side game state updates
            this.handleServerGameStateUpdate(gameState);
        });
    }

    emitGameStateUpdate() {
        if (this.socket && this.gameState.currentPlayer) {
            this.socket.emit('gameStateUpdate', {
                playerId: this.gameState.currentPlayer.id,
                player: this.gameState.currentPlayer,
                worldAge: this.gameState.gameSettings.worldAge
            });
        }
    }

    handleServerGameStateUpdate(serverState) {
        // Update other players' data
        Object.keys(serverState.players || {}).forEach(playerId => {
            if (playerId !== this.gameState.currentPlayer?.id) {
                this.gameState.players.set(playerId, serverState.players[playerId]);
            }
        });
        
        this.updateLeaderboard();
    }

    // ==========================================
    //   UTILITY FUNCTIONS
    // ==========================================

    formatNumber(num, compact = false) {
        if (compact && num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        } else if (compact && num >= 1000) {
            return (num / 1000).toFixed(1) + 'K';
        }
        return num.toLocaleString();
    }

    generatePlayerId() {
        return 'player_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    checkWinConditions() {
        const player = this.gameState.currentPlayer;
        if (!player) return;

        // Victory condition: Power Score > 10000
        if (player.stats.powerScore >= 10000) {
            this.showVictory();
        }
    }

    showVictory() {
        const player = this.gameState.currentPlayer;
        this.showNotification(`🎉 Tebrikler ${player.name}! Dünyayı ele geçirdiniz!`, 'success');
        
        // Add victory effects
        document.body.classList.add('victory-glow');
        
        // Stop game loop
        if (this.gameTimer) {
            clearInterval(this.gameTimer);
        }
    }

    // ==========================================
    //   GAME DESTRUCTION
    // ==========================================

    destroy() {
        if (this.gameTimer) {
            clearInterval(this.gameTimer);
        }
        
        if (this.socket) {
            this.socket.disconnect();
        }
        
        // Clear all data
        this.gameState.players.clear();
        this.gameState.technologies.clear();
    }
}

// Initialize game engine when script loads
const gameEngine = new GameEngine();

// Make it globally accessible
window.gameEngine = gameEngine;
