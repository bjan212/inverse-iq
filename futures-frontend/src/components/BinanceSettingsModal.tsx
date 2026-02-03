import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';
import { Loader2, CheckCircle2, AlertCircle, ExternalLink } from 'lucide-react';

interface BinanceSettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BinanceSettingsModal({ open, onOpenChange }: BinanceSettingsModalProps) {
  const [apiKey, setApiKey] = useState('');
  const [apiSecret, setApiSecret] = useState('');
  const [isTesting, setIsTesting] = useState(false);

  const saveKeysMutation = trpc.binance.saveApiKeys.useMutation();
  const testConnectionMutation = trpc.binance.testConnection.useMutation();
  const utils = trpc.useUtils();

  const handleSave = async () => {
    if (!apiKey || !apiSecret) {
      toast.error('Please enter both API Key and API Secret');
      return;
    }

    try {
      await saveKeysMutation.mutateAsync({ apiKey, apiSecret });
      toast.success('Binance API keys saved successfully');
      
      // Test connection
      setIsTesting(true);
      try {
        await testConnectionMutation.mutateAsync();
        toast.success('Connection test successful!');
        utils.binance.getApiKeysStatus.invalidate();
        onOpenChange(false);
      } catch (error: any) {
        toast.error(`Connection test failed: ${error.message}`);
      } finally {
        setIsTesting(false);
      }
    } catch (error: any) {
      toast.error(`Failed to save API keys: ${error.message}`);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Binance Futures API Settings</DialogTitle>
          <DialogDescription>
            Enter your Binance Futures API credentials to enable live trading execution.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Instructions */}
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="space-y-1">
                <p className="font-medium text-blue-900">How to get your API keys:</p>
                <ol className="list-decimal list-inside space-y-1 text-blue-800">
                  <li>Go to Binance Futures → API Management</li>
                  <li>Create a new API key with "Enable Futures" permission</li>
                  <li>Copy the API Key and Secret Key</li>
                  <li>Paste them below</li>
                </ol>
                <a
                  href="https://www.binance.com/en/my/settings/api-management"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 font-medium mt-2"
                >
                  Open Binance API Management
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>
          </div>

          {/* API Key Input */}
          <div className="space-y-2">
            <Label htmlFor="apiKey">API Key</Label>
            <Input
              id="apiKey"
              type="text"
              placeholder="Enter your Binance API Key"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="font-mono text-sm"
            />
          </div>

          {/* API Secret Input */}
          <div className="space-y-2">
            <Label htmlFor="apiSecret">API Secret</Label>
            <Input
              id="apiSecret"
              type="password"
              placeholder="Enter your Binance API Secret"
              value={apiSecret}
              onChange={(e) => setApiSecret(e.target.value)}
              className="font-mono text-sm"
            />
          </div>

          {/* Security Notice */}
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
              <div className="text-amber-800">
                <p className="font-medium">Security Tips:</p>
                <ul className="list-disc list-inside space-y-1 mt-1">
                  <li>Never share your API keys with anyone</li>
                  <li>Enable IP whitelist restriction on Binance</li>
                  <li>Do not enable withdrawal permissions</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saveKeysMutation.isPending || isTesting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={saveKeysMutation.isPending || isTesting || !apiKey || !apiSecret}
          >
            {saveKeysMutation.isPending || isTesting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {isTesting ? 'Testing Connection...' : 'Saving...'}
              </>
            ) : (
              <>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Save & Test Connection
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
