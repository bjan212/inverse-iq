import BoardroomBuilder from "@/components/BoardroomBuilder";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function BoardroomPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold font-display text-lg">AI</span>
            </div>
            <h1 className="text-xl font-bold font-display tracking-tight">Prompt Builder <span className="text-muted-foreground font-normal">/ Boardroom</span></h1>
          </div>
          
          <nav className="hidden md:flex items-center space-x-6">
            <Link href="/">
              <span className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer">General Builder</span>
            </Link>
            <Link href="/crypto">
              <span className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer">Crypto Analyst</span>
            </Link>
            <Link href="/spot">
              <span className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer">Spot Analyst</span>
            </Link>
            <Link href="/boardroom">
              <span className="text-sm font-medium text-foreground transition-colors cursor-pointer">Boardroom Strategist</span>
            </Link>
          </nav>

          <div className="flex items-center space-x-2">
            <ThemeToggle />
            <Button variant="ghost" size="sm">Sign In</Button>
            <Button size="sm">Get Started</Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold font-display tracking-tight text-foreground">Boardroom Strategist.</h1>
            <p className="text-lg text-muted-foreground max-w-2xl">
              Solve complex problems using the 5 principles of billion-dollar decision making.
            </p>
          </div>

          <BoardroomBuilder />
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-8 mt-auto">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>&copy; 2026 AI Prompt Builder. Built for precision.</p>
        </div>
      </footer>
    </div>
  );
}
