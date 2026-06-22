import { GitFork, Link2 } from "lucide-react";

export function ForkPanel() {
  return (
    <section className="rounded-3xl border border-card/80 bg-card/70 p-5 shadow-soft backdrop-blur-xl">
      <div className="flex items-center gap-2">
        <GitFork className="h-4 w-4 text-primary" />
        <h2 className="text-sm font-semibold">Ideas que se ramifican</h2>
      </div>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">Un fork crea un texto nuevo sin perder el vínculo con la versión que lo inspiró.</p>
      <div className="mt-4 flex gap-2 rounded-2xl border border-primary/15 bg-primary/5 p-3 text-xs leading-5 text-foreground/75">
        <Link2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
        La atribución y el árbol permanecen visibles aunque el original se retire.
      </div>
    </section>
  );
}
