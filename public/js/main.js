// ==========================================
//   WORLD DOMINION - MAIN APPLICATION
// ==========================================

// Main application initialization and coordination
document.addEventListener('DOMContentLoaded', () => {
    console.log('🌍 World Dominion Loading...');
    
    // Initialize loading screen
    showLoadingScreen();
    
    // Initialize application after a brief delay to show loading
    setTimeout(() => {
        initializeApplication();
    }, 1500);
});

function showLoadingScreen() {
    const loading = document.getElementById('loading');
    if (loading) {
        loading.classList.add('active');
    }
}

function hideLoadingScreen() {
    const loading = document.getElementById('loading');
    if (loading) {
        loading.classList.remove('active');
    }
}

function initializeApplication() {
    console.log('🎮 Initializing World Dominion...');
    
    try {
        // Verify all required systems are loaded
        if (!window.gameEngine) {
            throw new Error('Game Engine not loaded');
        }
        
        // Initialize statistics display
        updateOnlineStats();
        
        // Setup additional event handlers
        setupGlobalEventHandlers();
        
        // Setup keyboard shortcuts
        setupKeyboardShortcuts();
        
        // Initialize performance monitoring
        setupPerformanceMonitoring();
        
        // Start background processes
        startBackgroundProcesses();
        
        console.log('✅ World Dominion initialized successfully!');
        hideLoadingScreen();
        
    } catch (error) {
        console.error('❌ Failed to initialize World Dominion:', error);
        showErrorScreen(error.message);
    }
}

function setupGlobalEventHandlers() {
    // Handle window focus/blur for game pausing
    window.addEventListener('focus', () => {
        if (window.gameEngine?.gameState?.gameStarted) {
            console.log('🎯 Game resumed');
            // Resume game processes if needed
        }
    });
    
    window.addEventListener('blur', () => {
        if (window.gameEngine?.gameState?.gameStarted) {
            console.log('⏸️ Game paused');
            // Pause non-critical processes when window loses focus
        }
    });
    
    // Handle page visibility changes (mobile support)
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            console.log('📱 Page hidden - reducing update frequency');
        } else {
            console.log('📱 Page visible - resuming normal updates');
        }
    });
    
    // Handle window resize
    window.addEventListener('resize', debounce(() => {
        if (window.gameEngine?.worldMap) {
            window.gameEngine.worldMap.resizeCanvas();
        }
    }, 250));
    
    // Prevent accidental page refresh during gameplay
    window.addEventListener('beforeunload', (e) => {
        if (window.gameEngine?.gameState?.gameStarted) {
            e.preventDefault();
            e.returnValue = 'Oyunu bırakmak istediğinizden emin misiniz?';
            return 'Oyunu bırakmak istediğinizden emin misiniz?';
        }
    });
}

function setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        // Only handle shortcuts when not typing in inputs
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
            return;
        }
        
        switch (e.key) {
            case 'Escape':
                // Close any open modals
                document.querySelectorAll('.modal.active').forEach(modal => {
                    modal.classList.remove('active');
                });
                break;
                
            case 'Enter':
                // Focus chat input if not already focused
                const chatInput = document.getElementById('chat-input');
                if (chatInput && document.activeElement !== chatInput) {
                    chatInput.focus();
                    e.preventDefault();
                }
                break;
                
            case 't':
            case 'T':
                // Open technology tree
                if (window.gameEngine) {
                    window.gameEngine.showModal('tech-modal');
                }
                break;
                
            case 'd':
            case 'D':
                // Open diplomacy
                if (window.gameEngine) {
                    window.gameEngine.showModal('diplomacy-modal');
                }
                break;
                
            case 'm':
            case 'M':
                // Focus on map (reset view)
                if (window.gameEngine?.worldMap) {
                    window.gameEngine.worldMap.resetView();
                }
                break;
                
            case ' ':
                // Spacebar to pause/unpause (future feature)
                e.preventDefault();
                toggleGamePause();
                break;
        }
    });
}

function setupPerformanceMonitoring() {
    let frameCount = 0;
    let lastTime = performance.now();
    
    function monitorFPS() {
        frameCount++;
        const currentTime = performance.now();
        
        if (currentTime >= lastTime + 1000) {
            const fps = Math.round((frameCount * 1000) / (currentTime - lastTime));
            
            // Log performance warnings
            if (fps < 30) {
                console.warn(`⚠️ Low FPS detected: ${fps}`);
            }
            
            // Update FPS counter if element exists
            const fpsCounter = document.getElementById('fps-counter');
            if (fpsCounter) {
                fpsCounter.textContent = `${fps} FPS`;
            }
            
            frameCount = 0;
            lastTime = currentTime;
        }
        
        requestAnimationFrame(monitorFPS);
    }
    
    monitorFPS();
}

function startBackgroundProcesses() {
    // Update online player count periodically
    setInterval(updateOnlineStats, 30000); // Every 30 seconds
    
    // Auto-save game state (if implemented)
    setInterval(() => {
        if (window.gameEngine?.gameState?.gameStarted) {
            saveGameState();
        }
    }, 300000); // Every 5 minutes
    
    // Clean up old notifications
    setInterval(cleanupOldNotifications, 60000); // Every minute
}

