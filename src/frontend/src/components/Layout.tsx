import { Link, useRouterState } from "@tanstack/react-router";
import { Database, History, Terminal } from "lucide-react";
import type React from "react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import LoginButton from "./LoginButton";

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { identity } = useInternetIdentity();
  const isAuthenticated = !!identity;
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/90 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3 group">
              <div className="relative">
                <img
                  src="/assets/generated/schema-solver-logo.dim_256x256.png"
                  alt="Schema Anomaly Solver Pro"
                  className="w-9 h-9 rounded"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
                <div className="w-9 h-9 rounded neon-border flex items-center justify-center absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Database size={18} className="text-neon-green" />
                </div>
              </div>
              <div className="hidden sm:block">
                <div className="font-mono font-bold text-sm neon-text tracking-wider">
                  SCHEMA ANOMALY
                </div>
                <div className="font-mono text-xs text-muted-foreground tracking-widest">
                  SOLVER PRO
                </div>
              </div>
            </Link>

            {/* Nav */}
            <nav className="flex items-center gap-2">
              <Link
                to="/"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono transition-all ${
                  currentPath === "/"
                    ? "text-neon-green bg-neon-green/10 border border-neon-green/30"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                }`}
              >
                <Terminal size={12} />
                <span className="hidden sm:inline">Analyzer</span>
              </Link>

              {isAuthenticated && (
                <Link
                  to="/history"
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono transition-all ${
                    currentPath === "/history"
                      ? "text-neon-cyan bg-neon-cyan/10 border border-neon-cyan/30"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                  }`}
                >
                  <History size={12} />
                  <span className="hidden sm:inline">History</span>
                </Link>
              )}

              <LoginButton />
            </nav>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-border/30 py-6 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs font-mono text-muted-foreground">
          <div className="flex items-center gap-1">
            <span className="text-neon-green/60">&gt;</span>
            <span>© {new Date().getFullYear()} Schema Anomaly Solver Pro</span>
          </div>
          <div className="flex items-center gap-1">
            Built with{" "}
            <span className="text-destructive animate-pulse-neon">♥</span> using{" "}
            <a
              href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname || "schema-anomaly-solver-pro")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="neon-text hover:underline"
            >
              caffeine.ai
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
