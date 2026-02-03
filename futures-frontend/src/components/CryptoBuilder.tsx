import { useState, useEffect } from "react";
import { MagicFillButton } from "@/components/MagicFillButton";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Copy, RefreshCw, ArrowRight, Target, Map, Lightbulb, ChevronDown, Download, Search } from "lucide-react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

// Crypto Templates Data
const CRYPTO_TEMPLATES = [
  {
    id: "futures-very-high-risk",
    name: "Futures: Very High Risk (Degen/Scalp)",
    description: "Aggressive strategy targeting 100%+ daily returns via high leverage and volatility.",
    aim: {
      actor: "You are an aggressive high-frequency crypto futures trader specializing in scalping and volatility breakouts. You have a high tolerance for risk and focus on maximizing short-term gains.",
      input: "I am providing real-time 1-minute and 5-minute chart data for [COIN], including RSI, MACD, Bollinger Bands, and recent volume spikes. I also have a feed of breaking news and social sentiment trends.",
      mission: "Identify immediate, high-probability scalp entries (Long/Short) with the potential for 100% ROI within 24 hours using high leverage (20x-50x). Focus on 'Inverse Head and Shoulders' patterns, volatility squeezes, and 'inverseiq' reversal signals."
    },
    map: {
      memory: "Recall that we prioritize volatility over stability. We are looking for coins with recent 20%+ moves or massive volume spikes.",
      assets: "- 1m/5m Chart Data\n- Order Book Depth\n- Social Volume (Twitter/Telegram)\n- Liquidation Heatmap",
      actions: "1. Scan for 'Inverse Head and Shoulders' or 'Double Bottom' patterns on low timeframes.\n2. Analyze volume for 'smart money' divergence (price down, volume up).\n3. Check social sentiment for 'pump' signals.\n4. Provide specific entry, stop-loss (tight), and take-profit targets."
    },
    ocean: {
      original: "Avoid standard 'wait and see' advice. Be decisive and aggressive.",
      concrete: "Give exact price levels for Entry, Stop-Loss, and Take-Profit 1/2/3.",
      evident: "Justify the trade with specific indicator readings (e.g., 'RSI divergence at 30').",
      assertive: "Use command-style language: 'Enter NOW at...', 'Cut loss immediately if...'.",
      narrative: "Frame the trade as a 'sniper entry' into a volatility explosion."
    }
  },
  {
    id: "futures-high-risk",
    name: "Futures: High Risk (Swing/Trend)",
    description: "Trend-following strategy with significant leverage for multi-day moves.",
    aim: {
      actor: "You are a seasoned crypto swing trader who capitalizes on strong trend continuations and major reversals. You balance aggression with calculated risk management.",
      input: "I am providing 1-hour and 4-hour chart data for [COIN], along with open interest and funding rate data.",
      mission: "Identify a high-probability swing trade setup (Long/Short) targeting a 30-50% return over the next 1-3 days. Focus on breakout retests and key support/resistance flips."
    },
    map: {
      memory: "We prefer trades aligned with the broader market trend (BTC/ETH correlation).",
      assets: "- 1H/4H Chart Data\n- Funding Rates\n- Open Interest",
      actions: "1. Identify the dominant trend on the 4H chart.\n2. Look for a pullback to a key Fibonacci level (0.618) or support zone.\n3. Confirm with a candlestick reversal pattern.\n4. Suggest a trade plan with 5x-10x leverage."
    },
    ocean: {
      original: "Focus on market structure and liquidity grabs rather than just indicators.",
      concrete: "Specify the invalidation point (Stop Loss) clearly.",
      evident: "Reference specific price action structures (e.g., 'higher low', 'bull flag').",
      assertive: "Be confident but acknowledge the invalidation scenario.",
      narrative: "Describe the setup as 'catching the next wave' of the trend."
    }
  },
  {
    id: "gem-hunter",
    name: "Gem Hunter (Pre-Market/ICO)",
    description: "Finding undervalued projects before they hit mainstream exchanges.",
    aim: {
      actor: "You are a venture capital analyst and 'gem hunter' who specializes in identifying high-potential early-stage crypto projects before they list on major exchanges.",
      input: "I am providing a list of upcoming token sales on CoinList, recent whitepapers, and team backgrounds for [PROJECT_NAME].",
      mission: "Analyze the potential of [PROJECT_NAME] to be a '100x gem'. Evaluate its tokenomics, team experience, unique value proposition, and hype factor compared to successful predecessors."
    },
    map: {
      memory: "Remember that we look for projects with strong fundamentals but low initial market cap.",
      assets: "- Whitepaper\n- Tokenomics Schedule (Vesting)\n- Team LinkedIn Profiles\n- Community Growth Metrics",
      actions: "1. Scrutinize the vesting schedule for heavy insider selling pressure.\n2. Evaluate the 'moat' or unique tech.\n3. Compare valuation to competitors.\n4. Rate the project's 'explosion potential' on a scale of 1-10."
    },
    ocean: {
      original: "Look for red flags that others miss. Don't just regurgitate the marketing.",
      concrete: "Cite specific vesting periods and allocation percentages.",
      evident: "Compare metrics to past CoinList winners (e.g., Solana, Flow).",
      assertive: "Give a clear 'Buy', 'Watch', or 'Pass' rating.",
      narrative: "Tell the story of why this project solves a critical market problem."
    }
  },
  {
    id: "futures-medium-risk",
    name: "Futures: Medium Risk (Intraday)",
    description: "Balanced strategy for consistent daily profits with moderate leverage.",
    aim: {
      actor: "You are a disciplined intraday trader focusing on consistent, compoundable gains. You prioritize capital preservation over home runs.",
      input: "I am providing 15-minute and 1-hour chart data, focusing on key pivots and VWAP.",
      mission: "Find a low-risk intraday setup targeting a 1:2 or 1:3 risk-to-reward ratio. Focus on mean reversion to VWAP or range trading."
    },
    map: {
      memory: "We avoid trading during high-impact news events.",
      assets: "- 15m/1H Chart\n- VWAP\n- Daily Pivot Points",
      actions: "1. Identify the daily trading range.\n2. Look for entries at the range boundaries or VWAP deviations.\n3. Set a conservative stop loss outside the range."
    },
    ocean: {
      original: "Focus on statistical probability and risk management.",
      concrete: "Calculate the exact Risk:Reward ratio.",
      "evident": "Use VWAP and Pivot Points as evidence.",
      assertive: "Be objective and calm.",
      narrative: "Frame the trade as a 'disciplined execution' of a proven edge."
    }
  },
  {
    id: "futures-low-risk",
    name: "Futures: Low Risk (Hedging)",
    description: "Defensive strategy to protect portfolio value or earn funding fees.",
    aim: {
      actor: "You are a risk-averse portfolio manager looking to hedge exposure or capture delta-neutral yields.",
      input: "I am providing current funding rates across major exchanges and the spot price vs. futures price basis.",
      mission: "Construct a delta-neutral position to farm funding rates or hedge a spot holding. Calculate the expected annualized yield and liquidation risk."
    },
    map: {
      memory: "Safety is the #1 priority. We do not want directional exposure.",
      assets: "- Funding Rate History\n- Spot vs. Futures Basis",
      actions: "1. Identify the asset with the highest consistent positive funding rate.\n2. Calculate the position size to fully hedge the spot holding.\n3. Determine the liquidation price and required collateral."
    },
    ocean: {
      original: "Focus on mathematical yield rather than price prediction.",
      concrete: "Show the exact math for the hedge ratio.",
      evident: "Cite historical funding rate data.",
      assertive: "Be cautious and precise.",
      narrative: "Explain the strategy as 'generating passive income' with minimal risk."
    }
  }
];

