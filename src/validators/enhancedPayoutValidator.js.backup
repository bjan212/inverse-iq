/**
 * Enhanced Payout Validator with Accuracy-Based Multipliers
 * 
 * This system rewards traders based on:
 * 1. Base quality score (trade count, capital, consistency, diversity)
 * 2. Signal accuracy (75-100% = 1.0x to 3.0x multiplier)
 * 3. Volume bonuses (200-1000+ trades)
 * 4. Capital bonuses ($10k-$50k+)
 * 5. Consistency bonuses (regular trading activity)
 * 
 * Example Payouts:
 * - Elite Trader (92% accuracy, 1200 trades, $55k capital): $475 USDT
 * - Advanced Trader (77% accuracy, 350 trades, $8k capital): $137.50 USDT
 * - Standard Trader (72% accuracy, 150 trades, $3k capital): $60 USDT
 */

const DataQualityValidator = require('./dataQualityValidator');

class EnhancedPayoutValidator extends DataQualityValidator {
    constructor() {
        super();
        
        // Enhanced payment tiers with accuracy multipliers
        this.accuracyMultipliers = [
            { minAccuracy: 90, maxAccuracy: 100, multiplier: 3.0, label: 'ELITE', description: '90-100% win rate' },
            { minAccuracy: 85, maxAccuracy: 89, multiplier: 2.5, label: 'MASTER', description: '85-89% win rate' },
            { minAccuracy: 80, maxAccuracy: 84, multiplier: 2.0, label: 'EXPERT', description: '80-84% win rate' },
            { minAccuracy: 75, maxAccuracy: 79, multiplier: 1.5, label: 'ADVANCED', description: '75-79% win rate' },
            { minAccuracy: 70, maxAccuracy: 74, multiplier: 1.0, label: 'STANDARD', description: '70-74% win rate' },
            { minAccuracy: 0, maxAccuracy: 69, multiplier: 0.8, label: 'BASIC', description: 'Below 70% win rate' }
        ];
        
        // Volume bonuses (additional payment for high trade count)
        this.volumeBonuses = [
            { minTrades: 1000, bonus: 50, label: 'HIGH_VOLUME', description: '1000+ trades' },
            { minTrades: 500, bonus: 25, label: 'MEDIUM_VOLUME', description: '500-999 trades' },
            { minTrades: 200, bonus: 10, label: 'LOW_VOLUME', description: '200-499 trades' }
        ];
        
        // Capital bonuses (additional payment for large accounts)
        this.capitalBonuses = [
            { minCapital: 50000, bonus: 100, label: 'WHALE', description: '$50k+ capital' },
            { minCapital: 20000, bonus: 50, label: 'LARGE', description: '$20k-$50k capital' },
            { minCapital: 10000, bonus: 25, label: 'MEDIUM', description: '$10k-$20k capital' }
        ];
    }
    
    /**
     * Main validation and scoring method
     * Extends parent class with enhanced payout calculation
     */
    async validateAndScore(tradeData) {
        console.log('\n╔════════════════════════════════════════════════════════════╗');
        console.log('║      ENHANCED PAYOUT VALIDATION WITH ACCURACY TIERS       ║');
        console.log('╚════════════════════════════════════════════════════════════╝\n');
        
        // Get base validation from parent class
        const baseResult = await super.validateAndScore(tradeData);
        
        if (!baseResult.passed) {
            console.log('❌ Base validation failed. Cannot calculate enhanced payout.\n');
            return baseResult;
        }
        
        console.log('✅ Base validation passed. Calculating enhanced payout...\n');
        
        // Calculate enhanced payout with accuracy multipliers
        const enhancedPayout = this.calculateEnhancedPayout(tradeData, baseResult);
        
        // Return enhanced result
        return {
            ...baseResult,
            enhancedPayout,
            originalPayment: baseResult.payment,
            payment: enhancedPayout.totalPayout,
            paymentBreakdown: enhancedPayout.breakdown
        };
    }
    
