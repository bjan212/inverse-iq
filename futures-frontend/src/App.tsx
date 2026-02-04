import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import FuturesPage from "./pages/FuturesPage";
import CryptoPage from "./pages/CryptoPage";
import SpotPage from "./pages/SpotPage";
import BoardroomPage from "./pages/BoardroomPage";
import DeFiTrader from "./pages/DeFiTrader";
import TradeHistory from "./pages/TradeHistory";

function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/crypto"} component={CryptoPage} />
      <Route path={"/spot"} component={SpotPage} />
      <Route path={"/boardroom"} component={BoardroomPage} />
      <Route path={"/futures"} component={FuturesPage} />
      <Route path={"/defi-trader"} component={DeFiTrader} />
      <Route path={"/trade-history"} component={TradeHistory} />
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="light"
        switchable
      >
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