// Framework Data Structures
const AIM_FIELDS = [
  { id: "actor", label: "Actor", description: "Who should the AI be?", placeholder: "e.g., You are a seasoned financial analyst..." },
  { id: "input", label: "Input", description: "What context or data are you providing?", placeholder: "e.g., I'm providing three research papers..." },
  { id: "mission", label: "Mission", description: "What is the primary goal?", placeholder: "e.g., Write a 5-page investment memo..." }
];

const MAP_FIELDS = [
  { id: "memory", label: "Memory", description: "Relevant history or preferences", placeholder: "e.g., Recall our last discussion about..." },
  { id: "assets", label: "Assets", description: "Files or data references", placeholder: "e.g., - market_data.csv\n- interview_transcript.txt" },
  { id: "actions", label: "Actions", description: "Specific steps to take", placeholder: "e.g., 1. Analyze the data\n2. Identify trends\n3. Summarize findings" }
];

const OCEAN_FIELDS = [
  { id: "original", label: "Original", description: "How to make it unique?", placeholder: "e.g., Avoid buzzwords, take a contrarian view..." },
  { id: "concrete", label: "Concrete", description: "Specific details required", placeholder: "e.g., Quantify all growth projections..." },
  { id: "evident", label: "Evident", description: "Evidence backing claims", placeholder: "e.g., Cite specific documents for every claim..." },
  { id: "assertive", label: "Assertive", description: "Tone and confidence", placeholder: "e.g., Write with a confident, authoritative tone..." },
  { id: "narrative", label: "Narrative", description: "Storytelling structure", placeholder: "e.g., Begin with a compelling hook..." }
];

