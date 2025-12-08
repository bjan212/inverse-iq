/**
 * Automated Submission Handler
 * 
 * Complete automated flow:
 * 1. Receive submission (exchange + API keys + wallet)
 * 2. Test API connection
 * 3. Fetch trading data
 * 4. Validate data quality
 * 5. Calculate payment
 * 6. Execute crypto payment
 * 7. Store data
 * 8. Return confirmation
 * 
 * FULLY AUTOMATED - NO MANUAL INTERVENTION
 */

const BinanceCollector = require('../src/collectors/binanceCollector');
const BybitCollector = require('../src/collectors/bybitCollector');
const DataQualityValidator = require('../src/validators/dataQualityValidator');
const CryptoPaymentProcessor = require('../src/payment/cryptoPaymentProcessor');
const SelfImprovingEngine = require('../src/ai-engine/selfImprovingEngine');
const fs = require('fs');
const path = require('path');

class AutomatedSubmissionHandler {
  constructor() {
    this.validator = new DataQualityValidator();
    this.paymentProcessor = new CryptoPaymentProcessor();
    this.aiEngine = new SelfImprovingEngine();
    this.outputDir = path.join(__dirname, '../output/submissions');

    // Ensure output directory exists
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
  }

  /**
   * MAIN AUTOMATED FLOW
   * Handles complete submission from start to finish
   */
  async processSubmission(submission) {
    console.log('\n');
    console.log('═'.repeat(60));
    console.log('  AUTOMATED SUBMISSION PROCESSING');
    console.log('═'.repeat(60));
    console.log('\n');
    
    const result = {
      submissionId: `SUB${Date.now().toString(36).toUpperCase()}`,
      timestamp: new Date(),
      exchange: submission.exchange,
      walletAddress: submission.walletAddress,
      network: submission.network || 'TRC20',
      status: 'processing',
      steps: {},
      finalResult: null
    };
    
    try {
      // STEP 1: Test API Connection
      console.log('🔌 STEP 1: Testing API Connection\n');
      const connectionTest = await this.testAPIConnection(submission);
      result.steps.connectionTest = connectionTest;
      
      if (!connectionTest.success) {
        throw new Error(`API connection failed: ${connectionTest.error}`);
      }
      
      console.log(`   ✅ Connected to ${submission.exchange}\n`);
      
      // STEP 2: Fetch Trading Data
      console.log('📥 STEP 2: Fetching Trading Data\n');
      const tradeData = await this.fetchTradingData(submission);
      result.steps.dataFetch = {
        success: true,
        tradeCount: tradeData.trades.length
      };
      
      console.log(`   ✅ Fetched ${tradeData.trades.length} trades\n`);
      
      // STEP 3: Validate Data Quality
      console.log('📊 STEP 3: Validating Data Quality\n');
      const validation = await this.validator.validateAndScore(tradeData);
      result.steps.validation = validation;
      
      if (!validation.passed) {
        result.status = 'rejected';
        result.rejectionReason = validation.failureReason;
        console.log(`   ❌ Validation failed: ${validation.failureReason}\n`);
        return result;
      }
      
      console.log(`   ✅ Validation passed (Score: ${validation.score}/100)\n`);
      
      // STEP 4: Execute Crypto Payment
      console.log('💰 STEP 4: Processing Payment\n');
      const payment = await this.paymentProcessor.processPayment({
        submissionId: result.submissionId,
        amount: validation.payment,
        currency: 'USDT',
        network: submission.network || 'TRC20',
        walletAddress: submission.walletAddress
      });
      
      result.steps.payment = payment;
      
      if (!payment.success) {
        result.status = 'payment_failed';
        result.paymentError = payment.error;
        console.log(`   ❌ Payment failed: ${payment.error}\n`);
        return result;
      }
      
      console.log(`   ✅ Payment sent: ${payment.amount} ${payment.currency}\n`);
      
      // STEP 5: Store Data
      console.log('💾 STEP 5: Storing Data\n');
      const storage = await this.storeSubmissionData(result.submissionId, tradeData, validation);
      result.steps.storage = storage;

      console.log(`   ✅ Data stored successfully\n`);

      // STEP 6: Feed Data to AI Engine
      console.log('🧠 STEP 6: Feeding Data to AI Engine\n');
      try {
        const traderData = {
          traderId: result.submissionId,
          trades: tradeData.trades
        };
        const aiUpdate = await this.aiEngine.addNewTraderData(traderData);
        result.steps.aiUpdate = aiUpdate;

        console.log(`   ✅ AI Engine updated: ${aiUpdate.patternsAdded} new patterns, ${aiUpdate.patternsUpdated} strengthened\n`);
        console.log(`   📊 Total patterns in database: ${aiUpdate.totalPatterns}\n`);
      } catch (aiError) {
        console.error(`   ❌ AI Engine update failed: ${aiError.message}\n`);
        result.steps.aiUpdate = { error: aiError.message };
        // Don't fail the submission if AI update fails
      }
      
      // STEP 7: Generate Final Result
      result.status = 'completed';
      result.finalResult = {
        submissionId: result.submissionId,
        qualityScore: validation.score,
        qualityTier: validation.tier,
        paymentAmount: validation.payment,
        paymentCurrency: 'USDT',
        paymentNetwork: payment.network,
        transactionHash: payment.transactionHash,
        explorerUrl: this.paymentProcessor.getExplorerUrl(payment.transactionHash, payment.network),
        estimatedArrival: this.paymentProcessor.estimateArrivalTime(payment.network),
        tradeCount: tradeData.trades.length,
        dateRange: this.calculateDateRange(tradeData.trades),
        aiPatternsAdded: result.steps.aiUpdate?.patternsAdded || 0,
        aiPatternsUpdated: result.steps.aiUpdate?.patternsUpdated || 0,
        totalAiPatterns: result.steps.aiUpdate?.totalPatterns || 0,
        completedAt: new Date()
      };
      
      console.log('\n');
      console.log('═'.repeat(60));
      console.log('  ✅ SUBMISSION COMPLETED SUCCESSFULLY');
      console.log('═'.repeat(60));
      console.log('\n');
      console.log(`  Submission ID: ${result.submissionId}`);
      console.log(`  Quality Score: ${validation.score}/100 (${validation.tier})`);
      console.log(`  Payment: ${validation.payment} USDT`);
      console.log(`  Transaction: ${payment.transactionHash}`);
      console.log(`  Status: Payment sent to ${submission.walletAddress}`);
      console.log('\n');
      
      return result;
      
    } catch (error) {
      console.error(`\n❌ SUBMISSION FAILED: ${error.message}\n`);
      result.status = 'failed';
      result.error = error.message;
      result.failedAt = new Date();
      return result;
    }
  }

