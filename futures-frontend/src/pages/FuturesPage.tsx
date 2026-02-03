import FuturesAnalyst from "@/components/FuturesAnalyst";
import TradeHistory from "@/components/TradeHistory";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function FuturesPage() {
  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      {/* Header */}
      <header className="border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-primary flex items-center justify-center text-primary-foreground font-bold font-mono rounded-none">
              AI
            </div>
            <h1 className="text-xl font-bold tracking-tight font-display">AI Futures Analyst</h1>
          </div>
          <nav className="hidden md:flex items-center space-x-6">
            <Link href="/">
              <span className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                General Builder
              </span>
            </Link>
            <Link href="/crypto">
              <span className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                Crypto Analyst
              </span>
            </Link>
            <Link href="/spot">
              <span className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                Spot Analyst
              </span>
            </Link>
            <Link href="/boardroom">
              <span className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                Boardroom Strategist
              </span>
            </Link>
            <Link href="/futures">
              <span className="text-sm font-medium text-foreground transition-colors cursor-pointer">
                Futures Analyst
              </span>
            </Link>
          </nav>

          <div className="flex items-center space-x-2">
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto py-8 px-4 md:px-6 lg:px-8">
        <div className="mb-8 max-w-3xl">
          <h1 className="text-4xl md:text-5xl font-bold font-display tracking-tight mb-4 text-foreground">
            AI-Powered Futures Trading Signals
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Multi-agent AI system with{" "}
            <span className="font-semibold text-primary">chain-of-thought reasoning</span>,{" "}
            <span className="font-semibold text-primary">inverse learning</span>, and{" "}
            <span className="font-semibold text-primary">real-time grounding</span>. Get transparent, auditable
            trading signals from 4 expert AI agents.
          </p>
        </div>

        <FuturesAnalyst />
        
        <div className="mt-12">
          <TradeHistory />
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border mt-auto py-8 bg-secondary/30">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} AI Prompt Builder. High-risk trading requires expertise.</p>
        </div>
      </footer>
    </div>
  );
}
