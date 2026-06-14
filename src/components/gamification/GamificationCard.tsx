import { cn } from "@/lib/utils";
import { Trophy, Flame, Sparkles, BookOpen, GitFork, Star } from "lucide-react";

const BADGES = [
  { icon: Flame, label: "7-day streak", token: "text-spark", bg: "bg-spark-soft" },
  { icon: GitFork, label: "Forked 25×", token: "text-wip", bg: "bg-wip-soft" },
  { icon: BookOpen, label: "Novelist", token: "text-novela", bg: "bg-novela-soft" },
];

export function GamificationCard({ className }: { className?: string }) {
  const level = 17;
  const xp = 3240;
  const nextLevel = 4000;
  const pct = Math.round((xp / nextLevel) * 100);

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-card",
        className,
      )}
    >
      {/* subtle brand glow */}
      <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-primary/10 blur-2xl" />

      <div className="flex items-center gap-3">
        <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-soft">
          <span className="text-lg font-extrabold">{level}</span>
          <Star className="absolute -bottom-1 -right-1 h-5 w-5 fill-spark text-spark" />
        </div>
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
            Your level
          </p>
          <p className="text-base font-extrabold text-foreground">Wordsmith</p>
        </div>
      </div>

      <div className="mt-4">
        <div className="mb-1.5 flex items-center justify-between text-xs font-semibold">
          <span className="text-muted-foreground">{xp.toLocaleString()} XP</span>
          <span className="text-muted-foreground">{nextLevel.toLocaleString()} XP</span>
        </div>
        <div className="h-2.5 w-full overflow-hidden rounded-full bg-secondary">
          <div
            className="h-full rounded-full bg-gradient-to-r from-primary to-poesia"
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="mt-1.5 flex items-center gap-1 text-xs text-muted-foreground">
          <Sparkles className="h-3.5 w-3.5 text-spark" />
          {nextLevel - xp} XP to <span className="font-semibold text-foreground">Level 18</span>
        </p>
      </div>

      <div className="mt-4 border-t border-border/70 pt-4">
        <div className="mb-2.5 flex items-center gap-1.5 text-xs font-bold text-foreground">
          <Trophy className="h-4 w-4 text-spark" />
          Top badges
        </div>
        <div className="grid grid-cols-3 gap-2">
          {BADGES.map((b) => (
            <div
              key={b.label}
              className="flex flex-col items-center gap-1.5 rounded-xl border border-border/70 bg-secondary/40 p-2.5 text-center"
            >
              <span className={cn("flex h-9 w-9 items-center justify-center rounded-full", b.bg)}>
                <b.icon className={cn("h-5 w-5", b.token)} />
              </span>
              <span className="text-[10px] font-semibold leading-tight text-muted-foreground">
                {b.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

