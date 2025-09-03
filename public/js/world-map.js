// ==========================================
//   WORLD DOMINION - WORLD MAP SYSTEM
// ==========================================

class WorldMap {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.isDragging = false;
        this.lastMouseX = 0;
        this.lastMouseY = 0;
        this.offsetX = 0;
        this.offsetY = 0;
        this.scale = 1;
        this.minScale = 0.5;
        this.maxScale = 3;
        
        // World data
        this.countries = new Map();
        this.territories = [];
        this.animationFrame = null;
        
        this.setupEventListeners();
        this.initializeCountries();
    }

    // ==========================================
    //   INITIALIZATION
    // ==========================================

    initialize() {
        this.resizeCanvas();
        this.setupMapControls();
        this.startAnimation();
        console.log('World Map initialized');
    }

    resizeCanvas() {
        const container = this.canvas.parentElement;
        this.canvas.width = container.offsetWidth;
        this.canvas.height = container.offsetHeight;
        this.centerMap();
    }

    centerMap() {
        this.offsetX = 0;
        this.offsetY = 0;
        this.scale = 1;
    }

    initializeCountries() {
        // Define major countries with their positions and territories
        const countryData = [
            {
                id: 'turkey',
                name: 'Türkiye',
                flag: '🇹🇷',
                color: '#E74C3C',
                territories: [
                    { x: 520, y: 200, radius: 40, name: 'Ankara' },
                    { x: 540, y: 220, radius: 35, name: 'İstanbul' },
                    { x: 580, y: 230, radius: 25, name: 'İzmir' }
                ]
            },
            {
                id: 'usa',
                name: 'Amerika',
                flag: '🇺🇸',
                color: '#3498DB',
                territories: [
                    { x: 200, y: 150, radius: 50, name: 'Washington' },
                    { x: 180, y: 180, radius: 45, name: 'New York' },
                    { x: 150, y: 220, radius: 40, name: 'Los Angeles' }
                ]
            },
            {
                id: 'russia',
                name: 'Rusya',
                flag: '🇷🇺',
                color: '#9B59B6',
                territories: [
                    { x: 600, y: 100, radius: 60, name: 'Moskova' },
                    { x: 700, y: 120, radius: 45, name: 'St. Petersburg' },
                    { x: 800, y: 140, radius: 35, name: 'Vladivostok' }
                ]
            },
            {
                id: 'china',
                name: 'Çin',
                flag: '🇨🇳',
                color: '#F39C12',
                territories: [
                    { x: 750, y: 200, radius: 55, name: 'Pekin' },
                    { x: 720, y: 250, radius: 40, name: 'Şangay' },
                    { x: 680, y: 280, radius: 30, name: 'Guangzhou' }
                ]
            },
            {
                id: 'germany',
                name: 'Almanya',
                flag: '🇩🇪',
                color: '#2ECC71',
                territories: [
                    { x: 480, y: 150, radius: 35, name: 'Berlin' },
                    { x: 460, y: 170, radius: 30, name: 'Hamburg' },
                    { x: 500, y: 180, radius: 28, name: 'Munich' }
                ]
            },
            {
                id: 'france',
                name: 'Fransa',
                flag: '🇫🇷',
                color: '#E67E22',
                territories: [
                    { x: 440, y: 170, radius: 35, name: 'Paris' },
                    { x: 420, y: 200, radius: 25, name: 'Lyon' },
                    { x: 460, y: 220, radius: 20, name: 'Marseille' }
                ]
            },
            {
                id: 'uk',
                name: 'İngiltere',
                flag: '🇬🇧',
                color: '#1ABC9C',
                territories: [
                    { x: 420, y: 140, radius: 30, name: 'Londra' },
                    { x: 400, y: 120, radius: 20, name: 'Edinburgh' }
                ]
            },
            {
                id: 'japan',
                name: 'Japonya',
                flag: '🇯🇵',
                color: '#E91E63',
                territories: [
                    { x: 900, y: 200, radius: 35, name: 'Tokyo' },
                    { x: 880, y: 230, radius: 25, name: 'Osaka' }
                ]
            },
            {
                id: 'india',
                name: 'Hindistan',
                flag: '🇮🇳',
                color: '#FF5722',
                territories: [
                    { x: 650, y: 250, radius: 45, name: 'Yeni Delhi' },
                    { x: 680, y: 300, radius: 35, name: 'Mumbai' },
                    { x: 620, y: 320, radius: 30, name: 'Bangalore' }
                ]
            },
            {
                id: 'brazil',
                name: 'Brezilya',
                flag: '🇧🇷',
                color: '#4CAF50',
                territories: [
                    { x: 300, y: 350, radius: 40, name: 'Brasília' },
                    { x: 320, y: 380, radius: 35, name: 'Rio de Janeiro' },
                    { x: 280, y: 400, radius: 30, name: 'São Paulo' }
                ]
            }
        ];

        countryData.forEach(country => {
            this.countries.set(country.id, {
                ...country,
                owner: null,
                influence: 0,
                lastUpdate: Date.now()
            });
        });
    }

    setupEventListeners() {
        // Mouse events for panning
        this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('mouseup', () => this.handleMouseUp());
        this.canvas.addEventListener('mouseleave', () => this.handleMouseUp());
        
        // Wheel event for zooming
        this.canvas.addEventListener('wheel', (e) => this.handleWheel(e));
        
        // Touch events for mobile
        this.canvas.addEventListener('touchstart', (e) => this.handleTouchStart(e));
        this.canvas.addEventListener('touchmove', (e) => this.handleTouchMove(e));
        this.canvas.addEventListener('touchend', () => this.handleTouchEnd());
        
        // Window resize
        window.addEventListener('resize', () => this.resizeCanvas());
    }

    setupMapControls() {
        // Zoom controls
        document.getElementById('zoom-in')?.addEventListener('click', () => this.zoomIn());
        document.getElementById('zoom-out')?.addEventListener('click', () => this.zoomOut());
        document.getElementById('reset-view')?.addEventListener('click', () => this.resetView());
    }

    // ==========================================
    //   EVENT HANDLERS
    // ==========================================

    handleMouseDown(e) {
        this.isDragging = true;
        const rect = this.canvas.getBoundingClientRect();
        this.lastMouseX = e.clientX - rect.left;
        this.lastMouseY = e.clientY - rect.top;
        this.canvas.style.cursor = 'grabbing';
    }

    handleMouseMove(e) {
        const rect = this.canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        if (this.isDragging) {
            const deltaX = mouseX - this.lastMouseX;
            const deltaY = mouseY - this.lastMouseY;
            
            this.offsetX += deltaX;
            this.offsetY += deltaY;
            
            this.lastMouseX = mouseX;
            this.lastMouseY = mouseY;
        } else {
            // Check hover over territories
            this.checkHover(mouseX, mouseY);
        }
    }

    handleMouseUp() {
        this.isDragging = false;
        this.canvas.style.cursor = 'grab';
    }

    handleWheel(e) {
        e.preventDefault();
        
        const rect = this.canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        const wheel = e.deltaY < 0 ? 1 : -1;
        const zoom = Math.exp(wheel * 0.1);
        
        const newScale = this.scale * zoom;
        if (newScale >= this.minScale && newScale <= this.maxScale) {
            // Zoom toward mouse position
            this.offsetX = mouseX - (mouseX - this.offsetX) * zoom;
            this.offsetY = mouseY - (mouseY - this.offsetY) * zoom;
            this.scale = newScale;
        }
    }

    handleTouchStart(e) {
        if (e.touches.length === 1) {
            const touch = e.touches[0];
            const rect = this.canvas.getBoundingClientRect();
            this.lastMouseX = touch.clientX - rect.left;
            this.lastMouseY = touch.clientY - rect.top;
            this.isDragging = true;
        }
        e.preventDefault();
    }

    handleTouchMove(e) {
        if (e.touches.length === 1 && this.isDragging) {
            const touch = e.touches[0];
            const rect = this.canvas.getBoundingClientRect();
            const touchX = touch.clientX - rect.left;
            const touchY = touch.clientY - rect.top;
            
            const deltaX = touchX - this.lastMouseX;
            const deltaY = touchY - this.lastMouseY;
            
            this.offsetX += deltaX;
            this.offsetY += deltaY;
            
            this.lastMouseX = touchX;
            this.lastMouseY = touchY;
        }
        e.preventDefault();
    }

    handleTouchEnd() {
        this.isDragging = false;
    }

    checkHover(mouseX, mouseY) {
        // Convert screen coordinates to world coordinates
        const worldX = (mouseX - this.offsetX) / this.scale;
        const worldY = (mouseY - this.offsetY) / this.scale;
        
        let hovered = false;
        
        this.countries.forEach(country => {
            country.territories.forEach(territory => {
                const distance = Math.sqrt(
                    Math.pow(worldX - territory.x, 2) + Math.pow(worldY - territory.y, 2)
                );
                
                if (distance < territory.radius) {
                    this.canvas.style.cursor = 'pointer';
                    this.showTerritoryTooltip(territory, country, mouseX, mouseY);
                    hovered = true;
                }
            });
        });
        
        if (!hovered) {
            this.canvas.style.cursor = 'grab';
            this.hideTooltip();
        }
    }

    // ==========================================
    //   MAP CONTROLS
    // ==========================================

    zoomIn() {
        const newScale = Math.min(this.scale * 1.2, this.maxScale);
        this.scale = newScale;
    }

    zoomOut() {
        const newScale = Math.max(this.scale / 1.2, this.minScale);
        this.scale = newScale;
    }

    resetView() {
        this.centerMap();
    }

    // ==========================================
    //   RENDERING
    // ==========================================

    startAnimation() {
        const animate = () => {
            this.render();
            this.animationFrame = requestAnimationFrame(animate);
        };
        animate();
    }

    render() {
        // Clear canvas
        this.ctx.fillStyle = '#0a0e27';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Save transformation state
        this.ctx.save();
        
        // Apply transformations
        this.ctx.translate(this.offsetX, this.offsetY);
        this.ctx.scale(this.scale, this.scale);
        
        // Draw star field background
        this.drawStars();
        
        // Draw continental outlines
        this.drawContinents();
        
        // Draw countries and territories
        this.drawCountries();
        
        // Draw connections/trade routes
        this.drawConnections();
        
        // Draw effects and animations
        this.drawEffects();
        
        // Restore transformation state
        this.ctx.restore();
        
        // Draw UI elements (unaffected by transformations)
        this.drawUI();
    }

    drawStars() {
        // Draw animated star field
        const time = Date.now() * 0.001;
        
        for (let i = 0; i < 100; i++) {
            const x = (i * 123.456) % this.canvas.width;
            const y = (i * 789.012) % this.canvas.height;
            const alpha = (Math.sin(time + i) + 1) * 0.5;
            
            this.ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.3})`;
            this.ctx.fillRect(x, y, 1, 1);
        }
    }

    drawContinents() {
        // Draw simplified continental boundaries
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([5, 5]);
        
        // Europe outline
        this.ctx.beginPath();
        this.ctx.moveTo(400, 100);
        this.ctx.lineTo(600, 100);
        this.ctx.lineTo(620, 250);
        this.ctx.lineTo(400, 250);
        this.ctx.closePath();
        this.ctx.stroke();
        
        // Asia outline
        this.ctx.beginPath();
        this.ctx.moveTo(600, 80);
        this.ctx.lineTo(950, 80);
        this.ctx.lineTo(950, 350);
        this.ctx.lineTo(600, 350);
        this.ctx.closePath();
        this.ctx.stroke();
        
        // North America outline
        this.ctx.beginPath();
        this.ctx.moveTo(100, 100);
        this.ctx.lineTo(350, 100);
        this.ctx.lineTo(350, 300);
        this.ctx.lineTo(100, 300);
        this.ctx.closePath();
        this.ctx.stroke();
        
        // South America outline
        this.ctx.beginPath();
        this.ctx.moveTo(250, 300);
        this.ctx.lineTo(400, 300);
        this.ctx.lineTo(400, 500);
        this.ctx.lineTo(250, 500);
        this.ctx.closePath();
        this.ctx.stroke();
        
        this.ctx.setLineDash([]);
    }

    drawCountries() {
        this.countries.forEach((country, countryId) => {
            country.territories.forEach((territory, index) => {
                // Draw territory circle
                const gradient = this.ctx.createRadialGradient(
                    territory.x, territory.y, 0,
                    territory.x, territory.y, territory.radius
                );
                
                gradient.addColorStop(0, country.color + '80');
                gradient.addColorStop(0.7, country.color + '40');
                gradient.addColorStop(1, country.color + '10');
                
                this.ctx.fillStyle = gradient;
                this.ctx.beginPath();
                this.ctx.arc(territory.x, territory.y, territory.radius, 0, Math.PI * 2);
                this.ctx.fill();
                
                // Draw border
                this.ctx.strokeStyle = country.color;
                this.ctx.lineWidth = 2;
                this.ctx.stroke();
                
                // Draw country flag if it's the capital (first territory)
                if (index === 0) {
                    this.ctx.font = '24px Arial';
                    this.ctx.textAlign = 'center';
                    this.ctx.fillStyle = '#fff';
                    this.ctx.fillText(
                        country.flag, 
                        territory.x, 
                        territory.y + 8
                    );
                    
                    // Draw country name
                    this.ctx.font = 'bold 14px Arial';
                    this.ctx.fillStyle = '#fff';
                    this.ctx.strokeStyle = '#000';
                    this.ctx.lineWidth = 2;
                    this.ctx.strokeText(
                        country.name, 
                        territory.x, 
                        territory.y - territory.radius - 10
                    );
                    this.ctx.fillText(
                        country.name, 
                        territory.x, 
                        territory.y - territory.radius - 10
                    );
                }
                
                // Draw territory name for smaller cities
                if (index > 0) {
                    this.ctx.font = '10px Arial';
                    this.ctx.fillStyle = '#ccc';
                    this.ctx.textAlign = 'center';
                    this.ctx.fillText(
                        territory.name, 
                        territory.x, 
                        territory.y - territory.radius - 5
                    );
                }
            });
        });
    }

    drawConnections() {
        // Draw trade routes and diplomatic connections
        const time = Date.now() * 0.002;
        
        this.ctx.strokeStyle = `rgba(255, 215, 0, ${0.3 + Math.sin(time) * 0.2})`;
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([10, 5]);
        
        // Example connections (these would be dynamic based on game state)
        const connections = [
            { from: { x: 520, y: 200 }, to: { x: 480, y: 150 } }, // Turkey-Germany
            { from: { x: 200, y: 150 }, to: { x: 420, y: 140 } }, // USA-UK
            { from: { x: 750, y: 200 }, to: { x: 600, y: 100 } }, // China-Russia
        ];
        
        connections.forEach(connection => {
            this.ctx.beginPath();
            this.ctx.moveTo(connection.from.x, connection.from.y);
            this.ctx.lineTo(connection.to.x, connection.to.y);
            this.ctx.stroke();
        });
        
        this.ctx.setLineDash([]);
    }

    drawEffects() {
        const time = Date.now() * 0.001;
        
        // Draw pulsing effect on active territories
        this.countries.forEach((country, countryId) => {
            if (window.gameEngine?.gameState?.currentPlayer?.country === countryId) {
                country.territories.forEach(territory => {
                    const pulse = Math.sin(time * 3) * 0.5 + 0.5;
                    
                    this.ctx.strokeStyle = `rgba(255, 215, 0, ${pulse})`;
                    this.ctx.lineWidth = 4;
                    this.ctx.beginPath();
                    this.ctx.arc(
                        territory.x, 
                        territory.y, 
                        territory.radius + 10, 
                        0, 
                        Math.PI * 2
                    );
                    this.ctx.stroke();
                });
            }
        });
    }

    drawUI() {
        // Draw mini-map in corner
        this.drawMiniMap();
        
        // Draw scale indicator
        this.drawScaleIndicator();
    }

    drawMiniMap() {
        const miniMapSize = 150;
        const miniMapX = this.canvas.width - miniMapSize - 20;
        const miniMapY = 20;
        
        // Mini-map background
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(miniMapX, miniMapY, miniMapSize, miniMapSize);
        this.ctx.strokeStyle = 'rgba(255, 215, 0, 0.5)';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(miniMapX, miniMapY, miniMapSize, miniMapSize);
        
        // Draw simplified world view
        this.ctx.save();
        this.ctx.translate(miniMapX, miniMapY);
        this.ctx.scale(0.15, 0.15);
        
        this.countries.forEach((country) => {
            country.territories.forEach((territory) => {
                this.ctx.fillStyle = country.color + '80';
                this.ctx.beginPath();
                this.ctx.arc(territory.x, territory.y, territory.radius, 0, Math.PI * 2);
                this.ctx.fill();
            });
        });
        
        this.ctx.restore();
        
        // Draw viewport indicator
        const viewportX = miniMapX - (this.offsetX * 0.15);
        const viewportY = miniMapY - (this.offsetY * 0.15);
        const viewportW = this.canvas.width * 0.15 / this.scale;
        const viewportH = this.canvas.height * 0.15 / this.scale;
        
        this.ctx.strokeStyle = '#fff';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(viewportX, viewportY, viewportW, viewportH);
    }

    drawScaleIndicator() {
        const scaleText = `Zoom: ${Math.round(this.scale * 100)}%`;
        this.ctx.font = '12px Arial';
        this.ctx.fillStyle = '#fff';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(scaleText, 20, this.canvas.height - 20);
    }

    // ==========================================
    //   TOOLTIP SYSTEM
    // ==========================================

    showTerritoryTooltip(territory, country, x, y) {
        // Remove existing tooltip
        this.hideTooltip();
        
        const tooltip = document.createElement('div');
        tooltip.id = 'map-tooltip';
        tooltip.className = 'map-tooltip';
        tooltip.innerHTML = `
            <div class="tooltip-header">
                ${country.flag} <strong>${territory.name}</strong>
            </div>
            <div class="tooltip-content">
                <div>Ülke: ${country.name}</div>
                <div>Nüfus: ${(territory.radius * 100000).toLocaleString()}</div>
                <div>Etki: ${country.influence}%</div>
            </div>
        `;
        
        tooltip.style.cssText = `
            position: absolute;
            left: ${x + 10}px;
            top: ${y - 10}px;
            background: rgba(0, 0, 0, 0.9);
            color: white;
            padding: 10px;
            border-radius: 5px;
            border: 1px solid rgba(255, 215, 0, 0.5);
            font-size: 12px;
            z-index: 1000;
            pointer-events: none;
            backdrop-filter: blur(10px);
        `;
        
        document.body.appendChild(tooltip);
    }

    hideTooltip() {
        const existingTooltip = document.getElementById('map-tooltip');
        if (existingTooltip) {
            existingTooltip.remove();
        }
    }

    // ==========================================
    //   GAME INTEGRATION
    // ==========================================

    updateCountryOwnership(countryId, playerId) {
        const country = this.countries.get(countryId);
        if (country) {
            country.owner = playerId;
            country.lastUpdate = Date.now();
        }
    }

    updateCountryInfluence(countryId, influence) {
        const country = this.countries.get(countryId);
        if (country) {
            country.influence = Math.max(0, Math.min(100, influence));
        }
    }

    highlightCountry(countryId) {
        // This could be used to highlight a specific country
        // Implementation depends on specific game requirements
    }

    // ==========================================
    //   CLEANUP
    // ==========================================

    destroy() {
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
        }
        this.hideTooltip();
        
        // Remove event listeners
        this.canvas.removeEventListener('mousedown', this.handleMouseDown);
        this.canvas.removeEventListener('mousemove', this.handleMouseMove);
        this.canvas.removeEventListener('mouseup', this.handleMouseUp);
        this.canvas.removeEventListener('wheel', this.handleWheel);
        
        window.removeEventListener('resize', this.resizeCanvas);
    }
}

// Make WorldMap globally accessible
window.WorldMap = WorldMap;
