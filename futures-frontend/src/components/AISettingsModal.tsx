import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Loader2, Key, CheckCircle2 } from "lucide-react";

interface AISettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function AISettingsModal({ open, onOpenChange, onSuccess }: AISettingsModalProps) {
  const [provider, setProvider] = useState<"openai" | "anthropic">("openai");
  const [apiKey, setApiKey] = useState("");
  const [model, setModel] = useState("");

  const saveApiKey = trpc.prompt.saveApiKey.useMutation({
    onSuccess: () => {
      toast.success("API key saved successfully!");
      setApiKey("");
      setModel("");
      onOpenChange(false);
      onSuccess?.();
    },
    onError: (error) => {
      toast.error("Failed to save API key: " + error.message);
    },
  });

  const handleSave = () => {
    if (!apiKey.trim()) {
      toast.error("Please enter an API key");
      return;
    }

    saveApiKey.mutate({
      provider,
      apiKey: apiKey.trim(),
      model: model.trim() || undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Key className="w-5 h-5" />
            AI Model Settings
          </DialogTitle>
          <DialogDescription>
            Connect your own AI API keys to enhance the ensemble system with additional models.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Provider Selection */}
          <div className="space-y-2">
            <Label htmlFor="provider">AI Provider</Label>
            <Select value={provider} onValueChange={(v) => setProvider(v as "openai" | "anthropic")}>
              <SelectTrigger id="provider">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="openai">OpenAI (GPT-4)</SelectItem>
                <SelectItem value="anthropic">Anthropic (Claude)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* API Key Input */}
          <div className="space-y-2">
            <Label htmlFor="apiKey">API Key</Label>
            <Input
              id="apiKey"
              type="password"
              placeholder={provider === "openai" ? "sk-..." : "sk-ant-..."}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              {provider === "openai" ? (
                <>Get your API key from <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="underline">OpenAI Platform</a></>
              ) : (
                <>Get your API key from <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noopener noreferrer" className="underline">Anthropic Console</a></>
              )}
            </p>
          </div>

          {/* Model Selection (Optional) */}
          <div className="space-y-2">
            <Label htmlFor="model">Model (Optional)</Label>
            <Input
              id="model"
              placeholder={provider === "openai" ? "gpt-4" : "claude-3-5-sonnet-20241022"}
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              Leave empty to use the default model
            </p>
          </div>

          {/* Info Box */}
          <div className="bg-primary/5 border border-primary/20 rounded-md p-4 space-y-2">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
              <div className="text-sm space-y-1">
                <p className="font-medium">How the Ensemble Works:</p>
                <ul className="text-muted-foreground space-y-1 ml-4 list-disc">
                  <li>Queries all available AI models in parallel</li>
                  <li>Meta-AI synthesizes the best elements from each</li>
                  <li>Always includes the built-in model as baseline</li>
                  <li>Your API key is stored securely and never shared</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saveApiKey.isPending}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saveApiKey.isPending}>
            {saveApiKey.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              "Save API Key"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
