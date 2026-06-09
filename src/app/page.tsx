/**
 * Home Page (Landing / Root)
 *
 * Página pública de bienvenida para escritores.
 * Redirige a /feed si el usuario está autenticado.
 */
import Link from "next/link";

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-8 bg-background">
      {/* Hero */}
      <div className="max-w-2xl text-center space-y-8 animate-fade-in">

        <h1 className="text-5xl md:text-6xl font-bold tracking-tight">
          <span className="text-gradient-primary">Nectary</span>
        </h1>
        <p className="text-xl text-muted-foreground leading-relaxed max-w-lg mx-auto">
          El espacio para escritores. Comparte chispazos, documenta tu proceso
          y supera el bloqueo creativo junto a una comunidad que entiende lo
          que escribir implica.
        </p>

        {/* Post type pills */}
        <div className="flex flex-wrap justify-center gap-3">
          <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-spark/10 text-spark font-medium text-sm">
            Sparks
          </span>
          <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-wip/10 text-wip font-medium text-sm">
            WIPs
          </span>
          <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-postmortem/10 text-postmortem font-medium text-sm">
            Post-Mortems
          </span>
        </div>

        {/* CTA buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
          <Link
            href="/register"
            className="inline-flex items-center justify-center px-8 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-lg hover:opacity-90 transition-opacity animate-pulse-glow"
          >
            Únete a la comunidad
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center justify-center px-8 py-3 rounded-xl border border-border text-foreground font-semibold text-lg hover:bg-muted transition-colors"
          >
            Iniciar sesión
          </Link>
        </div>

        {/* Literary category badges */}
        <div className="flex flex-wrap justify-center gap-2 pt-6">
          <span className="px-3 py-1 rounded-full text-xs font-medium bg-category-cuento/10 text-category-cuento">
            Cuento
          </span>
          <span className="px-3 py-1 rounded-full text-xs font-medium bg-category-poesia/10 text-category-poesia">
            Poesía
          </span>
          <span className="px-3 py-1 rounded-full text-xs font-medium bg-category-novela/10 text-category-novela">
            Novela
          </span>
          <span className="px-3 py-1 rounded-full text-xs font-medium bg-category-ensayo/10 text-category-ensayo">
            Ensayo
          </span>
        </div>
      </div>
    </div>
  );
}
