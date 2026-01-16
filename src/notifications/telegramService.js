/**
 * Telegram Notification Service
 * 
 * Sends Telegram notifications for inverse signals using Telegram Bot API.
 * Supports formatted messages with signal details.
 */

const TelegramBot = require('node-telegram-bot-api');

class TelegramService {
  constructor(config = {}) {
    this.botToken = config.botToken || process.env.TELEGRAM_BOT_TOKEN;
    this.bot = null;
    this.initialized = false;
  }

  /**
   * Initialize Telegram bot
   */
  async initialize() {
    try {
      // Check if bot token is provided
      if (!this.botToken) {
        console.warn('⚠️  Telegram service: Bot token not configured');
        console.warn('   Set TELEGRAM_BOT_TOKEN environment variable');
        console.warn('   Create a bot via @BotFather on Telegram');
        this.initialized = false;
        return false;
      }

      // Create bot instance
      this.bot = new TelegramBot(this.botToken, { polling: false });

      // Verify bot token
      const me = await this.bot.getMe();
      
      console.log('✅ Telegram service initialized successfully');
      console.log(`   Bot Username: @${me.username}`);
      console.log(`   Bot Name: ${me.first_name}`);
      
      this.initialized = true;
      return true;
    } catch (error) {
      console.error('❌ Telegram service initialization failed:', error.message);
      this.initialized = false;
      return false;
    }
  }

  /**
   * Check if service is ready
   */
  isReady() {
    return this.initialized && this.bot !== null;
  }

  /**
   * Send signal notification to Telegram
   */
  async sendSignalNotification(chatId, signal) {
    if (!this.isReady()) {
      throw new Error('Telegram service not initialized');
    }

    try {
      const message = this.formatSignalMessage(signal);
      
      const result = await this.bot.sendMessage(chatId, message, {
        parse_mode: 'HTML',
        disable_web_page_preview: true
      });
      
      console.log(`📱 Telegram message sent to chat ${chatId}: ${result.message_id}`);
      
      return {
        success: true,
        messageId: result.message_id,
        chatId: chatId
      };
    } catch (error) {
      console.error(`❌ Failed to send Telegram message to ${chatId}:`, error.message);
      throw error;
    }
  }

  /**
   * Send test message
   */
  async sendTestMessage(chatId) {
    if (!this.isReady()) {
      throw new Error('Telegram service not initialized');
    }

    try {
      const message = `
✅ <b>Test Notification</b>

This is a test notification from <b>Xrypt</b>.

Your Telegram notifications are working correctly! You will receive alerts here when new inverse signals are generated.

━━━━━━━━━━━━━━━━━━━━
🧠 Xrypt - Learn from losses, profit from patterns
      `.trim();
      
      const result = await this.bot.sendMessage(chatId, message, {
        parse_mode: 'HTML'
      });
      
      console.log(`📱 Test message sent to chat ${chatId}: ${result.message_id}`);
      
      return {
        success: true,
        messageId: result.message_id,
        chatId: chatId
      };
    } catch (error) {
      console.error(`❌ Failed to send test message to ${chatId}:`, error.message);
      throw error;
    }
  }

