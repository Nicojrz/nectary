"use client";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import type { PostType } from "@/types/nectary";
import { X, Feather, BookOpen, HeartCrack } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WritingWorkspace } from "./WritingWorkspace";

interface CreateModalProps {
  open: boolean;
  onClose: () => void;
  initialType?: PostType;
}

export function CreateModal({ open, onClose, initialType = "spark" }: CreateModalProps) {
  const [postType, setPostType] = useState<PostType>(initialType);
  const [spark, setSpark] = useState("");

  useEffect(() => {
    if (!open) return;
    setPostType(initialType);
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [initialType, open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-background/90 p-3 backdrop-blur-xl sm:p-6">
      <div className="mx-auto max-w-6xl">
        <header className="mb-5 flex items-center justify-between">
          <div><p className="font-serif text-2xl text-foreground">Nectary</p><p className="text-xs text-muted-foreground">Tu espacio para pensar y escribir</p></div>
          <Button variant="outline" size="icon" onClick={onClose} aria-label="Cerrar estudio" className="rounded-full bg-card/60"><X /></Button>
        </header>

        <nav className="mb-5 grid grid-cols-3 gap-2 rounded-2xl border border-border/60 bg-card/50 p-1.5" aria-label="Tipo de publicación">
          {([["spark", "Spark", Feather], ["wip", "WIP", BookOpen], ["postmortem", "Post-Mortem", HeartCrack]] as const).map(([type, label, Icon]) => (
            <Button key={type} variant="ghost" onClick={() => setPostType(type)} className={cn("rounded-xl", postType === type && "bg-background text-primary shadow-soft")}><Icon className="h-4 w-4" />{label}</Button>
          ))}
        </nav>

        {postType === "spark" ? (
          <section className="glass-panel mx-auto max-w-2xl rounded-[2rem] p-6 sm:p-8">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-spark">Una idea breve</p>
            <h2 className="mt-2 font-serif text-3xl text-foreground">Captura el destello antes de que se vaya.</h2>
            <textarea autoFocus value={spark} onChange={(event) => setSpark(event.target.value)} maxLength={280} placeholder="Una imagen, una primera línea, una pregunta…" className="mt-6 min-h-52 w-full resize-none rounded-2xl border border-border/70 bg-card/55 p-5 font-serif text-xl leading-relaxed text-foreground outline-none placeholder:text-muted-foreground/55 focus:border-primary/40 focus:ring-2 focus:ring-ring/15" />
            <div className="mt-4 flex items-center justify-between"><span className="text-xs tabular-nums text-muted-foreground">{spark.length}/280</span><Button disabled={!spark.trim()} className="rounded-full px-6" onClick={onClose}>Publicar Spark</Button></div>
          </section>
        ) : <WritingWorkspace mode={postType} />}
      </div>
    </div>
  );
}


