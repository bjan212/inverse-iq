import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Calendar, Filter, Download } from "lucide-react";

export default function TradeHistory() {
  const [symbolFilter, setSymbolFilter] = useState<string>("");
  const [directionFilter, setDirectionFilter] = useState<string>("");
  const [resultFilter, setResultFilter] = useState<string>("");

  const { data: statistics, isLoading: statsLoading } = trpc.tradeHistory.getStatistics.useQuery();
  const { data: history, isLoading: historyLoading } = trpc.tradeHistory.getHistory.useQuery({
    symbol: symbolFilter || undefined,
    direction: directionFilter as any,
    result: resultFilter as any,
    limit: 50,
  });

  const exportToCSV = () => {
    if (!history) return;
    
    const headers = ['Date', 'Symbol', 'Direction', 'Entry', 'Exit', 'P&L', 'Result'];
    const rows = history.map((trade: any) => [
      new Date(trade.createdAt).toLocaleDateString(),
      trade.symbol,
      trade.direction,
      trade.entryPrice,
      trade.exitPrice || '-',
      trade.profitLoss || '-',
      trade.result,
    ]);
    
    const csv = [headers, ...rows].map(row => row.join(',')).join('\\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `trade-history-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-border bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto py-4">
          <h1 className="text-2xl font-bold">Trade History & Analytics</h1>
          <p className="text-sm text-muted-foreground">Track your trading performance and learn from your history</p>
        </div>
      </header>

      <main className="container mx-auto py-8 px-4 space-y-6">
        {/* Statistics Cards */}
        {statsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader className="pb-2">
                  <div className="h-4 bg-muted rounded w-1/2"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-8 bg-muted rounded w-3/4"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : statistics && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Total Trades</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{statistics.totalTrades}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {statistics.openTrades} open positions
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Win Rate</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-500">{statistics.winRate}%</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {statistics.winningTrades}W / {statistics.losingTrades}L
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Total P&L</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className={`text-3xl font-bold ${parseFloat(statistics.totalPnL) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    ${statistics.totalPnL}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Avg: ${statistics.avgProfit} / ${statistics.avgLoss}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Best Trade</CardDescription>
                </CardHeader>
                <CardContent>
                  {statistics.bestTrade ? (
                    <>
                      <div className="text-3xl font-bold text-green-500">
                        ${statistics.bestTrade.pnl}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {statistics.bestTrade.symbol}
                      </p>
                    </>
                  ) : (
                    <div className="text-sm text-muted-foreground">No trades yet</div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Performance Chart Placeholder */}
            <Card>
              <CardHeader>
                <CardTitle>Performance Over Time</CardTitle>
                <CardDescription>Cumulative P&L chart</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center bg-muted/30 rounded-lg">
                  <p className="text-muted-foreground">Chart visualization coming soon</p>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {/* Trade History Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Trade History</CardTitle>
                <CardDescription>Your complete trading record</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={exportToCSV} disabled={!history || history.length === 0}>
                <Download className="mr-2 h-4 w-4" />
                Export CSV
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {/* Filters */}
            <div className="flex gap-3 mb-4">
              <Select value={symbolFilter} onValueChange={setSymbolFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="All Symbols" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Symbols</SelectItem>
                  <SelectItem value="BTC/USDT">BTC/USDT</SelectItem>
                  <SelectItem value="ETH/USDT">ETH/USDT</SelectItem>
                  <SelectItem value="SOL/USDT">SOL/USDT</SelectItem>
                </SelectContent>
              </Select>

              <Select value={directionFilter} onValueChange={setDirectionFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="All Directions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Directions</SelectItem>
                  <SelectItem value="LONG">LONG</SelectItem>
                  <SelectItem value="SHORT">SHORT</SelectItem>
                </SelectContent>
              </Select>

              <Select value={resultFilter} onValueChange={setResultFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="All Results" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Results</SelectItem>
                  <SelectItem value="win">Win</SelectItem>
                  <SelectItem value="loss">Loss</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Table */}
            {historyLoading ? (
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-16 bg-muted/30 rounded animate-pulse"></div>
                ))}
              </div>
            ) : history && history.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4">Date</th>
                      <th className="text-left py-3 px-4">Symbol</th>
                      <th className="text-left py-3 px-4">Direction</th>
                      <th className="text-right py-3 px-4">Entry</th>
                      <th className="text-right py-3 px-4">Exit</th>
                      <th className="text-right py-3 px-4">Leverage</th>
                      <th className="text-right py-3 px-4">P&L</th>
                      <th className="text-center py-3 px-4">Result</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((trade: any) => (
                      <tr key={trade.id} className="border-b hover:bg-muted/30">
                        <td className="py-3 px-4 text-sm">
                          {new Date(trade.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4 font-semibold">{trade.symbol}</td>
                        <td className="py-3 px-4">
                          <Badge className={trade.direction === 'LONG' ? 'bg-green-500' : 'bg-red-500'}>
                            {trade.direction === 'LONG' ? (
                              <><TrendingUp className="mr-1 h-3 w-3" /> LONG</>
                            ) : (
                              <><TrendingDown className="mr-1 h-3 w-3" /> SHORT</>
                            )}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-sm">
                          ${trade.entryPrice}
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-sm">
                          {trade.exitPrice ? `$${trade.exitPrice}` : '-'}
                        </td>
                        <td className="py-3 px-4 text-right">{trade.leverage}x</td>
                        <td className={`py-3 px-4 text-right font-bold ${
                          trade.profitLoss && parseFloat(trade.profitLoss) >= 0 ? 'text-green-500' : 'text-red-500'
                        }`}>
                          {trade.profitLoss ? `$${trade.profitLoss}` : '-'}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <Badge variant={
                            trade.result === 'win' ? 'default' :
                            trade.result === 'loss' ? 'destructive' :
                            'outline'
                          }>
                            {trade.result}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <p>No trades recorded yet</p>
                <p className="text-sm mt-1">Start trading to see your history here</p>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