    /**
     * Calculate enhanced payout with all bonuses and multipliers
     */
    calculateEnhancedPayout(tradeData, baseResult) {
        console.log('💰 ENHANCED PAYOUT CALCULATION\n');
        
        let totalPayout = baseResult.payment;
        const breakdown = {
            basePayment: baseResult.payment,
            qualityTier: baseResult.tier,
            qualityScore: baseResult.score
        };
        
        // Step 1: Calculate signal accuracy
        console.log('📊 Step 1: Analyzing Signal Accuracy');
        const accuracy = this.calculateSignalAccuracy(tradeData.trades);
        const accuracyTier = this.getAccuracyMultiplier(accuracy);
        
        if (accuracyTier) {
            const beforeMultiplier = totalPayout;
            totalPayout *= accuracyTier.multiplier;
            breakdown.accuracyMultiplier = accuracyTier.multiplier;
            breakdown.accuracyTier = accuracyTier.label;
            breakdown.accuracy = accuracy;
            breakdown.accuracyDescription = accuracyTier.description;
            
            console.log(`   Win Rate: ${accuracy.toFixed(1)}%`);
            console.log(`   Tier: ${accuracyTier.label} (${accuracyTier.description})`);
            console.log(`   Multiplier: ${accuracyTier.multiplier}x`);
            console.log(`   Payment: $${beforeMultiplier} → $${totalPayout.toFixed(2)}\n`);
        } else {
            console.log(`   Win Rate: ${accuracy.toFixed(1)}%`);
            console.log(`   No multiplier applied (accuracy too low)\n`);
        }
        
        // Step 2: Add volume bonus
        console.log('📈 Step 2: Calculating Volume Bonus');
        const volumeBonus = this.getVolumeBonus(tradeData.trades.length);
        if (volumeBonus) {
            totalPayout += volumeBonus.bonus;
            breakdown.volumeBonus = volumeBonus.bonus;
            breakdown.volumeTier = volumeBonus.label;
            breakdown.volumeDescription = volumeBonus.description;
            
            console.log(`   Trade Count: ${tradeData.trades.length}`);
            console.log(`   Tier: ${volumeBonus.label} (${volumeBonus.description})`);
            console.log(`   Bonus: +$${volumeBonus.bonus}\n`);
        } else {
            console.log(`   Trade Count: ${tradeData.trades.length}`);
            console.log(`   No volume bonus (< 200 trades)\n`);
        }
        
        // Step 3: Add capital bonus
        console.log('💎 Step 3: Calculating Capital Bonus');
        const peakCapital = this.calculatePeakCapital(tradeData.trades);
        const capitalBonus = this.getCapitalBonus(peakCapital);
        if (capitalBonus) {
            totalPayout += capitalBonus.bonus;
            breakdown.capitalBonus = capitalBonus.bonus;
            breakdown.capitalTier = capitalBonus.label;
            breakdown.capitalDescription = capitalBonus.description;
            
            console.log(`   Peak Capital: $${peakCapital.toFixed(2)}`);
            console.log(`   Tier: ${capitalBonus.label} (${capitalBonus.description})`);
            console.log(`   Bonus: +$${capitalBonus.bonus}\n`);
        } else {
            console.log(`   Peak Capital: $${peakCapital.toFixed(2)}`);
            console.log(`   No capital bonus (< $10k)\n`);
        }
        
        // Step 4: Add consistency bonus
        console.log('⏰ Step 4: Calculating Consistency Bonus');
        const consistencyBonus = this.calculateConsistencyBonus(tradeData.trades);
        totalPayout += consistencyBonus;
        breakdown.consistencyBonus = consistencyBonus;
        
        const tradingDays = this.countTradingDays(tradeData.trades);
        const tradingSpan = this.calculateTradingSpan(tradeData.trades);
        const consistencyRatio = tradingSpan > 0 ? (tradingDays / tradingSpan) : 0;
        
        console.log(`   Trading Days: ${tradingDays} / ${tradingSpan} days`);
        console.log(`   Consistency Ratio: ${(consistencyRatio * 100).toFixed(1)}%`);
        console.log(`   Bonus: +$${consistencyBonus}\n`);
        
        // Final summary
        console.log('═══════════════════════════════════════════════════════════');
        console.log(`💰 TOTAL PAYOUT: $${totalPayout.toFixed(2)} USDT`);
        console.log('═══════════════════════════════════════════════════════════\n');
        
        return {
            totalPayout: Math.round(totalPayout * 100) / 100, // Round to 2 decimals
            breakdown,
            metrics: {
                accuracy,
                tradeCount: tradeData.trades.length,
                peakCapital,
                tradingDays,
                tradingSpan,
                consistencyRatio
            }
        };
    }
    
    /**
     * Calculate signal accuracy by analyzing trade patterns
     * Groups trades into signals (entry + exit) and calculates win rate
     */
    calculateSignalAccuracy(trades) {
        const signals = this.extractSignals(trades);
        
        if (signals.length === 0) {
            console.log('   ⚠️  No complete signals found in trade history');
            return 0;
        }
        
        const successfulSignals = signals.filter(s => s.profitable).length;
        const accuracy = (successfulSignals / signals.length) * 100;
        
        console.log(`   Total Signals: ${signals.length}`);
        console.log(`   Successful: ${successfulSignals}`);
        console.log(`   Failed: ${signals.length - successfulSignals}`);
        
        return accuracy;
    }
    
    /**
     * Extract trading signals from raw trade data
     * A signal = entry position + exit position(s)
     */
    extractSignals(trades) {
        const signals = [];
        const sortedTrades = [...trades].sort((a, b) => 
            new Date(a.time || a.updateTime) - new Date(b.time || b.updateTime)
        );
        
        // Group trades by symbol
        const tradesBySymbol = {};
        for (const trade of sortedTrades) {
            const symbol = trade.symbol;
            if (!tradesBySymbol[symbol]) {
                tradesBySymbol[symbol] = [];
            }
            tradesBySymbol[symbol].push(trade);
        }
        
        // Extract signals for each symbol
        for (const symbol in tradesBySymbol) {
            const symbolTrades = tradesBySymbol[symbol];
            const symbolSignals = this.extractSignalsForSymbol(symbolTrades);
            signals.push(...symbolSignals);
        }
        
        return signals;
    }
    
