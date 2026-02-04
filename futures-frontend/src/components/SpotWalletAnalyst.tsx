import { useState, useEffect } from "react";
import { MagicFillButton } from "@/components/MagicFillButton";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Copy, RefreshCw, ArrowRight, Target, Map, Lightbulb, ChevronDown, Download, Search, Briefcase, TrendingUp, Clock, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Spot Templates Data (Inline for simplicity, usually imported)
const SPOT_TEMPLATES = [
  {
    id: "spot-aggressive-short",
    name: "Aggressive Growth (Short Term)",
    risk: "High",
    timeframe: "1-3 Months",
    description: "High-risk, high-reward portfolio targeting 5x-10x returns via micro-caps and narratives.",
    aim: {
      actor: "You are a high-risk venture capital scout and 'gem hunter' specializing in micro-cap cryptocurrencies and emerging narratives (AI, Gaming, RWA). You prioritize asymmetric upside over capital preservation.",
      input: "I have a risk appetite of [RISK_LEVEL] and aim to turn [CAPITAL] into [TARGET] within [TIMEFRAME]. I am willing to tolerate 50%+ drawdowns for the chance of 10x returns.",
      mission: "Construct a 'Nest Egg' portfolio of 5-10 high-potential 'gem' projects. Focus on coins with <$50M market cap, upcoming catalysts (mainnet launch, tier-1 listing), and strong social metrics."
    },
    map: {
      memory: "Recall that in short timeframes, hype and narrative drive price more than fundamentals.",
      assets: "- CoinList Upcoming Sales\n- DexScreener Trending\n- Twitter/X Sentiment Analysis",
      actions: "1. Identify the top 3 trending narratives for the next quarter.\n2. Select 2 'anchor' plays (mid-cap) and 5 'moonshot' plays (micro-cap).\n3. Analyze token unlock schedules to avoid dumping pressure.\n4. Suggest entry zones based on recent dips."
    },
    ocean: {
      original: "Find the hidden gems that influencers aren't talking about yet.",
      concrete: "Allocate specific percentages (e.g., 20% into Coin A, 15% into Coin B).",
      evident: "Justify each pick with a specific catalyst (e.g., 'Beta launch in 2 weeks').",
      assertive: "Be bold in your allocation strategy.",
      narrative: "Frame the portfolio as a 'venture bet' on the next wave of adoption."
    }
  },
  {
    id: "spot-balanced-medium",
    name: "Balanced Growth (Medium Term)",
    risk: "Medium",
    timeframe: "6-12 Months",
    description: "Balanced portfolio mixing established blue-chips with high-growth mid-caps.",
    aim: {
      actor: "You are a balanced crypto portfolio manager who seeks to outperform Bitcoin while managing downside risk. You use a 'Core-Satellite' approach.",
      input: "I have a medium risk appetite and aim to grow my portfolio by 2x-3x over the next year. I want exposure to growth but need to sleep at night.",
      mission: "Design a portfolio with 50% in 'Core' assets (BTC/ETH/SOL) and 50% in 'Satellite' growth plays (Layer 2s, DeFi, Infrastructure). Rebalance monthly."
    },
    map: {
      memory: "We prioritize projects with working products and real revenue.",
      assets: "- DefiLlama TVL Rankings\n- Active Developer Counts\n- Revenue/Fees Protocols",
      actions: "1. Allocate the Core portion to market leaders.\n2. Select Satellite plays based on TVL growth and user adoption.\n3. Set clear take-profit targets for the Satellite portion to rotate back into Core."
    },
    ocean: {
      original: "Focus on fundamental value accrual.",
      concrete: "Provide a clear pie-chart style allocation.",
      evident: "Use on-chain metrics (TVL, Daily Active Users) as evidence.",
      assertive: "Be disciplined about rebalancing.",
      narrative: "Describe the strategy as 'capturing the growth of the ecosystem's infrastructure'."
    }
  },
  {
    id: "spot-conservative-long",
    name: "Conservative Wealth (Long Term)",
    risk: "Low",
    timeframe: "1-4 Years",
    description: "Capital preservation and steady compounding via blue-chips and staking.",
    aim: {
      actor: "You are a conservative wealth manager focused on generational wealth preservation and steady compounding in the crypto asset class.",
      input: "I have a low risk appetite and a multi-year horizon. My goal is to beat inflation and the S&P 500 significantly without risking ruin.",
      mission: "Build a 'Fortress' portfolio concentrated in Bitcoin and Ethereum, utilizing safe staking and lending yields to enhance returns. Minimize exposure to altcoin volatility."
    },
    map: {
      memory: "Rule #1: Don't lose money. Rule #2: Don't forget Rule #1.",
      assets: "- Bitcoin Halving Cycles\n- Ethereum Staking Yields\n- Macroeconomic Trends",
      actions: "1. Allocate 70-80% to BTC/ETH cold storage.\n2. Allocate 20% to stablecoin yield farming or low-risk staking.\n3. Establish a Dollar-Cost Averaging (DCA) schedule."
    },
    ocean: {
      "original": "Focus on macro-economics and the 'hard money' thesis.",
      "concrete": "Calculate the projected compound interest from staking.",
      "evident": "Reference historical 4-year cycle performance.",
      "assertive": "Be prudent and patient.",
      "narrative": "Frame the portfolio as 'digital gold' and 'internet bonds'."
    }
  },
  {
    "id": "spot-gem-sniper",
    "name": "CoinList Gem Sniper (Special)",
    "risk": "Very High",
    "timeframe": "Event Driven",
    "description": "Specialized strategy for getting into pre-sales and early token generation events.",
    "aim": {
      "actor": "You are an expert in primary market issuance and tokenomics analysis. You specialize in identifying the next 'Solana' or 'Flow' before they hit public trading.",
      "input": "I am looking for upcoming ICOs, IDOs, and LBP (Liquidity Bootstrapping Pools) on platforms like CoinList, Fjord Foundry, and Seedify.",
      "mission": "Analyze the upcoming token sale calendar. Identify projects with: 1. Top-tier VC backing (a16z, Paradigm), 2. Low initial circulating supply, 3. Strong community hype. Create a strategy to maximize allocation odds."
    },
    "map": {
      "memory": "Access is everything. We need to be early.",
      "assets": "- CoinList Sale Calendar\n- Vesting Schedules\n- VC Portfolios",
      "actions": "1. Rank upcoming sales by 'hype score'.\n2. Analyze the FDV (Fully Diluted Valuation) vs. Initial Market Cap.\n3. Provide a checklist for qualifying for the sale (KYC, Karma points, etc.)."
    },
    "ocean": {
      "original": "Focus on the 'access game' and 'allocation alpha'.",
      "concrete": "List specific dates and qualification requirements.",
      "evident": "Compare to ROI of past similar sales.",
      "assertive": "Urgent tone due to time-sensitive deadlines.",
      "narrative": "Frame this as 'getting in on the ground floor' with the insiders."
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

export default function SpotWalletAnalyst() {
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [generatedPrompt, setGeneratedPrompt] = useState("");
  const [activeTab, setActiveTab] = useState("aim");
  
  // Spot Analyst Specific State
  const [riskAppetite, setRiskAppetite] = useState("Medium");
  const [timeFrame, setTimeFrame] = useState("6-12 Months");
  const [capital, setCapital] = useState("");
  const [targetReturn, setTargetReturn] = useState("");

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

    // Verification Section
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

  const generateNestEgg = () => {
    // Logic to select the best template based on user inputs
    let selectedTemplate = SPOT_TEMPLATES[1]; // Default to Balanced

    if (riskAppetite === "Very High" || targetReturn.includes("10x") || targetReturn.includes("100x")) {
      selectedTemplate = SPOT_TEMPLATES[3]; // Gem Sniper
    } else if (riskAppetite === "High") {
      selectedTemplate = SPOT_TEMPLATES[0]; // Aggressive
    } else if (riskAppetite === "Low") {
      selectedTemplate = SPOT_TEMPLATES[2]; // Conservative
    }

    // Inject user variables into the template
    const inputContext = selectedTemplate.aim.input
      .replace("[RISK_LEVEL]", riskAppetite)
      .replace("[CAPITAL]", capital || "$10,000")
      .replace("[TARGET]", targetReturn || "2x")
      .replace("[TIMEFRAME]", timeFrame);

    setFormData({
      actor: selectedTemplate.aim.actor,
      input: inputContext,
      mission: selectedTemplate.aim.mission,
      memory: selectedTemplate.map.memory,
      assets: selectedTemplate.map.assets,
      actions: selectedTemplate.map.actions,
      original: selectedTemplate.ocean.original,
      concrete: selectedTemplate.ocean.concrete,
      evident: selectedTemplate.ocean.evident,
      assertive: selectedTemplate.ocean.assertive,
      narrative: selectedTemplate.ocean.narrative,
    });

    toast.success(`Generated '${selectedTemplate.name}' Strategy!`);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedPrompt);
    toast.success("Prompt copied to clipboard!");
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-[calc(100vh-8rem)]">
      {/* Left Column: Drafting Area */}
      <div className="flex flex-col h-full space-y-6 overflow-hidden">
        <div className="space-y-2">
          <h2 className="text-2xl font-bold font-display tracking-tight text-primary">Spot Wallet Analyst</h2>
          <p className="text-muted-foreground">Build your perfect "Nest Egg" portfolio strategy.</p>
        </div>

        {/* Strategy Builder Controls */}
        <Card className="bg-secondary/20 border-primary/10">
          <CardContent className="p-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="flex items-center"><ShieldAlert className="w-4 h-4 mr-2 text-primary" /> Risk Appetite</Label>
                <Select value={riskAppetite} onValueChange={setRiskAppetite}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Risk" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Low">Low (Preservation)</SelectItem>
                    <SelectItem value="Medium">Medium (Balanced)</SelectItem>
                    <SelectItem value="High">High (Aggressive)</SelectItem>
                    <SelectItem value="Very High">Very High (Degen/Gem)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="flex items-center"><Clock className="w-4 h-4 mr-2 text-primary" /> Time Frame</Label>
                <Select value={timeFrame} onValueChange={setTimeFrame}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Time" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1-3 Months">1-3 Months (Short)</SelectItem>
                    <SelectItem value="6-12 Months">6-12 Months (Medium)</SelectItem>
                    <SelectItem value="1-4 Years">1-4 Years (Long)</SelectItem>
                    <SelectItem value="Event Driven">Event Driven (Pre-Sale)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="flex items-center"><Briefcase className="w-4 h-4 mr-2 text-primary" /> Capital</Label>
                <Input placeholder="e.g. $10,000" value={capital} onChange={(e) => setCapital(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center"><TrendingUp className="w-4 h-4 mr-2 text-primary" /> Target Return</Label>
                <Input placeholder="e.g. 2x, 10x, $1M" value={targetReturn} onChange={(e) => setTargetReturn(e.target.value)} />
              </div>
            </div>
            <Button onClick={generateNestEgg} className="w-full font-semibold shadow-md">
              <Lightbulb className="w-4 h-4 mr-2" /> Generate Nest Egg Strategy
            </Button>
          </CardContent>
        </Card>

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
                            framework="spot"
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
                            framework="spot"
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
                      {!formData[field.id] && (() => {
                        const fields = activeTab === 'aim' ? AIM_FIELDS : activeTab === 'map' ? MAP_FIELDS : OCEAN_FIELDS;
                        const lastFilled = getLastFilledField(field.id, fields);
                        return lastFilled ? (
                          <MagicFillButton
                            framework="spot"
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
