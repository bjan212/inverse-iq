# Deploying the Signal Accountability System to DigitalOcean

This guide provides step-by-step instructions for deploying the Signal Accountability System to your DigitalOcean droplet. The system will continuously track trading signals for two randomly selected pairs, providing real-time performance metrics and verification.

## Prerequisites

- A running DigitalOcean droplet with Node.js installed
- PM2 process manager installed (`npm install -g pm2`)
- Git access to the repository

## Deployment Steps

### 1. Clone or Update the Repository

If you haven't already cloned the repository to your droplet:

```bash
git clone https://github.com/your-repo/trading-data-collection-service.git
cd trading-data-collection-service
```

If you already have the repository, pull the latest changes:

```bash
cd trading-data-collection-service
git pull origin main
```

### 2. Install Dependencies

Make sure all dependencies are installed:

```bash
npm install
```

### 3. Configure the System

Create necessary directories for data and logs:

```bash
mkdir -p data logs
```

### 4. Start the Signal Accountability System

Use PM2 to start the main server and the auto-tracking script:

```bash
# Start the main server if not already running
pm2 start server.js --name trading-server

# Start the auto-tracking script for random pairs
pm2 start scripts/autoTrackRandomPairs.js --name signal-tracker
```

### 5. Configure PM2 to Start on System Boot

Ensure the processes restart automatically if the droplet reboots:

```bash
pm2 save
pm2 startup
```

Follow the instructions provided by the `pm2 startup` command to complete the setup.

### 6. Monitor the System

You can monitor the running processes with:

```bash
pm2 list
pm2 logs signal-tracker
```

The auto-tracking script will:
- Select two random trading pairs to track
- Rotate the pairs every 24 hours
- Log performance statistics to `logs/auto_track.log`
- Store performance data in the `data` directory

### 7. Access the Performance Dashboard

The performance dashboard is available at:

```
http://your-droplet-ip/signal-performance.html
```

This dashboard provides real-time performance metrics, including:
- Overall win rate and PnL
- Symbol-specific performance
- Pattern-specific performance
- Signal verification

## Customizing the Configuration

You can customize the auto-tracking behavior by editing `scripts/autoTrackRandomPairs.js`:

- `availablePairs`: List of trading pairs to select from
- `pairsToTrack`: Number of pairs to track simultaneously (default: 2)
- `checkInterval`: How often to check for new signals (default: 1 minute)
- `rotateInterval`: How often to rotate pairs (default: 24 hours)

After making changes, restart the process:

```bash
pm2 restart signal-tracker
```

## Troubleshooting

### Logs

Check the logs for any errors:

```bash
pm2 logs signal-tracker
cat logs/auto_track.log
```

### Data Files

Examine the data files to ensure they're being updated:

```bash
ls -la data/
```

### Restarting the System

If you encounter issues, you can restart the entire system:

```bash
pm2 restart all
```

## Updating the System

To update the system with new changes:

1. Pull the latest changes from the repository:
   ```bash
   cd trading-data-collection-service
   git pull origin main
   ```

2. Install any new dependencies:
   ```bash
   npm install
   ```

3. Restart the processes:
   ```bash
   pm2 restart all
   ```

## Conclusion

The Signal Accountability System is now deployed and running on your DigitalOcean droplet. It will continuously track signals for two randomly selected trading pairs, providing transparency and accountability for the trading engine's performance.

The system will automatically:
- Track new signals for the selected pairs
- Monitor price movements
- Record outcomes (wins/losses)
- Calculate performance metrics
- Generate verification IDs for each signal

All of this data is accessible through the performance dashboard and API endpoints.
