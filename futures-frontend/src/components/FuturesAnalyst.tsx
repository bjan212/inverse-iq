import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Loader2, TrendingUp, TrendingDown, Shield, Brain, Users, Zap, Clock, AlertTriangle, Settings, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent } from "@/components/ui/dialog";
// Quiz removed - direct signal generation
import { Streamdown } from "streamdown";
import { Copy, Check } from "lucide-react";
import { AISettingsModal } from "@/components/AISettingsModal";

interface AgentAnalysis {
  quant: string;
  risk: string;
  psychology: string;
  contrarian: string;
}

interface Recommendation {
  direction: "LONG" | "SHORT";
  entryZone: string;
  stopLoss: string;
  takeProfit: string;
  positionSize: string;
  confidence: number;
  validityMinutes: number;
  keyRisk: string;
}

export default function FuturesAnalyst() {
  const [symbol, setSymbol] = useState("BTC/USDT");
  const [riskLevel, setRiskLevel] = useState<"very_high" | "high" | "medium" | "low">("high");
  const [capital, setCapital] = useState(1000);
  const [leverage, setLeverage] = useState([10]);
  const [exchange, setExchange] = useState("all");

  const [agents, setAgents] = useState<AgentAnalysis | null>(null);
  const [recommendation, setRecommendation] = useState<Recommendation | null>(null);
  const [signalTimestamp, setSignalTimestamp] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [marketData, setMarketData] = useState<any>(null);
  // Quiz removed - all users can generate signals directly
  const [copied, setCopied] = useState(false);
  const [showAISettings, setShowAISettings] = useState(false);
  const [isFindingBestTrade, setIsFindingBestTrade] = useState(false);

  // Fetch market data
  const { data: liveMarketData, refetch: refetchMarketData } = trpc.futures.getMarketData.useQuery(
    { symbol },
    { enabled: false, refetchInterval: 5000 } // Auto-refresh every 5 seconds when enabled
  );

  useEffect(() => {
    if (liveMarketData) {
      setMarketData(liveMarketData);
    }
  }, [liveMarketData]);

  const generateSignalMutation = trpc.futures.generateSignal.useMutation({
    onSuccess: (data) => {
      setAgents(data.agents);
      setRecommendation(data.recommendation);
      setSignalTimestamp(data.timestamp);
      setTimeRemaining(data.recommendation.validityMinutes * 60); // Convert to seconds
      toast.success("Signal generated successfully!");
    },
    onError: (error) => {
      toast.error(`Failed to generate signal: ${error.message}`);
    },
  });

  const findBestTradeMutation = trpc.futures.findBestTrade.useMutation({
    onSuccess: (data) => {
      setIsFindingBestTrade(false);
      toast.success(`Best opportunity: ${data.symbol} (${data.direction}) - Confidence: ${data.confidence}/10`);
      
      // Auto-fill the form with best opportunity
      setSymbol(data.symbol);
      
      // Show detailed results
      toast.info(data.reason, { duration: 5000 });
      
      // Auto-generate full signal for best opportunity
      setTimeout(() => {
        handleGenerateSignal();
      }, 1000);
    },
    onError: (error) => {
      setIsFindingBestTrade(false);
      toast.error(`Failed to find best trade: ${error.message}`);
    },
  });

  const handleFindBestTrade = () => {
    setIsFindingBestTrade(true);
    findBestTradeMutation.mutate({
      riskLevel,
      capital,
      leverage: leverage[0],
      exchange: exchange === "all" ? undefined : exchange,
    });
  };

  const handleGenerateSignal = () => {
    // Fetch market data first
    refetchMarketData();
    
    generateSignalMutation.mutate({
      symbol,
      riskLevel,
      capital,
      leverage: leverage[0],
      exchange: exchange === "all" ? undefined : exchange,
    });
  };

  // Countdown timer
  useEffect(() => {
    if (timeRemaining === null || timeRemaining <= 0) return;

    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev === null || prev <= 1) {
          toast.warning("Signal expired! Generate a new one.");
          return null;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timeRemaining]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const getTimerColor = () => {
    if (timeRemaining === null) return "bg-gray-300";
    const totalSeconds = (recommendation?.validityMinutes || 0) * 60;
    const percentage = (timeRemaining / totalSeconds) * 100;
    if (percentage > 50) return "bg-green-500";
    if (percentage > 20) return "bg-yellow-500";
    return "bg-red-500";
  };

  const getTimerStatus = () => {
    if (timeRemaining === null) return "Expired";
    const totalSeconds = (recommendation?.validityMinutes || 0) * 60;
    const percentage = (timeRemaining / totalSeconds) * 100;
    if (percentage > 50) return "Optimal Entry Window";
    if (percentage > 20) return "Good Entry Window";
    return "Critical - Signal Expiring";
  };

  const generateMarkdownOutput = () => {
    if (!recommendation || !agents) return "";
    
    return `# Trading Signal: ${symbol}

## 🎯 Trade Setup

**Direction:** ${recommendation.direction}  
**Entry Zone:** ${recommendation.entryZone}  
**Stop-Loss:** ${recommendation.stopLoss}  
**Take-Profit:** ${recommendation.takeProfit}  
**Position Size:** ${recommendation.positionSize}  
**AI Confidence:** ${recommendation.confidence}/10  
**Validity:** ${recommendation.validityMinutes} minutes

⚠️ **Key Risk:** ${recommendation.keyRisk}

---

## 📊 Multi-Agent Analysis

### Quant Analyst (Technical)
${agents.quant}

### Risk Specialist (Position Sizing)
${agents.risk}

### Market Psychology (Sentiment)
${agents.psychology}

### Contrarian (InverseIQ)
${agents.contrarian}

---

*Generated at: ${signalTimestamp || new Date().toISOString()}*
`;
  };

  const handleCopySignal = async () => {
    const markdown = generateMarkdownOutput();
    try {
      await navigator.clipboard.writeText(markdown);
      setCopied(true);
      toast.success("Signal copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error("Failed to copy signal");
    }
  };

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left Panel: Signal Generator */}
      <Card className="lg:col-span-1">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-primary" />
            Signal Generator
          </CardTitle>
          <CardDescription>Configure your trading parameters</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="symbol">Symbol</Label>
            <Input
              id="symbol"
              value={symbol}
              onChange={(e) => setSymbol(e.target.value)}
              placeholder="BTC/USDT"
            />
          </div>

          {/* Market Data Display */}
          {marketData && (
            <div className="p-3 bg-secondary/30 rounded-lg space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Live Price:</span>
                <span className="font-mono font-bold">${marketData.price.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">24h Change:</span>
                <span className={`font-mono font-bold ${marketData.change24h >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {marketData.change24h >= 0 ? '+' : ''}{marketData.change24h.toFixed(2)}%
                </span>
              </div>
              {marketData.fundingRate !== null && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Funding Rate:</span>
                  <span className="font-mono font-bold">{(marketData.fundingRate * 100).toFixed(4)}%</span>
                </div>
              )}
            </div>
          )}

          <div>
            <Label htmlFor="riskLevel">Risk Level</Label>
            <Select value={riskLevel} onValueChange={(v: any) => setRiskLevel(v)}>
              <SelectTrigger id="riskLevel">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="very_high">🔥 Very High (Degen)</SelectItem>
                <SelectItem value="high">⚡ High</SelectItem>
                <SelectItem value="medium">⚖️ Medium</SelectItem>
                <SelectItem value="low">🛡️ Low</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="capital">Capital ($)</Label>
            <Input
              id="capital"
              type="number"
              value={capital}
              onChange={(e) => setCapital(Number(e.target.value))}
              min={100}
            />
          </div>

          <div>
            <Label htmlFor="leverage">Leverage: {leverage[0]}x</Label>
            <Slider
              id="leverage"
              value={leverage}
              onValueChange={setLeverage}
              min={1}
              max={50}
              step={1}
              className="mt-2"
            />
          </div>

          <div>
            <Label htmlFor="exchange">Exchange</Label>
            <Select value={exchange} onValueChange={setExchange}>
              <SelectTrigger id="exchange">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Exchanges</SelectItem>
                <SelectItem value="binance">Binance</SelectItem>
                <SelectItem value="bybit">Bybit</SelectItem>
                <SelectItem value="okx">OKX</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2">
            <Button
              onClick={() => setShowAISettings(true)}
              variant="outline"
              className="w-full"
              size="sm"
            >
              <Settings className="w-4 h-4 mr-2" />
              AI Settings
            </Button>

            <Button
              onClick={handleFindBestTrade}
              disabled={isFindingBestTrade || findBestTradeMutation.isPending}
              variant="secondary"
              className="w-full"
              size="lg"
            >
              {isFindingBestTrade ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Scanning Markets...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Find Best Trade Now
                </>
              )}
            </Button>

            <Button
              onClick={handleGenerateSignal}
              disabled={generateSignalMutation.isPending}
              className="w-full"
              size="lg"
            >
              {generateSignalMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 mr-2" />
                  Generate Signal
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Center Panel: Multi-Agent Analysis */}
      <Card className="lg:col-span-1">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-primary" />
            Multi-Agent Analysis
          </CardTitle>
          <CardDescription>Chain-of-thought reasoning from 4 expert agents</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {!agents && (
            <div className="text-center py-12 text-muted-foreground">
              <Brain className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p>Generate a signal to see agent analysis</p>
            </div>
          )}

          {agents && (
            <>
              {/* Quant Analyst */}
              <Collapsible defaultOpen>
                <CollapsibleTrigger asChild>
                  <Button variant="outline" className="w-full justify-between">
                    <span className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4" />
                      Quantitative Analyst
                    </span>
                    <Badge variant="secondary">Technical</Badge>
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-2 p-3 bg-secondary/30 rounded-lg text-sm">
                  <Streamdown>{agents.quant}</Streamdown>
                </CollapsibleContent>
              </Collapsible>

              {/* Risk Specialist */}
              <Collapsible>
                <CollapsibleTrigger asChild>
                  <Button variant="outline" className="w-full justify-between">
                    <span className="flex items-center gap-2">
                      <Shield className="w-4 h-4" />
                      Risk Specialist
                    </span>
                    <Badge variant="secondary">Risk</Badge>
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-2 p-3 bg-secondary/30 rounded-lg text-sm">
                  <Streamdown>{agents.risk}</Streamdown>
                </CollapsibleContent>
              </Collapsible>

              {/* Market Psychology */}
              <Collapsible>
                <CollapsibleTrigger asChild>
                  <Button variant="outline" className="w-full justify-between">
                    <span className="flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      Market Psychology
                    </span>
                    <Badge variant="secondary">Sentiment</Badge>
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-2 p-3 bg-secondary/30 rounded-lg text-sm">
                  <Streamdown>{agents.psychology}</Streamdown>
                </CollapsibleContent>
              </Collapsible>

              {/* Contrarian */}
              <Collapsible>
                <CollapsibleTrigger asChild>
                  <Button variant="outline" className="w-full justify-between">
                    <span className="flex items-center gap-2">
                      <TrendingDown className="w-4 h-4" />
                      Contrarian (InverseIQ)
                    </span>
                    <Badge variant="secondary">Counter</Badge>
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-2 p-3 bg-secondary/30 rounded-lg text-sm">
                  <Streamdown>{agents.contrarian}</Streamdown>
                </CollapsibleContent>
              </Collapsible>
            </>
          )}
        </CardContent>
      </Card>

      {/* Right Panel: Trade Execution */}
      <Card className="lg:col-span-1">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-primary" />
            Trade Execution
          </CardTitle>
          <CardDescription>Unified recommendation</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!recommendation && (
            <div className="text-center py-12 text-muted-foreground">
              <Zap className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p>Generate a signal to see recommendation</p>
            </div>
          )}

          {recommendation && (
            <>
              {/* Validity Timer */}
              {timeRemaining !== null && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {getTimerStatus()}
                    </span>
                    <span className="font-mono font-bold">{formatTime(timeRemaining)}</span>
                  </div>
                  <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-1000 ${getTimerColor()}`}
                      style={{
                        width: `${((timeRemaining / ((recommendation.validityMinutes || 1) * 60)) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Direction */}
              <div className="flex items-center justify-between p-4 bg-secondary/30 rounded-lg">
                <span className="text-sm font-medium">Direction</span>
                <Badge
                  variant={recommendation.direction === "LONG" ? "default" : "destructive"}
                  className="text-lg px-4 py-1"
                >
                  {recommendation.direction === "LONG" ? (
                    <TrendingUp className="w-4 h-4 mr-1" />
                  ) : (
                    <TrendingDown className="w-4 h-4 mr-1" />
                  )}
                  {recommendation.direction}
                </Badge>
              </div>

              {/* Entry Zone */}
              <div>
                <Label className="text-xs text-muted-foreground">Entry Zone</Label>
                <div className="text-lg font-mono font-bold">{recommendation.entryZone}</div>
              </div>

              {/* Stop Loss */}
              <div>
                <Label className="text-xs text-muted-foreground">Stop-Loss</Label>
                <div className="text-lg font-mono font-bold text-red-600">{recommendation.stopLoss}</div>
              </div>

              {/* Take Profit */}
              <div>
                <Label className="text-xs text-muted-foreground">Take-Profit</Label>
                <div className="text-lg font-mono font-bold text-green-600">{recommendation.takeProfit}</div>
              </div>

              {/* Position Size */}
              <div>
                <Label className="text-xs text-muted-foreground">Position Size</Label>
                <div className="text-lg font-mono font-bold">{recommendation.positionSize}</div>
              </div>

              {/* Confidence */}
              <div>
                <Label className="text-xs text-muted-foreground">AI Confidence</Label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all"
                      style={{ width: `${recommendation.confidence * 10}%` }}
                    />
                  </div>
                  <span className="text-sm font-bold">{recommendation.confidence}/10</span>
                </div>
              </div>

              {/* Key Risk */}
              <div className="p-3 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-yellow-600 dark:text-yellow-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="text-xs font-semibold text-yellow-800 dark:text-yellow-400 mb-1">
                      Key Risk
                    </div>
                    <div className="text-xs text-yellow-700 dark:text-yellow-300">{recommendation.keyRisk}</div>
                  </div>
                </div>
              </div>

              {/* Execute Button */}
              <Button
                variant="default"
                size="lg"
                className="w-full"
                disabled={timeRemaining === null || timeRemaining <= 0}
              >
                Execute Trade
              </Button>

              {timeRemaining !== null && timeRemaining <= 0 && (
                <Button variant="outline" size="lg" className="w-full" onClick={handleGenerateSignal}>
                  Refresh Signal
                </Button>
              )}

              {/* Copy Signal Button */}
              <Button
                variant="outline"
                size="lg"
                className="w-full"
                onClick={handleCopySignal}
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-2" />
                    Copy Full Signal
                  </>
                )}
              </Button>

              {/* Markdown Preview */}
              <div className="mt-4 p-4 bg-secondary/30 rounded-lg border border-border max-h-96 overflow-y-auto">
                <div className="text-xs text-muted-foreground mb-2 font-semibold">Signal Preview (Markdown)</div>
                <Streamdown className="text-sm">{generateMarkdownOutput()}</Streamdown>
              </div>
            </>
          )}
        </CardContent>
      </Card>
      </div>

      {/* Quiz removed - all users can generate signals directly */}

      {/* AI Settings Modal */}
      <AISettingsModal
        open={showAISettings}
        onOpenChange={setShowAISettings}
        onSuccess={() => {
          toast.success("AI ensemble enabled! Better signals incoming.");
        }}
      />
    </>
  );
}
