import { Link } from "@tanstack/react-router";
import { Ghost } from "lucide-react";

export function SiteHeader() {
  const link = "text-sm text-muted-foreground hover:text-primary transition-colors";
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2">
          <Ghost className="h-5 w-5 text-accent animate-flicker" />
          <span className="font-display text-xl text-foreground">PhantomVault <span className="text-primary">AI</span></span>
        </Link>
        <nav className="flex items-center gap-6">
          <Link to="/" className={link} activeProps={{ className: "text-primary" }} activeOptions={{ exact: true }}>
            Vault
          </Link>
          <Link to="/search" className={link} activeProps={{ className: "text-primary" }}>
            Search & Ask
          </Link>
          <Link to="/about" className={link} activeProps={{ className: "text-primary" }}>
            About
          </Link>
        </nav>
      </div>
    </header>
  );
}
