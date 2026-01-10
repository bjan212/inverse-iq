// Fetches crypto price/trade data from multiple public APIs and saves to JSON for AI engine
// Sources: Binance, Bybit, CoinGecko, CryptoCompare
// Usage: node fetch_all_sources.js

const fs = require('fs');
const axios = require('axios');

async function fetchBinance(symbol = 'BTCUSDT') {
  try {
    const url = `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=1m&limit=100`;
    const res = await axios.get(url);
    return res.data.map(k => ({
      source: 'binance',
      symbol,
      time: k[0],
      open: k[1],
      high: k[2],
      low: k[3],
      close: k[4],
      volume: k[5]
    }));
  } catch (e) {
    console.error('Binance error:', e.message);
    return [];
  }
}

async function fetchBybit(symbol = 'BTCUSDT') {
  try {
    const url = `https://api.bybit.com/v5/market/kline?category=linear&symbol=${symbol}&interval=1&limit=100`;
    const res = await axios.get(url);
    if (!res.data.result || !res.data.result.list) return [];
    return res.data.result.list.map(k => ({
      source: 'bybit',
      symbol,
      time: k[0],
      open: k[1],
      high: k[2],
      low: k[3],
      close: k[4],
      volume: k[5]
    }));
  } catch (e) {
    console.error('Bybit error:', e.message);
    return [];
  }
}


async function fetchCryptoCompare(symbol = 'BTC') {
  try {
    const url = `https://min-api.cryptocompare.com/data/v2/histominute?fsym=${symbol}&tsym=USD&limit=100`;
    const res = await axios.get(url);
    if (!res.data.Data || !res.data.Data.Data) return [];
    return res.data.Data.Data.map(k => ({
      source: 'cryptocompare',
      symbol,
      time: k.time * 1000,
      open: k.open,
      high: k.high,
      low: k.low,
      close: k.close,
      volume: k.volumefrom
    }));
  } catch (e) {
    console.error('CryptoCompare error:', e.message);
    return [];
  }
}

async function main() {
  const symbols = [
    { binance: 'BTCUSDT', bybit: 'BTCUSDT', coingecko: 'bitcoin', cryptocompare: 'BTC' },
    { binance: 'ETHUSDT', bybit: 'ETHUSDT', coingecko: 'ethereum', cryptocompare: 'ETH' }
  ];
  let allData = [];
  for (const s of symbols) {
    const [b, y, c] = await Promise.all([
      fetchBinance(s.binance),
      fetchBybit(s.bybit),
      fetchCryptoCompare(s.cryptocompare)
    ]);
    allData = allData.concat(b, y, c);
  }
  fs.writeFileSync('data/online_signals.json', JSON.stringify(allData, null, 2));
  console.log('Fetched and saved data from all sources.');
}

main();
