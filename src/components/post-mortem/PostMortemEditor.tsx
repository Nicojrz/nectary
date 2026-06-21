"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  BookOpen,
  Check,
  CircleCheck,
  Compass,
  HeartCrack,
  Lightbulb,
  Loader2,
  Route,
  RotateCcw,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { CATEGORY_LABELS } from "@/lib/wip-domain";
import { POST_MORTEM_SECTIONS } from "@/lib/post-mortem-domain";
import type { LiteraryCategory } from "@/types";

interface AvailableWip {
  id: string;
  title: string;
  status: "in-progress" | "blocked" | "resolved";
  is_draft: boolean;
  post_mortem_id: string | null;
}

interface PostMortemEditorProps {
  initialWipId?: string;
  onCreated?: () => void;
}

type SectionKey = (typeof POST_MORTEM_SECTIONS)[number]["key"];
const DRAFT_KEY = "nectary:post-mortem-draft";
const emptySections: Record<SectionKey, string> = { context: "", failedAttempts: "", solution: "", lessonsLearned: "" };
const sectionIcons = [Compass, RotateCcw, Route, Lightbulb];

export function PostMortemEditor({ initialWipId, onCreated }: PostMortemEditorProps) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [sections, setSections] = useState(emptySections);
  const [category, setCategory] = useState<LiteraryCategory | null>(null);
  const [wipOriginId, setWipOriginId] = useState(initialWipId ?? "");
  const [availableWips, setAvailableWips] = useState<AvailableWip[]>([]);
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [draftSaved, setDraftSaved] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/wips?mine=true&limit=50", { cache: "no-store" })
      .then((response) => response.ok ? response.json() : Promise.reject())
      .then((payload) => {
        if (!cancelled) {
          setAvailableWips((payload.items ?? []).filter((wip: AvailableWip) => !wip.is_draft && !wip.post_mortem_id));
        }
      })
      .catch(() => undefined);
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      try {
        const raw = window.localStorage.getItem(DRAFT_KEY);
        if (!raw) return;
        const draft = JSON.parse(raw) as { title?: string; sections?: Partial<Record<SectionKey, string>>; category?: LiteraryCategory; wipOriginId?: string };
        setTitle(draft.title ?? "");
        setSections({ ...emptySections, ...draft.sections });
        setCategory(draft.category ?? null);
        if (!initialWipId) setWipOriginId(draft.wipOriginId ?? "");
      } catch {
        window.localStorage.removeItem(DRAFT_KEY);
      }
    }, 0);
    return () => window.clearTimeout(timeout);
  }, [initialWipId]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      window.localStorage.setItem(DRAFT_KEY, JSON.stringify({ title, sections, category, wipOriginId }));
      setDraftSaved(true);
    }, 700);
    return () => window.clearTimeout(timeout);
  }, [category, sections, title, wipOriginId]);

  const requirements = [Boolean(title.trim()), Boolean(category), ...POST_MORTEM_SECTIONS.map((section) => Boolean(sections[section.key].trim()))];
  const completed = requirements.filter(Boolean).length;
  const complete = completed === requirements.length;
  const showError = (field: string) => submitted || touched[field];
  const selectedWip = availableWips.find((wip) => wip.id === wipOriginId);

  function setSection(key: SectionKey, value: string) {
    setSections((current) => ({ ...current, [key]: value }));
  }

  async function publish() {
    setSubmitted(true);
    setSubmitError(null);
    if (!complete || !category) {
      const missingSection = POST_MORTEM_SECTIONS.find((section) => !sections[section.key].trim());
      document.getElementById(!title.trim() ? "pm-title" : !category ? "pm-category-cuento" : `pm-${missingSection?.key}`)?.focus();
      return;
    }
    setSaving(true);
    try {
      const response = await fetch("/api/post-mortems", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, ...sections, category, wipOriginId: wipOriginId || null }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "No fue posible publicar el Post-Mortem");

      window.localStorage.removeItem(DRAFT_KEY);
      toast.success("Post-Mortem publicado");
      window.dispatchEvent(new CustomEvent("feed-updated"));
      onCreated?.();
      router.push(`/post-mortem/${payload.item.id}`);
      router.refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : "No fue posible publicar el Post-Mortem";
      setSubmitError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="glass-panel overflow-hidden rounded-3xl" aria-labelledby="post-mortem-editor-title">
      <header className="border-b border-border/70 bg-card/65 px-5 py-5 sm:px-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-postmortem-soft text-postmortem" aria-hidden="true"><HeartCrack className="h-5 w-5" strokeWidth={1.8} /></span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-postmortem">Reflexión estructurada</p>
              <h1 id="post-mortem-editor-title" className="mt-1 font-serif text-2xl leading-tight text-foreground sm:text-3xl">Convierte el proceso en conocimiento compartido</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">Recorre cuatro momentos concretos. El borrador se conserva en este dispositivo.</p>
            </div>
          </div>
          <div className="min-w-44 rounded-2xl border border-border/70 bg-background/55 px-4 py-3" aria-live="polite">
            <div className="flex items-center justify-between text-xs"><span className="font-medium text-foreground">Reflexión</span><span className="tabular-nums text-muted-foreground">{completed}/6</span></div>
            <div className="mt-2 grid grid-cols-6 gap-1" aria-hidden="true">{requirements.map((done, index) => <span key={index} className={cn("h-1.5 rounded-full", done ? "bg-postmortem" : "bg-border")} />)}</div>
            <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">{draftSaved ? <><CircleCheck className="h-3.5 w-3.5 text-postmortem" />Borrador local guardado</> : "Guardando cambios…"}</p>
          </div>
        </div>
      </header>

      <div className="grid lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="p-5 sm:p-8">
          <div className="mx-auto max-w-3xl space-y-8">
            <div>
              <div className="flex items-center justify-between gap-4"><label htmlFor="pm-title" className="text-sm font-semibold text-foreground">Título <span className="text-destructive" aria-hidden="true">*</span></label><span className="text-xs tabular-nums text-muted-foreground">{title.length}/200</span></div>
              <input id="pm-title" value={title} maxLength={200} aria-invalid={showError("title") && !title.trim()} aria-describedby="pm-title-help pm-title-error" onBlur={() => setTouched((current) => ({ ...current, title: true }))} onChange={(event) => setTitle(event.target.value)} placeholder="La idea principal que te llevas" className="mt-2 min-h-12 w-full rounded-2xl border border-input bg-background/60 px-4 py-3 font-serif text-2xl outline-none transition-colors placeholder:text-muted-foreground/55 focus:border-postmortem focus:ring-2 focus:ring-postmortem/15 aria-invalid:border-destructive sm:text-3xl" />
              <p id="pm-title-help" className="mt-2 text-xs leading-5 text-muted-foreground">Resume el aprendizaje, no solo el nombre del proyecto.</p>
              {showError("title") && !title.trim() && <p id="pm-title-error" role="alert" className="mt-2 flex items-center gap-1.5 text-sm text-destructive"><AlertTriangle className="h-4 w-4" />Escribe un título para la reflexión.</p>}
            </div>

            {POST_MORTEM_SECTIONS.map((section, index) => {
              const Icon = sectionIcons[index];
              const invalid = showError(section.key) && !sections[section.key].trim();
              return (
                <section key={section.key} id={`section-${section.key}`} className="scroll-mt-24 rounded-3xl border border-border/75 bg-card/55 p-5 sm:p-6">
                  <div className="flex gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-postmortem-soft text-postmortem" aria-hidden="true"><Icon className="h-5 w-5" strokeWidth={1.8} /></span>
                    <div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Parte {index + 1} de 4</p><label htmlFor={`pm-${section.key}`} className="mt-1 block font-serif text-xl text-foreground">{section.label} <span className="text-destructive" aria-hidden="true">*</span></label><p id={`pm-${section.key}-help`} className="mt-1 text-sm leading-6 text-muted-foreground">{section.prompt}</p></div>
                  </div>
                  <Textarea id={`pm-${section.key}`} value={sections[section.key]} aria-invalid={invalid} aria-describedby={`pm-${section.key}-help pm-${section.key}-error`} onBlur={() => setTouched((current) => ({ ...current, [section.key]: true }))} onChange={(event) => setSection(section.key, event.target.value)} className="mt-4 min-h-40 resize-y rounded-2xl border-input bg-background/65 p-4 font-serif text-base leading-7 focus-visible:border-postmortem focus-visible:ring-postmortem/15 aria-invalid:border-destructive" placeholder="Escribe esta parte con ejemplos concretos…" />
                  {invalid && <p id={`pm-${section.key}-error`} role="alert" className="mt-2 flex items-center gap-1.5 text-sm text-destructive"><AlertTriangle className="h-4 w-4" />Completa esta sección antes de publicar.</p>}
                </section>
              );
            })}
          </div>
        </div>

        <aside className="border-t border-border/70 bg-secondary/25 p-5 lg:border-l lg:border-t-0 lg:p-6">
          <div className="lg:sticky lg:top-24">
            <h2 className="text-sm font-semibold text-foreground">Estructura de la reflexión</h2>
            <nav className="mt-3 space-y-1" aria-label="Secciones del Post-Mortem">
              {POST_MORTEM_SECTIONS.map((section, index) => <a key={section.key} href={`#section-${section.key}`} className="flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm text-foreground transition-colors duration-200 hover:bg-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-postmortem"><span className={cn("flex h-6 w-6 items-center justify-center rounded-full border text-xs tabular-nums", sections[section.key].trim() ? "border-postmortem bg-postmortem-soft text-postmortem" : "border-border text-muted-foreground")}>{sections[section.key].trim() ? <Check className="h-3.5 w-3.5" /> : index + 1}</span>{section.label}</a>)}
            </nav>

            <fieldset className="mt-7" aria-describedby="pm-category-error">
              <legend className="text-sm font-semibold text-foreground">Categoría <span className="text-destructive" aria-hidden="true">*</span></legend>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">La disciplina en la que ocurrió el aprendizaje.</p>
              <div className="mt-3 grid grid-cols-2 gap-2">
                {(Object.entries(CATEGORY_LABELS) as [LiteraryCategory, string][]).map(([id, label]) => <button id={`pm-category-${id}`} key={id} type="button" aria-pressed={category === id} onBlur={() => setTouched((current) => ({ ...current, category: true }))} onClick={() => setCategory(id)} className={cn("min-h-11 cursor-pointer rounded-xl border px-3 py-2 text-left text-sm transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-postmortem focus-visible:ring-offset-2", category === id ? "border-postmortem/50 bg-postmortem-soft font-semibold text-postmortem" : "border-border/80 bg-card/65 hover:border-postmortem/30")}>{label}</button>)}
              </div>
              {showError("category") && !category && <p id="pm-category-error" role="alert" className="mt-2 flex items-center gap-1.5 text-sm text-destructive"><AlertTriangle className="h-4 w-4" />Selecciona una categoría.</p>}
            </fieldset>

            <div className="mt-7">
              <label htmlFor="pm-wip" className="flex items-center gap-2 text-sm font-semibold text-foreground"><BookOpen className="h-4 w-4 text-wip" />WIP de origen <span className="font-normal text-muted-foreground">(opcional)</span></label>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">Aparecen tus WIPs publicados que todavía no tienen una reflexión vinculada.</p>
              <select id="pm-wip" value={wipOriginId} onChange={(event) => setWipOriginId(event.target.value)} className="mt-3 min-h-11 w-full rounded-xl border border-input bg-background/65 px-3 text-base outline-none focus:border-postmortem focus:ring-2 focus:ring-postmortem/15"><option value="">Sin WIP vinculado</option>{availableWips.map((wip) => <option key={wip.id} value={wip.id}>{wip.title} · {wip.status === "resolved" ? "Resuelto" : wip.status === "blocked" ? "Bloqueado" : "En progreso"}</option>)}</select>
              {selectedWip && selectedWip.status !== "resolved" && <p className="mt-2 rounded-xl border border-wip/20 bg-wip-soft/50 px-3 py-2 text-xs leading-5 text-foreground">Al publicar esta reflexión, el WIP se marcará automáticamente como resuelto.</p>}
              {initialWipId && !availableWips.some((wip) => wip.id === initialWipId) && <p className="mt-2 text-xs leading-5 text-muted-foreground">Este WIP no está disponible porque es un borrador, ya tiene un Post-Mortem o no pertenece a tu cuenta.</p>}
            </div>
          </div>
        </aside>
      </div>

      <footer className="flex flex-col gap-3 border-t border-border/70 bg-card/75 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <div><p className="text-xs leading-5 text-muted-foreground">Al publicar, esta reflexión será visible y tendrá historial de versiones.</p>{submitError && <p role="alert" className="mt-1 max-w-md text-sm text-destructive">{submitError}</p>}</div>
        <Button type="button" className="min-h-11 rounded-full px-7" disabled={saving} onClick={() => void publish()}>{saving ? <Loader2 className="animate-spin" /> : <HeartCrack />}Publicar Post-Mortem</Button>
      </footer>
    </section>
  );
}
