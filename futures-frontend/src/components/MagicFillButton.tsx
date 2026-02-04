import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

interface MagicFillButtonProps {
  framework: "aim" | "map" | "ocean" | "crypto" | "spot" | "boardroom";
  currentField: string;
  currentValue: string;
  targetField: string;
  targetLabel: string;
  allFields?: Record<string, string>;
  onApply: (suggestion: string) => void;
  disabled?: boolean;
  buttonText?: string;
  loadingText?: string;
}

export function MagicFillButton({
  framework,
  currentField,
  currentValue,
  targetField,
  targetLabel,
  allFields,
  onApply,
  disabled,
  buttonText = "Magic Fill",
  loadingText = "Generating suggestion...",
}: MagicFillButtonProps) {
  const [showSuggestion, setShowSuggestion] = useState(false);
  const [suggestion, setSuggestion] = useState("");

  const suggestMutation = trpc.ai.suggest.useMutation({
    onSuccess: (data) => {
      setSuggestion(data.suggestion);
      setShowSuggestion(true);
    },
    onError: (error) => {
      toast.error("Failed to generate suggestion");
      console.error("AI suggestion error:", error);
    },
  });

  const handleGenerate = () => {
    suggestMutation.mutate({
      framework,
      currentField,
      currentValue,
      targetField,
      allFields,
    });
  };

  const handleApply = () => {
    onApply(suggestion);
    toast.success(`"${targetLabel}" filled with AI suggestion!`);
    setShowSuggestion(false);
    setSuggestion("");
  };

  const handleDismiss = () => {
    setShowSuggestion(false);
    setSuggestion("");
  };

  if (disabled || !currentValue || currentValue.trim().length < 10) {
    return null;
  }

  return (
    <div className="mt-2">
      {!showSuggestion && !suggestMutation.isPending && (
        <Button
          size="sm"
          variant="outline"
          onClick={handleGenerate}
          className="h-7 text-xs border-primary/30 text-primary hover:bg-primary/10"
        >
          <Sparkles className="w-3 h-3 mr-1" />
          {buttonText}
        </Button>
      )}

      {suggestMutation.isPending && (
        <div className="flex items-center text-xs text-muted-foreground py-1">
          <Loader2 className="w-3 h-3 mr-1 animate-spin" />
          {loadingText}
        </div>
      )}

      {showSuggestion && suggestion && (
        <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-center text-xs font-semibold text-primary">
            <Sparkles className="w-3 h-3 mr-1" />
            AI Suggestion for "{targetLabel}"
          </div>
          <p className="text-sm text-foreground/90 leading-relaxed font-mono bg-background/50 p-2 rounded border border-border">
            {suggestion}
          </p>
          <div className="flex gap-2">
            <Button size="sm" variant="default" onClick={handleApply} className="h-7 text-xs">
              Apply
            </Button>
            <Button size="sm" variant="ghost" onClick={handleDismiss} className="h-7 text-xs">
              Dismiss
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
