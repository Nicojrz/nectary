/**
 * Navbar Component
 *
 * Main navigation bar shown on all authenticated pages.
 * Includes: Logo, nav links, creative state selector (RF-FD-03),
 * notification bell, and user menu.
 *
 * TODO: Connect to Supabase auth for user session.
 * TODO: Implement creative state selector.
 * TODO: Implement notification dropdown.
 */
import Link from "next/link";
import {
  Flame,
  Wrench,
  BookOpen,
  Trophy,
  Plus,
  Bell,
  User,
} from "lucide-react";

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-md">
      <nav className="container mx-auto max-w-5xl flex h-14 items-center justify-between px-4">
        {/* Logo */}
        <Link
          href="/feed"
          className="flex items-center gap-2 font-bold text-lg text-primary hover:opacity-80 transition-opacity"
        >

          <span className="text-gradient-primary">Nectary</span>
        </Link>

        {/* Center nav links */}
        <div className="hidden md:flex items-center gap-1">
          <NavLink href="/feed" icon={<Flame className="w-4 h-4" />} label="Feed" />
          <NavLink href="/spark/new" icon={<Plus className="w-4 h-4" />} label="Spark" />
          <NavLink href="/wip/new" icon={<Wrench className="w-4 h-4" />} label="WIP" />
          <NavLink href="/post-mortem/new" icon={<BookOpen className="w-4 h-4" />} label="Post-Mortem" />
          <NavLink href="/leaderboard" icon={<Trophy className="w-4 h-4" />} label="Leaderboard" />
        </div>

        {/* Right: Creative state + Notifications + User */}
        <div className="flex items-center gap-3">
          {/* TODO: Creative State Selector — RF-FD-03 */}
          <button
            className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5" />
          </button>
          <button
            className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            aria-label="User menu"
          >
            <User className="w-5 h-5" />
          </button>
        </div>
      </nav>
    </header>
  );
}

function NavLink({
  href,
  icon,
  label,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-1.5 px-3 py-2 text-sm text-muted-foreground hover:text-foreground rounded-md hover:bg-muted transition-colors"
    >
      {icon}
      <span>{label}</span>
    </Link>
  );
}
