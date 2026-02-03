import { Button } from "@/components/ui/button";
import { useAISuggestion } from "@/hooks/useAISuggestion";
import { Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface AISuggestionButtonProps {
  framework: "aim" | "map" | "ocean" | "crypto" | "spot" | "boardroom";
  currentField: string;
  currentValue: string;
  targetField: string;
  allFields?: Record<string, string>;
  onApply: (suggestion: string) => void;
  disabled?: boolean;
}

export function AISuggestionButton({
  framework,
  currentField,
  currentValue,
  targetField,
  allFields,
  onApply,
  disabled,
}: AISuggestionButtonProps) {
  const { suggestion, isGenerating, clearSuggestion } = useAISuggestion({
    framework,
    currentField,
    currentValue,
    targetField,
    allFields,
    debounceMs: 0, // No debounce for button-triggered suggestions
  });

  const handleApply = () => {
    if (suggestion) {
      onApply(suggestion);
      toast.success("AI suggestion applied!");
      clearSuggestion();
    }
  };

  if (disabled || !currentValue || currentValue.trim().length < 10) {
    return null;
  }

  return (
    <div className="mt-2 flex items-start gap-2">
      {isGenerating ? (
        <div className="flex items-center text-xs text-muted-foreground">
          <Loader2 className="w-3 h-3 mr-1 animate-spin" />
          Generating suggestion...
        </div>
      ) : suggestion ? (
        <div className="flex-1 p-3 bg-primary/5 border border-primary/20 rounded-lg space-y-2">
          <div className="flex items-center text-xs font-semibold text-primary">
            <Sparkles className="w-3 h-3 mr-1" />
            AI Suggestion
          </div>
          <p className="text-sm text-foreground/80 leading-relaxed">{suggestion}</p>
          <div className="flex gap-2">
            <Button size="sm" variant="default" onClick={handleApply} className="h-7 text-xs">
              Apply
            </Button>
            <Button size="sm" variant="ghost" onClick={clearSuggestion} className="h-7 text-xs">
              Dismiss
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
