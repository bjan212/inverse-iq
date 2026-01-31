# Trade Analyzer Guide

## Overview

The Trade Analyzer is an advanced feature that allows users to connect their exchange APIs and receive intelligent recommendations based on their open trades. The system analyzes margin balance, timeframe, trade setup, direction, and engine metrics to provide personalized trading advice.

## Key Features

### 1. Exchange API Integration

- Connect multiple cryptocurrency exchanges (Binance, Bybit, OKX, MEXC)
- Securely store API keys for automated data retrieval
- Real-time access to account balances and open positions

### 2. Position Analysis

- Comprehensive analysis of all open positions
- Risk assessment based on position size, leverage, and market conditions
- Position-specific recommendations for risk management

### 3. Risk Metrics

- Overall portfolio risk score (0-100)
- Maximum drawdown estimation
- Position-to-balance ratio analysis
- Leverage risk evaluation

### 4. AI-Driven Recommendations

- Personalized trading recommendations based on:
  - Historical performance data from the Signal Accountability System
  - Current market conditions
  - Account balance and margin utilization
  - Position size and leverage
  - Risk tolerance parameters

### 5. Performance Integration

- Integration with the Signal Performance Tracker
- Symbol-specific win rates influence recommendations
- Pattern performance data enhances decision-making

## How It Works

### 1. Connect Exchange APIs

Users connect their exchange accounts by providing API keys through the Trade Analyzer interface. These keys are securely stored and used to retrieve account information and open positions.

### 2. Analyze Open Trades

The system retrieves open positions from all connected exchanges and analyzes them based on:

- Position size relative to account balance
- Leverage used
- Distance to liquidation price
- Unrealized profit/loss
- Historical performance of the symbol

### 3. Generate Recommendations

Based on the analysis, the system generates:

- Overall portfolio recommendations
- Exchange-specific recommendations
- Position-specific recommendations

### 4. Track Analysis History

All analyses are saved to provide a historical record of recommendations and portfolio risk over time.

## Risk Assessment

The Trade Analyzer calculates risk using several key metrics:

### Risk Score (0-100)

A comprehensive risk score based on:
- 50% - Position size relative to balance
- 30% - Leverage used
- 20% - Position diversification

### Risk Levels

- **Very Low (0-20)**: Extremely conservative portfolio with significant room for increased exposure
- **Low (21-40)**: Conservative risk exposure with opportunity to increase position sizes
- **Moderate (41-60)**: Acceptable risk parameters but requires close monitoring
- **High (61-80)**: Excessive exposure that exceeds recommended risk parameters
- **Critical (81-100)**: Significant risk of substantial losses requiring immediate position reduction

### Maximum Drawdown

Estimated maximum portfolio drawdown based on position sizes and leverage.

## Using the Trade Analyzer

### 1. Dashboard

The dashboard provides an overview of:
- Connected exchanges
- Open positions
- Overall risk level
- Latest recommendation

### 2. Exchange Connections

Manage your exchange API connections:
- Add new exchanges
- View connected exchanges
- Remove exchange connections

### 3. Open Positions

View all open positions across connected exchanges:
- Symbol
- Direction (Long/Short)
- Size
- Entry price
- Leverage
- Unrealized PnL

### 4. Trade Analysis

Run a comprehensive analysis of your open trades:
- Overall recommendation
- Risk assessment
- Exchange-specific analysis
- Position-specific recommendations

### 5. Analysis History

View historical analyses to track how your portfolio risk has changed over time.

## Security Considerations

- API keys are stored securely and should have read-only permissions
- No trading permissions are required for the Trade Analyzer
- For OKX, a passphrase is required in addition to API key and secret

## Integration with Signal Accountability System

The Trade Analyzer integrates with the Signal Accountability System to enhance recommendations:

- Symbol-specific win rates influence position recommendations
- Pattern performance data helps identify high-probability setups
- Historical performance metrics guide risk management decisions

## Best Practices

1. **Use Read-Only API Keys**: Only provide API keys with read-only permissions to ensure security.

2. **Regular Analysis**: Run analysis regularly to keep track of your portfolio risk, especially during volatile market conditions.

3. **Follow Risk Management Guidelines**: Pay attention to the risk assessment and consider reducing exposure when risk levels are high.

4. **Diversify Positions**: Maintain a diversified portfolio to reduce overall risk.

5. **Monitor Leverage**: Keep leverage at reasonable levels to avoid liquidation during market volatility.

## Technical Implementation

The Trade Analyzer consists of several components:

1. **TradeAnalyzer Class** (`src/analytics/tradeAnalyzer.js`):
   - Core logic for analyzing trades
   - Exchange connector implementations
   - Risk calculation algorithms

2. **API Endpoints** (in `server.js`):
   - `/api/trade-analyzer/api-keys` - Manage API keys
   - `/api/trade-analyzer/exchanges/:userId` - Get connected exchanges
   - `/api/trade-analyzer/positions/:userId` - Get open positions
   - `/api/trade-analyzer/account/:userId` - Get account information
   - `/api/trade-analyzer/analyze/:userId` - Analyze open trades
   - `/api/trade-analyzer/history/:userId` - Get analysis history

3. **User Interface** (`public/trade-analyzer.html`):
   - Dashboard for viewing analysis results
   - Forms for managing exchange connections
   - Tables for displaying positions and recommendations

## Conclusion

The Trade Analyzer provides a powerful tool for traders to manage risk and optimize their trading strategies. By connecting exchange APIs and leveraging the performance data from the Signal Accountability System, users can make more informed trading decisions and improve their overall trading performance.
