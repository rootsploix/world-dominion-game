// ==========================================
//   WORLD DOMINION - CHAT SYSTEM
// ==========================================

class ChatSystem {
    constructor(gameEngine) {
        this.gameEngine = gameEngine;
        this.currentChannel = 'global';
        this.messageHistory = new Map();
        this.maxMessages = 100;
        this.setupChannels();
    }

    setupChannels() {
        const channels = ['global', 'alliance', 'trade'];
        channels.forEach(channel => {
            this.messageHistory.set(channel, []);
        });
    }

    addSystemMessage(message, channel = 'global') {
        const messageData = {
            id: Date.now(),
            type: 'system',
            message: message,
            timestamp: Date.now(),
            channel: channel
        };

        this.addMessageToHistory(messageData);
        if (channel === this.currentChannel) {
            this.displayMessage(messageData);
        }
    }

    addPlayerMessage(playerName, message, channel = 'global') {
        const messageData = {
            id: Date.now(),
            type: 'player',
            playerName: playerName,
            message: message,
            timestamp: Date.now(),
            channel: channel
        };

        this.addMessageToHistory(messageData);
        if (channel === this.currentChannel) {
            this.displayMessage(messageData);
        }
    }

    addMessageToHistory(messageData) {
        const channelHistory = this.messageHistory.get(messageData.channel) || [];
        channelHistory.push(messageData);
        
        // Keep only the last maxMessages
        if (channelHistory.length > this.maxMessages) {
            channelHistory.shift();
        }
        
        this.messageHistory.set(messageData.channel, channelHistory);
    }

    displayMessage(messageData) {
        const container = document.getElementById('chat-messages');
        if (!container) return;

        const messageElement = document.createElement('div');
        messageElement.className = `chat-message ${messageData.type}-message`;
        
        const timestamp = new Date(messageData.timestamp).toLocaleTimeString();
        
        if (messageData.type === 'system') {
            messageElement.innerHTML = `
                <i class="fas fa-info-circle"></i>
                <span class="system-text">${messageData.message}</span>
                <span class="timestamp">${timestamp}</span>
            `;
        } else {
            messageElement.innerHTML = `
                <span class="timestamp">[${timestamp}]</span>
                <span class="player-name">${messageData.playerName}:</span>
                <span class="message-text">${this.sanitizeMessage(messageData.message)}</span>
            `;
        }

        container.appendChild(messageElement);
        container.scrollTop = container.scrollHeight;

        // Add fade-in animation
        messageElement.style.opacity = '0';
        messageElement.style.transform = 'translateY(10px)';
        setTimeout(() => {
            messageElement.style.transition = 'all 0.3s ease';
            messageElement.style.opacity = '1';
            messageElement.style.transform = 'translateY(0)';
        }, 10);
    }