    /**
     * Extract signals for a specific symbol
     */
    extractSignalsForSymbol(trades) {
        const signals = [];
        let position = null;
        let positionQty = 0;
        
        for (const trade of trades) {
            const side = (trade.side || '').toUpperCase();
            const qty = Math.abs(parseFloat(trade.qty || trade.quantity || 0));
            const price = parseFloat(trade.price || 0);
            
            if (!side || !qty || !price) continue;
            
            if (!position) {
                // Opening new position
                position = {
                    symbol: trade.symbol,
                    side: side,
                    entryPrice: price,
                    entryQty: qty,
                    entryTime: new Date(trade.time || trade.updateTime),
                    exits: [],
                    totalExitQty: 0
                };
                positionQty = side === 'BUY' ? qty : -qty;
            } else {
                // Check if this is a closing trade
                const isClosing = (position.side === 'BUY' && side === 'SELL') ||
                                 (position.side === 'SELL' && side === 'BUY');
                
                if (isClosing) {
                    position.exits.push({
                        price: price,
                        qty: qty,
                        time: new Date(trade.time || trade.updateTime)
                    });
                    position.totalExitQty += qty;
                    
                    // Update position quantity
                    positionQty += side === 'BUY' ? qty : -qty;
                    
                    // Check if position is fully closed
                    if (Math.abs(positionQty) < 0.0001) {
                        // Calculate if profitable
                        const avgExitPrice = position.exits.reduce((sum, e) => 
                            sum + (e.price * e.qty), 0) / position.totalExitQty;
                        
                        const profitable = position.side === 'BUY' 
                            ? avgExitPrice > position.entryPrice
                            : avgExitPrice < position.entryPrice;
                        
                        const pnlPercent = position.side === 'BUY'
                            ? ((avgExitPrice - position.entryPrice) / position.entryPrice) * 100
                            : ((position.entryPrice - avgExitPrice) / position.entryPrice) * 100;
                        
                        signals.push({
                            ...position,
                            avgExitPrice,
                            profitable,
                            pnlPercent
                        });
                        
                        // Reset for next signal
                        position = null;
                        positionQty = 0;
                    }
                } else {
                    // Adding to position
                    positionQty += side === 'BUY' ? qty : -qty;
                }
            }
        }
        
        return signals;
    }
    
    /**
     * Get accuracy multiplier tier based on win rate
     */
    getAccuracyMultiplier(accuracy) {
        return this.accuracyMultipliers.find(tier => 
            accuracy >= tier.minAccuracy && accuracy <= tier.maxAccuracy
        );
    }
    
    /**
     * Get volume bonus tier based on trade count
     */
    getVolumeBonus(tradeCount) {
        // Find the highest tier that matches
        for (const tier of this.volumeBonuses) {
            if (tradeCount >= tier.minTrades) {
                return tier;
            }
        }
        return null;
    }
    
    /**
     * Get capital bonus tier based on peak capital
     */
    getCapitalBonus(capital) {
        // Find the highest tier that matches
        for (const tier of this.capitalBonuses) {
            if (capital >= tier.minCapital) {
                return tier;
            }
        }
        return null;
    }
    
    /**
     * Calculate consistency bonus based on trading frequency
     */
    calculateConsistencyBonus(trades) {
        const tradingDays = this.countTradingDays(trades);
        const tradingSpan = this.calculateTradingSpan(trades);
        
        if (tradingSpan === 0) return 0;
        
        const consistencyRatio = tradingDays / tradingSpan;
        
        // Award bonus based on consistency
        if (consistencyRatio >= 0.8) return 25;  // Trading 80%+ of days
        if (consistencyRatio >= 0.6) return 15;  // Trading 60-79% of days
        if (consistencyRatio >= 0.4) return 10;  // Trading 40-59% of days
        if (consistencyRatio >= 0.2) return 5;   // Trading 20-39% of days
        return 0;
    }
    
    /**
     * Generate detailed payout report
     */
    generateEnhancedReport(validationResult) {
        const baseReport = super.generateReport(validationResult);
        
        return {
            ...baseReport,
            enhancedPayout: validationResult.enhancedPayout,
            paymentBreakdown: validationResult.paymentBreakdown,
            accuracyMetrics: {
                winRate: validationResult.enhancedPayout?.metrics?.accuracy || 0,
                totalSignals: validationResult.enhancedPayout?.breakdown?.totalSignals || 0,
                successfulSignals: validationResult.enhancedPayout?.breakdown?.successfulSignals || 0
            },
            bonuses: {
                volume: validationResult.paymentBreakdown?.volumeBonus || 0,
                capital: validationResult.paymentBreakdown?.capitalBonus || 0,
                consistency: validationResult.paymentBreakdown?.consistencyBonus || 0
            }
        };
    }
}

module.exports = EnhancedPayoutValidator;
