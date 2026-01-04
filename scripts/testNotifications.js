/**
 * Test Notification System
 * 
 * This script helps test the notification system by:
 * 1. Creating a test subscriber
 * 2. Sending test notifications
 * 3. Generating a test signal
 * 4. Verifying notifications were sent
 */

const NotificationManager = require('../src/notifications/notificationManager');

async function testNotificationSystem() {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║  InverseIQ - Notification System Test                     ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  const notificationManager = new NotificationManager();

  // Step 1: Initialize
  console.log('📋 Step 1: Initializing Notification Manager...\n');
  const initialized = await notificationManager.initialize();

  if (!initialized) {
    console.log('\n⚠️  Warning: Notification services not fully configured');
    console.log('   Please check your .env file and configure at least one service\n');
    console.log('   See .env.example for configuration instructions\n');
    return;
  }

  // Step 2: Get subscriber info from user
  console.log('\n📋 Step 2: Subscriber Information\n');
  
  const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const question = (query) => new Promise((resolve) => readline.question(query, resolve));

  try {
    const email = await question('Enter your email (or press Enter to skip): ');
    const telegramChatId = await question('Enter your Telegram chat ID (or press Enter to skip): ');

    if (!email && !telegramChatId) {
      console.log('\n❌ Error: At least one contact method is required\n');
      readline.close();
      return;
    }

    // Step 3: Create subscriber
    console.log('\n📋 Step 3: Creating Test Subscriber...\n');
    
    const subscriberDB = notificationManager.getSubscriberDB();
    const subscriber = subscriberDB.addSubscriber({
      email: email || null,
      telegramChatId: telegramChatId || null,
      preferences: {
        channels: {
          email: !!email,
          telegram: !!telegramChatId
        },
        minConfidence: 70,
        symbols: ['BTCUSDT', 'ETHUSDT'],
        directions: ['LONG', 'SHORT'],
        notifyOnHighConfidence: true,
        notifyOnCombinedPatterns: true
      }
    });

    console.log('✅ Subscriber created successfully!');
    console.log(`   ID: ${subscriber.id}`);
    console.log(`   Email: ${subscriber.email || 'N/A'}`);
    console.log(`   Telegram: ${subscriber.telegramChatId || 'N/A'}\n`);

    // Step 4: Send test notification
    console.log('📋 Step 4: Sending Test Notification...\n');
    
    const testResult = await notificationManager.sendTestNotification(subscriber.id);
    
    console.log('Test Notification Results:');
    console.log(`   Channels Sent: ${testResult.channelsSent}`);
    
    if (testResult.channels.email.enabled) {
      console.log(`   Email: ${testResult.channels.email.sent ? '✅ Sent' : '❌ Failed'}`);
      if (testResult.channels.email.error) {
        console.log(`      Error: ${testResult.channels.email.error}`);
      }
    }
    
    if (testResult.channels.telegram.enabled) {
      console.log(`   Telegram: ${testResult.channels.telegram.sent ? '✅ Sent' : '❌ Failed'}`);
      if (testResult.channels.telegram.error) {
        console.log(`      Error: ${testResult.channels.telegram.error}`);
      }
    }

    // Step 5: Generate test signal
    console.log('\n📋 Step 5: Generating Test Signal...\n');
    
    const testSignal = {
      signalId: `TEST_${Date.now()}`,
      symbol: 'BTCUSDT',
      direction: 'LONG',
      confidence: 85,
      riskLevel: 'LOW',
      pattern: {
        tradersAffected: 5,
        totalOccurrences: 12,
        totalLosses: 5000,
        avgLoss: 416.67,
        originalDirection: 'SHORT'
      },
      reason: 'TEST SIGNAL: This is a test inverse signal to verify your notification system is working correctly.',
      currentConditions: {
        price: 45000,
        priceChange24h: 2.5,
        volume24h: 1000000000,
        rsi: 65,
        macd: 'BULLISH',
        marketSentiment: 'GREED',
        fearGreedIndex: 70,
        fundingRate: 0.0001
      },
      generatedAt: new Date(),
      expiresAt: new Date(Date.now() + 4 * 60 * 60 * 1000)
    };

    console.log('Test Signal Details:');
    console.log(`   Symbol: ${testSignal.symbol}`);
    console.log(`   Direction: ${testSignal.direction}`);
    console.log(`   Confidence: ${testSignal.confidence}%`);
    console.log(`   Risk: ${testSignal.riskLevel}\n`);

    // Step 6: Send signal notification
    console.log('📋 Step 6: Sending Signal Notification...\n');
    
    const signalResult = await notificationManager.notifySignal(testSignal);
    
    console.log('Signal Notification Results:');
    console.log(`   Sent: ${signalResult.sent}`);
    console.log(`   Failed: ${signalResult.failed}\n`);

    // Step 7: Show statistics
    console.log('📋 Step 7: Notification Statistics\n');
    
    const stats = notificationManager.getStatistics();
    
    console.log('Overall Statistics:');
    console.log(`   Total Sent: ${stats.totalSent}`);
    console.log(`   Email Sent: ${stats.emailSent}`);
    console.log(`   Telegram Sent: ${stats.telegramSent}`);
    console.log(`   Failed: ${stats.failed}\n`);
    
    console.log('Subscriber Statistics:');
    console.log(`   Total: ${stats.subscribers.total}`);
    console.log(`   Active: ${stats.subscribers.active}`);
    console.log(`   With Email: ${stats.subscribers.withEmail}`);
    console.log(`   With Telegram: ${stats.subscribers.withTelegram}\n`);

    // Step 8: Cleanup option
    const cleanup = await question('\nDo you want to delete the test subscriber? (y/n): ');
    
    if (cleanup.toLowerCase() === 'y') {
      subscriberDB.deleteSubscriber(subscriber.id);
      console.log('\n✅ Test subscriber deleted\n');
    } else {
      console.log(`\n✅ Test subscriber kept (ID: ${subscriber.id})`);
      console.log('   You can manage it via API endpoints\n');
    }

    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║  Test Complete!                                           ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    if (testResult.channelsSent > 0) {
      console.log('✅ SUCCESS: Notification system is working correctly!\n');
      console.log('Next steps:');
      console.log('1. Check your email/Telegram for the test notifications');
      console.log('2. Subscribe via API: POST /api/notifications/subscribe');
      console.log('3. Generate real signals: npm run bootstrap');
      console.log('4. Receive notifications automatically!\n');
    } else {
      console.log('⚠️  WARNING: No notifications were sent successfully\n');
      console.log('Please check:');
      console.log('1. Your .env configuration');
      console.log('2. SMTP credentials (for email)');
      console.log('3. Telegram bot token (for Telegram)');
      console.log('4. Server logs for error messages\n');
    }

  } catch (error) {
    console.error('\n❌ Error during test:', error.message);
    console.error(error.stack);
  } finally {
    readline.close();
  }
}

// Run the test
testNotificationSystem().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
