import { useState, useEffect } from "react";
import { MagicFillButton } from "@/components/MagicFillButton";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Copy, RefreshCw, ArrowRight, Target, Map, Lightbulb, Sparkles, Loader2, Settings, CheckCircle2, Circle } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { AISettingsModal } from "@/components/AISettingsModal";
import { Badge } from "@/components/ui/badge";

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

export default function PromptBuilder() {
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [generatedPrompt, setGeneratedPrompt] = useState("");
  const [activeTab, setActiveTab] = useState("aim");
  const [quickStartInput, setQuickStartInput] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Check API key status
  const { data: apiKeyStatus, refetch: refetchApiKeyStatus } = trpc.prompt.getApiKeyStatus.useQuery();

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

  const getLastFilledField = (currentFieldId: string, fields: typeof AIM_FIELDS | typeof MAP_FIELDS | typeof OCEAN_FIELDS) => {
    const currentIndex = fields.findIndex(f => f.id === currentFieldId);
    if (currentIndex === 0) return null;
    
    for (let i = currentIndex - 1; i >= 0; i--) {
      const field = fields[i];
      if (formData[field!.id] && formData[field!.id]!.trim().length > 10) {
        return { id: field!.id, value: formData[field!.id]! };
      }
    }
    return null;
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedPrompt);
    toast.success("Prompt copied to clipboard!");
  };

  const generateFromQuickStart = trpc.prompt.generateFromDescription.useMutation({
    onSuccess: (data) => {
      setFormData(data as unknown as Record<string, string>);
      toast.success("All fields generated successfully!");
      setIsGenerating(false);
    },
    onError: (error) => {
      toast.error("Failed to generate fields: " + error.message);
      setIsGenerating(false);
    }
  });

  const handleQuickStart = () => {
    if (!quickStartInput.trim()) {
      toast.error("Please enter a description first");
      return;
    }
    setIsGenerating(true);
    generateFromQuickStart.mutate({ description: quickStartInput });
  };

  return (
    <>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-[calc(100vh-8rem)]">
      {/* Left Column: Drafting Area */}
      <div className="flex flex-col h-full space-y-6 overflow-hidden">
        <div className="space-y-2">
          <h2 className="text-2xl font-bold font-display tracking-tight text-primary">Drafting Table</h2>
          <p className="text-muted-foreground">Construct your prompt using the proven frameworks.</p>
        </div>

        {/* Quick Start Section */}
        <Card className="border-2 border-primary/20 bg-primary/5">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                <h3 className="font-bold text-lg">Quick Start</h3>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSettings(true)}
                className="h-8 gap-2"
              >
                <Settings className="w-4 h-4" />
                AI Settings
              </Button>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Describe what you want in one line, and AI will fill all fields for you</p>
              
              {/* AI Models Status Indicators */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-muted-foreground">Active Models:</span>
                <Badge variant="outline" className="gap-1.5">
                  <CheckCircle2 className="w-3 h-3 text-green-500" />
                  Built-in
                </Badge>
                {apiKeyStatus?.hasKey && apiKeyStatus.provider === "openai" && (
                  <Badge variant="outline" className="gap-1.5">
                    <CheckCircle2 className="w-3 h-3 text-green-500" />
                    OpenAI
                  </Badge>
                )}
                {apiKeyStatus?.hasKey && apiKeyStatus.provider === "anthropic" && (
                  <Badge variant="outline" className="gap-1.5">
                    <CheckCircle2 className="w-3 h-3 text-green-500" />
                    Anthropic
                  </Badge>
                )}
                {!apiKeyStatus?.hasKey && (
                  <Badge variant="outline" className="gap-1.5 text-muted-foreground">
                    <Circle className="w-3 h-3" />
                    External APIs (Not Connected)
                  </Badge>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <Textarea
              placeholder="e.g., Write a technical blog post about React Server Components for senior developers"
              className="font-mono text-sm min-h-[80px] resize-none"
              value={quickStartInput}
              onChange={(e) => setQuickStartInput(e.target.value)}
              disabled={isGenerating}
            />
            <Button
              onClick={handleQuickStart}
              disabled={isGenerating || !quickStartInput.trim()}
              className="w-full"
              size="lg"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Consulting Multiple AI Models...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate from Description
                </>
              )}
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
                        const lastFilled = getLastFilledField(field.id, activeTab === 'aim' ? AIM_FIELDS : activeTab === 'map' ? MAP_FIELDS : OCEAN_FIELDS);
                        return lastFilled ? (
                          <MagicFillButton
                            framework={activeTab as "aim" | "map" | "ocean"}
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
                        const lastFilled = getLastFilledField(field.id, activeTab === 'aim' ? AIM_FIELDS : activeTab === 'map' ? MAP_FIELDS : OCEAN_FIELDS);
                        return lastFilled ? (
                          <MagicFillButton
                            framework={activeTab as "aim" | "map" | "ocean"}
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

    {/* AI Settings Modal */}
    <AISettingsModal
      open={showSettings}
      onOpenChange={setShowSettings}
      onSuccess={() => refetchApiKeyStatus()}
    />
    </>
  );
}
