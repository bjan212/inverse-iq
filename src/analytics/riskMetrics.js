/**
 * Risk Metrics Module
 * 
 * Provides comprehensive risk management calculations including:
 * - Position sizing (Kelly Criterion, Fixed Fractional, Volatility-Adjusted)
 * - Portfolio risk (VaR, CVaR, Max Drawdown, Sharpe/Sortino Ratios)
 * - Correlation analysis and diversification
 * - Leverage and margin calculations
 */

class RiskMetrics {
  constructor() {
    this.riskFreeRate = 0.02; // 2% annual risk-free rate
  }

  /**
   * POSITION SIZING METHODS
   */

  /**
   * Calculate Kelly Criterion position size
   * @param {number} winRate - Win rate (0-1)
   * @param {number} avgWin - Average win amount
   * @param {number} avgLoss - Average loss amount
   * @param {number} capital - Total capital
   * @returns {object} Position sizing recommendation
   */
  calculateKellyPosition(winRate, avgWin, avgLoss, capital) {
    const lossRate = 1 - winRate;
    
    // Kelly % = (Win% * AvgWin - Loss% * AvgLoss) / AvgWin
    const kellyPercent = (winRate * avgWin - lossRate * avgLoss) / avgWin;
    
    // Use fractional Kelly (0.25) for safety - full Kelly is too aggressive
    const fractionalKelly = kellyPercent * 0.25;
    
    // Calculate position size (cap at 10% of capital)
    const positionSize = capital * Math.max(0, Math.min(fractionalKelly, 0.1));
    
    return {
      kellyPercent: (kellyPercent * 100).toFixed(2),
      fractionalKelly: (fractionalKelly * 100).toFixed(2),
      recommendedSize: positionSize.toFixed(2),
      maxRisk: (positionSize * 0.02).toFixed(2), // 2% max risk per trade
      interpretation: this.interpretKelly(kellyPercent)
    };
  }

  interpretKelly(kellyPercent) {
    if (kellyPercent <= 0) return 'Negative edge - Do not trade';
    if (kellyPercent < 0.05) return 'Very small edge - Trade cautiously';
    if (kellyPercent < 0.15) return 'Moderate edge - Standard position';
    if (kellyPercent < 0.25) return 'Strong edge - Larger position';
    return 'Very strong edge - Maximum position (with caution)';
  }

  /**
   * Calculate Fixed Fractional position size
   * @param {number} riskPerTrade - Risk per trade as decimal (e.g., 0.02 for 2%)
   * @param {number} capital - Total capital
   * @param {number} stopLossPercent - Stop loss as decimal
   * @returns {object} Position size
   */
  calculateFixedFractional(riskPerTrade, capital, stopLossPercent) {
    const riskAmount = capital * riskPerTrade;
    const positionSize = riskAmount / stopLossPercent;
    
    return {
      riskAmount: riskAmount.toFixed(2),
      positionSize: positionSize.toFixed(2),
      stopLossPercent: (stopLossPercent * 100).toFixed(2),
      maxLoss: riskAmount.toFixed(2)
    };
  }

  /**
   * Calculate Volatility-Adjusted position size
   * @param {number} atr - Average True Range
   * @param {number} capital - Total capital
   * @param {number} riskTolerance - Risk tolerance (0-1)
   * @returns {object} Position size
   */
  calculateVolatilityAdjusted(atr, capital, riskTolerance = 0.02) {
    const volatilityFactor = 1 / atr;
    const basePosition = capital * riskTolerance;
    const adjustedPosition = basePosition * volatilityFactor;
    
    return {
      basePosition: basePosition.toFixed(2),
      volatilityFactor: volatilityFactor.toFixed(4),
      adjustedPosition: adjustedPosition.toFixed(2),
      atr: atr.toFixed(2)
    };
  }

  /**
   * PORTFOLIO RISK METHODS
   */

  /**
   * Calculate Portfolio Value at Risk (VaR)
   * @param {Array} positions - Array of position objects with returns
   * @param {number} confidence - Confidence level (e.g., 0.95 for 95%)
   * @returns {object} VaR calculation
   */
  calculatePortfolioVaR(positions, confidence = 0.95) {
    if (!positions || positions.length === 0) {
      return { var: 0, confidence: confidence * 100, interpretation: 'No positions' };
    }

    // Extract returns from positions
    const returns = positions.map(p => p.return || 0);
    
    // Sort returns
    const sortedReturns = returns.sort((a, b) => a - b);
    
    // Find VaR at confidence level
    const varIndex = Math.floor((1 - confidence) * sortedReturns.length);
    const var95 = Math.abs(sortedReturns[varIndex] || 0);
    
    return {
      var: var95.toFixed(4),
      confidence: (confidence * 100).toFixed(0),
      interpretation: `${(confidence * 100).toFixed(0)}% confident losses won't exceed ${(var95 * 100).toFixed(2)}%`,
      worstCase: sortedReturns[0]?.toFixed(4) || 0
    };
  }

