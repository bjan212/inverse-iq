/**
 * Enhanced Payout Validator with Accuracy-Based Multipliers (HALVED PAYOUTS)
 *
 * This system rewards traders based on:
 * 1. Base quality score (trade count, capital, consistency, diversity) - HALVED
 * 2. Signal accuracy (75-100% = 1.0x to 3.0x multiplier)
 * 3. Volume bonuses (200-1000+ trades) - HALVED
 * 4. Capital bonuses ($10k-$50k+) - HALVED
 * 5. Consistency bonuses (regular trading activity) - HALVED
 *
 * ALL PAYOUTS ARE HALVED FROM THE ORIGINAL SYSTEM
 *
 * Example Payouts:
 * - Elite Trader (92% accuracy, 1200 trades, $55k capital): $147.50 USDT (was $295)
 * - Advanced Trader (77% accuracy, 350 trades, $8k capital): $36.25 USDT (was $72.50)
 * - Standard Trader (72% accuracy, 150 trades, $3k capital): $30 USDT (was $60)
 */

const DataQualityValidator = require('./dataQualityValidator');

class EnhancedPayoutValidator extends DataQualityValidator {
    constructor() {
        super();

        // HALVED BASE PAYMENT TIERS
        this.paymentTiers = [
            { minScore: 85, maxScore: 100, payment: 20, label: 'EXCELLENT' }, // was 40
            { minScore: 75, maxScore: 84, payment: 12.5, label: 'GOOD' },    // was 25
            { minScore: 60, maxScore: 74, payment: 7.5, label: 'ACCEPTABLE' }, // was 15
            { minScore: 40, maxScore: 59, payment: 5, label: 'BASIC' },       // was 10
            { minScore: 0, maxScore: 39, payment: 0, label: 'INSUFFICIENT' }
        ];

        // Enhanced payment tiers with accuracy multipliers (UNCHANGED)
        this.accuracyMultipliers = [
            { minAccuracy: 90, maxAccuracy: 100, multiplier: 3.0, label: 'ELITE', description: '90-100% win rate' },
            { minAccuracy: 85, maxAccuracy: 89, multiplier: 2.5, label: 'MASTER', description: '85-89% win rate' },
            { minAccuracy: 80, maxAccuracy: 84, multiplier: 2.0, label: 'EXPERT', description: '80-84% win rate' },
            { minAccuracy: 75, maxAccuracy: 79, multiplier: 1.5, label: 'ADVANCED', description: '75-79% win rate' },
            { minAccuracy: 70, maxAccuracy: 74, multiplier: 1.0, label: 'STANDARD', description: '70-74% win rate' },
            { minAccuracy: 0, maxAccuracy: 69, multiplier: 0.8, label: 'BASIC', description: 'Below 70% win rate' }
        ];

        // Volume bonuses (additional payment for high trade count) - HALVED
        this.volumeBonuses = [
            { minTrades: 1000, bonus: 25, label: 'HIGH_VOLUME', description: '1000+ trades' }, // was 50
            { minTrades: 500, bonus: 12.5, label: 'MEDIUM_VOLUME', description: '500-999 trades' }, // was 25
            { minTrades: 200, bonus: 5, label: 'LOW_VOLUME', description: '200-499 trades' } // was 10
        ];

        // Capital bonuses (additional payment for large accounts) - HALVED
        this.capitalBonuses = [
            { minCapital: 50000, bonus: 50, label: 'WHALE', description: '$50k+ capital' }, // was 100
            { minCapital: 20000, bonus: 25, label: 'LARGE', description: '$20k-$50k capital' }, // was 50
            { minCapital: 10000, bonus: 12.5, label: 'MEDIUM', description: '$10k-$20k capital' } // was 25
        ];
    }

    /**
     * Calculate consistency bonus based on trading frequency - HALVED
     */
    calculateConsistencyBonus(trades) {
        const tradingDays = this.countTradingDays(trades);
        const tradingSpan = this.calculateTradingSpan(trades);

        if (tradingSpan === 0) return 0;

        const consistencyRatio = tradingDays / tradingSpan;

        // Award bonus based on consistency - HALVED
        if (consistencyRatio >= 0.8) return 12.5;  // Trading 80%+ of days (was 25)
        if (consistencyRatio >= 0.6) return 7.5;   // Trading 60-79% of days (was 15)
        if (consistencyRatio >= 0.4) return 5;     // Trading 40-59% of days (was 10)
        if (consistencyRatio >= 0.2) return 2.5;   // Trading 20-39% of days (was 5)
        return 0;
    }
}

module.exports = EnhancedPayoutValidator;
