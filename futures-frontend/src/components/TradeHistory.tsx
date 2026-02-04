import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, CheckCircle, XCircle, Minus } from "lucide-react";
import { toast } from "sonner";

export default function TradeHistory() {
  const { data: trades, isLoading, refetch } = trpc.futures.getTradeHistory.useQuery();
  const { data: progress } = trpc.futures.getUserProgress.useQuery();

  const recordResultMutation = trpc.futures.recordTradeResult.useMutation({
    onSuccess: () => {
      toast.success("Trade result recorded!");
      refetch();
    },
    onError: (error) => {
      toast.error(`Failed to record result: ${error.message}`);
    },
  });

  const handleRecordResult = (tradeId: number, result: "win" | "loss" | "breakeven", exitPrice: string) => {
    const trade = trades?.find((t) => t.id === tradeId);
    if (!trade) return;

    const entryPrice = parseFloat(trade.entryPrice);
    const exit = parseFloat(exitPrice);
    const isLong = trade.direction === "LONG";

    let profitLoss = "0";
    if (result === "win") {
      profitLoss = isLong ? ((exit - entryPrice) / entryPrice * 100).toFixed(2) : ((entryPrice - exit) / entryPrice * 100).toFixed(2);
    } else if (result === "loss") {
      profitLoss = isLong ? ((exit - entryPrice) / entryPrice * 100).toFixed(2) : ((entryPrice - exit) / entryPrice * 100).toFixed(2);
    }

    recordResultMutation.mutate({
      tradeId,
      result,
      exitPrice,
      profitLoss,
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          Loading trade history...
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Progress Stats */}
      {progress && (
        <Card>
          <CardHeader>
            <CardTitle>Your Progress</CardTitle>
            <CardDescription>Level: {progress.currentLevel.toUpperCase()}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold">{progress.totalTrades}</div>
                <div className="text-xs text-muted-foreground">Total Trades</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">{progress.winningTrades}</div>
                <div className="text-xs text-muted-foreground">Wins</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-red-600">{progress.losingTrades}</div>
                <div className="text-xs text-muted-foreground">Losses</div>
              </div>
            </div>
            <div className="mt-4">
              <div className="flex items-center justify-between text-sm mb-1">
                <span>Win Rate</span>
                <span className="font-bold">{progress.winRate}%</span>
              </div>
              <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500 transition-all"
                  style={{ width: `${progress.winRate}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Trade History */}
      <Card>
        <CardHeader>
          <CardTitle>Trade History</CardTitle>
          <CardDescription>Your recent futures trades</CardDescription>
        </CardHeader>
        <CardContent>
          {!trades || trades.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              No trades yet. Generate a signal to get started!
            </div>
          ) : (
            <div className="space-y-3">
              {trades.map((trade) => (
                <div
                  key={trade.id}
                  className="p-4 border border-border rounded-lg space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={trade.direction === "LONG" ? "default" : "destructive"}
                      >
                        {trade.direction === "LONG" ? (
                          <TrendingUp className="w-3 h-3 mr-1" />
                        ) : (
                          <TrendingDown className="w-3 h-3 mr-1" />
                        )}
                        {trade.direction}
                      </Badge>
                      <span className="font-bold">{trade.symbol}</span>
                      <span className="text-xs text-muted-foreground">
                        {trade.leverage}x
                      </span>
                    </div>
                    <div>
                      {trade.result === "open" ? (
                        <Badge variant="outline">OPEN</Badge>
                      ) : trade.result === "win" ? (
                        <Badge variant="default" className="bg-green-600">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          WIN
                        </Badge>
                      ) : trade.result === "loss" ? (
                        <Badge variant="destructive">
                          <XCircle className="w-3 h-3 mr-1" />
                          LOSS
                        </Badge>
                      ) : (
                        <Badge variant="secondary">
                          <Minus className="w-3 h-3 mr-1" />
                          BREAKEVEN
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div>
                      <div className="text-xs text-muted-foreground">Entry</div>
                      <div className="font-mono">${trade.entryPrice}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Stop-Loss</div>
                      <div className="font-mono text-red-600">${trade.stopLoss}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Take-Profit</div>
                      <div className="font-mono text-green-600">${trade.takeProfit}</div>
                    </div>
                  </div>

                  {trade.result === "open" && (
                    <div className="flex gap-2 pt-2">
                      <Button
                        size="sm"
                        variant="default"
                        className="flex-1"
                        onClick={() => handleRecordResult(trade.id, "win", trade.takeProfit)}
                      >
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Win
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        className="flex-1"
                        onClick={() => handleRecordResult(trade.id, "loss", trade.stopLoss)}
                      >
                        <XCircle className="w-3 h-3 mr-1" />
                        Loss
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        className="flex-1"
                        onClick={() => handleRecordResult(trade.id, "breakeven", trade.entryPrice)}
                      >
                        <Minus className="w-3 h-3 mr-1" />
                        BE
                      </Button>
                    </div>
                  )}

                  {trade.profitLoss && (
                    <div className="pt-2 border-t border-border">
                      <div className="text-sm">
                        <span className="text-muted-foreground">P/L: </span>
                        <span
                          className={`font-bold ${
                            parseFloat(trade.profitLoss) >= 0
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          {parseFloat(trade.profitLoss) >= 0 ? "+" : ""}
                          {trade.profitLoss}%
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
