import { GitFork, MoveRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const BRANCHES = [
  { source: "El faro sin costa", author: "Iván Reyes", branches: 6 },
  { source: "La última librería", author: "Mara Solano", branches: 14 },
  { source: "Borradores sin columna", author: "Lin Park", branches: 12 },
];

export function ForkPanel() {
  return (
    <section className="glass-panel rounded-3xl p-5" aria-label="Ideas que están creciendo">
      <div className="flex items-center gap-2">
        <GitFork className="h-4 w-4 text-primary" />
        <h2 className="text-sm font-semibold text-foreground">Ramas activas</h2>
      </div>
      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">Ideas que otros escritores están llevando a lugares nuevos.</p>

      <ol className="mt-4 space-y-4">
        {BRANCHES.map((branch, index) => (
          <li key={branch.source} className="relative border-l border-primary/25 pl-4">
            <span className="absolute -left-1 top-1 h-2 w-2 rounded-full bg-primary" aria-hidden />
            <p className="font-serif text-base leading-snug text-foreground">{branch.source}</p>
            <p className="mt-1 text-[11px] text-muted-foreground">{branch.author} · {branch.branches} ramas</p>
            {index < BRANCHES.length - 1 && <MoveRight className="mt-2 h-3 w-3 rotate-90 text-border" />}
          </li>
        ))}
      </ol>

      <Button variant="ghost" className="mt-3 w-full rounded-full text-primary">Explorar todos los forks</Button>
    </section>
  );
}

