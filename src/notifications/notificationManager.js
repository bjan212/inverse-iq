/**
 * Notification Manager
 * 
 * Central orchestrator for all notification services.
 * Manages sending notifications through multiple channels (Email, Telegram).
 */

const EmailService = require('./emailService');
const TelegramService = require('./telegramService');
const SubscriberDB = require('../database/subscriberDB');

class NotificationManager {
  constructor() {
    this.emailService = new EmailService();
    this.telegramService = new TelegramService();
    this.subscriberDB = new SubscriberDB();
    this.initialized = false;
    this.stats = {
      totalSent: 0,
      emailSent: 0,
      telegramSent: 0,
      failed: 0
    };
  }

  /**
   * Initialize all notification services
   */
  async initialize() {
    console.log('\n🔔 Initializing Notification Manager...\n');

    try {
      // Initialize email service
      const emailReady = await this.emailService.initialize();
      
      // Initialize Telegram service
      const telegramReady = await this.telegramService.initialize();

      // Check if at least one service is ready
      if (!emailReady && !telegramReady) {
        console.warn('⚠️  No notification services are configured');
        console.warn('   Configure at least one service to enable notifications');
        this.initialized = false;
        return false;
      }

      console.log('\n✅ Notification Manager initialized');
      console.log(`   Email: ${emailReady ? 'Ready' : 'Not configured'}`);
      console.log(`   Telegram: ${telegramReady ? 'Ready' : 'Not configured'}`);
      console.log(`   Subscribers: ${this.subscriberDB.getStatistics().active}\n`);

      this.initialized = true;
      return true;
    } catch (error) {
      console.error('❌ Notification Manager initialization failed:', error.message);
      this.initialized = false;
      return false;
    }
  }

  /**
   * Check if manager is ready
   */
  isReady() {
    return this.initialized;
  }

