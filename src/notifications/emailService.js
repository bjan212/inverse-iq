/**
 * Email Notification Service
 * 
 * Sends email notifications for inverse signals using nodemailer.
 * Supports HTML formatted emails with signal details.
 */

const nodemailer = require('nodemailer');

class EmailService {
  constructor(config = {}) {
    this.config = {
      host: config.host || process.env.SMTP_HOST || 'smtp.gmail.com',
      port: config.port || process.env.SMTP_PORT || 587,
      secure: config.secure || false, // true for 465, false for other ports
      auth: {
        user: config.user || process.env.SMTP_USER,
        pass: config.pass || process.env.SMTP_PASS
      },
      from: config.from || process.env.SMTP_FROM || 'Xrypt <notify@xrypt.net>'
    };

    this.transporter = null;
    this.initialized = false;
  }

  /**
   * Initialize email transporter
   */
  async initialize() {
    try {
      // Check if credentials are provided
      if (!this.config.auth.user || !this.config.auth.pass) {
        console.warn('⚠️  Email service: SMTP credentials not configured');
        console.warn('   Set SMTP_USER and SMTP_PASS environment variables');
        this.initialized = false;
        return false;
      }

      this.transporter = nodemailer.createTransport(this.config);

      // Verify connection
      await this.transporter.verify();
      
      console.log('✅ Email service initialized successfully');
      console.log(`   SMTP Host: ${this.config.host}`);
      console.log(`   From: ${this.config.from}`);
      
      this.initialized = true;
      return true;
    } catch (error) {
      console.error('❌ Email service initialization failed:', error.message);
      this.initialized = false;
      return false;
    }
  }

  /**
   * Check if service is ready
   */
  isReady() {
    return this.initialized && this.transporter !== null;
  }

  /**
   * Send signal notification email
   */
  async sendSignalNotification(email, signal) {
    if (!this.isReady()) {
      throw new Error('Email service not initialized');
    }

    try {
      const html = this.generateSignalEmailHTML(signal);
      const text = this.generateSignalEmailText(signal);

      const mailOptions = {
        from: this.config.from,
        to: email,
        subject: `🎯 Xrypt Signal: ${signal.symbol} ${signal.direction} (${signal.confidence}% confidence)`,
        text: text,
        html: html
      };

      const info = await this.transporter.sendMail(mailOptions);
      
      console.log(`📧 Email sent to ${email}: ${info.messageId}`);
      
      return {
        success: true,
        messageId: info.messageId,
        recipient: email
      };
    } catch (error) {
      console.error(`❌ Failed to send email to ${email}:`, error.message);
      throw error;
    }
  }

  /**
   * Send test email
   */
  async sendTestEmail(email) {
    if (!this.isReady()) {
      throw new Error('Email service not initialized');
    }

    try {
      const mailOptions = {
        from: this.config.from,
        to: email,
        subject: '✅ Xrypt - Test Notification',
        text: 'This is a test notification from Xrypt. Your email notifications are working correctly!',
        html: `
          <div style="font-family: 'Courier New', monospace; max-width: 600px; margin: 0 auto; background: #030712; color: #f3f4f6; padding: 30px; border-radius: 10px;">
            <h1 style="color: #4ade80; margin-bottom: 20px;">✅ Test Notification</h1>
            <p style="font-size: 16px; line-height: 1.6;">
              This is a test notification from <strong>Xrypt</strong>.
            </p>
            <p style="font-size: 16px; line-height: 1.6;">
              Your email notifications are working correctly! You will receive alerts here when new inverse signals are generated.
            </p>
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #374151; font-size: 12px; color: #888;">
              <p>Xrypt - Learn from losses, profit from patterns</p>
            </div>
          </div>
        `
      };

      const info = await this.transporter.sendMail(mailOptions);
      
      console.log(`📧 Test email sent to ${email}: ${info.messageId}`);
      
      return {
        success: true,
        messageId: info.messageId,
        recipient: email
      };
    } catch (error) {
      console.error(`❌ Failed to send test email to ${email}:`, error.message);
      throw error;
    }
  }