  /**
   * Calculate Conditional Value at Risk (CVaR) - Expected Shortfall
   * @param {Array} positions - Array of position objects
   * @param {number} confidence - Confidence level
   * @returns {object} CVaR calculation
   */
  calculatePortfolioCVaR(positions, confidence = 0.95) {
    if (!positions || positions.length === 0) {
      return { cvar: 0, confidence: confidence * 100 };
    }

    const returns = positions.map(p => p.return || 0);
    const sortedReturns = returns.sort((a, b) => a - b);
    
    // Calculate average of returns below VaR threshold
    const varIndex = Math.floor((1 - confidence) * sortedReturns.length);
    const tailReturns = sortedReturns.slice(0, varIndex + 1);
    const cvar = Math.abs(tailReturns.reduce((sum, r) => sum + r, 0) / tailReturns.length);
    
    return {
      cvar: cvar.toFixed(4),
      confidence: (confidence * 100).toFixed(0),
      interpretation: `Average loss in worst ${((1 - confidence) * 100).toFixed(0)}% of cases: ${(cvar * 100).toFixed(2)}%`
    };
  }

  /**
   * Calculate Maximum Drawdown
   * @param {Array} equityCurve - Array of equity values over time
   * @returns {object} Drawdown metrics
   */
  calculateMaxDrawdown(equityCurve) {
    if (!equityCurve || equityCurve.length === 0) {
      return { maxDrawdown: 0, maxDrawdownPercent: 0, peak: 0, trough: 0 };
    }

    let maxDrawdown = 0;
    let peak = equityCurve[0];
    let peakIndex = 0;
    let troughIndex = 0;
    
    for (let i = 0; i < equityCurve.length; i++) {
      if (equityCurve[i] > peak) {
        peak = equityCurve[i];
        peakIndex = i;
      }
      
      const drawdown = (peak - equityCurve[i]) / peak;
      
      if (drawdown > maxDrawdown) {
        maxDrawdown = drawdown;
        troughIndex = i;
      }
    }
    
    return {
      maxDrawdown: maxDrawdown.toFixed(4),
      maxDrawdownPercent: (maxDrawdown * 100).toFixed(2),
      peak: peak.toFixed(2),
      peakIndex,
      troughIndex,
      interpretation: `Maximum peak-to-trough decline: ${(maxDrawdown * 100).toFixed(2)}%`
    };
  }

  /**
   * Calculate Sharpe Ratio
   * @param {Array} returns - Array of returns
   * @param {number} riskFreeRate - Risk-free rate (annual)
   * @returns {object} Sharpe ratio
   */
  calculateSharpeRatio(returns, riskFreeRate = null) {
    if (!returns || returns.length === 0) {
      return { sharpe: 0, interpretation: 'No data' };
    }

    const rfRate = riskFreeRate !== null ? riskFreeRate : this.riskFreeRate;
    
    // Calculate average return
    const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    
    // Calculate standard deviation
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length;
    const stdDev = Math.sqrt(variance);
    
    // Sharpe = (Avg Return - Risk Free Rate) / Std Dev
    const sharpe = stdDev !== 0 ? (avgReturn - rfRate) / stdDev : 0;
    
    return {
      sharpe: sharpe.toFixed(2),
      avgReturn: (avgReturn * 100).toFixed(2),
      stdDev: (stdDev * 100).toFixed(2),
      interpretation: this.interpretSharpe(sharpe)
    };
  }

  interpretSharpe(sharpe) {
    if (sharpe < 0) return 'Poor - Returns below risk-free rate';
    if (sharpe < 1) return 'Sub-optimal - Low risk-adjusted returns';
    if (sharpe < 2) return 'Good - Acceptable risk-adjusted returns';
    if (sharpe < 3) return 'Very Good - Strong risk-adjusted returns';
    return 'Excellent - Outstanding risk-adjusted returns';
  }