export default function CryptoBuilder() {
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [generatedPrompt, setGeneratedPrompt] = useState("");
  const [activeTab, setActiveTab] = useState("aim");
  const [coinSymbol, setCoinSymbol] = useState("");
  const [isFetching, setIsFetching] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Update generated prompt whenever form data changes
  useEffect(() => {
    const parts = [];

    // AIM Section
    if (formData.actor || formData.input || formData.mission) {
      parts.push("### CORE REQUEST (AIM)");
      if (formData.actor) parts.push(`**Role:** ${formData.actor}`);
      if (formData.input) parts.push(`**Context:** ${formData.input}`);
      if (formData.mission) parts.push(`**Mission:** ${formData.mission}`);
      parts.push("");
    }

    // MAP Section
    if (formData.memory || formData.assets || formData.actions) {
      parts.push("### CONTEXT & STEPS (MAP)");
      if (formData.memory) parts.push(`**Memory:** ${formData.memory}`);
      if (formData.assets) parts.push(`**Assets:**\n${formData.assets}`);
      if (formData.actions) parts.push(`**Actions:**\n${formData.actions}`);
      parts.push("");
    }

    // OCEAN Section
    if (formData.original || formData.concrete || formData.evident || formData.assertive || formData.narrative) {
      parts.push("### OUTPUT STYLE (OCEAN)");
      if (formData.original) parts.push(`- **Originality:** ${formData.original}`);
      if (formData.concrete) parts.push(`- **Concreteness:** ${formData.concrete}`);
      if (formData.evident) parts.push(`- **Evidence:** ${formData.evident}`);
      if (formData.assertive) parts.push(`- **Tone:** ${formData.assertive}`);
      if (formData.narrative) parts.push(`- **Structure:** ${formData.narrative}`);
      parts.push("");
    }

    // Verification Section (Always included as best practice)
    parts.push("### VERIFICATION");
    parts.push("Before providing the final answer, please:");
    parts.push("1. Explain your reasoning step-by-step (Chain of Thought).");
    parts.push("2. Review your work for potential biases or weak arguments.");
    parts.push("3. Ensure all claims are backed by the provided context.");

    setGeneratedPrompt(parts.join("\n"));
  }, [formData]);

  const handleInputChange = (id: string, value: string) => {
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const getLastFilledField = (targetFieldId: string, fields: typeof AIM_FIELDS) => {
    const targetIndex = fields.findIndex(f => f.id === targetFieldId);
    if (targetIndex <= 0) return null;
    
    for (let i = targetIndex - 1; i >= 0; i--) {
      const field = fields[i];
      const value = formData[field.id];
      if (value && value.length >= 10) {
        return { id: field.id, value, label: field.label };
      }
    }
    return null;
  };

  const applyTemplate = (template: typeof CRYPTO_TEMPLATES[0]) => {
    setFormData({
      actor: template.aim.actor,
      input: template.aim.input,
      mission: template.aim.mission,
      memory: template.map.memory,
      assets: template.map.assets,
      actions: template.map.actions,
      original: template.ocean.original,
      concrete: template.ocean.concrete,
      evident: template.ocean.evident,
      assertive: template.ocean.assertive,
      narrative: template.ocean.narrative,
    });
    toast.success(`Applied template: ${template.name}`);
  };

  const fetchMarketData = async () => {
    if (!coinSymbol) {
      toast.error("Please enter a coin symbol (e.g., bitcoin, ethereum)");
      return;
    }

    setIsFetching(true);
    try {
      // Using CoinGecko API (Free tier, no key required for basic data)
      const response = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${coinSymbol.toLowerCase()}&vs_currencies=usd&include_market_cap=true&include_24hr_vol=true&include_24hr_change=true`);
      
      if (!response.ok) throw new Error("Failed to fetch data");
      
      const data = await response.json();
      const coinData = data[coinSymbol.toLowerCase()];

      if (!coinData) {
        toast.error(`Coin '${coinSymbol}' not found. Try full name (e.g., 'bitcoin' instead of 'btc')`);
        setIsFetching(false);
        return;
      }

      const marketSummary = `
Market Data for ${coinSymbol.toUpperCase()} (Source: CoinGecko):
- Price: $${coinData.usd}
- 24h Change: ${coinData.usd_24h_change.toFixed(2)}%
- Market Cap: $${coinData.usd_market_cap.toLocaleString()}
- 24h Volume: $${coinData.usd_24h_vol.toLocaleString()}
      `.trim();

      setFormData(prev => ({
        ...prev,
        input: prev.input ? `${prev.input}\n\n${marketSummary}` : marketSummary
      }));

      toast.success("Market data added to Input field!");
      setIsDialogOpen(false);
      setCoinSymbol("");
    } catch (error) {
      console.error(error);
      toast.error("Error fetching market data. API might be rate limited.");
    } finally {
      setIsFetching(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedPrompt);
    toast.success("Prompt copied to clipboard!");
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-[calc(100vh-8rem)]">
      {/* Left Column: Drafting Area */}
      <div className="flex flex-col h-full space-y-6 overflow-hidden">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <h2 className="text-2xl font-bold font-display tracking-tight text-primary">Crypto Analyst</h2>
            <p className="text-muted-foreground">Construct high-precision trading prompts.</p>
          </div>
          
          <div className="flex space-x-2">
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="border-primary/20 hover:border-primary/50 hover:bg-primary/5">
                  <Download className="mr-2 h-4 w-4" /> Fetch Data
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Fetch Real-Time Market Data</DialogTitle>
                  <DialogDescription>
                    Enter the full name of the cryptocurrency (e.g., "bitcoin", "ethereum", "solana") to fetch current price, volume, and market cap from CoinGecko.
                  </DialogDescription>
                </DialogHeader>
                <div className="flex space-x-2 mt-4">
                  <Input 
                    placeholder="Coin Name (e.g. bitcoin)" 
                    value={coinSymbol}
                    onChange={(e) => setCoinSymbol(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && fetchMarketData()}
                  />
                  <Button onClick={fetchMarketData} disabled={isFetching}>
                    {isFetching ? <RefreshCw className="animate-spin h-4 w-4" /> : <Search className="h-4 w-4" />}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="border-primary/20 hover:border-primary/50 hover:bg-primary/5">
                  Load Template <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                <DropdownMenuLabel>Crypto Trading Templates</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {CRYPTO_TEMPLATES.map((template) => (
                  <DropdownMenuItem 
                    key={template.id} 
                    onClick={() => applyTemplate(template)}
                    className="cursor-pointer flex flex-col items-start py-2"
                  >
                    <span className="font-medium">{template.name}</span>
                    <span className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{template.description}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="grid w-full grid-cols-3 mb-4 bg-secondary/50 p-1 rounded-none border border-border">
            <TabsTrigger value="aim" className="data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-none border-r border-transparent data-[state=active]:border-border transition-all">
              <Target className="w-4 h-4 mr-2" /> AIM
            </TabsTrigger>
            <TabsTrigger value="map" className="data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-none border-r border-transparent data-[state=active]:border-border transition-all">
              <Map className="w-4 h-4 mr-2" /> MAP
            </TabsTrigger>
            <TabsTrigger value="ocean" className="data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-none transition-all">
              <Lightbulb className="w-4 h-4 mr-2" /> OCEAN
            </TabsTrigger>
          </TabsList>

          <ScrollArea className="flex-1 pr-4 -mr-4">
            <TabsContent value="aim" className="space-y-6 mt-0">
              <div className="bg-card border border-border p-6 shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <img src="/images/icon-aim.png" alt="AIM" className="w-24 h-24 object-contain" />
                </div>
                <div className="relative z-10 space-y-6">
                  {AIM_FIELDS.map((field) => (
                    <div key={field.id} className="space-y-2">
                      <Label htmlFor={field.id} className="text-base font-semibold flex items-center">
                        {field.label}
                        <span className="ml-2 text-xs font-normal text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">
                          {field.id === 'actor' ? 'Who' : field.id === 'input' ? 'Context' : 'Goal'}
                        </span>
                      </Label>
                      <p className="text-sm text-muted-foreground mb-2">{field.description}</p>
                      <Textarea
                        id={field.id}
                        placeholder={field.placeholder}
                        className="font-mono text-sm bg-background/50 focus:bg-background transition-colors min-h-[100px] resize-none border-border focus:border-primary/50 focus:ring-1 focus:ring-primary/20"
                        value={formData[field.id] || ""}
                        onChange={(e) => handleInputChange(field.id, e.target.value)}
                      />
                      {!formData[field.id] && (() => {
                        const fields = activeTab === 'aim' ? AIM_FIELDS : activeTab === 'map' ? MAP_FIELDS : OCEAN_FIELDS;
                        const lastFilled = getLastFilledField(field.id, fields);
                        return lastFilled ? (
                          <MagicFillButton
                            framework="crypto"
                            currentField={lastFilled.id}
                            currentValue={lastFilled.value}
                            targetField={field.id}
                            targetLabel={field.label}
                            allFields={formData}
                            onApply={(suggestion) => handleInputChange(field.id, suggestion)}
                          />
                        ) : null;
                      })()}
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex justify-end">
                <Button onClick={() => setActiveTab("map")} className="group">
                  Next: Context (MAP) <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="map" className="space-y-6 mt-0">
              <div className="bg-card border border-border p-6 shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <img src="/images/icon-map.png" alt="MAP" className="w-24 h-24 object-contain" />
                </div>
                <div className="relative z-10 space-y-6">
                  {MAP_FIELDS.map((field) => (
                    <div key={field.id} className="space-y-2">
                      <Label htmlFor={field.id} className="text-base font-semibold flex items-center">
                        {field.label}
                      </Label>
                      <p className="text-sm text-muted-foreground mb-2">{field.description}</p>
                      <Textarea
                        id={field.id}
                        placeholder={field.placeholder}
                        className="font-mono text-sm bg-background/50 focus:bg-background transition-colors min-h-[100px] resize-none border-border focus:border-primary/50 focus:ring-1 focus:ring-primary/20"
                        value={formData[field.id] || ""}
                        onChange={(e) => handleInputChange(field.id, e.target.value)}
                      />
                      {!formData[field.id] && (() => {
                        const fields = activeTab === 'aim' ? AIM_FIELDS : activeTab === 'map' ? MAP_FIELDS : OCEAN_FIELDS;
                        const lastFilled = getLastFilledField(field.id, fields);
                        return lastFilled ? (
                          <MagicFillButton
                            framework="crypto"
                            currentField={lastFilled.id}
                            currentValue={lastFilled.value}
                            targetField={field.id}
                            targetLabel={field.label}
                            allFields={formData}
                            onApply={(suggestion) => handleInputChange(field.id, suggestion)}
                          />
                        ) : null;
                      })()}
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setActiveTab("aim")}>Back</Button>
                <Button onClick={() => setActiveTab("ocean")} className="group">
                  Next: Style (OCEAN) <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="ocean" className="space-y-6 mt-0">
              <div className="bg-card border border-border p-6 shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <img src="/images/icon-ocean.png" alt="OCEAN" className="w-24 h-24 object-contain" />
                </div>
                <div className="relative z-10 space-y-6">
                  {OCEAN_FIELDS.map((field) => (
                    <div key={field.id} className="space-y-2">
                      <Label htmlFor={field.id} className="text-base font-semibold flex items-center">
                        {field.label}
                      </Label>
                      <p className="text-sm text-muted-foreground mb-2">{field.description}</p>
                      <Textarea
                        id={field.id}
                        placeholder={field.placeholder}
                        className="font-mono text-sm bg-background/50 focus:bg-background transition-colors min-h-[80px] resize-none border-border focus:border-primary/50 focus:ring-1 focus:ring-primary/20"
                        value={formData[field.id] || ""}
                        onChange={(e) => handleInputChange(field.id, e.target.value)}
                      />
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex justify-start">
                <Button variant="outline" onClick={() => setActiveTab("map")}>Back</Button>
              </div>
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </div>

      {/* Right Column: Blueprint Preview */}
      <div className="flex flex-col h-full space-y-6">
        <div className="space-y-2">
          <h2 className="text-2xl font-bold font-display tracking-tight text-primary">The Blueprint</h2>
          <p className="text-muted-foreground">Your generated prompt, ready for deployment.</p>
        </div>

        <Card className="flex-1 flex flex-col border-2 border-primary/10 shadow-lg overflow-hidden bg-background relative">
          {/* Architectural Grid Background */}
          <div className="absolute inset-0 pointer-events-none opacity-[0.03]" 
               style={{ 
                 backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)', 
                 backgroundSize: '20px 20px' 
               }} 
          />
          
          <CardHeader className="bg-secondary/30 border-b border-border py-3 px-4 flex flex-row items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-xs font-mono font-medium text-muted-foreground uppercase tracking-wider">Output Preview</span>
            </div>
            <div className="flex items-center space-x-2">
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-7 text-xs font-mono hover:bg-background/50"
                onClick={() => setFormData({})}
              >
                <RefreshCw className="w-3 h-3 mr-1" /> Reset
              </Button>
            </div>
          </CardHeader>
          
          <CardContent className="flex-1 p-0 relative overflow-hidden">
            <ScrollArea className="h-full w-full">
              <div className="p-6 font-mono text-sm leading-relaxed whitespace-pre-wrap text-foreground/90">
                {generatedPrompt || (
                  <span className="text-muted-foreground/40 italic">
                    Live update...
                  </span>
                )}
              </div>
            </ScrollArea>
            
            {/* Copy Button Overlay */}
            <div className="absolute bottom-6 right-6">
              <Button 
                size="lg" 
                className="shadow-xl hover:shadow-2xl transition-all hover:-translate-y-1 font-semibold"
                onClick={copyToClipboard}
                disabled={!generatedPrompt}
              >
                <Copy className="w-4 h-4 mr-2" /> Copy to Clipboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
