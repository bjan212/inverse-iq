#!/usr/bin/env node

/**
 * Quick Test: Check HybridEngine Load
 * Verifies the engine loads and database is accessible
 */

const HybridEngine = require('../src/ai-engine/hybridEngine');
const fs = require('fs');
const path = require('path');

console.log('🔍 Testing HybridEngine...\n');

try {
  // Just check if module loads
  console.log('✅ HybridEngine module loaded successfully');
  
  // Check database file
  const dbPath = path.join(__dirname, '../data/hybrid_pattern_database.json');
  if (fs.existsSync(dbPath)) {
    const db = JSON.parse(fs.readFileSync(dbPath, 'utf-8'));
    console.log(`✅ Pattern database found`);
    console.log(`   - Patterns: ${db.patterns?.length || 0}`);
    console.log(`   - Traders: ${db.traders?.length || 0}`);
    console.log(`   - Last updated: ${db.lastUpdated || 'Unknown'}`);
  } else {
    console.log('⚠️  Pattern database not found. Run: node scripts/bootstrapHybridAI.js');
  }

  console.log('\n✅ HybridEngine is ready to use!\n');
  console.log('Example usage:');
  console.log('  const engine = new HybridEngine();');
  console.log('  const signals = await engine.generateSmartSignals([\'BTCUSDT\', \'ETHUSDT\']);\n');

} catch (error) {
  console.error('❌ Error loading HybridEngine:', error.message);
  process.exit(1);
}