  /**
   * Calculate Sortino Ratio (only penalizes downside volatility)
   * @param {Array} returns - Array of returns
   * @param {number} targetReturn - Target return threshold
   * @returns {object} Sortino ratio
   */
  calculateSortinoRatio(returns, targetReturn = 0) {
    if (!returns || returns.length === 0) {
      return { sortino: 0, interpretation: 'No data' };
    }

    const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    
    // Calculate downside deviation (only negative returns)
    const downsideReturns = returns.filter(r => r < targetReturn);
    const downsideVariance = downsideReturns.reduce((sum, r) => 
      sum + Math.pow(r - targetReturn, 2), 0) / returns.length;
    const downsideDeviation = Math.sqrt(downsideVariance);
    
    const sortino = downsideDeviation !== 0 ? (avgReturn - targetReturn) / downsideDeviation : 0;
    
    return {
      sortino: sortino.toFixed(2),
      avgReturn: (avgReturn * 100).toFixed(2),
      downsideDeviation: (downsideDeviation * 100).toFixed(2),
      interpretation: this.interpretSortino(sortino)
    };
  }

  interpretSortino(sortino) {
    if (sortino < 0) return 'Poor - Negative risk-adjusted returns';
    if (sortino < 1) return 'Below Average';
    if (sortino < 2) return 'Good';
    if (sortino < 3) return 'Very Good';
    return 'Excellent';
  }

  /**
   * POSITION RISK METHODS
   */

  /**
   * Calculate position risk
   * @param {number} entry - Entry price
   * @param {number} stopLoss - Stop loss price
   * @param {number} size - Position size
   * @returns {object} Risk metrics
   */
  calculatePositionRisk(entry, stopLoss, size) {
    const riskPerUnit = Math.abs(entry - stopLoss);
    const totalRisk = riskPerUnit * size;
    const riskPercent = (riskPerUnit / entry) * 100;
    
    return {
      riskPerUnit: riskPerUnit.toFixed(2),
      totalRisk: totalRisk.toFixed(2),
      riskPercent: riskPercent.toFixed(2),
      stopLoss: stopLoss.toFixed(2)
    };
  }

  /**
   * Calculate Risk/Reward Ratio
   * @param {number} entry - Entry price
   * @param {number} stopLoss - Stop loss price
   * @param {number} takeProfit - Take profit price
   * @returns {object} R:R ratio
   */
  calculateRiskRewardRatio(entry, stopLoss, takeProfit) {
    const risk = Math.abs(entry - stopLoss);
    const reward = Math.abs(takeProfit - entry);
    const ratio = risk !== 0 ? reward / risk : 0;
    
    return {
      risk: risk.toFixed(2),
      reward: reward.toFixed(2),
      ratio: ratio.toFixed(2),
      interpretation: this.interpretRR(ratio)
    };
  }

  interpretRR(ratio) {
    if (ratio < 1) return 'Poor - Risk exceeds reward';
    if (ratio < 1.5) return 'Below Average - Minimal reward advantage';
    if (ratio < 2) return 'Acceptable - Standard risk/reward';
    if (ratio < 3) return 'Good - Favorable risk/reward';
    return 'Excellent - High reward potential';
  }

  /**
   * Calculate break-even price including fees
   * @param {number} entry - Entry price
   * @param {number} fees - Total fees as decimal (e.g., 0.001 for 0.1%)
   * @param {number} leverage - Leverage multiplier
   * @returns {object} Break-even calculation
   */
  calculateBreakEvenPrice(entry, fees, leverage = 1) {
    const totalFees = entry * fees * 2; // Entry + Exit fees
    const breakEven = entry + (totalFees / leverage);
    
    return {
      entry: entry.toFixed(2),
      breakEven: breakEven.toFixed(2),
      fees: totalFees.toFixed(2),
      moveRequired: ((breakEven - entry) / entry * 100).toFixed(2)
    };
  }

  /**
   * CORRELATION & DIVERSIFICATION
   */

  /**
   * Calculate correlation matrix for assets
   * @param {Array} assets - Array of asset objects with returns
   * @param {number} period - Period for calculation
   * @returns {object} Correlation matrix
   */
  calculateCorrelationMatrix(assets, period = 30) {
    if (!assets || assets.length < 2) {
      return { matrix: [], interpretation: 'Need at least 2 assets' };
    }

    const matrix = [];
    
    for (let i = 0; i < assets.length; i++) {
      const row = [];
      for (let j = 0; j < assets.length; j++) {
        if (i === j) {
          row.push(1.0);
        } else {
          const correlation = this.calculateCorrelation(
            assets[i].returns || [],
            assets[j].returns || []
          );
          row.push(correlation);
        }
      }
      matrix.push(row);
    }
    
    return {
      matrix,
      assets: assets.map(a => a.symbol),
      avgCorrelation: this.calculateAvgCorrelation(matrix),
      interpretation: 'Correlation matrix (1 = perfect correlation, -1 = perfect inverse)'
    };
  }

