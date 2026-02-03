import { useState, useEffect } from "react";
import { MagicFillButton } from "@/components/MagicFillButton";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Copy, RefreshCw, Briefcase, Eye, TrendingUp, Users, User, Ghost } from "lucide-react";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";

const PRINCIPLES = [
  {
    id: "ghost_notes",
    name: "Ghost Notes (Bayesian Filtering)",
    icon: Ghost,
    description: "Identify what is missing. Look for the 'bullet holes' that aren't there.",
    prompt_injection: "Apply 'Ghost Notes' analysis: Identify what is missing from the context. What variables are not being discussed but could be critical? Look for the 'bullet holes' that aren't there."
  },
  {
    id: "loss_function",
    name: "Loss Function Loop",
    icon: TrendingUp,
    description: "Optimize for correcting mistakes. Define metric -> Predict -> Fail -> Adjust.",
    prompt_injection: "Use the 'Loss Function Loop': 1. Define the success metric. 2. Predict the outcome. 3. Simulate the delivery. 4. Identify the most likely failure point. 5. Suggest one variable to adjust to minimize this failure."
  },
  {
    id: "adaptive_tension",
    name: "Adaptive Tension (CORE)",
    icon: Users,
    description: "Navigate conflict with Curiosity, Objectivity, Reassurance, and Empathy.",
    prompt_injection: "Apply the CORE Framework for communication: Ensure the response demonstrates Curiosity (ask questions), Objectivity (focus on facts), Reassurance (state positive intent), and Empathy (acknowledge perspectives)."
  },
  {
    id: "time_horizon",
    name: "Time Horizon Advantage",
    icon: Eye,
    description: "Plan for 90 Days (Visible), 12 Months (Valuable), and 5 Years (Visionary).",
    prompt_injection: "Structure the strategy across three time horizons: 1. Be Visible (90 Days): Quick wins. 2. Be Valuable (12-18 Months): Skill/System building. 3. Be a Visionary (5 Years): Long-term positioning."
  },
  {
    id: "identity",
    name: "Identity",
    icon: User,
    description: "Ask 'What will this decision make me?' instead of 'What will it get me?'.",
    prompt_injection: "Frame the final recommendation around Identity: Ask 'What will this decision make the user?' rather than just 'What will it get them?'. Prioritize character and long-term evolution."
  }
];

