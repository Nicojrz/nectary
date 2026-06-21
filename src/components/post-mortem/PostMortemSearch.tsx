"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Flame, LibraryBig, Loader2, Search, SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CATEGORY_LABELS } from "@/lib/wip-domain";
import type { LiteraryCategory } from "@/types";

interface SearchResult {
  id: string;
  title: string;
  context: string;
  lessons_learned: string;
  categories: LiteraryCategory[];
  unblocked_count: number;
  created_at: string;
}

export function PostMortemSearch() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<LiteraryCategory | "">("");
  const [items, setItems] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function search() {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (query.trim()) params.set("q", query.trim());
      if (category) params.set("category", category);
      const response = await fetch(`/api/post-mortems?${params}`);
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "No fue posible buscar");
      setItems(payload.items ?? []);
    } catch (searchError) {
      setError(searchError instanceof Error ? searchError.message : "No fue posible buscar");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timeout = window.setTimeout(() => { void search(); }, 0);
    return () => window.clearTimeout(timeout);
    // Initial catalog load only; subsequent searches are explicit form submissions.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function submit(event: FormEvent) {
    event.preventDefault();
    void search();
  }

  return (
    <div className="mx-auto max-w-5xl">
      <header className="mb-8 flex gap-4">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-postmortem-soft text-postmortem" aria-hidden="true"><LibraryBig className="h-6 w-6" strokeWidth={1.8} /></span>
        <div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-postmortem">Biblioteca de aprendizajes</p><h1 className="mt-1 font-serif text-4xl leading-tight sm:text-5xl">Explora Post-Mortems</h1><p className="mt-2 max-w-2xl text-base leading-7 text-muted-foreground">Encuentra decisiones, intentos y aprendizajes de otros procesos de escritura.</p></div>
      </header>

      <form onSubmit={submit} className="grid gap-4 rounded-3xl border border-card/80 bg-card/75 p-5 shadow-soft sm:grid-cols-[minmax(0,1fr)_220px_auto] sm:items-end">
        <div><label htmlFor="pm-search-query" className="text-sm font-semibold text-foreground">Palabras clave</label><div className="relative mt-2"><Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><input id="pm-search-query" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Diálogo, estructura, cierre…" className="min-h-11 w-full rounded-xl border border-input bg-background pl-10 pr-3 text-base outline-none transition-colors focus:border-postmortem focus:ring-2 focus:ring-postmortem/15" /></div></div>
        <div><label htmlFor="pm-search-category" className="text-sm font-semibold text-foreground">Categoría</label><select id="pm-search-category" value={category} onChange={(event) => setCategory(event.target.value as LiteraryCategory | "")} className="mt-2 min-h-11 w-full rounded-xl border border-input bg-background px-3 text-base outline-none focus:border-postmortem focus:ring-2 focus:ring-postmortem/15"><option value="">Todas las categorías</option>{(Object.entries(CATEGORY_LABELS) as [LiteraryCategory, string][]).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div>
        <Button className="min-h-11 rounded-xl px-5" type="submit" disabled={loading}>{loading ? <Loader2 className="animate-spin" /> : <Search />}Buscar</Button>
      </form>

      <div className="mt-8" aria-live="polite">
        {!loading && !error && items.length > 0 && <p className="mb-4 text-sm text-muted-foreground"><strong className="font-semibold text-foreground tabular-nums">{items.length}</strong> reflexiones encontradas</p>}
        {error && <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-5" role="alert"><p className="font-semibold text-destructive">No pudimos completar la búsqueda</p><p className="mt-1 text-sm text-muted-foreground">{error}. Revisa tu conexión e inténtalo nuevamente.</p></div>}
        {loading && <div className="space-y-4" role="status" aria-label="Buscando Post-Mortems">{[1, 2, 3].map((item) => <div key={item} className="animate-pulse rounded-3xl border border-border/60 bg-card/50 p-6"><div className="h-5 w-32 rounded bg-muted" /><div className="mt-4 h-8 w-2/3 rounded bg-muted" /><div className="mt-4 h-4 rounded bg-muted" /><div className="mt-2 h-4 w-4/5 rounded bg-muted" /></div>)}<span className="sr-only">Buscando reflexiones</span></div>}
        {!loading && !error && items.length === 0 && <div className="rounded-3xl border border-dashed border-border p-10 text-center"><SearchX className="mx-auto h-7 w-7 text-muted-foreground" /><p className="mt-4 font-serif text-xl text-foreground">No encontramos reflexiones</p><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">Prueba con menos palabras o selecciona otra categoría.</p></div>}
        <div className="space-y-4">
        {items.map((item) => (
          <article key={item.id} className="rounded-3xl border border-card/80 bg-card/75 p-5 shadow-card transition-[border-color,box-shadow] duration-200 hover:border-postmortem/25 hover:shadow-lift sm:p-6">
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground"><span className="inline-flex min-h-7 items-center rounded-full bg-postmortem-soft px-3 font-semibold text-postmortem">{CATEGORY_LABELS[item.categories[0]]}</span><span className="inline-flex items-center gap-1.5"><Flame className="h-3.5 w-3.5 text-postmortem" />{item.unblocked_count} personas desbloqueadas</span></div>
            <h2 className="mt-4 max-w-3xl font-serif text-2xl leading-tight sm:text-3xl"><Link href={`/post-mortem/${item.id}`} className="rounded-sm outline-none hover:text-postmortem focus-visible:ring-2 focus-visible:ring-postmortem">{item.title}</Link></h2>
            <p className="mt-3 max-w-prose line-clamp-2 text-base leading-7 text-muted-foreground">{item.context}</p>
            <div className="mt-5 flex justify-end border-t border-border/60 pt-4"><Button asChild variant="outline" className="min-h-11 rounded-full bg-background/50"><Link href={`/post-mortem/${item.id}`}>Leer reflexión<ArrowRight /></Link></Button></div>
          </article>
        ))}
        </div>
      </div>
    </div>
  );
}