  calculateCorrelation(returns1, returns2) {
    if (returns1.length !== returns2.length || returns1.length === 0) {
      return 0;
    }

    const n = returns1.length;
    const mean1 = returns1.reduce((sum, r) => sum + r, 0) / n;
    const mean2 = returns2.reduce((sum, r) => sum + r, 0) / n;
    
    let numerator = 0;
    let sum1Sq = 0;
    let sum2Sq = 0;
    
    for (let i = 0; i < n; i++) {
      const diff1 = returns1[i] - mean1;
      const diff2 = returns2[i] - mean2;
      numerator += diff1 * diff2;
      sum1Sq += diff1 * diff1;
      sum2Sq += diff2 * diff2;
    }
    
    const denominator = Math.sqrt(sum1Sq * sum2Sq);
    return denominator !== 0 ? numerator / denominator : 0;
  }

  calculateAvgCorrelation(matrix) {
    let sum = 0;
    let count = 0;
    
    for (let i = 0; i < matrix.length; i++) {
      for (let j = i + 1; j < matrix[i].length; j++) {
        sum += Math.abs(matrix[i][j]);
        count++;
      }
    }
    
    return count > 0 ? (sum / count).toFixed(2) : 0;
  }

  /**
   * Calculate portfolio beta
   * @param {Array} positions - Portfolio positions
   * @param {Array} marketReturns - Market index returns
   * @returns {object} Beta calculation
   */
  calculatePortfolioBeta(positions, marketReturns) {
    if (!positions || !marketReturns || positions.length === 0) {
      return { beta: 1, interpretation: 'No data' };
    }

    const portfolioReturns = positions.map(p => p.return || 0);
    const correlation = this.calculateCorrelation(portfolioReturns, marketReturns);
    
    const portfolioStdDev = this.calculateStdDev(portfolioReturns);
    const marketStdDev = this.calculateStdDev(marketReturns);
    
    const beta = marketStdDev !== 0 ? 
      (correlation * portfolioStdDev) / marketStdDev : 1;
    
    return {
      beta: beta.toFixed(2),
      interpretation: this.interpretBeta(beta)
    };
  }

  interpretBeta(beta) {
    if (beta < 0) return 'Inverse to market';
    if (beta < 0.5) return 'Low volatility - Less volatile than market';
    if (beta < 1) return 'Moderate volatility - Somewhat less volatile than market';
    if (beta === 1) return 'Market volatility - Moves with market';
    if (beta < 1.5) return 'High volatility - More volatile than market';
    return 'Very high volatility - Significantly more volatile than market';
  }

  calculateStdDev(returns) {
    if (!returns || returns.length === 0) return 0;
    
    const mean = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / returns.length;
    return Math.sqrt(variance);
  }

  /**
   * LEVERAGE & MARGIN
   */

  /**
   * Calculate effective leverage
   * @param {Array} positions - Array of positions
   * @param {number} capital - Total capital
   * @returns {object} Leverage metrics
   */
  calculateEffectiveLeverage(positions, capital) {
    if (!positions || positions.length === 0 || capital === 0) {
      return { leverage: 0, exposure: 0 };
    }

    const totalExposure = positions.reduce((sum, p) => 
      sum + (p.size * p.price * (p.leverage || 1)), 0);
    
    const leverage = totalExposure / capital;
    
    return {
      leverage: leverage.toFixed(2),
      exposure: totalExposure.toFixed(2),
      capital: capital.toFixed(2),
      interpretation: this.interpretLeverage(leverage)
    };
  }

  interpretLeverage(leverage) {
    if (leverage < 1) return 'Conservative - Under-leveraged';
    if (leverage < 2) return 'Low - Safe leverage';
    if (leverage < 5) return 'Moderate - Standard leverage';
    if (leverage < 10) return 'High - Risky leverage';
    return 'Very High - Dangerous leverage';
  }

  /**
   * Calculate liquidation price
   * @param {number} entry - Entry price
   * @param {number} leverage - Leverage multiplier
   * @param {string} side - 'LONG' or 'SHORT'
   * @returns {object} Liquidation price
   */
  calculateLiquidationPrice(entry, leverage, side) {
    const maintenanceMargin = 0.005; // 0.5% maintenance margin
    
    let liquidationPrice;
    if (side === 'LONG') {
      liquidationPrice = entry * (1 - (1 / leverage) + maintenanceMargin);
    } else {
      liquidationPrice = entry * (1 + (1 / leverage) - maintenanceMargin);
    }
    
    const distancePercent = Math.abs((liquidationPrice - entry) / entry) * 100;
    
    return {
      liquidationPrice: liquidationPrice.toFixed(2),
      entry: entry.toFixed(2),
      distancePercent: distancePercent.toFixed(2),
      leverage: leverage,
      side,
      warning: leverage > 10 ? 'DANGER: Very high leverage!' : null
    };
  }
}

module.exports = RiskMetrics;