  /**
   * Send signal notification to all interested subscribers
   */
  async notifySignal(signal) {
    if (!this.isReady()) {
      console.warn('⚠️  Notification Manager not initialized, skipping notifications');
      return {
        success: false,
        error: 'Notification Manager not initialized'
      };
    }

    try {
      console.log(`\n🔔 Sending notifications for signal: ${signal.signalId}`);
      console.log(`   Symbol: ${signal.symbol} ${signal.direction}`);
      console.log(`   Confidence: ${signal.confidence}%\n`);

      // Get interested subscribers
      const subscribers = this.subscriberDB.getInterestedSubscribers(signal);
      
      if (subscribers.length === 0) {
        console.log('   No interested subscribers found');
        return {
          success: true,
          sent: 0,
          subscribers: 0
        };
      }

      console.log(`   Found ${subscribers.length} interested subscribers\n`);

      const results = {
        success: true,
        sent: 0,
        failed: 0,
        details: []
      };

      // Send to each subscriber
      for (const subscriber of subscribers) {
        const subscriberResults = await this.sendToSubscriber(subscriber, signal);
        
        if (subscriberResults.success) {
          results.sent += subscriberResults.channelsSent;
          this.subscriberDB.recordNotification(subscriber.id);
        } else {
          results.failed++;
        }
        
        results.details.push(subscriberResults);
      }

      // Update stats
      this.stats.totalSent += results.sent;

      console.log(`\n✅ Notification batch complete:`);
      console.log(`   Sent: ${results.sent}`);
      console.log(`   Failed: ${results.failed}\n`);

      return results;
    } catch (error) {
      console.error('❌ Failed to send signal notifications:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Send notification to a single subscriber
   */
  async sendToSubscriber(subscriber, signal) {
    const result = {
      subscriberId: subscriber.id,
      success: false,
      channelsSent: 0,
      channels: {
        email: { enabled: false, sent: false, error: null },
        telegram: { enabled: false, sent: false, error: null }
      }
    };

    // Send via Email
    if (subscriber.preferences.channels.email && subscriber.email) {
      result.channels.email.enabled = true;
      
      if (this.emailService.isReady()) {
        try {
          await this.emailService.sendSignalNotification(subscriber.email, signal);
          result.channels.email.sent = true;
          result.channelsSent++;
          this.stats.emailSent++;
          console.log(`   ✅ Email sent to ${subscriber.email}`);
        } catch (error) {
          result.channels.email.error = error.message;
          this.stats.failed++;
          console.error(`   ❌ Email failed for ${subscriber.email}: ${error.message}`);
        }
      } else {
        result.channels.email.error = 'Email service not ready';
      }
    }

    // Send via Telegram
    if (subscriber.preferences.channels.telegram && subscriber.telegramChatId) {
      result.channels.telegram.enabled = true;
      
      if (this.telegramService.isReady()) {
        try {
          await this.telegramService.sendSignalNotification(subscriber.telegramChatId, signal);
          result.channels.telegram.sent = true;
          result.channelsSent++;
          this.stats.telegramSent++;
          console.log(`   ✅ Telegram sent to chat ${subscriber.telegramChatId}`);
        } catch (error) {
          result.channels.telegram.error = error.message;
          this.stats.failed++;
          console.error(`   ❌ Telegram failed for chat ${subscriber.telegramChatId}: ${error.message}`);
        }
      } else {
        result.channels.telegram.error = 'Telegram service not ready';
      }
    }

    result.success = result.channelsSent > 0;
    return result;
  }

  /**
   * Send test notification to a subscriber
   */
  async sendTestNotification(subscriberId) {
    if (!this.isReady()) {
      throw new Error('Notification Manager not initialized');
    }

    const subscriber = this.subscriberDB.getSubscriber(subscriberId);
    
    if (!subscriber) {
      throw new Error(`Subscriber not found: ${subscriberId}`);
    }

    const result = {
      subscriberId: subscriber.id,
      success: false,
      channelsSent: 0,
      channels: {
        email: { enabled: false, sent: false, error: null },
        telegram: { enabled: false, sent: false, error: null }
      }
    };

    // Test Email
    if (subscriber.preferences.channels.email && subscriber.email) {
      result.channels.email.enabled = true;
      
      if (this.emailService.isReady()) {
        try {
          await this.emailService.sendTestEmail(subscriber.email);
          result.channels.email.sent = true;
          result.channelsSent++;
        } catch (error) {
          result.channels.email.error = error.message;
        }
      } else {
        result.channels.email.error = 'Email service not ready';
      }
    }

    // Test Telegram
    if (subscriber.preferences.channels.telegram && subscriber.telegramChatId) {
      result.channels.telegram.enabled = true;
      
      if (this.telegramService.isReady()) {
        try {
          await this.telegramService.sendTestMessage(subscriber.telegramChatId);
          result.channels.telegram.sent = true;
          result.channelsSent++;
        } catch (error) {
          result.channels.telegram.error = error.message;
        }
      } else {
        result.channels.telegram.error = 'Telegram service not ready';
      }
    }

    result.success = result.channelsSent > 0;
    return result;
  }

  /**
   * Get subscriber database
   */
  getSubscriberDB() {
    return this.subscriberDB;
  }

  /**
   * Get email service
   */
  getEmailService() {
    return this.emailService;
  }

  /**
   * Get Telegram service
   */
  getTelegramService() {
    return this.telegramService;
  }

  /**
   * Get statistics
   */
  getStatistics() {
    return {
      ...this.stats,
      subscribers: this.subscriberDB.getStatistics(),
      services: {
        email: this.emailService.isReady(),
        telegram: this.telegramService.isReady()
      }
    };
  }

  /**
   * Reset statistics
   */
  resetStatistics() {
    this.stats = {
      totalSent: 0,
      emailSent: 0,
      telegramSent: 0,
      failed: 0
    };
  }
}

module.exports = NotificationManager;
