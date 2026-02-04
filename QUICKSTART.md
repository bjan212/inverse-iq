# Futures Analyst - Quick Start Guide

## 🚀 Get Started in 5 Minutes

### Step 1: Install Dependencies (2 min)

```bash
cd /home/ubuntu/inverse-iq
npm install
```

### Step 2: Configure Environment (1 min)

Create `.env` file:

```env
DATABASE_URL="postgresql://localhost:5432/inverse_iq"
JWT_SECRET="your-secret-key"
PORT=4000
```

### Step 3: Setup Database (1 min)

```bash
cd futures-config
pnpm db:push
```

### Step 4: Start Server (1 min)

```bash
node server.js
```

**Server running at:** `http://localhost:4000`

---

## 🎯 First Trade

### 1. Access Futures Analyst
Navigate to: `http://localhost:4000/futures-analyst`

### 2. Add Binance API Key
- Click "Setup Binance API"
- Enter your API key and secret
- Test connection

### 3. Generate Signal
- Select BTC/USDT
- Choose risk level: High
- Set capital: 1000 USDT
- Leverage: 10x
- Click "Generate Signal"

### 4. Review Analysis
- Read all 4 AI agent analyses
- Check confidence score (aim for >80%)
- Verify entry zone and stop-loss

### 5. Execute Trade
- Enter position size (e.g., 0.01 BTC)
- Click "Execute Trade"
- Monitor position in real-time

---

## 🧠 Key Features

| Feature | Description | Status |
|---------|-------------|--------|
| **AI Ensemble** | Multiple AI models in parallel | ✅ Ready |
| **Inverse Learning** | Learn from losing trades | ✅ Ready |
| **Binance API** | Real trade execution | ✅ Ready |
| **WebSocket** | Live position updates | ✅ Ready |
| **Trade History** | Analytics dashboard | ✅ Ready |
| **No Quiz** | Direct signal generation | ✅ Ready |

---

## 📚 Next Steps

1. **Read Full Documentation:** `FUTURES_ANALYST_README.md`
2. **Integration Guide:** `FUTURES_ANALYST_INTEGRATION.md`
3. **Test with Small Amounts:** Start with $10-50
4. **Enable External AIs:** Add OpenAI/Anthropic keys for better signals
5. **Monitor Performance:** Check Trade History page daily

---

## ⚠️ Important Notes

- **Always use stop-loss orders**
- **Start with low leverage (5-10x)**
- **Never risk more than 2-5% per trade**
- **Test on Binance Testnet first** (set `BINANCE_TESTNET=true`)

---

## 🐛 Common Issues

### Port 4000 Already in Use
```bash
# Change port in server.js
const PORT = process.env.PORT || 5000;
```

### Database Connection Failed
```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Or use MySQL
DATABASE_URL="mysql://localhost:3306/inverse_iq"
```

### Binance API Invalid Signature
- Verify API key/secret are correct
- Check system time is synchronized
- Ensure API has Futures permissions

---

## 📞 Need Help?

- **GitHub Issues:** https://github.com/bjan212/inverse-iq/issues
- **Documentation:** See `FUTURES_ANALYST_README.md`
- **Email:** support@inverse-iq.com

---

**Happy Trading! 🚀📈**