  /**
   * Format signal message for Telegram
   */
  formatSignalMessage(signal) {
    const directionEmoji = signal.direction === 'LONG' ? '📈' : '📉';
    const confidenceEmoji = signal.confidence >= 85 ? '🔥' : signal.confidence >= 75 ? '⚡' : '💡';
    const riskEmoji = this.getRiskEmoji(signal.riskLevel);
    
    // Trading levels section (NEW)
    const tradingLevelsSection = signal.averageEntryPrice ? `
━━━━━━━━━━━━━━━━━━━━

💰 <b>Trading Levels</b>
🎯 Entry: <b>$${signal.averageEntryPrice.toFixed(2)}</b>
🛑 Stop Loss: <b>$${signal.stopLoss.toFixed(2)}</b> <code>(-${signal.stopLossPercent}%)</code>
✅ TP1: <b>$${signal.takeProfit1.toFixed(2)}</b> <code>(+${signal.takeProfit1Percent}%)</code>
🚀 TP2: <b>$${signal.takeProfit2.toFixed(2)}</b> <code>(+${signal.takeProfit2Percent}%)</code>
📊 R:R: <b>1:${signal.riskRewardRatio1}</b> / <b>1:${signal.riskRewardRatio2}</b>
` : '';

    // Expiry section
    const expirySection = signal.expiresAt ? `
⏰ Expires: ${new Date(signal.expiresAt).toLocaleString()}` : '';
    
    return `
🧠 <b>Xrypt Signal Alert</b>

${directionEmoji} <b>${signal.symbol}</b> - <b>${signal.direction}</b>
${confidenceEmoji} Confidence: <b>${signal.confidence}%</b>
${riskEmoji} Risk: <b>${signal.riskLevel.replace('_', ' ')}</b>
${tradingLevelsSection}
━━━━━━━━━━━━━━━━━━━━

📊 <b>Pattern Intelligence</b>
• Traders Affected: ${signal.pattern.tradersAffected}
• Occurrences: ${signal.pattern.totalOccurrences}
• Total Losses: $${signal.pattern.totalLosses.toFixed(2)}
• Avg Loss: $${signal.pattern.avgLoss.toFixed(2)}

━━━━━━━━━━━━━━━━━━━━

💡 <b>Analysis</b>
${this.escapeHtml(signal.reason)}

━━━━━━━━━━━━━━━━━━━━

📈 <b>Market Conditions</b>
• Price: $${signal.currentConditions.price.toFixed(2)}
• 24h Change: ${signal.currentConditions.priceChange24h >= 0 ? '+' : ''}${signal.currentConditions.priceChange24h.toFixed(2)}%
• RSI: ${signal.currentConditions.rsi}
• Sentiment: ${signal.currentConditions.marketSentiment}
${signal.currentConditions.fundingRate ? `• Funding Rate: ${(signal.currentConditions.fundingRate * 100).toFixed(4)}%` : ''}

━━━━━━━━━━━━━━━━━━━━

🕐 Generated: ${new Date(signal.generatedAt).toLocaleString()}${expirySection}
    `.trim();
  }

  /**
   * Get risk emoji
   */
  getRiskEmoji(riskLevel) {
    const riskMap = {
      'VERY_LOW': '🟢',
      'LOW': '🟡',
      'MEDIUM': '🟠',
      'HIGH': '🔴'
    };
    return riskMap[riskLevel] || '⚪';
  }

  /**
   * Escape HTML special characters
   */
  escapeHtml(text) {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '<')
      .replace(/>/g, '>');
  }

  /**
   * Get bot info
   */
  async getBotInfo() {
    if (!this.isReady()) {
      throw new Error('Telegram service not initialized');
    }

    try {
      const me = await this.bot.getMe();
      return {
        id: me.id,
        username: me.username,
        firstName: me.first_name,
        canJoinGroups: me.can_join_groups,
        canReadAllGroupMessages: me.can_read_all_group_messages,
        supportsInlineQueries: me.supports_inline_queries
      };
    } catch (error) {
      console.error('Failed to get bot info:', error.message);
      throw error;
    }
  }

  /**
   * Send message with inline keyboard
   */
  async sendMessageWithKeyboard(chatId, text, keyboard) {
    if (!this.isReady()) {
      throw new Error('Telegram service not initialized');
    }

    try {
      const result = await this.bot.sendMessage(chatId, text, {
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: keyboard
        }
      });
      
      return {
        success: true,
        messageId: result.message_id,
        chatId: chatId
      };
    } catch (error) {
      console.error(`Failed to send message with keyboard to ${chatId}:`, error.message);
      throw error;
    }
  }

  /**
   * Get chat info (useful for debugging)
   */
  async getChatInfo(chatId) {
    if (!this.isReady()) {
      throw new Error('Telegram service not initialized');
    }

    try {
      const chat = await this.bot.getChat(chatId);
      return {
        id: chat.id,
        type: chat.type,
        title: chat.title,
        username: chat.username,
        firstName: chat.first_name,
        lastName: chat.last_name
      };
    } catch (error) {
      console.error(`Failed to get chat info for ${chatId}:`, error.message);
      throw error;
    }
  }
}

module.exports = TelegramService;
