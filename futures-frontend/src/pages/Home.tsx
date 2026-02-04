import { useAuth } from "@/_core/hooks/useAuth";
import PromptBuilder from "@/components/PromptBuilder";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function Home() {
  // The userAuth hooks provides authentication state
  // To implement login/logout functionality, simply call logout() or redirect to getLoginUrl()
  let { user, loading, error, isAuthenticated, logout } = useAuth();

  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary/20 selection:text-primary">
      {/* Header */}
      <header className="border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-primary flex items-center justify-center text-primary-foreground font-bold font-mono rounded-none">
              AI
            </div>
            <h1 className="text-xl font-bold tracking-tight font-display">Prompt Builder</h1>
          </div>
          <nav className="hidden md:flex items-center space-x-6">
            <Link href="/">
              <span className="text-sm font-medium text-foreground transition-colors cursor-pointer">General Builder</span>
            </Link>
            <Link href="/crypto">
              <span className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer">Crypto Analyst</span>
            </Link>
            <Link href="/spot">
              <span className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer">Spot Analyst</span>
            </Link>
            <Link href="/boardroom">
              <span className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer">Boardroom Strategist</span>
            </Link>
            <Link href="/futures">
              <span className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer">Futures Analyst</span>
            </Link>
            <a href="#" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Guide</a>
            <a href="#" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">About</a>
          </nav>

          <div className="flex items-center space-x-2">
            <ThemeToggle />
            <Button variant="ghost" size="sm">Sign In</Button>
            <Button size="sm">Get Started</Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto py-8 px-4 md:px-6 lg:px-8">
        <div className="mb-8 max-w-2xl">
          <h1 className="text-4xl md:text-5xl font-bold font-display tracking-tight mb-4 text-foreground">
            Craft the Perfect Prompt.
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Stop guessing. Use the <span className="font-semibold text-primary">AIM</span>, <span className="font-semibold text-primary">MAP</span>, and <span className="font-semibold text-primary">OCEAN</span> frameworks to engineer precise, high-quality instructions for any AI model.
          </p>
        </div>

        <PromptBuilder />
      </main>

      {/* Footer */}
      <footer className="border-t border-border mt-auto py-8 bg-secondary/30">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} AI Prompt Builder. Designed for precision.</p>
        </div>
      </footer>
    </div>
  );
}
