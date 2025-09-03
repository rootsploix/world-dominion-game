// ==========================================
//   WORLD DOMINION - EXPRESS SERVER
// ==========================================

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');

// Initialize Express app
const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Configuration
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Security & Performance Middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com", "https://fonts.googleapis.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com", "https://cdnjs.cloudflare.com"],
            scriptSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'", "ws:", "wss:"]
        }
    }
}));
app.use(compression());
app.use(cors({
    origin: process.env.NODE_ENV === 'production' ? ['https://yourdomain.com'] : true,
    credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.static(path.join(__dirname, '../public'), {
    maxAge: '1d',
    etag: true
}));

// In-memory game state (in production, use a database)
let gameState = {
    players: new Map(),
    gameRooms: new Map(),
    globalStats: {
        totalPlayers: 0,
        activeGames: 0,
        totalGames: 0
    }
};

// ==========================================
//   API ROUTES
// ==========================================

// Health check
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'healthy', 
        timestamp: new Date().toISOString(),
        environment: NODE_ENV,
        players: gameState.players.size
    });
});

// Get global statistics
app.get('/api/stats', (req, res) => {
    res.json({
        ...gameState.globalStats,
        onlinePlayers: gameState.players.size,
        timestamp: new Date().toISOString()
    });
});

// Get leaderboard
app.get('/api/leaderboard', (req, res) => {
    const players = Array.from(gameState.players.values())
        .sort((a, b) => b.stats.powerScore - a.stats.powerScore)
        .slice(0, 100)
        .map(player => ({
            id: player.id,
            name: player.name,
            country: player.country,
            powerScore: player.stats.powerScore,
            joinedAt: player.joinedAt
        }));
    
    res.json(players);
});

// Create or join game room
app.post('/api/rooms/join', (req, res) => {
    const { playerName, country } = req.body;
    
    if (!playerName || !country) {
        return res.status(400).json({ error: 'Player name and country required' });
    }
    
    // Find available room or create new one
    let room = findAvailableRoom();
    if (!room) {
        room = createNewRoom();
    }
    
    const playerId = generatePlayerId();
    const player = createPlayer(playerId, playerName, country);
    
    gameState.players.set(playerId, player);
    room.players.set(playerId, player);
    
    res.json({
        roomId: room.id,
        playerId: playerId,
        player: player
    });
});

// Get game room info
app.get('/api/rooms/:roomId', (req, res) => {
    const roomId = req.params.roomId;
    const room = gameState.gameRooms.get(roomId);
    
    if (!room) {
        return res.status(404).json({ error: 'Room not found' });
    }
    
    res.json({
        id: room.id,
        players: Array.from(room.players.values()),
        createdAt: room.createdAt,
        status: room.status
    });
});

// Save player data
app.post('/api/players/:playerId/save', (req, res) => {
    const playerId = req.params.playerId;
    const playerData = req.body;
    
    const player = gameState.players.get(playerId);
    if (!player) {
        return res.status(404).json({ error: 'Player not found' });
    }
    
    // Update player data
    Object.assign(player, playerData);
    
    res.json({ message: 'Player data saved successfully' });
});

// Serve the main game page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Handle 404
app.use('*', (req, res) => {
    res.status(404).json({ error: 'API endpoint not found' });
});

// ==========================================
//   SOCKET.IO REAL-TIME COMMUNICATION
// ==========================================