  /**
   * Generate HTML email for signal
   */
  generateSignalEmailHTML(signal) {
    const directionColor = signal.direction === 'LONG' ? '#4caf50' : '#f44336';
    const confidenceColor = signal.confidence >= 85 ? '#4ade80' : signal.confidence >= 75 ? '#22c55e' : '#16a34a';
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; background: #111827;">
        <div style="font-family: 'Courier New', monospace; max-width: 600px; margin: 0 auto; background: #030712; color: #f3f4f6; padding: 30px; border-radius: 10px;">
          
          <!-- Header -->
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #4ade80; font-size: 28px; margin: 0;">🧠 Xrypt</h1>
            <p style="color: #888; font-size: 14px; margin-top: 5px;">AI-Powered Inverse Signal</p>
          </div>

          <!-- Signal Card -->
          <div style="background: rgba(3, 7, 18, 0.8); border: 2px solid #4ade80; border-radius: 12px; padding: 25px; margin-bottom: 20px;">
            
            <!-- Symbol & Direction -->
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
              <h2 style="color: #fff; font-size: 32px; margin: 0;">${signal.symbol}</h2>
              <span style="background: ${directionColor}; color: #fff; padding: 8px 16px; border-radius: 20px; font-weight: bold; font-size: 16px;">
                ${signal.direction}
              </span>
            </div>

            <!-- Confidence -->
            <div style="margin-bottom: 20px;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                <span style="color: #888; font-size: 14px;">Confidence Score</span>
                <span style="color: ${confidenceColor}; font-weight: bold; font-size: 16px;">${signal.confidence}%</span>
              </div>
              <div style="height: 10px; background: #374151; border-radius: 10px; overflow: hidden;">
                <div style="height: 100%; width: ${signal.confidence}%; background: linear-gradient(90deg, #4ade80, #22c55e); border-radius: 10px;"></div>
              </div>
            </div>

            <!-- Trading Levels (NEW) -->
            ${signal.averageEntryPrice ? `
            <div style="background: rgba(74, 222, 128, 0.1); border: 2px solid #4ade80; border-radius: 10px; padding: 15px; margin-bottom: 15px;">
              <h3 style="color: #4ade80; font-size: 14px; margin: 0 0 15px 0; text-transform: uppercase;">📊 Trading Levels</h3>
              <table style="width: 100%; font-size: 14px;">
                <tr>
                  <td style="color: #888; padding: 8px 0; border-bottom: 1px solid #374151;">Entry Price:</td>
                  <td style="color: #4ade80; font-weight: bold; text-align: right; padding: 8px 0; border-bottom: 1px solid #374151;">$${signal.averageEntryPrice.toFixed(2)}</td>
                </tr>
                <tr>
                  <td style="color: #888; padding: 8px 0; border-bottom: 1px solid #374151;">Stop Loss:</td>
                  <td style="color: #f87171; font-weight: bold; text-align: right; padding: 8px 0; border-bottom: 1px solid #374151;">$${signal.stopLoss.toFixed(2)} <span style="color: #888; font-size: 12px;">(${signal.stopLossPercent}%)</span></td>
                </tr>
                <tr>
                  <td style="color: #888; padding: 8px 0; border-bottom: 1px solid #374151;">Take Profit 1:</td>
                  <td style="color: #4ade80; font-weight: bold; text-align: right; padding: 8px 0; border-bottom: 1px solid #374151;">$${signal.takeProfit1.toFixed(2)} <span style="color: #888; font-size: 12px;">(+${signal.takeProfit1Percent}%)</span></td>
                </tr>
                <tr>
                  <td style="color: #888; padding: 8px 0; border-bottom: 1px solid #374151;">Take Profit 2:</td>
                  <td style="color: #4ade80; font-weight: bold; text-align: right; padding: 8px 0; border-bottom: 1px solid #374151;">$${signal.takeProfit2.toFixed(2)} <span style="color: #888; font-size: 12px;">(+${signal.takeProfit2Percent}%)</span></td>
                </tr>
                <tr>
                  <td style="color: #888; padding: 8px 0;">Risk/Reward:</td>
                  <td style="color: #fff; font-weight: bold; text-align: right; padding: 8px 0;">1:${signal.riskRewardRatio1} / 1:${signal.riskRewardRatio2}</td>
                </tr>
              </table>
            </div>
            ` : ''}

            <!-- Pattern Info -->
            <div style="background: rgba(3, 7, 18, 0.6); border: 1px solid #374151; border-radius: 10px; padding: 15px; margin-bottom: 15px;">
              <h3 style="color: #888; font-size: 12px; margin: 0 0 10px 0; text-transform: uppercase;">Pattern Intelligence</h3>
              <table style="width: 100%; font-size: 14px;">
                <tr>
                  <td style="color: #888; padding: 5px 0;">Traders Affected:</td>
                  <td style="color: #fff; font-weight: bold; text-align: right;">${signal.pattern.tradersAffected}</td>
                </tr>
                <tr>
                  <td style="color: #888; padding: 5px 0;">Occurrences:</td>
                  <td style="color: #fff; font-weight: bold; text-align: right;">${signal.pattern.totalOccurrences}</td>
                </tr>
                <tr>
                  <td style="color: #888; padding: 5px 0;">Total Losses:</td>
                  <td style="color: #fff; font-weight: bold; text-align: right;">$${signal.pattern.totalLosses.toFixed(2)}</td>
                </tr>
                <tr>
                  <td style="color: #888; padding: 5px 0;">Risk Level:</td>
                  <td style="color: #fff; font-weight: bold; text-align: right;">${signal.riskLevel.replace('_', ' ')}</td>
                </tr>
              </table>
            </div>

            <!-- Reason -->
            <div style="background: rgba(3, 7, 18, 0.6); border-left: 3px solid #4ade80; padding: 15px; border-radius: 5px; margin-bottom: 15px;">
              <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #d1d5db;">
                ${signal.reason}
              </p>
            </div>

            <!-- Market Conditions -->
            <div style="background: rgba(3, 7, 18, 0.6); border: 1px solid #374151; border-radius: 10px; padding: 15px;">
              <h3 style="color: #888; font-size: 12px; margin: 0 0 10px 0; text-transform: uppercase;">Current Market Conditions</h3>
              <table style="width: 100%; font-size: 13px;">
                <tr>
                  <td style="color: #888; padding: 3px 0;">Price:</td>
                  <td style="color: #fff; text-align: right;">$${signal.currentConditions.price.toFixed(2)}</td>
                </tr>
                <tr>
                  <td style="color: #888; padding: 3px 0;">24h Change:</td>
                  <td style="color: ${signal.currentConditions.priceChange24h >= 0 ? '#4caf50' : '#f44336'}; text-align: right;">
                    ${signal.currentConditions.priceChange24h >= 0 ? '+' : ''}${signal.currentConditions.priceChange24h.toFixed(2)}%
                  </td>
                </tr>
                <tr>
                  <td style="color: #888; padding: 3px 0;">RSI:</td>
                  <td style="color: #fff; text-align: right;">${signal.currentConditions.rsi}</td>
                </tr>
                <tr>
                  <td style="color: #888; padding: 3px 0;">Sentiment:</td>
                  <td style="color: #fff; text-align: right;">${signal.currentConditions.marketSentiment}</td>
                </tr>
              </table>
            </div>

          </div>

          <!-- Timestamp & Validity -->
          <div style="text-align: center; font-size: 12px; color: #666; margin-bottom: 20px;">
            <div style="margin-bottom: 5px;">Generated: ${new Date(signal.generatedAt).toLocaleString()}</div>
            ${signal.expiresAt ? `<div style="color: #f59e0b;">⏰ Expires: ${new Date(signal.expiresAt).toLocaleString()}</div>` : ''}
          </div>

          <!-- Footer -->
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #374151; text-align: center;">
            <p style="font-size: 12px; color: #888; margin: 5px 0;">
              Xrypt - Learn from losses, profit from patterns
            </p>
            <p style="font-size: 11px; color: #666; margin: 5px 0;">
              This is an automated notification. To manage your preferences, visit your account settings.
            </p>
          </div>

        </div>
      </body>
      </html>
    `;
  }

  /**
   * Generate plain text email for signal
   */
  generateSignalEmailText(signal) {
    const tradingLevelsText = signal.averageEntryPrice ? `
TRADING LEVELS
Entry Price: $${signal.averageEntryPrice.toFixed(2)}
Stop Loss: $${signal.stopLoss.toFixed(2)} (-${signal.stopLossPercent}%)
Take Profit 1: $${signal.takeProfit1.toFixed(2)} (+${signal.takeProfit1Percent}%)
Take Profit 2: $${signal.takeProfit2.toFixed(2)} (+${signal.takeProfit2Percent}%)
Risk/Reward: 1:${signal.riskRewardRatio1} / 1:${signal.riskRewardRatio2}

` : '';

    const expiryText = signal.expiresAt ? `
Expires: ${new Date(signal.expiresAt).toLocaleString()}
` : '';

    return `
🧠 Xrypt - AI-Powered Inverse Signal

═══════════════════════════════════════

SIGNAL DETAILS
Symbol: ${signal.symbol}
Direction: ${signal.direction}
Confidence: ${signal.confidence}%
Risk Level: ${signal.riskLevel.replace('_', ' ')}

${tradingLevelsText}PATTERN INTELLIGENCE
Traders Affected: ${signal.pattern.tradersAffected}
Occurrences: ${signal.pattern.totalOccurrences}
Total Losses: $${signal.pattern.totalLosses.toFixed(2)}

REASON
${signal.reason}

CURRENT MARKET CONDITIONS
Price: $${signal.currentConditions.price.toFixed(2)}
24h Change: ${signal.currentConditions.priceChange24h >= 0 ? '+' : ''}${signal.currentConditions.priceChange24h.toFixed(2)}%
RSI: ${signal.currentConditions.rsi}
Sentiment: ${signal.currentConditions.marketSentiment}

═══════════════════════════════════════

Generated: ${new Date(signal.generatedAt).toLocaleString()}${expiryText}

Xrypt - Learn from losses, profit from patterns
    `.trim();
  }
}

module.exports = EmailService;
