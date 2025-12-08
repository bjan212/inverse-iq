#!/usr/bin/env node

/**
 * InverseIQ Production Startup Script
 * 
 * This script helps you start the InverseIQ platform in production mode.
 * It performs pre-flight checks and starts all necessary services.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('\n╔════════════════════════════════════════════════════════════╗');
console.log('║         InverseIQ Production Startup                      ║');
console.log('╚════════════════════════════════════════════════════════════╝\n');

// Configuration
const config = {
  nodeVersion: '16.0.0',
  requiredDirs: ['data', 'data/submissions', 'data/public', 'output', 'signals'],
  requiredFiles: ['server.js', 'package.json'],
  port: process.env.PORT || 3000
};

// Step 1: Pre-flight Checks
console.log('📋 Step 1: Pre-flight Checks\n');

// Check Node.js version
console.log('   Checking Node.js version...');
const nodeVersion = process.version;
console.log(`   ✓ Node.js ${nodeVersion} detected`);

if (nodeVersion < `v${config.nodeVersion}`) {
  console.error(`   ✗ Node.js ${config.nodeVersion} or higher required`);
  process.exit(1);
}

// Check required directories
console.log('\n   Checking required directories...');
config.requiredDirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    console.log(`   → Creating ${dir}/`);
    fs.mkdirSync(dir, { recursive: true });
  } else {
    console.log(`   ✓ ${dir}/ exists`);
  }
});

// Check required files
console.log('\n   Checking required files...');
config.requiredFiles.forEach(file => {
  if (!fs.existsSync(file)) {
    console.error(`   ✗ Missing required file: ${file}`);
    process.exit(1);
  } else {
    console.log(`   ✓ ${file} exists`);
  }
});

// Check dependencies
console.log('\n   Checking dependencies...');
if (!fs.existsSync('node_modules')) {
  console.log('   → Installing dependencies...');
  try {
    execSync('npm install --production', { stdio: 'inherit' });
    console.log('   ✓ Dependencies installed');
  } catch (error) {
    console.error('   ✗ Failed to install dependencies');
    process.exit(1);
  }
} else {
  console.log('   ✓ Dependencies installed');
}

// Step 2: Environment Setup
console.log('\n📋 Step 2: Environment Setup\n');

// Check for .env file
if (!fs.existsSync('.env')) {
  console.log('   → Creating .env file...');
  const envContent = `# InverseIQ Environment Configuration
NODE_ENV=production
PORT=${config.port}
DATA_DIR=./data
LOG_LEVEL=info

# Add your configuration here
# MONGODB_URI=mongodb://localhost:27017/inverseiq
# JWT_SECRET=your_random_secret_here
`;
  fs.writeFileSync('.env', envContent);
  console.log('   ✓ .env file created');
  console.log('   ⚠️  Please edit .env file with your configuration');
} else {
  console.log('   ✓ .env file exists');
}

// Step 3: Database Check
console.log('\n📋 Step 3: Database Check\n');

const dbPath = './data/hybrid_pattern_database.json';
if (!fs.existsSync(dbPath)) {
  console.log('   ⚠️  Pattern database not found');
  console.log('   → You should run: node scripts/bootstrapHybridAI.js');
  console.log('   → This will collect public data and create initial patterns');
} else {
  console.log('   ✓ Pattern database exists');
  const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
  console.log(`   → Total patterns: ${db.totalPatterns || 0}`);
  console.log(`   → Total traders: ${db.totalTraders || 0}`);
}

// Step 4: Port Check
console.log('\n📋 Step 4: Port Availability\n');

const net = require('net');
const server = net.createServer();

server.once('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.log(`   ✗ Port ${config.port} is already in use`);
    console.log(`   → Please stop the existing process or use a different port`);
    process.exit(1);
  }
});

server.once('listening', () => {
  server.close();
  console.log(`   ✓ Port ${config.port} is available`);
  
  // Step 5: Start Services
  startServices();
});

server.listen(config.port);

function startServices() {
  console.log('\n📋 Step 5: Starting Services\n');
  
  // Check if PM2 is available
  let usePM2 = false;
  try {
    execSync('pm2 --version', { stdio: 'ignore' });
    usePM2 = true;
    console.log('   ✓ PM2 detected - Using PM2 for process management');
  } catch (error) {
    console.log('   ℹ️  PM2 not found - Starting in direct mode');
    console.log('   → Install PM2 for production: npm install -g pm2');
  }
  
  if (usePM2) {
    startWithPM2();
  } else {
    startDirect();
  }
}

function startWithPM2() {
  console.log('\n   Starting services with PM2...\n');
  
  try {
    // Stop existing processes
    try {
      execSync('pm2 stop inverseiq', { stdio: 'ignore' });
      execSync('pm2 stop ai-engine', { stdio: 'ignore' });
    } catch (e) {
      // Processes might not exist yet
    }
    
    // Start web server
    console.log('   → Starting web server...');
    execSync('pm2 start server.js --name inverseiq', { stdio: 'inherit' });
    console.log('   ✓ Web server started');
    
    // Start AI engine
    console.log('\n   → Starting AI engine...');
    execSync('pm2 start scripts/runAIEngine.js --name ai-engine', { stdio: 'inherit' });
    console.log('   ✓ AI engine started');
    
    // Save PM2 configuration
    console.log('\n   → Saving PM2 configuration...');
    execSync('pm2 save', { stdio: 'inherit' });
    console.log('   ✓ PM2 configuration saved');
    
    // Show status
    console.log('\n   Current status:');
    execSync('pm2 list', { stdio: 'inherit' });
    
    showSuccessMessage(true);
    
  } catch (error) {
    console.error('\n   ✗ Failed to start services with PM2');
    console.error(error.message);
    process.exit(1);
  }
}

function startDirect() {
  console.log('\n   Starting web server in direct mode...\n');
  console.log('   ⚠️  For production, it\'s recommended to use PM2');
  console.log('   → Install: npm install -g pm2');
  console.log('   → Then run: node scripts/startProduction.js\n');
  
  showSuccessMessage(false);
  
  // Start server
  require('../server.js');
}

function showSuccessMessage(isPM2) {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║         ✅ InverseIQ Started Successfully!                 ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');
  
  console.log('🌐 Access your platform:\n');
  console.log(`   Main Page:     http://localhost:${config.port}`);
  console.log(`   Signals Page:  http://localhost:${config.port}/signals.html`);
  console.log(`   Enhanced:      http://localhost:${config.port}/signals-enhanced.html`);
  console.log(`   Admin Panel:   http://localhost:${config.port}/admin.html`);
  
  if (isPM2) {
    console.log('\n📊 Manage your services:\n');
    console.log('   View logs:     pm2 logs inverseiq');
    console.log('   Monitor:       pm2 monit');
    console.log('   Restart:       pm2 restart all');
    console.log('   Stop:          pm2 stop all');
    console.log('   Status:        pm2 list');
  }
  
  console.log('\n📋 Next steps:\n');
  
  if (!fs.existsSync('./data/hybrid_pattern_database.json')) {
    console.log('   1. Bootstrap AI with public data:');
    console.log('      node scripts/bootstrapHybridAI.js');
    console.log('');
  }
  
  console.log('   2. Collect trader data:');
  console.log('      node scripts/collect.js --platform binance --api-key KEY --api-secret SECRET');
  console.log('');
  console.log('   3. Monitor your platform:');
  console.log('      Check logs and performance regularly');
  console.log('');
  console.log('   4. Setup automated tasks:');
  console.log('      See docs/DEPLOYMENT_GUIDE.md for cron job setup');
  
  console.log('\n📚 Documentation:\n');
  console.log('   Deployment:    docs/DEPLOYMENT_GUIDE.md');
  console.log('   Hybrid AI:     docs/HYBRID_AI_GUIDE.md');
  console.log('   Architecture:  docs/PLATFORM_ARCHITECTURE.md');
  console.log('   IP Strategy:   docs/COMPETITIVE_ANALYSIS_AND_IP_STRATEGY.md');
  
  console.log('\n💡 Tips:\n');
  console.log('   • Use HTTPS in production (see deployment guide)');
  console.log('   • Setup firewall rules');
  console.log('   • Enable automated backups');
  console.log('   • Monitor server resources');
  console.log('   • Keep dependencies updated');
  
  console.log('\n🚀 InverseIQ is ready to collect data and generate signals!\n');
}
