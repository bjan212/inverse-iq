import { trpc } from "@/lib/trpc";
import { useEffect, useState } from "react";

type Framework = "aim" | "map" | "ocean" | "crypto" | "spot" | "boardroom";

interface UseAISuggestionProps {
  framework: Framework;
  currentField: string;
  currentValue: string;
  targetField: string;
  allFields?: Record<string, string>;
  debounceMs?: number;
}

export function useAISuggestion({
  framework,
  currentField,
  currentValue,
  targetField,
  allFields,
  debounceMs = 1000,
}: UseAISuggestionProps) {
  const [debouncedValue, setDebouncedValue] = useState(currentValue);
  const [suggestion, setSuggestion] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const suggestMutation = trpc.ai.suggest.useMutation({
    onSuccess: (data) => {
      setSuggestion(data.suggestion);
      setIsGenerating(false);
    },
    onError: (error) => {
      console.error("AI suggestion error:", error);
      setIsGenerating(false);
    },
  });

  // Debounce the current value
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(currentValue);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [currentValue, debounceMs]);

  // Trigger suggestion when debounced value changes and is non-empty
  useEffect(() => {
    if (debouncedValue.trim().length > 10) {
      setIsGenerating(true);
      suggestMutation.mutate({
        framework,
        currentField,
        currentValue: debouncedValue,
        targetField,
        allFields,
      });
    } else {
      setSuggestion("");
    }
  }, [debouncedValue, framework, currentField, targetField]);

  return {
    suggestion,
    isGenerating,
    clearSuggestion: () => setSuggestion(""),
  };
}