io.on('connection', (socket) => {
    console.log(`🔌 Player connected: ${socket.id}`);
    
    let currentPlayer = null;
    let currentRoom = null;
    
    // Handle player joining
    socket.on('playerJoin', (data) => {
        const { playerName, country } = data;
        
        // Create player
        const playerId = generatePlayerId();
        const player = createPlayer(playerId, playerName, country);
        currentPlayer = player;
        
        // Add to game state
        gameState.players.set(playerId, player);
        
        // Find or create room
        currentRoom = findAvailableRoom() || createNewRoom();
        currentRoom.players.set(playerId, player);
        
        // Join socket room
        socket.join(currentRoom.id);
        
        // Notify client
        socket.emit('playerJoined', {
            player: player,
            room: {
                id: currentRoom.id,
                players: Array.from(currentRoom.players.values())
            }
        });
        
        // Notify other players in room
        socket.to(currentRoom.id).emit('playerJoined', player);
        
        // Update global stats
        updateGlobalStats();
        
        console.log(`🎮 Player joined: ${playerName} (${country})`);
    });
    
    // Handle chat messages
    socket.on('chatMessage', (data) => {
        if (!currentPlayer || !currentRoom) return;
        
        const message = {
            id: Date.now(),
            playerId: currentPlayer.id,
            playerName: currentPlayer.name,
            message: data.message,
            timestamp: Date.now(),
            type: 'player'
        };
        
        // Broadcast to room
        io.to(currentRoom.id).emit('chatMessage', message);
        
        console.log(`💬 Chat [${currentPlayer.name}]: ${data.message}`);
    });
    
    // Handle game state updates
    socket.on('gameStateUpdate', (data) => {
        if (!currentPlayer || !currentRoom) return;
        
        // Update player data
        Object.assign(currentPlayer, data.player);
        
        // Broadcast updated state to other players in room
        socket.to(currentRoom.id).emit('gameStateUpdate', {
            playerId: currentPlayer.id,
            player: currentPlayer,
            worldAge: data.worldAge
        });
    });
    
    // Handle diplomacy actions
    socket.on('diplomacyAction', (data) => {
        if (!currentPlayer || !currentRoom) return;
        
        const { targetPlayerId, action, details } = data;
        const targetPlayer = currentRoom.players.get(targetPlayerId);
        
        if (targetPlayer) {
            // Send diplomacy proposal to target player
            socket.to(currentRoom.id).emit('diplomacyProposal', {
                from: currentPlayer,
                to: targetPlayer,
                action: action,
                details: details,
                timestamp: Date.now()
            });
            
            console.log(`🤝 Diplomacy: ${currentPlayer.name} → ${targetPlayer.name} (${action})`);
        }
    });
    
    // Handle technology research
    socket.on('techResearch', (data) => {
        if (!currentPlayer) return;
        
        const { techId, cost } = data;
        
        // Validate and process research (simplified)
        if (currentPlayer.resources.science >= cost) {
            currentPlayer.resources.science -= cost;
            currentPlayer.technologies.add(techId);
            
            socket.emit('techResearchComplete', {
                techId: techId,
                player: currentPlayer
            });
            
            console.log(`🔬 Tech researched: ${currentPlayer.name} → ${techId}`);
        }
    });
    
    // Handle building construction
    socket.on('buildStructure', (data) => {
        if (!currentPlayer) return;
        
        const { buildingType, cost } = data;
        
        // Validate resources (simplified)
        let canAfford = true;
        Object.keys(cost).forEach(resource => {
            if (currentPlayer.resources[resource] < cost[resource]) {
                canAfford = false;
            }
        });
        
        if (canAfford) {
            // Deduct resources
            Object.keys(cost).forEach(resource => {
                currentPlayer.resources[resource] -= cost[resource];
            });
            
            // Add building
            const buildingNames = {
                factory: 'factories',
                lab: 'labs',
                barracks: 'barracks'
            };
            
            if (buildingNames[buildingType]) {
                currentPlayer.buildings[buildingNames[buildingType]]++;
            }
            
            socket.emit('buildingComplete', {
                buildingType: buildingType,
                player: currentPlayer
            });
            
            console.log(`🏗️ Building built: ${currentPlayer.name} → ${buildingType}`);
        }
    });
    
    // Handle disconnection
    socket.on('disconnect', () => {
        if (currentPlayer && currentRoom) {
            // Remove player from room
            currentRoom.players.delete(currentPlayer.id);
            gameState.players.delete(currentPlayer.id);
            
            // Notify other players
            socket.to(currentRoom.id).emit('playerLeft', currentPlayer.id);
            
            // Clean up empty rooms
            if (currentRoom.players.size === 0) {
                gameState.gameRooms.delete(currentRoom.id);
            }
            
            console.log(`🚪 Player disconnected: ${currentPlayer.name}`);
        }
        
        updateGlobalStats();
    });
});

// ==========================================
//   HELPER FUNCTIONS
// ==========================================

function generatePlayerId() {
    return 'player_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

function generateRoomId() {
    return 'room_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
}

function createPlayer(id, name, country) {
    return {
        id: id,
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
}

function createNewRoom() {
    const room = {
        id: generateRoomId(),
        players: new Map(),
        createdAt: Date.now(),
        status: 'active',
        maxPlayers: 20
    };
    
    gameState.gameRooms.set(room.id, room);
    return room;
}

function findAvailableRoom() {
    for (let room of gameState.gameRooms.values()) {
        if (room.players.size < room.maxPlayers && room.status === 'active') {
            return room;
        }
    }
    return null;
}

function updateGlobalStats() {
    gameState.globalStats = {
        totalPlayers: gameState.players.size,
        activeGames: gameState.gameRooms.size,
        totalGames: gameState.globalStats.totalGames + 1
    };
}

// ==========================================
//   GAME LOOP & BACKGROUND PROCESSES
// ==========================================

// Resource generation for all players
function processResourceGeneration() {
    gameState.players.forEach(player => {
        // Base resource generation
        const goldGain = player.buildings.factories * 20;
        const productionGain = player.buildings.factories * 5;
        const scienceGain = player.buildings.labs * 8;
        const militaryGain = player.buildings.barracks * 3;

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
    });
}

// Clean up inactive rooms and players
function cleanupInactiveData() {
    const now = Date.now();
    const INACTIVE_THRESHOLD = 30 * 60 * 1000; // 30 minutes
    
    // Clean up inactive players
    gameState.players.forEach((player, playerId) => {
        if (now - player.joinedAt > INACTIVE_THRESHOLD) {
            gameState.players.delete(playerId);
        }
    });
    
    // Clean up empty rooms
    gameState.gameRooms.forEach((room, roomId) => {
        if (room.players.size === 0) {
            gameState.gameRooms.delete(roomId);
        }
    });
}

// Start background processes
setInterval(processResourceGeneration, 5000); // Every 5 seconds
setInterval(cleanupInactiveData, 300000); // Every 5 minutes
setInterval(() => {
    console.log(`📊 Stats - Players: ${gameState.players.size}, Rooms: ${gameState.gameRooms.size}`);
}, 60000); // Every minute

// ==========================================
//   SERVER STARTUP
// ==========================================

server.listen(PORT, () => {
    console.log('🌍 =============================================');
    console.log('🌍      WORLD DOMINION SERVER STARTED');
    console.log('🌍 =============================================');
    console.log(`🌍 Environment: ${NODE_ENV}`);
    console.log(`🌍 Port: ${PORT}`);
    console.log(`🌍 Game URL: http://localhost:${PORT}`);
    console.log('🌍 =============================================');
    console.log('🌍 Ready for world domination! 🚀');
    console.log('');
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down World Dominion server...');
    
    // Notify all connected players
    io.emit('serverShutdown', {
        message: 'Sunucu kapatılıyor. Oyun durumunuz kaydedilecek.',
        countdown: 10
    });
    
    // Give time for clients to save
    setTimeout(() => {
        server.close(() => {
            console.log('✅ World Dominion server shut down gracefully');
            process.exit(0);
        });
    }, 10000);
});

module.exports = server;
