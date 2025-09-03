#!/usr/bin/env node

// ==========================================
//   WORLD DOMINION - DEPLOYMENT SCRIPT
// ==========================================

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 ===============================================');
console.log('🚀       WORLD DOMINION DEPLOYMENT');
console.log('🚀 ===============================================');

// Check Node.js version
const nodeVersion = process.version;
console.log(`📋 Node.js Version: ${nodeVersion}`);

if (parseInt(nodeVersion.slice(1)) < 14) {
    console.error('❌ Node.js 14.0.0 or higher required');
    process.exit(1);
}

// Create deployment directories
const deployDirs = [
    'dist',
    'dist/public',
    'dist/server',
    'logs'
];

deployDirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`📁 Created directory: ${dir}`);
    }
});

// Copy files for production
console.log('📄 Copying files...');

// Copy public files
execSync('xcopy /E /I /Y public dist\\public', { stdio: 'inherit' });

// Copy server files
execSync('copy server\\server.js dist\\server\\', { stdio: 'inherit' });

// Copy package files
execSync('copy package.json dist\\', { stdio: 'inherit' });
execSync('copy README.md dist\\', { stdio: 'inherit' });

// Create production environment file
const envContent = `NODE_ENV=production
PORT=3000
MAX_PLAYERS=100
TICK_RATE=5000
SESSION_SECRET=your-secure-session-secret-here
CORS_ORIGIN=https://yourdomain.com
`;

fs.writeFileSync('dist/.env', envContent);
console.log('📄 Created .env file');

// Create production package.json
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
packageJson.scripts = {
    "start": "node server/server.js",
    "dev": "nodemon server/server.js",
    "pm2:start": "pm2 start ecosystem.config.js",
    "pm2:stop": "pm2 stop world-dominion",
    "pm2:restart": "pm2 restart world-dominion",
    "pm2:logs": "pm2 logs world-dominion"
};

fs.writeFileSync('dist/package.json', JSON.stringify(packageJson, null, 2));
console.log('📄 Updated package.json for production');

// Create PM2 ecosystem file for production deployment
const pm2Config = {
    apps: [{
        name: 'world-dominion',
        script: 'server/server.js',
        instances: 'max',
        exec_mode: 'cluster',
        env: {
            NODE_ENV: 'development',
            PORT: 3000
        },
        env_production: {
            NODE_ENV: 'production',
            PORT: process.env.PORT || 3000
        },
        error_file: './logs/err.log',
        out_file: './logs/out.log',
        log_file: './logs/combined.log',
        time: true,
        max_memory_restart: '1G',
        node_args: '--max-old-space-size=4096'
    }]
};

fs.writeFileSync('dist/ecosystem.config.js', `module.exports = ${JSON.stringify(pm2Config, null, 2)};`);
console.log('📄 Created PM2 ecosystem config');

// Create Docker files for containerization
const dockerfile = `FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application code
COPY . .

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# Change ownership
RUN chown -R nodejs:nodejs /app
USER nodejs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \\
    CMD node -e "require('http').get('http://localhost:3000/api/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) }).on('error', () => process.exit(1))"

# Start application
CMD ["npm", "start"]
`;

fs.writeFileSync('dist/Dockerfile', dockerfile);
console.log('📄 Created Dockerfile');

// Create docker-compose.yml
const dockerCompose = `version: '3.8'

services:
  world-dominion:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - PORT=3000
    restart: unless-stopped
    volumes:
      - ./logs:/app/logs
    networks:
      - world-dominion-network

  # Redis for scaling (optional)
  redis:
    image: redis:7-alpine
    restart: unless-stopped
    networks:
      - world-dominion-network
    volumes:
      - redis-data:/data

networks:
  world-dominion-network:
    driver: bridge

volumes:
  redis-data:
`;

fs.writeFileSync('dist/docker-compose.yml', dockerCompose);
console.log('📄 Created docker-compose.yml');

// Create nginx config for reverse proxy
const nginxConfig = `server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    
    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;
    
    # SSL Configuration (add your SSL certificates)
    # ssl_certificate /path/to/cert.pem;
    # ssl_certificate_key /path/to/private.key;
    
    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    
    # Gzip compression
    gzip on;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    # WebSocket support for Socket.io
    location /socket.io/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Static files caching
    location ~* \\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2)$ {
        proxy_pass http://localhost:3000;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
`;

fs.writeFileSync('dist/nginx.conf', nginxConfig);
console.log('📄 Created nginx configuration');

// Create deployment guide
const deployGuide = `# 🚀 World Dominion Deployment Guide

## 📋 Quick Start

### Local Development
\`\`\`bash
npm install
npm start
# Visit: http://localhost:3000
\`\`\`

### Production Deployment

#### Option 1: Direct Node.js
\`\`\`bash
# Install dependencies
npm ci --only=production

# Set environment
export NODE_ENV=production
export PORT=3000

# Start server
npm start
\`\`\`

#### Option 2: PM2 (Recommended)
\`\`\`bash
# Install PM2 globally
npm install -g pm2

# Start with PM2
npm run pm2:start

# Monitor
pm2 monit

# View logs
npm run pm2:logs
\`\`\`

#### Option 3: Docker
\`\`\`bash
# Build image
docker build -t world-dominion .

# Run container
docker run -p 3000:3000 world-dominion

# Or use docker-compose
docker-compose up -d
\`\`\`

## 🌐 Production Checklist

- [ ] Configure SSL certificates
- [ ] Set up domain name
- [ ] Configure nginx reverse proxy
- [ ] Set strong session secrets
- [ ] Configure rate limiting
- [ ] Set up monitoring (PM2/Docker)
- [ ] Configure backups
- [ ] Set up CI/CD pipeline
- [ ] Configure CDN for static assets
- [ ] Set up database (Redis/MongoDB)

## 🔧 Environment Variables

\`\`\`env
NODE_ENV=production
PORT=3000
MAX_PLAYERS=100
TICK_RATE=5000
SESSION_SECRET=your-super-secure-secret
CORS_ORIGIN=https://yourdomain.com
REDIS_URL=redis://localhost:6379
DATABASE_URL=mongodb://localhost:27017/worlddominion
\`\`\`

## 📈 Scaling

For high traffic, consider:
- Load balancer (nginx/HAProxy)
- Redis for session storage
- MongoDB for persistent data
- CDN for static assets
- Multiple server instances

## 🔐 Security

- Regular security updates
- Rate limiting
- Input validation
- HTTPS only in production
- Secure session management
- Regular backups
`;

fs.writeFileSync('dist/DEPLOYMENT.md', deployGuide);
console.log('📄 Created deployment guide');

console.log('');
console.log('✅ ===============================================');
console.log('✅       DEPLOYMENT READY!');
console.log('✅ ===============================================');
console.log('✅ All files prepared in dist/ directory');
console.log('✅ Production configurations created');
console.log('✅ Docker support added');
console.log('✅ PM2 support added');
console.log('✅ Nginx configuration ready');
console.log('✅ Security enhancements applied');
console.log('');
console.log('🎯 Next steps:');
console.log('   1. Test locally: npm start');
console.log('   2. Deploy to production server');
console.log('   3. Configure domain and SSL');
console.log('   4. Set up monitoring');
console.log('');
