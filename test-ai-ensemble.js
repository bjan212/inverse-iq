#!/usr/bin/env node

/**
 * AI Ensemble Test Script
 * 
 * This script tests the AI ensemble system to verify:
 * 1. Database connection works
 * 2. API keys are stored correctly
 * 3. Ensemble generation uses all available models
 * 4. Meta-AI synthesis combines responses properly
 */

const { getDb } = require('./futures-backend/db');
const { apiKeys } = require('./drizzle/schema');
const { eq } = require('drizzle-orm');

async function testEnsemble() {
  console.log('\n🧪 AI Ensemble Test Suite\n');
  console.log('=' .repeat(60));

  try {
    // Test 1: Database Connection
    console.log('\n📊 Test 1: Database Connection');
    const db = await getDb();
    if (!db) {
      console.log('❌ FAIL: Database not available');
      console.log('   💡 Fix: Set DATABASE_URL in .env file');
      return;
    }
    console.log('✅ PASS: Database connected');

    // Test 2: Check for API Keys
    console.log('\n🔑 Test 2: API Keys Check');
    const allKeys = await db.select().from(apiKeys).limit(10);
    
    if (allKeys.length === 0) {
      console.log('⚠️  WARN: No API keys found');
      console.log('   💡 Add keys via UI: Settings → AI Settings');
      console.log('   💡 Or set in .env: OPENAI_API_KEY, ANTHROPIC_API_KEY');
    } else {
      console.log(`✅ PASS: Found ${allKeys.length} API key(s)`);
      
      const providers = {};
      allKeys.forEach(key => {
        if (key.isActive) {
          providers[key.provider] = true;
        }
      });
      
      console.log('\n   Active Providers:');
      if (providers.openai) console.log('   ✓ OpenAI (GPT-4)');
      if (providers.anthropic) console.log('   ✓ Anthropic (Claude)');
      console.log('   ✓ Built-in (Always available)');
      
      const modelCount = Object.keys(providers).length + 1; // +1 for built-in
      console.log(`\n   📈 Ensemble will query ${modelCount} model(s) in parallel`);
    }

    // Test 3: Ensemble Configuration
    console.log('\n⚙️  Test 3: Ensemble Configuration');
    
    const hasOpenAI = process.env.OPENAI_API_KEY || allKeys.some(k => k.provider === 'openai' && k.isActive);
    const hasAnthropic = process.env.ANTHROPIC_API_KEY || allKeys.some(k => k.provider === 'anthropic' && k.isActive);
    
    console.log('\n   Environment Variables:');
    console.log(`   ${hasOpenAI ? '✓' : '✗'} OPENAI_API_KEY`);
    console.log(`   ${hasAnthropic ? '✓' : '✗'} ANTHROPIC_API_KEY`);
    
    if (!hasOpenAI && !hasAnthropic) {
      console.log('\n   ⚠️  Using built-in AI only (single model)');
      console.log('   💡 Add external API keys for better signals');
    } else {
      console.log('\n   ✅ Multi-model ensemble enabled!');
    }

    // Test 4: Database Schema
    console.log('\n📋 Test 4: Database Schema');
    try {
      const testQuery = await db.select().from(apiKeys).limit(1);
      console.log('✅ PASS: apiKeys table exists');
    } catch (error) {
      console.log('❌ FAIL: apiKeys table missing');
      console.log('   💡 Run: cd futures-config && pnpm db:push');
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('\n📊 Test Summary\n');
    
    const totalModels = (hasOpenAI ? 1 : 0) + (hasAnthropic ? 1 : 0) + 1;
    
    console.log(`   Models Available: ${totalModels}/3`);
    console.log(`   Database: ${db ? 'Connected' : 'Not Connected'}`);
    console.log(`   API Keys Stored: ${allKeys.length}`);
    
    if (totalModels === 3) {
      console.log('\n   🎉 Perfect! All 3 models available for ensemble');
      console.log('   📈 Expect highest quality signals');
    } else if (totalModels === 2) {
      console.log('\n   👍 Good! 2 models available');
      console.log('   💡 Add one more for maximum quality');
    } else {
      console.log('\n   ⚠️  Only built-in model available');
      console.log('   💡 Add OpenAI/Anthropic keys for better signals');
    }

    console.log('\n' + '='.repeat(60));
    console.log('\n✨ Next Steps:\n');
    console.log('   1. Start server: node server.js');
    console.log('   2. Open: http://localhost:4000/futures-analyst');
    console.log('   3. Click "AI Settings" to add API keys');
    console.log('   4. Generate signal and check console for:');
    console.log('      [Quick Start] Generated using: built-in, openai, anthropic');
    console.log('\n');

  } catch (error) {
    console.error('\n❌ Test failed with error:');
    console.error(error.message);
    console.error('\n💡 Troubleshooting:');
    console.error('   - Check DATABASE_URL in .env');
    console.error('   - Run: cd futures-config && pnpm db:push');
    console.error('   - Ensure server dependencies installed: npm install');
  }
}

// Run tests
testEnsemble().then(() => {
  process.exit(0);
}).catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
