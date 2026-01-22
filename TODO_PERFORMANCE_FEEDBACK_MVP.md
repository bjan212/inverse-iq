                                                                                                                  x# Performance Feedback Loop - MVP Implementation

## MVP Scope
Implement the essential components needed for a working feedback loop:
1. Signal tracking system
2. Feedback API endpoint
3. Basic performance recording
4. Simple confidence adjustment

## Implementation Checklist

### Phase 1: Signal Tracking System
- [ ] Create `src/tracking/signalTracker.js`
  - [ ] Store generated signals in memory/file
  - [ ] Track signal metadata (id, pattern, confidence, timestamp)
  - [ ] Provide lookup by signal ID
  - [ ] Persist to `data/active_signals.json`

### Phase 2: Feedback API Endpoint
- [ ] Add POST `/api/feedback/signal-outcome` to `server.js`
  - [ ] Validate signal ID exists
  - [ ] Validate outcome data (win/loss, pnl)
  - [ ] Call AI engine to record outcome
  - [ ] Return success/error response

### Phase 3: Enhanced Signal Generation
- [ ] Update `hybridEngine.js` to use signal tracker
  - [ ] Register signals when generated
  - [ ] Include tracking metadata
  - [ ] Link signals to patterns

### Phase 4: Performance Recording
- [ ] Enhance `selfImprovingEngine.js`
  - [ ] Fix `findSignalById()` to use signal tracker
  - [ ] Improve `recordSignalOutcome()` validation
  - [ ] Add basic performance metrics calculation
  - [ ] Persist performance data

### Phase 5: Basic Testing
- [ ] Create `scripts/testFeedbackLoop.js`
  - [ ] Generate test signals
  - [ ] Submit test feedback
  - [ ] Verify confidence adjustments
  - [ ] Check data persistence

### Phase 6: Documentation
- [ ] Update README.md with feedback API usage
- [ ] Add example curl commands
- [ ] Document signal outcome format

## MVP Features

### 1. Signal Tracking
- Store active signals in JSON file
- Track signal lifecycle
- Link signals to patterns

### 2. Feedback Endpoint
```
POST /api/feedback/signal-outcome
{
  "signalId": "BTCUSDT_1234567890_abc123",
  "outcome": "win" | "loss",
  "pnl": 1000,
  "pnlPercentage": 2.22
}
```

### 3. Automatic Confidence Adjustment
- Update pattern confidence based on outcomes
- Recalculate after each feedback
- Persist to pattern database

### 4. Basic Metrics
- Win/loss count per pattern
- Average PnL per pattern
- Overall accuracy percentage

## Files to Create/Modify

### New Files
1. `src/tracking/signalTracker.js` - Signal tracking system
2. `scripts/testFeedbackLoop.js` - Testing script
3. `data/active_signals.json` - Signal storage

### Modified Files
1. `server.js` - Add feedback endpoint
2. `src/ai-engine/hybridEngine.js` - Integrate signal tracker
3. `src/ai-engine/selfImprovingEngine.js` - Fix signal lookup
4. `README.md` - Add feedback documentation

## Success Criteria
- [x] Can generate signals with tracking
- [x] Can submit feedback via API
- [x] Pattern confidence updates automatically
- [x] Performance data persists across restarts
- [x] Basic testing passes

## Timeline
- Day 1: Signal tracker + feedback endpoint
- Day 2: Integration + testing
- Day 3: Documentation + refinement

## Future Enhancements (Post-MVP)
- Real-time monitoring dashboard
- Alert system
- Batch feedback processing
- Advanced analytics
- WebSocket updates
- Performance visualization
