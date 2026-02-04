import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Sparkles, TrendingUp, TrendingDown, Clock, Target, AlertTriangle, RefreshCw, Wallet } from "lucide-react";
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';
import { Progress } from "@/components/ui/progress";
import { StarkNetWalletButton } from "@/components/StarkNetWalletButton";
import { useEdgeXWebSocket } from "@/hooks/useEdgeXWebSocket";
import { BinanceSettingsModal } from "@/components/BinanceSettingsModal";
import { Settings } from "lucide-react";

export default function DeFiTrader() {
  const { address, isConnected } = useAccount();
  const [selectedExchange, setSelectedExchange] = useState<string>("all");
  const [quantity, setQuantity] = useState<string>("0.01");
  const [showPositions, setShowPositions] = useState(false);
  const [selectedCrypto, setSelectedCrypto] = useState<string>("");
  const [isScanning, setIsScanning] = useState(false);
  const [signal, setSignal] = useState<any>(null);
  const [showBinanceSettings, setShowBinanceSettings] = useState(false);

  // Check if user has Binance API keys
  const { data: binanceStatus } = trpc.binance.getApiKeysStatus.useQuery();

  const generateSignalMutation = trpc.trading.generateSignal.useMutation({
    onSuccess: (data) => {
      setSignal(data);
      setIsScanning(false);
      toast.success("Trading signal generated successfully!");
    },
    onError: (error) => {
      toast.error(`Failed to generate signal: ${error.message}`);
      setIsScanning(false);
    },
  });

  // Binance execution (Simple Mode)
  const binanceExecuteTradeMutation = trpc.binance.executeTrade.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
      setShowPositions(true);
    },
    onError: (error) => {
      toast.error(`Failed to execute trade: ${error.message}`);
    },
  });

  // EdgeX execution (Advanced Mode)
  const edgexExecuteTradeMutation = trpc.edgex.executeTrade.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
      setShowPositions(true);
    },
    onError: (error) => {
      toast.error(`Failed to execute trade: ${error.message}`);
    },
  });

  // WebSocket for real-time position updates
  const { positions: wsPositions, isConnected: wsConnected } = useEdgeXWebSocket(
    address,
    isConnected && showPositions
  );

  // Get positions based on mode
  const { data: binancePositions, refetch: refetchBinancePositions } = trpc.binance.getPositions.useQuery(
    undefined,
    { enabled: binanceStatus?.hasKeys && showPositions }
  );

  const { data: edgexPositions, refetch: refetchEdgexPositions } = trpc.edgex.getPositions.useQuery(
    { walletAddress: address || "" },
    { enabled: !binanceStatus?.hasKeys && isConnected && !!address && showPositions && !wsConnected }
  );

  const positions = binanceStatus?.hasKeys
    ? binancePositions
    : (wsConnected ? wsPositions : edgexPositions);
  const refetchPositions = binanceStatus?.hasKeys
    ? refetchBinancePositions
    : refetchEdgexPositions;

  const recordTradeCloseMutation = trpc.binance.recordTradeClose.useMutation({
    onSuccess: (data) => {
      if (data.learnedFromTrade) {
        toast.success("🎓 Position closed and inverse pattern learned!");
      } else {
        toast.success("Position closed successfully!");
      }
      refetchPositions();
    },
    onError: (error) => {
      toast.error(`Failed to record trade: ${error.message}`);
    },
  });

  const binanceClosePositionMutation = trpc.binance.closePosition.useMutation({
    onSuccess: () => {
      // Position closed, now record it for auto-learning
      // Note: In production, you'd get actual trade data from the position
      // For now, we'll just close without recording
      toast.success("Position closed successfully!");
      refetchPositions();
    },
    onError: (error) => {
      toast.error(`Failed to close position: ${error.message}`);
    },
  });

  const edgexClosePositionMutation = trpc.edgex.closePosition.useMutation({
    onSuccess: () => {
      toast.success("Position closed successfully!");
      refetchPositions();
    },
    onError: (error) => {
      toast.error(`Failed to close position: ${error.message}`);
    },
  });

  const handleExecuteTrade = () => {
    if (!signal) {
      toast.error("No signal available");
      return;
    }

    // Simple Mode: Use Binance API
    if (binanceStatus?.hasKeys) {
      binanceExecuteTradeMutation.mutate({
        signal: {
          pair: signal.pair,
          direction: signal.direction,
          entry: signal.entry,
          stopLoss: signal.stopLoss,
          takeProfit: signal.takeProfit,
          leverage: signal.leverage,
        },
        quantity,
      });
      return;
    }

    // Advanced Mode: Use EdgeX L2
    if (!isConnected || !address) {
      toast.error("Please connect your wallet or setup Binance API first");
      return;
    }

    edgexExecuteTradeMutation.mutate({
      signal: {
        pair: signal.pair,
        direction: signal.direction,
        entry: signal.entry,
        stopLoss: signal.stopLoss,
        takeProfit: signal.takeProfit,
        leverage: signal.leverage,
      },
      walletAddress: address,
      quantity,
    });
  };

  // Mock crypto list - will be replaced with API data
  const cryptoList = [
    "BTC/USDT", "ETH/USDT", "SOL/USDT", "BNB/USDT", "XRP/USDT",
    "ADA/USDT", "DOGE/USDT", "MATIC/USDT", "DOT/USDT", "AVAX/USDT",
    "LINK/USDT", "UNI/USDT", "ATOM/USDT", "LTC/USDT", "ETC/USDT"
  ];

  const exchanges = [
    { value: "all", label: "All Markets" },
    { value: "binance", label: "Binance Futures" },
    { value: "okx", label: "OKX Futures" },
    { value: "bybit", label: "Bybit Futures" },
    { value: "edgex", label: "EdgeX (L2 DEX)" },
    { value: "hyperliquid", label: "Hyperliquid" },
  ];

  const handleFindBestTrade = async () => {
    setIsScanning(true);
    generateSignalMutation.mutate({
      exchange: selectedExchange,
      riskProfile: "very-high", // TODO: Get from risk profile selector
      specificCrypto: selectedCrypto || undefined,
    });
  };

  const getTimerColor = (minutes: number) => {
    if (minutes > 15) return "text-green-500";
    if (minutes > 5) return "text-yellow-500";
    return "text-red-500";
  };

  const getTimerProgress = (minutes: number, total: number) => {
    return (minutes / total) * 100;
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      {/* Header */}
      <header className="border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-primary flex items-center justify-center text-primary-foreground font-bold font-mono rounded-none">
              AI
            </div>
            <h1 className="text-xl font-bold tracking-tight font-display">DeFi Trader</h1>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="text-xs">
              {binanceStatus?.hasKeys ? 'Simple Mode • Binance Futures' : 'Layer 2 • EdgeX • 100x Leverage'}
            </Badge>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowBinanceSettings(true)}
                className="gap-2"
              >
                <Settings className="h-4 w-4" />
                {binanceStatus?.hasKeys ? 'Binance Connected' : 'Setup Binance API'}
              </Button>
              <ConnectButton />
              <div className="h-6 w-px bg-border" />
              <StarkNetWalletButton />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto py-8 px-4 md:px-6 lg:px-8">
        <div className="mb-8 max-w-2xl">
          <h1 className="text-4xl md:text-5xl font-bold font-display tracking-tight mb-4 text-foreground">
            AI-Powered Futures Trading
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Scan 177+ crypto pairs across Layer 2 DEXs and centralized exchanges. Get high-probability signals with 99% confidence targeting, real-time countdown timers, and direct wallet execution.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Controls */}
          <div className="lg:col-span-1 space-y-6">
            {/* Exchange Selection */}
            <Card className="border-2">
              <CardHeader>
                <CardTitle className="text-lg">Exchange Selection</CardTitle>
                <CardDescription>Choose your preferred trading venue</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Exchange</label>
                  <Select value={selectedExchange} onValueChange={setSelectedExchange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select exchange" />
                    </SelectTrigger>
                    <SelectContent>
                      {exchanges.map((ex) => (
                        <SelectItem key={ex.value} value={ex.value}>
                          {ex.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Search Specific Coin</label>
                  <Select value={selectedCrypto} onValueChange={setSelectedCrypto}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select crypto pair" />
                    </SelectTrigger>
                    <SelectContent>
                      {cryptoList.map((crypto) => (
                        <SelectItem key={crypto} value={crypto}>
                          {crypto}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button 
                  className="w-full" 
                  size="lg"
                  onClick={handleFindBestTrade}
                  disabled={isScanning}
                >
                  {isScanning ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Scanning 177 Pairs...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Find Me the Most Favorable Coin to Trade
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Risk Template Selection */}
            <Card className="border-2">
              <CardHeader>
                <CardTitle className="text-lg">Risk Profile</CardTitle>
                <CardDescription>Select your risk appetite</CardDescription>
              </CardHeader>
              <CardContent>
                <Select defaultValue="very-high">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="very-high">
                      <span className="flex items-center">
                        <AlertTriangle className="mr-2 h-4 w-4 text-red-500" />
                        Very High Risk (Double in 1 day)
                      </span>
                    </SelectItem>
                    <SelectItem value="high">High Risk</SelectItem>
                    <SelectItem value="medium">Medium Risk</SelectItem>
                    <SelectItem value="low">Low Risk</SelectItem>
                    <SelectItem value="gem">Gem Hunter (Dips & Upcoming)</SelectItem>
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Signal Display */}
          <div className="lg:col-span-2">
            {!signal ? (
              <Card className="border-2 border-dashed h-full flex items-center justify-center min-h-[500px]">
                <CardContent className="text-center py-12">
                  <Target className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-xl font-semibold mb-2">No Active Signal</h3>
                  <p className="text-muted-foreground max-w-md mx-auto">
                    Click "Find Me the Most Favorable Coin to Trade" to scan all markets and get AI-powered trading signals with 99% probability targeting.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                {/* Signal Card */}
                <Card className="border-2 border-primary">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-2xl flex items-center gap-2">
                          {signal.pair}
                          {signal.direction === "LONG" ? (
                            <Badge className="bg-green-500 text-white">
                              <TrendingUp className="mr-1 h-4 w-4" />
                              LONG
                            </Badge>
                          ) : (
                            <Badge className="bg-red-500 text-white">
                              <TrendingDown className="mr-1 h-4 w-4" />
                              SHORT
                            </Badge>
                          )}
                        </CardTitle>
                        <CardDescription className="mt-2">
                          {selectedExchange === "all" ? "All Markets" : exchanges.find(e => e.value === selectedExchange)?.label} • {signal.timeframe} Timeframe
                        </CardDescription>
                      </div>
                      <Badge variant="outline" className="text-lg px-3 py-1">
                        {signal.confidence}% Confidence
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Countdown Timer */}
                    <div className="bg-muted/50 p-4 rounded-lg border">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Clock className={`h-5 w-5 ${getTimerColor(signal.validityMinutes)}`} />
                          <span className="font-semibold">Signal Validity</span>
                        </div>
                        <span className={`text-2xl font-bold font-mono ${getTimerColor(signal.validityMinutes)}`}>
                          {signal.validityMinutes}:00
                        </span>
                      </div>
                      <Progress 
                        value={getTimerProgress(signal.validityMinutes, 30)} 
                        className="h-2"
                      />
                      <p className="text-xs text-muted-foreground mt-2">
                        {signal.validityMinutes > 15 ? "✓ Optimal entry window" : 
                         signal.validityMinutes > 5 ? "⚠ Good entry window" : 
                         "🚨 Critical - Signal expiring soon"}
                      </p>
                    </div>

                    {/* Trade Setup */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-muted/30 p-3 rounded-lg">
                        <p className="text-xs text-muted-foreground mb-1">Entry Price</p>
                        <p className="text-lg font-bold font-mono">${signal.entry}</p>
                      </div>
                      <div className="bg-red-500/10 p-3 rounded-lg border border-red-500/20">
                        <p className="text-xs text-muted-foreground mb-1">Stop Loss</p>
                        <p className="text-lg font-bold font-mono text-red-500">${signal.stopLoss}</p>
                      </div>
                      <div className="bg-green-500/10 p-3 rounded-lg border border-green-500/20">
                        <p className="text-xs text-muted-foreground mb-1">Take Profit</p>
                        <p className="text-lg font-bold font-mono text-green-500">${signal.takeProfit}</p>
                      </div>
                      <div className="bg-primary/10 p-3 rounded-lg border border-primary/20">
                        <p className="text-xs text-muted-foreground mb-1">Leverage</p>
                        <p className="text-lg font-bold font-mono text-primary">{signal.leverage}</p>
                      </div>
                    </div>

                    {/* Risk/Reward */}
                    <div className="bg-muted/30 p-4 rounded-lg">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Risk/Reward Ratio</span>
                        <span className="text-xl font-bold text-green-500">{signal.riskReward}</span>
                      </div>
                    </div>

                    {/* Technical Indicators */}
                    <div>
                      <h4 className="font-semibold mb-3">Technical Analysis</h4>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-muted/30 p-3 rounded-lg">
                          <p className="text-xs text-muted-foreground mb-1">RSI (14)</p>
                          <p className="font-semibold">{signal.indicators.rsi}</p>
                        </div>
                        <div className="bg-muted/30 p-3 rounded-lg">
                          <p className="text-xs text-muted-foreground mb-1">MACD</p>
                          <p className="font-semibold text-green-500">{signal.indicators.macd}</p>
                        </div>
                        <div className="bg-muted/30 p-3 rounded-lg">
                          <p className="text-xs text-muted-foreground mb-1">Volume</p>
                          <p className="font-semibold text-blue-500">{signal.indicators.volume}</p>
                        </div>
                        <div className="bg-muted/30 p-3 rounded-lg">
                          <p className="text-xs text-muted-foreground mb-1">Sentiment</p>
                          <p className="font-semibold text-green-500">{signal.indicators.sentiment}</p>
                        </div>
                      </div>
                    </div>

                    {/* Quantity Input */}
                    <div className="bg-muted/30 p-4 rounded-lg">
                      <label className="text-sm font-medium mb-2 block">Position Size</label>
                      <input
                        type="number"
                        step="0.001"
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value)}
                        className="w-full px-3 py-2 bg-background border border-border rounded-lg"
                        placeholder="0.01"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Amount in {signal.pair.split('/')[0]}
                      </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3">
                      {isConnected ? (
                        <Button 
                          className="flex-1" 
                          size="lg"
                          onClick={handleExecuteTrade}
                          disabled={binanceExecuteTradeMutation.isPending || edgexExecuteTradeMutation.isPending}
                        >
                          {(binanceExecuteTradeMutation.isPending || edgexExecuteTradeMutation.isPending)
                            ? "Executing..."
                            : binanceStatus?.hasKeys
                            ? "Execute Trade on Binance"
                            : "Execute Trade on EdgeX L2"}
                        </Button>
                      ) : (
                        <Button className="flex-1" size="lg" disabled>
                          Connect Wallet to Trade
                        </Button>
                      )}
                      <Button 
                        variant="outline" 
                        size="lg"
                        onClick={() => setShowPositions(!showPositions)}
                      >
                        {showPositions ? "Hide" : "Show"} Positions
                      </Button>
                    </div>

                    {/* Warning */}
                    <div className="bg-yellow-500/10 border border-yellow-500/20 p-3 rounded-lg flex items-start gap-2">
                      <AlertTriangle className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-muted-foreground">
                        <strong>High Risk Warning:</strong> Futures trading with leverage can result in significant losses. Only trade with capital you can afford to lose. This signal is AI-generated and not financial advice.
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Position Tracking Dashboard */}
                {showPositions && isConnected && (
                  <Card className="border-2 mt-6">
                    <CardHeader>
                      <CardTitle>Active Positions</CardTitle>
                      <CardDescription>Your open positions on EdgeX L2 DEX</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {positions && positions.length > 0 ? (
                        <div className="space-y-4">
                          {positions.map((position: any, index: number) => (
                            <div key={index} className="bg-muted/30 p-4 rounded-lg border">
                              <div className="flex items-start justify-between mb-3">
                                <div>
                                  <h4 className="font-bold text-lg">{position.symbol}</h4>
                                  <Badge className={position.side === 'LONG' ? 'bg-green-500' : 'bg-red-500'}>
                                    {position.side}
                                  </Badge>
                                </div>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => {
                                    if (binanceStatus?.hasKeys) {
                                      binanceClosePositionMutation.mutate({
                                        symbol: position.symbol,
                                        positionAmt: position.positionAmt || position.size,
                                      });
                                    } else {
                                      edgexClosePositionMutation.mutate({
                                        symbol: position.symbol,
                                        walletAddress: address!,
                                      });
                                    }
                                  }}
                                  disabled={binanceClosePositionMutation.isPending || edgexClosePositionMutation.isPending}
                                >
                                  Close Position
                                </Button>
                              </div>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                <div>
                                  <p className="text-xs text-muted-foreground">Size</p>
                                  <p className="font-semibold">{position.size}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-muted-foreground">Entry Price</p>
                                  <p className="font-semibold">${position.entryPrice}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-muted-foreground">Mark Price</p>
                                  <p className="font-semibold">${position.markPrice}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-muted-foreground">Unrealized P&L</p>
                                  <p className={`font-semibold ${parseFloat(position.unrealizedPnl) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                    ${position.unrealizedPnl}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-xs text-muted-foreground">Leverage</p>
                                  <p className="font-semibold">{position.leverage}x</p>
                                </div>
                                <div>
                                  <p className="text-xs text-muted-foreground">Margin</p>
                                  <p className="font-semibold">${position.margin}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-muted-foreground">Liq. Price</p>
                                  <p className="font-semibold text-red-500">${position.liquidationPrice}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          <p>No active positions</p>
                          <p className="text-sm mt-1">Execute a trade to open your first position</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Binance API Settings Modal */}
      <BinanceSettingsModal
        open={showBinanceSettings}
        onOpenChange={setShowBinanceSettings}
      />
    </div>
  );
}
