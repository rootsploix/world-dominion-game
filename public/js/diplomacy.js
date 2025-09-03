// ==========================================
//   WORLD DOMINION - DIPLOMACY SYSTEM
// ==========================================

class DiplomacySystem {
    constructor(gameEngine) {
        this.gameEngine = gameEngine;
        this.diplomacyActions = new Map();
        this.relationshipTypes = {
            WAR: 'war',
            NEUTRAL: 'neutral',
            ALLIANCE: 'alliance',
            TRADE: 'trade'
        };
        this.setupEventHandlers();
    }

    setupEventHandlers() {
        document.querySelectorAll('.diplo-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const action = e.target.textContent.trim();
                this.handleDiplomacyAction(action);
            });
        });
    }

    handleDiplomacyAction(action) {
        const player = this.gameEngine.gameState.currentPlayer;
        if (!player) return;

        if (action.includes('İttifak')) {
            this.proposeAlliance();
        } else if (action.includes('Ticaret')) {
            this.proposeTrade();
        } else if (action.includes('Savaş')) {
            this.declareWar();
        } else if (action.includes('Barış')) {
            this.proposePeace();
        }
    }

    proposeAlliance() {
        this.gameEngine.showNotification('🤝 İttifak teklifi gönderildi!', 'info');
    }

    proposeTrade() {
        this.gameEngine.showNotification('💰 Ticaret anlaşması önerildi!', 'info');
    }

    declareWar() {
        this.gameEngine.showNotification('⚔️ Savaş ilan edildi!', 'warning');
    }

    proposePeace() {
        this.gameEngine.showNotification('🕊️ Barış antlaşması önerildi!', 'success');
    }

    updateWorldLeaders() {
        const container = document.getElementById('world-leaders');
        if (!container) return;

        const players = Array.from(this.gameEngine.gameState.players.values())
            .filter(p => p.id !== this.gameEngine.gameState.currentPlayer?.id)
            .sort((a, b) => b.stats.powerScore - a.stats.powerScore)
            .slice(0, 5);

        container.innerHTML = '';
        
        players.forEach(player => {
            const leaderElement = document.createElement('div');
            leaderElement.className = 'world-leader';
            leaderElement.innerHTML = `
                <div class="leader-info">
                    <span class="leader-flag">🏰</span>
                    <span class="leader-name">${player.name}</span>
                    <span class="leader-score">${this.gameEngine.formatNumber(player.stats.powerScore)}</span>
                </div>
                <div class="leader-actions">
                    <button onclick="diplomacySystem.sendMessage('${player.id}')">💬</button>
                    <button onclick="diplomacySystem.proposeAction('${player.id}', 'alliance')">🤝</button>
                </div>
            `;
            container.appendChild(leaderElement);
        });
    }

    sendMessage(playerId) {
        this.gameEngine.showNotification('💬 Mesaj gönderildi!', 'info');
    }

    proposeAction(playerId, actionType) {
        const actions = {
            alliance: '🤝 İttifak teklifi',
            trade: '💰 Ticaret teklifi',
            war: '⚔️ Savaş ilanı'
        };
        
        this.gameEngine.showNotification(`${actions[actionType]} gönderildi!`, 'info');
    }
}

// Initialize diplomacy system
window.diplomacySystem = null;

// Initialize when game engine is ready
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        if (window.gameEngine) {
            window.diplomacySystem = new DiplomacySystem(window.gameEngine);
        }
    }, 100);
});
