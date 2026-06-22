"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, CalendarDays, Feather, GitFork, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ForkTree } from "@/components/fork/ForkTree";
import { ReactionBar } from "@/components/shared/ReactionBar";
import { CATEGORY_LABELS } from "@/lib/wip-domain";
import type { LiteraryCategory, SparkPost } from "@/types/nectary";

interface SparkRecord {
  id: string;
  author_id: string;
  content: string;
  categories: LiteraryCategory[];
  fork_count: number;
  created_at: string;
  author: { id: string; name: string; avatar_url: string | null; level: number } | null;
}

export function SparkDetail({ id }: { id: string }) {
  const [spark, setSpark] = useState<SparkRecord | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const response = await fetch(`/api/sparks/${id}`, { cache: "no-store" });
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error || "No fue posible cargar el Spark");
        if (mounted) setSpark(payload.item);
      } catch (loadError) {
        if (mounted) setError(loadError instanceof Error ? loadError.message : "No fue posible cargar el Spark");
      }
    }
    void load();
    return () => { mounted = false; };
  }, [id]);

  if (error) return <div className="mx-auto max-w-xl rounded-3xl border border-destructive/20 bg-destructive/5 p-8 text-center" role="alert"><p className="font-serif text-2xl">No pudimos abrir este Spark</p><p className="mt-2 text-sm text-muted-foreground">{error}</p><Button asChild variant="outline" className="mt-5"><Link href="/feed"><ArrowLeft />Volver al feed</Link></Button></div>;
  if (!spark) return <div className="flex min-h-72 items-center justify-center" role="status"><Loader2 className="h-7 w-7 animate-spin text-primary" /><span className="sr-only">Cargando Spark</span></div>;

  const author = {
    name: spark.author?.name ?? "Autor",
    handle: "",
    initials: (spark.author?.name ?? "A").slice(0, 2).toUpperCase(),
    tint: "primary",
    level: spark.author?.level ?? 1,
  };
  const post: SparkPost = {
    id: spark.id, type: "spark", category: spark.categories[0] ?? "cuento", author,
    body: spark.content, createdAt: spark.created_at, reactions: { likes: 0 }, forks: spark.fork_count, version: 1,
  };

  return (
    <div className="mx-auto max-w-4xl">
      <Button asChild variant="ghost" className="mb-5 min-h-11 rounded-full text-muted-foreground"><Link href="/feed"><ArrowLeft />Volver al feed</Link></Button>
      <article className="glass-panel overflow-hidden rounded-3xl">
        <header className="border-b border-border/70 bg-card/65 p-6 sm:p-9">
          <div className="flex flex-wrap items-center gap-2 text-xs"><span className="inline-flex min-h-7 items-center gap-1.5 rounded-full bg-spark-soft px-3 font-semibold text-spark"><Feather className="h-3.5 w-3.5" />Spark</span><span className="inline-flex min-h-7 items-center rounded-full bg-secondary px-3">{CATEGORY_LABELS[post.category]}</span><span className="inline-flex min-h-7 items-center rounded-full border border-border/70 bg-background/55 px-3">Versión 1</span></div>
          <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground"><span>Por <strong className="font-medium text-foreground">{author.name}</strong></span><span className="inline-flex items-center gap-1.5"><CalendarDays className="h-4 w-4" /><time>{new Date(spark.created_at).toLocaleDateString("es-MX")}</time></span></div>
        </header>
        <div className="p-6 sm:p-9"><p className="whitespace-pre-wrap font-serif text-2xl leading-[1.65] text-foreground">{spark.content}</p><ReactionBar className="mt-8 border-t border-border/60 pt-5" postId={spark.id} postType="spark" reactions={{ likes: 0 }} forks={spark.fork_count} onFork={() => window.dispatchEvent(new CustomEvent("open-fork", { detail: post }))} /></div>
      </article>
      <div className="mt-6 rounded-3xl border border-primary/15 bg-primary/5 p-5 sm:flex sm:items-center sm:justify-between"><div><div className="flex items-center gap-2 font-semibold"><GitFork className="h-4 w-4 text-primary" />Continúa esta idea</div><p className="mt-1 text-sm text-muted-foreground">Crea tu versión sin perder la atribución al original.</p></div><Button className="mt-4 min-h-11 rounded-full sm:mt-0" onClick={() => window.dispatchEvent(new CustomEvent("open-fork", { detail: post }))}><GitFork />Hacer fork</Button></div>
      <ForkTree postId={spark.id} postType="spark" className="mt-6" />
    </div>
  );
}