function updateOnlineStats() {
    // Simulate online player count (in real implementation, this would come from server)
    const onlinePlayersElement = document.getElementById('online-players');
    const totalGamesElement = document.getElementById('total-games');
    
    if (onlinePlayersElement) {
        const simulatedOnline = Math.floor(Math.random() * 500) + 100;
        onlinePlayersElement.textContent = simulatedOnline.toLocaleString();
    }
    
    if (totalGamesElement) {
        const simulatedTotal = Math.floor(Math.random() * 10000) + 50000;
        totalGamesElement.textContent = simulatedTotal.toLocaleString();
    }
}

function saveGameState() {
    try {
        const gameState = window.gameEngine?.gameState;
        if (gameState && gameState.currentPlayer) {
            localStorage.setItem('worldDominion_gameState', JSON.stringify({
                player: gameState.currentPlayer,
                timestamp: Date.now()
            }));
            console.log('💾 Game state saved');
        }
    } catch (error) {
        console.error('❌ Failed to save game state:', error);
    }
}

function loadGameState() {
    try {
        const saved = localStorage.getItem('worldDominion_gameState');
        if (saved) {
            const data = JSON.parse(saved);
            const age = Date.now() - data.timestamp;
            
            // Only restore if saved within last 24 hours
            if (age < 24 * 60 * 60 * 1000) {
                return data.player;
            }
        }
    } catch (error) {
        console.error('❌ Failed to load game state:', error);
    }
    return null;
}

function cleanupOldNotifications() {
    const notifications = document.querySelectorAll('.notification');
    notifications.forEach(notification => {
        const age = Date.now() - parseInt(notification.dataset.timestamp || '0');
        if (age > 300000) { // 5 minutes
            notification.remove();
        }
    });
}

function toggleGamePause() {
    // Placeholder for pause functionality
    if (window.gameEngine?.gameState?.gameStarted) {
        console.log('⏯️ Game pause toggle (feature coming soon)');
        window.gameEngine.showNotification('Oyun duraklatma özelliği yakında!', 'info');
    }
}

function showErrorScreen(errorMessage) {
    const errorHtml = `
        <div id="error-screen" class="screen active" style="
            background: linear-gradient(45deg, #8B0000, #DC143C);
            justify-content: center;
            align-items: center;
            flex-direction: column;
            text-align: center;
            padding: 2rem;
        ">
            <div style="
                background: rgba(0, 0, 0, 0.8);
                padding: 3rem;
                border-radius: 20px;
                border: 2px solid rgba(220, 20, 60, 0.5);
                max-width: 500px;
            ">
                <h1 style="color: #ff6b6b; margin-bottom: 1rem; font-family: 'Orbitron', monospace;">
                    <i class="fas fa-exclamation-triangle"></i>
                    Hata!
                </h1>
                <p style="color: #fff; margin-bottom: 2rem; font-size: 1.1rem;">
                    Oyun başlatılırken bir hata oluştu:
                </p>
                <p style="color: #ffcccb; margin-bottom: 2rem; font-family: monospace; background: rgba(0,0,0,0.5); padding: 1rem; border-radius: 10px;">
                    ${errorMessage}
                </p>
                <button onclick="location.reload()" style="
                    padding: 1rem 2rem;
                    background: linear-gradient(45deg, #ff6b6b, #ffd700);
                    border: none;
                    border-radius: 25px;
                    color: #000;
                    font-size: 1.1rem;
                    font-weight: bold;
                    cursor: pointer;
                    transition: all 0.3s ease;
                ">
                    <i class="fas fa-refresh"></i>
                    Sayfayı Yenile
                </button>
            </div>
        </div>
    `;
    
    document.body.innerHTML = errorHtml;
    hideLoadingScreen();
}

// Utility functions
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function throttle(func, limit) {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    }
}

// Browser feature detection
function checkBrowserSupport() {
    const features = {
        canvas: !!document.createElement('canvas').getContext,
        localStorage: typeof(Storage) !== 'undefined',
        websocket: 'WebSocket' in window,
        webgl: !!document.createElement('canvas').getContext('webgl')
    };
    
    const unsupported = Object.keys(features).filter(key => !features[key]);
    
    if (unsupported.length > 0) {
        console.warn('⚠️ Some browser features not supported:', unsupported);
    }
    
    return unsupported.length === 0;
}

// Check browser support on load
if (!checkBrowserSupport()) {
    console.warn('⚠️ Browser may not fully support all game features');
}

// Global error handler
window.addEventListener('error', (e) => {
    console.error('🚨 Global error:', e.error);
    
    // Don't crash the game for minor errors
    if (window.gameEngine) {
        window.gameEngine.showNotification('Küçük bir hata oluştu, oyun devam ediyor.', 'warning');
    }
});

// Unhandled promise rejection handler
window.addEventListener('unhandledrejection', (e) => {
    console.error('🚨 Unhandled promise rejection:', e.reason);
    e.preventDefault(); // Prevent default browser behavior
    
    if (window.gameEngine) {
        window.gameEngine.showNotification('Bir bağlantı hatası oluştu.', 'warning');
    }
});

// Export utilities for global access
window.WorldDominion = {
    debounce,
    throttle,
    saveGameState,
    loadGameState,
    checkBrowserSupport,
    updateOnlineStats
};

console.log('📜 Main script loaded successfully');
