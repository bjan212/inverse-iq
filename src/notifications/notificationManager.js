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
  constructor(signalTracker = null) {
    this.emailService = new EmailService();
    this.telegramService = new TelegramService();
    this.subscriberDB = new SubscriberDB();
    this.signalTracker = signalTracker; // NEW: Track notifications per signal
    this.initialized = false;
    this.queue = [];
    this.activeJobs = 0;
    this.maxConcurrency = Number(process.env.NOTIFICATION_CONCURRENCY || 5);
    this.maxRetries = Number(process.env.NOTIFICATION_MAX_RETRIES || 3);
    this.retryDelayMs = Number(process.env.NOTIFICATION_RETRY_DELAY_MS || 2000);
    this.notificationCooldownMs = Number(process.env.NOTIFICATION_COOLDOWN_MS || 300000); // 5 minutes default
    this.stats = {
      totalSent: 0,
      emailSent: 0,
      telegramSent: 0,
      failed: 0,
      duplicatesPrevented: 0 // NEW: Track prevented duplicates
    };
  }

  /**
   * Set signal tracker (can be set after construction)
   */
  setSignalTracker(signalTracker) {
    this.signalTracker = signalTracker;
    console.log('✅ Signal tracker connected to NotificationManager');
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
   * Check if notification should be sent (deduplication logic)
   */
  shouldSendNotification(signal) {
    // If no signal tracker, allow notification (backward compatibility)
    if (!this.signalTracker) {
      return { allowed: true, reason: 'No signal tracker configured' };
    }

    // Check if notification already sent for this signal
    if (this.signalTracker.hasNotificationBeenSent(signal.signalId)) {
      this.stats.duplicatesPrevented++;
      return { 
        allowed: false, 
        reason: 'Notification already sent for this signal' 
      };
    }

    // Check cooldown period (if notification was sent recently)
    const history = this.signalTracker.getNotificationHistory(signal.signalId);
    if (history && history.lastNotificationAt) {
      const timeSinceLastNotification = Date.now() - new Date(history.lastNotificationAt).getTime();
      if (timeSinceLastNotification < this.notificationCooldownMs) {
        this.stats.duplicatesPrevented++;
        const remainingCooldown = Math.ceil((this.notificationCooldownMs - timeSinceLastNotification) / 1000);
        return { 
          allowed: false, 
          reason: `Cooldown period active (${remainingCooldown}s remaining)` 
        };
      }
    }

    return { allowed: true, reason: 'Notification allowed' };
  }

  /**
   * Send signal notification to all interested subscribers (with deduplication)
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
      console.log(`\n🔔 Processing notification request for signal: ${signal.signalId}`);
      console.log(`   Symbol: ${signal.symbol} ${signal.direction}`);
      console.log(`   Confidence: ${signal.confidence}%`);

      // DEDUPLICATION CHECK
      const shouldSend = this.shouldSendNotification(signal);
      if (!shouldSend.allowed) {
        console.log(`   ⚠️  Notification blocked: ${shouldSend.reason}`);
        return {
          success: true,
          sent: 0,
          blocked: true,
          reason: shouldSend.reason,
          duplicatesPrevented: this.stats.duplicatesPrevented
        };
      }

      console.log(`   ✅ Deduplication check passed\n`);

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
      
      // Queue subscribers for async processing to avoid blocking the request thread
      subscribers.forEach((subscriber) => this.enqueueNotification(subscriber, signal));

      // Mark notification as sent in signal tracker
      if (this.signalTracker) {
        await this.signalTracker.recordNotificationSent(signal.signalId, 'batch');
      }

      return {
        success: true,
        queued: subscribers.length,
        concurrency: this.maxConcurrency,
        retryLimit: this.maxRetries,
        deduplicationEnabled: !!this.signalTracker
      };
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

  enqueueNotification(subscriber, signal) {
    this.queue.push({ subscriber, signal, attempt: 0 });
    this.processQueue();
  }

  processQueue() {
    while (this.activeJobs < this.maxConcurrency && this.queue.length > 0) {
      const job = this.queue.shift();
      this.activeJobs++;

      this.sendToSubscriber(job.subscriber, job.signal)
        .then((result) => {
          if (result.success) {
            this.subscriberDB.recordNotification(job.subscriber.id);
            this.stats.totalSent += result.channelsSent;
          } else if (job.attempt < this.maxRetries) {
            const nextAttempt = { ...job, attempt: job.attempt + 1 };
            setTimeout(() => {
              this.queue.push(nextAttempt);
              this.processQueue();
            }, this.retryDelayMs * (job.attempt + 1));
          } else {
            this.stats.failed++;
            console.error(`❌ Notification failed after retries for subscriber ${job.subscriber.id}`);
          }
        })
        .catch((err) => {
          if (job.attempt < this.maxRetries) {
            const nextAttempt = { ...job, attempt: job.attempt + 1 };
            setTimeout(() => {
              this.queue.push(nextAttempt);
              this.processQueue();
            }, this.retryDelayMs * (job.attempt + 1));
          } else {
            this.stats.failed++;
            console.error(`❌ Notification error for subscriber ${job.subscriber.id}:`, err.message);
          }
        })
        .finally(() => {
          this.activeJobs = Math.max(0, this.activeJobs - 1);
          if (this.queue.length > 0) {
            this.processQueue();
          }
        });
    }
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
      },
      deduplication: {
        enabled: !!this.signalTracker,
        duplicatesPrevented: this.stats.duplicatesPrevented,
        cooldownMs: this.notificationCooldownMs
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
      failed: 0,
      duplicatesPrevented: 0
    };
  }

  /**
   * Get notification history for a signal (if tracker available)
   */
  getSignalNotificationHistory(signalId) {
    if (!this.signalTracker) {
      return null;
    }
    return this.signalTracker.getNotificationHistory(signalId);
  }

  /**
   * Force send notification (bypass deduplication - use with caution!)
   */
  async forceSendNotification(signal) {
    console.log(`⚠️  FORCE SENDING notification for signal: ${signal.signalId}`);
    
    // Temporarily disable tracker
    const originalTracker = this.signalTracker;
    this.signalTracker = null;
    
    try {
      const result = await this.notifySignal(signal);
      return result;
    } finally {
      // Restore tracker
      this.signalTracker = originalTracker;
    }
  }
}

module.exports = NotificationManager;
