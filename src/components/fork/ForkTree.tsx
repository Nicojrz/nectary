"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { GitCommitHorizontal, GitFork, Loader2 } from "lucide-react";
import { CATEGORY_LABELS } from "@/lib/wip-domain";
import type { LiteraryCategory } from "@/types/nectary";

interface ForkTreeNode {
  forkId: string | null;
  postId: string;
  postType: "spark" | "wip";
  sourceVersion: number;
  motivation: string | null;
  authorName: string;
  title: string;
  category: LiteraryCategory | null;
  originalDeleted: boolean;
  children: ForkTreeNode[];
}

export function ForkTree({ postId, postType, className = "" }: { postId: string; postType: "spark" | "wip"; className?: string }) {
  const [tree, setTree] = useState<ForkTreeNode | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      try {
        const response = await fetch(`/api/forks?sourceId=${postId}&sourceType=${postType}`, { cache: "no-store" });
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error || "No fue posible cargar las ramas");
        if (mounted) setTree(payload.tree);
      } catch (loadError) {
        if (mounted) setError(loadError instanceof Error ? loadError.message : "No fue posible cargar las ramas");
      } finally {
        if (mounted) setLoading(false);
      }
    }
    void load();
    return () => { mounted = false; };
  }, [postId, postType]);

  return (
    <section className={`rounded-3xl border border-card/80 bg-card/75 p-5 shadow-soft sm:p-6 ${className}`} aria-labelledby={`fork-tree-${postId}`}>
      <div className="flex items-center gap-2">
        <GitFork className="h-4 w-4 text-primary" />
        <h2 id={`fork-tree-${postId}`} className="text-sm font-semibold">Trazabilidad de la idea</h2>
      </div>
      <p className="mt-1 text-xs leading-5 text-muted-foreground">Cada rama conserva su origen, versión y motivación.</p>

      {loading ? <div className="flex min-h-24 items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-primary" /><span className="sr-only">Cargando árbol</span></div>
        : error ? <p className="mt-4 text-sm text-destructive" role="alert">{error}</p>
        : tree ? <div className="mt-5"><TreeNode node={tree} currentId={postId} /></div>
        : <p className="mt-4 text-sm text-muted-foreground">No existe trazabilidad para este texto.</p>}
    </section>
  );
}

function TreeNode({ node, currentId }: { node: ForkTreeNode; currentId: string }) {
  const current = node.postId === currentId;
  return (
    <div>
      <div className={`relative rounded-2xl border p-3 ${current ? "border-primary/35 bg-primary/8" : "border-border/70 bg-background/50"}`}>
        <div className="flex gap-2.5">
          <GitCommitHorizontal className={`mt-0.5 h-4 w-4 shrink-0 ${current ? "text-primary" : "text-muted-foreground"}`} />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              <span>{node.forkId ? "Fork" : "Original"}</span>
              {node.category && <span>· {CATEGORY_LABELS[node.category]}</span>}
              {current && <span className="rounded-full bg-primary/10 px-2 py-0.5 text-primary">Estás aquí</span>}
            </div>
            {node.originalDeleted ? <p className="mt-1 font-medium text-muted-foreground">[Contenido eliminado]</p> : <Link href={`/${node.postType}/${node.postId}`} className="mt-1 block truncate font-medium text-foreground underline-offset-4 hover:text-primary hover:underline">{node.title}</Link>}
            <p className="mt-0.5 text-xs text-muted-foreground">{node.authorName}{node.forkId ? ` · desde versión ${node.sourceVersion}` : ""}</p>
            {node.motivation && <p className="mt-2 text-xs italic leading-5 text-foreground/70">“{node.motivation}”</p>}
          </div>
        </div>
      </div>
      {node.children.length > 0 && (
        <div className="ml-4 space-y-3 border-l border-primary/20 py-3 pl-4">
          {node.children.map((child) => <TreeNode key={child.postId} node={child} currentId={currentId} />)}
        </div>
      )}
    </div>
  );
}