export default function BoardroomBuilder() {
  const [userInput, setUserInput] = useState("");
  const [selectedPrinciples, setSelectedPrinciples] = useState<string[]>(PRINCIPLES.map(p => p.id));
  const [generatedPrompt, setGeneratedPrompt] = useState("");
  const [isRefining, setIsRefining] = useState(false);

  useEffect(() => {
    if (!userInput) {
      setGeneratedPrompt("");
      return;
    }

    const activePrinciples = PRINCIPLES.filter(p => selectedPrinciples.includes(p.id));
    const principlesText = activePrinciples.map(p => `- ${p.name}: ${p.prompt_injection}`).join("\n");

    const prompt = `You are a Billion-Dollar Boardroom Advisor. Your goal is to help the user make a high-stakes decision using the following principles:

${principlesText}

### User Context
${userInput}

### Instructions
Provide a strategic analysis that rigorously applies the selected frameworks above. Be direct, concise, and focus on high-leverage insights.`;

    setGeneratedPrompt(prompt);
  }, [userInput, selectedPrinciples]);

  const togglePrinciple = (id: string) => {
    setSelectedPrinciples(prev => 
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedPrompt);
    toast.success("Prompt copied to clipboard!");
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-[calc(100vh-8rem)]">
      {/* Left Column: Input & Configuration */}
      <div className="flex flex-col h-full space-y-6 overflow-hidden">
        <div className="space-y-2">
          <h2 className="text-2xl font-bold font-display tracking-tight text-primary flex items-center">
            <Briefcase className="w-6 h-6 mr-2" /> Boardroom Strategist
          </h2>
          <p className="text-muted-foreground">Apply billion-dollar principles to your high-stakes decisions.</p>
        </div>

        <Card className="flex-1 flex flex-col bg-secondary/20 border-primary/10 overflow-hidden">
          <CardContent className="flex-1 flex flex-col p-6 space-y-6 overflow-hidden">
            <div className="space-y-3 flex-shrink-0">
              <Label className="text-base font-semibold">Select Principles to Apply</Label>
              <div className="grid grid-cols-1 gap-3">
                {PRINCIPLES.map((principle) => (
                  <div key={principle.id} className="flex items-start space-x-3 p-3 rounded-lg border border-border bg-background/50 hover:bg-background transition-colors">
                    <Checkbox 
                      id={principle.id} 
                      checked={selectedPrinciples.includes(principle.id)}
                      onCheckedChange={() => togglePrinciple(principle.id)}
                      className="mt-1"
                    />
                    <div className="space-y-1">
                      <Label htmlFor={principle.id} className="font-medium cursor-pointer flex items-center">
                        <principle.icon className="w-3 h-3 mr-2 text-primary" />
                        {principle.name}
                      </Label>
                      <p className="text-xs text-muted-foreground leading-snug">
                        {principle.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2 flex-1 flex flex-col min-h-0">
              <Label htmlFor="context" className="text-base font-semibold">Your Situation / Dilemma</Label>
              <Textarea
                id="context"
                placeholder="Describe the decision you need to make, the conflict you're facing, or the strategy you're building..."
                className="flex-1 font-mono text-sm bg-background/50 focus:bg-background transition-colors resize-none border-border focus:border-primary/50 focus:ring-1 focus:ring-primary/20 p-4"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
              />
              {userInput && userInput.length >= 20 && (
                <MagicFillButton
                  framework="boardroom"
                  currentField="context"
                  currentValue={userInput}
                  targetField="refined_context"
                  targetLabel="Refined Situation"
                  allFields={{ context: userInput }}
                  onApply={(refined) => setUserInput(refined)}
                  buttonText="Refine with AI"
                  loadingText="Refining your situation..."
                />
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Right Column: Output Preview */}
      <div className="flex flex-col h-full space-y-6">
        <div className="space-y-2">
          <h2 className="text-2xl font-bold font-display tracking-tight text-primary">Strategic Prompt</h2>
          <p className="text-muted-foreground">Your AI advisor instructions.</p>
        </div>

        <Card className="flex-1 flex flex-col border-2 border-primary/10 shadow-lg overflow-hidden bg-background relative">
          <div className="absolute inset-0 pointer-events-none opacity-[0.03]" 
               style={{ 
                 backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)', 
                 backgroundSize: '20px 20px' 
               }} 
          />
          
          <CardHeader className="bg-secondary/30 border-b border-border py-3 px-4 flex flex-row items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
              <span className="text-xs font-mono font-medium text-muted-foreground uppercase tracking-wider">Prompt Preview</span>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-7 text-xs font-mono hover:bg-background/50"
              onClick={() => setUserInput("")}
            >
              <RefreshCw className="w-3 h-3 mr-1" /> Clear
            </Button>
          </CardHeader>
          
          <CardContent className="flex-1 p-0 relative overflow-hidden">
            <ScrollArea className="h-full w-full">
              <div className="p-6 font-mono text-sm leading-relaxed whitespace-pre-wrap text-foreground/90">
                {generatedPrompt || (
                  <span className="text-muted-foreground/40 italic">
                    Describe your situation to generate a boardroom-level strategy prompt...
                  </span>
                )}
              </div>
            </ScrollArea>
            
            <div className="absolute bottom-6 right-6">
              <Button 
                size="lg" 
                className="shadow-xl hover:shadow-2xl transition-all hover:-translate-y-1 font-semibold"
                onClick={copyToClipboard}
                disabled={!generatedPrompt}
              >
                <Copy className="w-4 h-4 mr-2" /> Copy Prompt
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
