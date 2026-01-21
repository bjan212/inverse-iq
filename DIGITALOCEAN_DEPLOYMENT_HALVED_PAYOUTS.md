# 🚀 DigitalOcean Deployment Guide - Halved Payout System

## Quick Deployment Steps

### 1. Replace the Enhanced Payout Validator

```bash
# SSH into your DigitalOcean droplet
ssh root@your-droplet-ip

# Navigate to your project directory


 
# Backup the current validator
cp src/validators/enhancedPayoutValidator.js src/validators/enhancedPayoutValidator.backup.js


# Replace with halved version
cp src/validators/enhancedPayoutValidator_halved.js src/validators/enhancedPayoutValidator.js

# Verify the change
cat src/validators/enhancedPayoutValidator.js | grep "payment: 20"
# Should show: { minScore: 85, maxScore: 100, payment: 20, label: 'EXCELLENT' }
```

### 2. Restart the Service

```bash
# If using PM2
pm2 restart trading-service

# If using systemd
sudo systemctl restart trading-service

# If using Docker
docker-compose restart

# Verify it's running
pm2 status
# or=**********************************************************************************************
sudo systemctl status trading-service z
```

### 3. Test the Deployment

```bash
# Run the halved payout tests
node scripts/testEnhancedPayouts_halved.js

# Check the logs
pm2 logs trading-service --lines 50
```x                                                                                                                                                                                                                                                                                                                §

### 4. Verify Payout Calculationsxxxxxxxxxx

```bash
# Test with a sample submission (replace with actual data)
curl -X POST http://your-domain.com/api/submit-data \QQQQ\=8
  -H "Content-Type: application/json" \2222222222222222222 §§§§§§§§§§§§§§§§§§§§§§AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA§§§§§§§§§§§§§§QQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAASSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS```````````````````````````````````````````````````
  -d '{§§§§
    "submissionId": "TEST123",
    "exchange": "binance",§§§§x
    "trades": [...]
  }'

# Check the response - payouts should be halved§
```

## Rollback Plan (If Needed)

```bash
# Restore the original validator
cp src/validators/enhancedPayoutValidator.backup.js src/validators/enhancedPayoutValidator.js

# Restart service
pm2 restart trading-service

# Verify rollback
pm2 logs trading-service
```

## Environment Variables (No Changes Needed)

The halved payout system uses the same environment variables:
- `PAYMENT_CURRENCY=USDT`
- `MIN_PAYOUT_AMOUNT=5` (was 10, now 5 due to halving)
- All other settings remain the same

## Monitoring

```bash
# Monitor real-time logs
pm2 logs trading-service --lines 100

# Check for errors
pm2 logs trading-service --err

# Monitor system resources
pm2 monit
```

## Database Updates (Optional)

If you want to track the payout version:

```sql
-- Add a version field to track payout calculations
ALTER TABLE submissions ADD COLUMN payout_version VARCHAR(10) DEFAULT 'v2_halved';

-- Update existing records (optional)
UPDATE submissions SET payout_version = 'v1_original' WHERE created_at < '2024-01-15';
```

## Verification Checklist

- [ ] Backup created successfully
- [ ] New validator file deployed
- [ ] Service restarted without errors
- [ ] Test submissions show halved payouts
- [ ] Logs show no errors
- [ ] Database connections working
- [ ] API endpoints responding correctly
- [ ] Payment calculations accurate

## Expected Payout Changes

| Trader Type | Old Payout | New Payout | Change |
|-------------|------------|------------|--------|
| Elite (92% accuracy, 1200 trades, $55k) | $295 | $147.50 | -50% |
| Master (87% accuracy, 600 trades, $25k) | $152.50 | $76.25 | -50% |
| Advanced (77% accuracy, 350 trades, $8k) | $72.50 | $36.25 | -50% |
| Basic (65% accuracy, 50 trades, $800) | $25 | $12.50 | -50% |

## Support

If you encounter issues:
1. Check logs: `pm2 logs trading-service`
2. Verify file permissions: `ls -la src/validators/`
3. Test locally first: `node scripts/testEnhancedPayouts_halved.js`
4. Rollback if needed using the backup

## Deployment Complete! 🎉

Your DigitalOcean instance is now running the halved payout system. All new submissions will be calculated with the reduced payout structure.
