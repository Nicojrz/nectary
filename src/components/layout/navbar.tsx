"use client";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import type { CreativeState } from "@/types/nectary";
import { Search, Plus, Bell, Trophy, LayoutGrid } from "lucide-react";
import { Button } from "@/components/ui/button";

interface NavbarProps {
  creativeState: CreativeState;
  onCreativeStateChange: (s: CreativeState) => void;
  onCreate: () => void;
}

export function Navbar({ onCreate }: NavbarProps) {
  const [query, setQuery] = useState("");

  return (
    <header className="sticky top-0 z-40 border-b border-card/60 glass">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:px-6">
        {/* logo */}
        <Link href="/" className="flex shrink-0 items-center gap-2">
          <Image 
            src="/logo.png" 
            alt="Nectary Logo" 
            width={28} 
            height={28} 
            style={{ width: "auto", height: "auto" }}
            className="h-7 w-7 object-cover"
          />
          <span className="hidden font-serif text-2xl text-foreground sm:block">
            Nectary
          </span>
        </Link>

        {/* search */}
        <div className="relative ml-auto hidden max-w-sm flex-1 md:block">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar chispas, escritores, WIPs…"
            className="h-10 w-full rounded-full border border-card/80 bg-card/55 pl-9 pr-4 text-sm text-foreground outline-none placeholder:text-muted-foreground backdrop-blur-xl transition-all focus:border-primary/30 focus:bg-card/80 focus:ring-2 focus:ring-ring/20"
          />
        </div>

        <Button
          variant="outline"
          size="icon"
          aria-label="Feed"
          className="ml-auto hidden rounded-full border-card/80 bg-card/55 text-muted-foreground backdrop-blur-xl md:ml-0 sm:inline-flex"
          asChild
        >
          <Link href="/feed">
            <LayoutGrid className="h-5 w-5" />
          </Link>
        </Button>

        <Button
          variant="outline"
          size="icon"
          aria-label="Leaderboard"
          className="hidden rounded-full border-card/80 bg-card/55 text-muted-foreground backdrop-blur-xl sm:inline-flex"
          asChild
        >
          <Link href="/leaderboard">
            <Trophy className="h-5 w-5" />
          </Link>
        </Button>

        <Button
          variant="outline"
          size="icon"
          aria-label="Notifications"
          className="hidden rounded-full border-card/80 bg-card/55 text-muted-foreground backdrop-blur-xl sm:inline-flex"
        >
          <Bell className="h-5 w-5" />
        </Button>

        <Button
          onClick={onCreate}
          className="h-10 rounded-full px-4 shadow-soft"
        >
          <Plus className="h-4 w-4" strokeWidth={2.6} />
          <span className="hidden sm:inline">Escribir</span>
        </Button>
      </div>
    </header>
  );
}

