"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  BookOpen,
  Check,
  CheckCircle2,
  CircleDashed,
  FileText,
  Loader2,
  LockKeyhole,
  Save,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { CATEGORY_LABELS, WIP_STATUS_LABELS } from "@/lib/wip-domain";
import type { LiteraryCategory, WIPStatus } from "@/types";

interface WipEditorProps {
  onCreated?: () => void;
}

const categories = Object.entries(CATEGORY_LABELS) as [LiteraryCategory, string][];
const statusOptions: { id: WIPStatus; icon: typeof CircleDashed }[] = [
  { id: "in-progress", icon: CircleDashed },
  { id: "blocked", icon: LockKeyhole },
  { id: "resolved", icon: CheckCircle2 },
];

export function WipEditor({ onCreated }: WipEditorProps) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [currentBlock, setCurrentBlock] = useState("");
  const [category, setCategory] = useState<LiteraryCategory | null>(null);
  const [status, setStatus] = useState<WIPStatus>("in-progress");
  const [saving, setSaving] = useState<"draft" | "publish" | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [submitted, setSubmitted] = useState(false);

  const requirements = [Boolean(title.trim()), Boolean(content.trim()), Boolean(category)];
  const completed = requirements.filter(Boolean).length;
  const canSave = completed === requirements.length;
  const showError = (field: string) => submitted || touched[field];

  async function save(isDraft: boolean) {
    setSubmitted(true);
    setSubmitError(null);
    if (!canSave || !category) {
      document.getElementById(!title.trim() ? "wip-title" : !content.trim() ? "wip-content" : "wip-category-cuento")?.focus();
      return;
    }
    setSaving(isDraft ? "draft" : "publish");
    try {
      const response = await fetch("/api/wips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content, category, status, currentBlock: currentBlock || null, isDraft }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "No fue posible guardar el WIP");

      toast.success(isDraft ? "Borrador guardado" : "WIP publicado");
      window.dispatchEvent(new CustomEvent("feed-updated"));
      onCreated?.();
      router.push(`/wip/${payload.item.id}`);
      router.refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : "No fue posible guardar el WIP";
      setSubmitError(message);
      toast.error(message);
    } finally {
      setSaving(null);
    }
  }

  return (
    <section className="glass-panel overflow-hidden rounded-3xl" aria-labelledby="wip-editor-title">
      <header className="border-b border-border/70 bg-card/65 px-5 py-5 sm:px-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-wip-soft text-wip" aria-hidden="true">
              <BookOpen className="h-5 w-5" strokeWidth={1.8} />
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-wip">Trabajo en progreso</p>
              <h1 id="wip-editor-title" className="mt-1 font-serif text-2xl leading-tight text-foreground sm:text-3xl">Comparte el texto que todavía está creciendo</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">Publica una versión clara para que otros escritores puedan comentarla con contexto.</p>
            </div>
          </div>
          <div className="min-w-40 rounded-2xl border border-border/70 bg-background/55 px-4 py-3" aria-live="polite">
            <div className="flex items-center justify-between text-xs"><span className="font-medium text-foreground">Preparación</span><span className="tabular-nums text-muted-foreground">{completed}/3</span></div>
            <div className="mt-2 grid grid-cols-3 gap-1" aria-hidden="true">{requirements.map((done, index) => <span key={index} className={cn("h-1.5 rounded-full", done ? "bg-wip" : "bg-border")} />)}</div>
          </div>
        </div>
      </header>

      <div className="grid lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="p-5 sm:p-8">
          <div className="mx-auto max-w-3xl space-y-8">
            <div>
              <div className="flex items-center justify-between gap-4">
                <label htmlFor="wip-title" className="text-sm font-semibold text-foreground">Título <span className="text-destructive" aria-hidden="true">*</span></label>
                <span className="text-xs tabular-nums text-muted-foreground">{title.length}/200</span>
              </div>
              <input
                id="wip-title"
                value={title}
                maxLength={200}
                aria-invalid={showError("title") && !title.trim()}
                aria-describedby="wip-title-help wip-title-error"
                onBlur={() => setTouched((current) => ({ ...current, title: true }))}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Un título que ubique a tus lectores"
                className="mt-2 min-h-12 w-full rounded-2xl border border-input bg-background/60 px-4 py-3 font-serif text-2xl text-foreground outline-none transition-colors placeholder:text-muted-foreground/55 focus:border-wip focus:ring-2 focus:ring-wip/15 aria-invalid:border-destructive aria-invalid:ring-destructive/15 sm:text-3xl"
              />
              <p id="wip-title-help" className="mt-2 text-xs leading-5 text-muted-foreground">Describe la obra o fragmento, no el problema que estás intentando resolver.</p>
              {showError("title") && !title.trim() && <p id="wip-title-error" role="alert" className="mt-2 flex items-center gap-1.5 text-sm text-destructive"><AlertTriangle className="h-4 w-4" />Escribe un título antes de continuar.</p>}
            </div>

            <div>
              <div className="flex flex-wrap items-end justify-between gap-2">
                <div><label htmlFor="wip-content" className="text-sm font-semibold text-foreground">Texto en progreso <span className="text-destructive" aria-hidden="true">*</span></label><p id="wip-content-help" className="mt-1 text-xs text-muted-foreground">Solo texto plano. Comparte exactamente la versión que deseas revisar.</p></div>
                <span className="text-xs tabular-nums text-muted-foreground">{content.trim() ? content.trim().split(/\s+/).length : 0} palabras</span>
              </div>
              <Textarea
                id="wip-content"
                value={content}
                aria-invalid={showError("content") && !content.trim()}
                aria-describedby="wip-content-help wip-content-error"
                onBlur={() => setTouched((current) => ({ ...current, content: true }))}
                onChange={(event) => setContent(event.target.value)}
                placeholder="Escribe o pega aquí el fragmento que necesita otra mirada…"
                className="mt-3 min-h-[420px] resize-y rounded-2xl border-input bg-background/60 p-5 font-serif text-lg leading-8 shadow-none placeholder:text-muted-foreground/55 focus-visible:border-wip focus-visible:ring-wip/15 aria-invalid:border-destructive"
              />
              {showError("content") && !content.trim() && <p id="wip-content-error" role="alert" className="mt-2 flex items-center gap-1.5 text-sm text-destructive"><AlertTriangle className="h-4 w-4" />Añade el texto que quieres compartir.</p>}
            </div>
          </div>
        </div>

        <aside className="border-t border-border/70 bg-secondary/25 p-5 lg:border-l lg:border-t-0 lg:p-6">
          <div className="lg:sticky lg:top-24">
            <div className="flex items-center gap-2"><FileText className="h-4 w-4 text-wip" /><h2 className="text-sm font-semibold text-foreground">Ficha de publicación</h2></div>

            <fieldset className="mt-6" aria-describedby="wip-category-error">
              <legend className="text-sm font-semibold text-foreground">Categoría <span className="text-destructive" aria-hidden="true">*</span></legend>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">Selecciona una sola disciplina literaria.</p>
              <div className="mt-3 grid grid-cols-2 gap-2">
                {categories.map(([id, label]) => (
                  <button
                    id={`wip-category-${id}`}
                    key={id}
                    type="button"
                    aria-pressed={category === id}
                    onBlur={() => setTouched((current) => ({ ...current, category: true }))}
                    onClick={() => setCategory(id)}
                    className={cn(
                      "min-h-11 cursor-pointer rounded-xl border px-3 py-2 text-left text-sm transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wip focus-visible:ring-offset-2",
                      category === id ? "border-wip/50 bg-wip-soft font-semibold text-wip" : "border-border/80 bg-card/65 text-foreground hover:border-wip/30 hover:bg-card",
                    )}
                  >
                    <span className="flex items-center justify-between gap-2">{label}{category === id && <Check className="h-4 w-4" aria-hidden="true" />}</span>
                  </button>
                ))}
              </div>
              {showError("category") && !category && <p id="wip-category-error" role="alert" className="mt-2 flex items-center gap-1.5 text-sm text-destructive"><AlertTriangle className="h-4 w-4" />Selecciona una categoría.</p>}
            </fieldset>

            <fieldset className="mt-7">
              <legend className="text-sm font-semibold text-foreground">Estado inicial</legend>
              <div className="mt-3 space-y-2">
                {statusOptions.map(({ id, icon: Icon }) => (
                  <button key={id} type="button" aria-pressed={status === id} onClick={() => setStatus(id)} className={cn("flex min-h-11 w-full cursor-pointer items-center gap-3 rounded-xl border px-3 text-left text-sm transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wip focus-visible:ring-offset-2", status === id ? "border-wip/50 bg-wip-soft font-semibold text-wip" : "border-border/80 bg-card/65 hover:border-wip/30")}>
                    <Icon className="h-4 w-4" aria-hidden="true" />{WIP_STATUS_LABELS[id]}{status === id && <Check className="ml-auto h-4 w-4" aria-hidden="true" />}
                  </button>
                ))}
              </div>
            </fieldset>

            {status === "blocked" && (
              <div className="mt-7 rounded-2xl border border-destructive/20 bg-destructive/5 p-4">
                <label htmlFor="wip-block" className="flex items-center gap-2 text-sm font-semibold text-foreground"><LockKeyhole className="h-4 w-4 text-destructive" />Bloqueo actual</label>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">Formula una pregunta concreta para orientar los comentarios.</p>
                <Textarea id="wip-block" value={currentBlock} maxLength={1000} onChange={(event) => setCurrentBlock(event.target.value)} placeholder="¿En qué punto necesitas ayuda?" className="mt-3 min-h-28 bg-background/70 text-base" />
                <p className="mt-2 text-right text-xs tabular-nums text-muted-foreground">{currentBlock.length}/1000</p>
              </div>
            )}
          </div>
        </aside>
      </div>

      <footer className="flex flex-col-reverse gap-3 border-t border-border/70 bg-card/75 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <Button type="button" variant="outline" className="min-h-11 rounded-full bg-background/60 px-5" disabled={!canSave || saving !== null} onClick={() => void save(true)}>{saving === "draft" ? <Loader2 className="animate-spin" /> : <Save />}Guardar borrador</Button>
        <div className="flex flex-col items-stretch gap-2 sm:items-end">
          {submitError && <p role="alert" className="max-w-md text-sm text-destructive">{submitError}</p>}
          <Button type="button" className="min-h-11 rounded-full px-7" disabled={saving !== null} onClick={() => void save(false)}>{saving === "publish" ? <Loader2 className="animate-spin" /> : <BookOpen />}Publicar WIP</Button>
        </div>
      </footer>
    </section>
  );
}
