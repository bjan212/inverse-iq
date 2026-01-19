/**
 * Subscriber Database
 * 
 * Simple JSON-based database for managing notification subscribers.
 * Stores subscriber information and notification preferences.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class SubscriberDB {
  constructor(storagePath = './data/subscribers.json') {
    this.storagePath = storagePath;
    this.subscribers = new Map();
    this.loadSubscribers();
  }

  /**
   * Load subscribers from disk (async)
   */
  async loadSubscribers() {
    try {
      // Ensure data directory exists
      const dir = path.dirname(this.storagePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      // Load existing subscribers
      if (fs.existsSync(this.storagePath)) {
        const data = await fs.promises.readFile(this.storagePath, 'utf8');
        const parsed = JSON.parse(data);

        // Convert array to Map
        if (Array.isArray(parsed)) {
          parsed.forEach(sub => {
            this.subscribers.set(sub.id, sub);
          });
        }

        console.log(`📚 Loaded ${this.subscribers.size} subscribers from database`);
      } else {
        console.log('📚 No existing subscriber database found, starting fresh');
        await this.saveSubscribers();
      }
    } catch (error) {
      console.error('Failed to load subscribers:', error.message);
      this.subscribers = new Map();
    }
  }

  /**
   * Save subscribers to disk (async)
   */
  async saveSubscribers() {
    try {
      const data = Array.from(this.subscribers.values());
      await fs.promises.writeFile(this.storagePath, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('Failed to save subscribers:', error.message);
    }
  }

  /**
   * Generate unique subscriber ID
   */
  generateId() {
    return crypto.randomBytes(16).toString('hex');
  }

  /**
   * Add new subscriber (async)
   */
  async addSubscriber(subscriberData) {
    const { email, telegramChatId, preferences } = subscriberData;

    // Validate required fields
    if (!email && !telegramChatId) {
      throw new Error('At least one contact method (email or Telegram) is required');
    }

    // Check if subscriber already exists
    const existing = this.findByContact(email, telegramChatId);
    if (existing) {
      throw new Error('Subscriber already exists with this contact information');
    }

    // Create new subscriber
    const subscriber = {
      id: this.generateId(),
      email: email || null,
      telegramChatId: telegramChatId || null,
      preferences: {
        channels: preferences?.channels || {
          email: email ? true : false,
          telegram: telegramChatId ? true : false
        },
        minConfidence: preferences?.minConfidence || 75,
        symbols: preferences?.symbols || ['BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'SOLUSDT'],
        directions: preferences?.directions || ['LONG', 'SHORT'],
        notifyOnHighConfidence: preferences?.notifyOnHighConfidence !== false,
        notifyOnCombinedPatterns: preferences?.notifyOnCombinedPatterns !== false
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      active: true,
      notificationCount: 0,
      lastNotificationAt: null
    };

    this.subscribers.set(subscriber.id, subscriber);
    await this.saveSubscribers();

    console.log(`✅ New subscriber added: ${subscriber.id}`);
    console.log(`   Email: ${subscriber.email || 'N/A'}`);
    console.log(`   Telegram: ${subscriber.telegramChatId || 'N/A'}`);

    return subscriber;
  }

  /**
   * Find subscriber by contact information
   */
  findByContact(email, telegramChatId) {
    for (const subscriber of this.subscribers.values()) {
      if (email && subscriber.email === email) {
        return subscriber;
      }
      if (telegramChatId && subscriber.telegramChatId === telegramChatId) {
        return subscriber;
      }
    }
    return null;
  }

  /**
   * Get subscriber by ID
   */
  getSubscriber(id) {
    return this.subscribers.get(id);
  }

  /**
   * Update subscriber preferences (async)
   */
  async updatePreferences(id, preferences) {
    const subscriber = this.subscribers.get(id);

    if (!subscriber) {
      throw new Error(`Subscriber not found: ${id}`);
    }

    // Update preferences
    subscriber.preferences = {
      ...subscriber.preferences,
      ...preferences
    };

    subscriber.updatedAt = new Date().toISOString();

    this.subscribers.set(id, subscriber);
    await this.saveSubscribers();

    console.log(`✅ Updated preferences for subscriber: ${id}`);

    return subscriber;
  }

  /**
   * Update subscriber contact information (async)
   */
  async updateContact(id, contactData) {
    const subscriber = this.subscribers.get(id);

    if (!subscriber) {
      throw new Error(`Subscriber not found: ${id}`);
    }

    if (contactData.email !== undefined) {
      subscriber.email = contactData.email;
    }

    if (contactData.telegramChatId !== undefined) {
      subscriber.telegramChatId = contactData.telegramChatId;
    }

    subscriber.updatedAt = new Date().toISOString();

    this.subscribers.set(id, subscriber);
    await this.saveSubscribers();

    console.log(`✅ Updated contact info for subscriber: ${id}`);

    return subscriber;
  }

  /**
   * Deactivate subscriber (soft delete) (async)
   */
  async deactivateSubscriber(id) {
    const subscriber = this.subscribers.get(id);

    if (!subscriber) {
      throw new Error(`Subscriber not found: ${id}`);
    }

    subscriber.active = false;
    subscriber.updatedAt = new Date().toISOString();

    this.subscribers.set(id, subscriber);
    await this.saveSubscribers();

    console.log(`✅ Deactivated subscriber: ${id}`);

    return subscriber;
  }

  /**
   * Reactivate subscriber (async)
   */
  async reactivateSubscriber(id) {
    const subscriber = this.subscribers.get(id);

    if (!subscriber) {
      throw new Error(`Subscriber not found: ${id}`);
    }

    subscriber.active = true;
    subscriber.updatedAt = new Date().toISOString();

    this.subscribers.set(id, subscriber);
    await this.saveSubscribers();

    console.log(`✅ Reactivated subscriber: ${id}`);

    return subscriber;
  }

  /**
   * Delete subscriber permanently (async)
   */
  async deleteSubscriber(id) {
    const subscriber = this.subscribers.get(id);

    if (!subscriber) {
      throw new Error(`Subscriber not found: ${id}`);
    }

    this.subscribers.delete(id);
    await this.saveSubscribers();

    console.log(`✅ Deleted subscriber: ${id}`);

    return true;
  }

  /**
   * Record notification sent (async)
   */
  async recordNotification(id) {
    const subscriber = this.subscribers.get(id);

    if (!subscriber) {
      return;
    }

    subscriber.notificationCount++;
    subscriber.lastNotificationAt = new Date().toISOString();

    this.subscribers.set(id, subscriber);
    await this.saveSubscribers();
  }

  /**
   * Get all active subscribers
   */
  getActiveSubscribers() {
    return Array.from(this.subscribers.values()).filter(s => s.active);
  }

  /**
   * Get subscribers interested in a specific signal
   */
  getInterestedSubscribers(signal) {
    const active = this.getActiveSubscribers();
    
    return active.filter(subscriber => {
      const prefs = subscriber.preferences;
      
      // Check confidence threshold
      if (signal.confidence < prefs.minConfidence) {
        return false;
      }
      
      // Check symbol filter
      if (prefs.symbols.length > 0 && !prefs.symbols.includes(signal.symbol)) {
        return false;
      }
      
      // Check direction filter
      if (prefs.directions.length > 0 && !prefs.directions.includes(signal.direction)) {
        return false;
      }
      
      // Check high confidence preference
      if (signal.confidence >= 85 && !prefs.notifyOnHighConfidence) {
        return false;
      }
      
      // Check combined pattern preference
      if (signal.pattern?.source === 'combined' && !prefs.notifyOnCombinedPatterns) {
        return false;
      }
      
      return true;
    });
  }

  /**
   * Get statistics
   */
  getStatistics() {
    const all = Array.from(this.subscribers.values());
    const active = all.filter(s => s.active);
    
    return {
      total: all.length,
      active: active.length,
      inactive: all.length - active.length,
      withEmail: active.filter(s => s.email).length,
      withTelegram: active.filter(s => s.telegramChatId).length,
      totalNotificationsSent: all.reduce((sum, s) => sum + s.notificationCount, 0)
    };
  }

  /**
   * Get all subscribers (for admin)
   */
  getAllSubscribers() {
    return Array.from(this.subscribers.values());
  }
}

module.exports = SubscriberDB;
