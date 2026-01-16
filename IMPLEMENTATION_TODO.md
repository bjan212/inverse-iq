# Implementation TODO - Signal Enhancement & Notification Fixes

## Requirements Summary

### 1. Subscription System (Real-time Trade Setups)
✅ Already exists - Users can subscribe to receive signals via email/Telegram

### 2. Notification Issues to Fix
- **Problem**: Duplicate notifications (both email AND Telegram firing non-stop)
- **Solution**: 
  - Send ONE notification per signal when pattern emerges
  - Include validity timer in notification
  - Add deduplication logic
  - Track notification history per signal

### 3. New Fields to Add
- Average Entry Price
- Stop Loss
- Take Profit 1 (TP1)
- Take Profit 2 (TP2)
- Exit Price (when closed)

### 4. Calculation Logic
- **Automatic calculation** based on:
  - Risk level
  - Confidence score
  - Time frame analysis
  - Inverse pattern metrics
  - Provable historical data

### 5. Future Feature (Note for later)
- Web3 decentralized copy trading system for DeFi futures

---

## Implementation Plan

### Phase 1: Fix Duplicate Notifications (HIGH PRIORITY)
- [ ] Add signal notification tracking to prevent duplicates
- [ ] Implement "one notification per signal" logic
- [ ] Add notification cooldown period
- [ ] Update NotificationManager with deduplication

### Phase 2: Add New Fields to Signal Structure
- [ ] Update SignalTracker with new fields
- [ ] Add calculation methods to HybridEngine
- [ ] Include validity timer/expiration display

### Phase 3: Update Notification Templates
- [ ] Add trading levels to email template
- [ ] Add trading levels to Telegram message
- [ ] Include validity timer in notifications
- [ ] Add "signal expires in X hours" display

### Phase 4: Implement Smart Calculations
- [ ] Risk-based stop loss calculation
- [ ] Confidence-based take profit calculation
- [ ] Time frame analysis integration
- [ ] Historical pattern-based adjustments

### Phase 5: Update API & Frontend
- [ ] Ensure API includes new fields
- [ ] Update signals page display
- [ ] Add admin monitoring for notifications

---

## Files to Modify

### Core Logic
1. `src/tracking/signalTracker.js` - Add notification tracking
2. `src/ai-engine/hybridEngine.js` - Add calculation logic
3. `src/notifications/notificationManager.js` - Fix duplicates

### Notification System
4. `src/notifications/emailService.js` - Update template
5. `src/notifications/telegramService.js` - Update message

### API & Frontend
6. `server.js` - Verify API responses
7. `public/signals.html` - Display new fields

---

## Priority Order

1. **CRITICAL**: Fix duplicate notifications
2. **HIGH**: Add new fields to signal structure
3. **HIGH**: Update notification templates
4. **MEDIUM**: Implement calculation logic
5. **LOW**: Frontend display updates

---

## Testing Checklist

- [ ] Test notification deduplication
- [ ] Verify only ONE notification per signal
- [ ] Test email notifications with new fields
- [ ] Test Telegram notifications with new fields
- [ ] Verify API responses include new fields
- [ ] Test calculation accuracy
- [ ] Verify validity timer works correctly
