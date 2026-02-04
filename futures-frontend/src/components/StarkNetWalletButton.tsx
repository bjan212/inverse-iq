import { useAccount, useConnect, useDisconnect } from '@starknet-react/core';
import { Button } from './ui/button';
import { Wallet } from 'lucide-react';

export function StarkNetWalletButton() {
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();

  if (isConnected && address) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">
          {address.slice(0, 6)}...{address.slice(-4)}
        </span>
        <Button variant="outline" size="sm" onClick={() => disconnect()}>
          Disconnect L2
        </Button>
      </div>
    );
  }

  return (
    <div className="flex gap-2">
      {connectors.map((connector) => (
        <Button
          key={connector.id}
          variant="outline"
          size="sm"
          onClick={() => connect({ connector })}
          className="flex items-center gap-2"
        >
          <Wallet className="h-4 w-4" />
          {connector.name}
        </Button>
      ))}
    </div>
  );
}