    switchChannel(channel) {
        this.currentChannel = channel;
        this.loadChannelMessages(channel);
        
        // Update active tab
        document.querySelectorAll('.chat-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelector(`[data-tab="${channel}"]`)?.classList.add('active');
    }

    loadChannelMessages(channel) {
        const container = document.getElementById('chat-messages');
        if (!container) return;

        container.innerHTML = '';
        
        const messages = this.messageHistory.get(channel) || [];
        messages.slice(-50).forEach(messageData => { // Show last 50 messages
            this.displayMessage(messageData);
        });
    }

    sanitizeMessage(message) {
        // Basic HTML escaping to prevent XSS
        return message
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#x27;');
    }

    processCommand(message) {
        if (!message.startsWith('/')) return false;

        const parts = message.slice(1).split(' ');
        const command = parts[0].toLowerCase();
        const args = parts.slice(1);

        switch (command) {
            case 'help':
                this.showHelp();
                break;
            case 'who':
                this.showOnlinePlayers();
                break;
            case 'clear':
                this.clearChat();
                break;
            case 'me':
                this.sendActionMessage(args.join(' '));
                break;
            default:
                this.addSystemMessage(`Bilinmeyen komut: /${command}. /help yazarak komutları görebilirsiniz.`);
        }
        
        return true;
    }

    showHelp() {
        const helpText = `
            <strong>Kullanılabilir Komutlar:</strong><br>
            /help - Bu yardım mesajını gösterir<br>
            /who - Çevrimiçi oyuncuları listeler<br>
            /clear - Sohbet geçmişini temizler<br>
            /me [eylem] - Eylem mesajı gönderir
        `;
        this.addSystemMessage(helpText);
    }

    showOnlinePlayers() {
        const players = Array.from(this.gameEngine.gameState.players.values());
        const playerList = players.map(p => p.name).join(', ');
        this.addSystemMessage(`Çevrimiçi Oyuncular (${players.length}): ${playerList}`);
    }

    clearChat() {
        const container = document.getElementById('chat-messages');
        if (container) {
            container.innerHTML = '';
            this.addSystemMessage('Sohbet geçmişi temizlendi.');
        }
    }

    sendActionMessage(action) {
        const player = this.gameEngine.gameState.currentPlayer;
        if (!player || !action) return;

        const actionMessage = `<em>* ${player.name} ${action}</em>`;
        this.addPlayerMessage('', actionMessage, this.currentChannel);
    }

    formatChatMessage(message) {
        // Add basic formatting support
        return message
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // **bold**
            .replace(/\*(.*?)\*/g, '<em>$1</em>') // *italic*
            .replace(/__(.*?)__/g, '<u>$1</u>'); // __underline__
    }

    addChatNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `chat-notification ${type}`;
        notification.textContent = message;
        
        const container = document.getElementById('chat-messages');
        if (container) {
            container.appendChild(notification);
            container.scrollTop = container.scrollHeight;
            
            // Auto-remove after 3 seconds
            setTimeout(() => {
                notification.remove();
            }, 3000);
        }
    }

    getChannelDisplayName(channel) {
        const names = {
            global: 'Genel',
            alliance: 'İttifak', 
            trade: 'Ticaret'
        };
        return names[channel] || channel;
    }

    // Integration with game events
    onPlayerJoined(playerName) {
        this.addSystemMessage(`🎮 ${playerName} oyuna katıldı!`, 'global');
    }

    onPlayerLeft(playerName) {
        this.addSystemMessage(`👋 ${playerName} oyundan ayrıldı.`, 'global');
    }

    onAllianceFormed(player1, player2) {
        this.addSystemMessage(`🤝 ${player1} ve ${player2} ittifak kurdu!`, 'global');
        this.addSystemMessage(`🤝 ${player1} ile ittifak kurdunuz!`, 'alliance');
    }

    onWarDeclared(attacker, defender) {
        this.addSystemMessage(`⚔️ ${attacker}, ${defender}'a savaş ilan etti!`, 'global');
    }

    onTradeCompleted(trader1, trader2, amount) {
        this.addSystemMessage(`💰 ${trader1} ve ${trader2} arasında ${amount} değerinde ticaret yapıldı!`, 'trade');
    }

    // Anti-spam protection
    checkSpam(playerId, message) {
        const now = Date.now();
        const playerHistory = this.playerMessageHistory.get(playerId) || [];
        
        // Remove messages older than 1 minute
        const recentMessages = playerHistory.filter(msg => now - msg.timestamp < 60000);
        
        // Check for too many messages
        if (recentMessages.length >= 10) {
            return true;
        }
        
        // Check for repeated messages
        const duplicates = recentMessages.filter(msg => msg.message === message);
        if (duplicates.length >= 3) {
            return true;
        }
        
        // Add current message to history
        recentMessages.push({ message, timestamp: now });
        this.playerMessageHistory.set(playerId, recentMessages);
        
        return false;
    }

    filterProfanity(message) {
        // Basic profanity filter - in a real game this would be more comprehensive
        const badWords = ['spam', 'hack', 'cheat']; // Simplified list
        let filtered = message;
        
        badWords.forEach(word => {
            const regex = new RegExp(word, 'gi');
            filtered = filtered.replace(regex, '*'.repeat(word.length));
        });
        
        return filtered;
    }
}

// Initialize chat system
window.chatSystem = null;

// Initialize when game engine is ready  
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        if (window.gameEngine) {
            window.chatSystem = new ChatSystem(window.gameEngine);
            
            // Add some welcome messages
            window.chatSystem.addSystemMessage('World Dominion\'a hoş geldiniz! 🌍');
            window.chatSystem.addSystemMessage('Komutlar için /help yazın.');
        }
    }, 100);
});