  /**
   * TEST API CONNECTION
   */
  async testAPIConnection(submission) {
    try {
      let collector;
      
      switch (submission.exchange.toLowerCase()) {
        case 'binance':
          collector = new BinanceCollector(submission.apiKey, submission.apiSecret);
          break;
        case 'bybit':
          collector = new BybitCollector(submission.apiKey, submission.apiSecret);
          break;
        default:
          throw new Error(`Unsupported exchange: ${submission.exchange}`);
      }
      
      // Test connection by fetching account info
      const accountInfo = await collector.testConnection();
      
      return {
        success: true,
        exchange: submission.exchange,
        accountInfo: {
          canTrade: accountInfo.canTrade || false,
          permissions: accountInfo.permissions || []
        }
      };
      
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * FETCH TRADING DATA
   */
  async fetchTradingData(submission) {
    let collector;
    
    switch (submission.exchange.toLowerCase()) {
      case 'binance':
        collector = new BinanceCollector(submission.apiKey, submission.apiSecret);
        break;
      case 'bybit':
        collector = new BybitCollector(submission.apiKey, submission.apiSecret);
        break;
      default:
        throw new Error(`Unsupported exchange: ${submission.exchange}`);
    }
    
    // Fetch all available trades
    const trades = await collector.getAllTrades();
    
    return {
      exchange: submission.exchange,
      trades: trades,
      fetchedAt: new Date()
    };
  }

  /**
   * STORE SUBMISSION DATA
   */
  async storeSubmissionData(submissionId, tradeData, validation) {
    const filename = `${submissionId}.json`;
    const filepath = path.join(this.outputDir, filename);
    
    const dataToStore = {
      submissionId,
      exchange: tradeData.exchange,
      tradeCount: tradeData.trades.length,
      qualityScore: validation.score,
      qualityTier: validation.tier,
      payment: validation.payment,
      validation: {
        requirements: validation.requirements,
        scoreBreakdown: validation.details
      },
      trades: tradeData.trades,
      storedAt: new Date()
    };
    
    fs.writeFileSync(filepath, JSON.stringify(dataToStore, null, 2));
    
    return {
      success: true,
      filepath,
      filesize: fs.statSync(filepath).size
    };
  }

  /**
   * CALCULATE DATE RANGE
   */
  calculateDateRange(trades) {
    if (trades.length === 0) return 'N/A';
    
    const timestamps = trades.map(t => new Date(t.time || t.updateTime).getTime());
    const earliest = new Date(Math.min(...timestamps));
    const latest = new Date(Math.max(...timestamps));
    
    const formatDate = (date) => {
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return `${months[date.getMonth()]} ${date.getFullYear()}`;
    };
    
    return `${formatDate(earliest)} - ${formatDate(latest)}`;
  }

  /**
   * GET SUBMISSION STATUS
   */
  getSubmissionStatus(submissionId) {
    const filepath = path.join(this.outputDir, `${submissionId}.json`);
    
    if (fs.existsSync(filepath)) {
      const data = JSON.parse(fs.readFileSync(filepath, 'utf8'));
      return {
        found: true,
        status: 'completed',
        data: {
          submissionId: data.submissionId,
          qualityScore: data.qualityScore,
          qualityTier: data.qualityTier,
          payment: data.payment,
          tradeCount: data.tradeCount,
          storedAt: data.storedAt
        }
      };
    }
    
    return {
      found: false,
      status: 'not_found'
    };
  }
}

// CLI Usage
if (require.main === module) {
  const handler = new AutomatedSubmissionHandler();
  
  // Example submission
  const testSubmission = {
    exchange: 'binance',
    apiKey: process.argv[2] || 'YOUR_API_KEY',
    apiSecret: process.argv[3] || 'YOUR_API_SECRET',
    walletAddress: process.argv[4] || 'TYourWalletAddressHere123456789',
    network: 'TRC20'
  };
  
  console.log('Starting automated submission processing...\n');
  console.log(`Exchange: ${testSubmission.exchange}`);
  console.log(`Wallet: ${testSubmission.walletAddress}`);
  console.log(`Network: ${testSubmission.network}\n`);
  
  handler.processSubmission(testSubmission)
    .then(result => {
      console.log('\n📄 FINAL RESULT:\n');
      console.log(JSON.stringify(result.finalResult || result, null, 2));
      
      if (result.status === 'completed') {
        console.log('\n✅ SUCCESS: Submission processed and payment sent!');
        process.exit(0);
      } else {
        console.log(`\n❌ FAILED: ${result.error || result.rejectionReason || 'Unknown error'}`);
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('\n❌ ERROR:', error.message);
      process.exit(1);
    });
}

module.exports = AutomatedSubmissionHandler;

