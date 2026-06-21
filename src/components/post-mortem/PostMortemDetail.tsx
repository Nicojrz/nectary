"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, BookOpen, CalendarDays, Compass, Flame, HeartCrack, History, Lightbulb, Loader2, Pencil, Route, RotateCcw, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { CATEGORY_LABELS } from "@/lib/wip-domain";
import { POST_MORTEM_SECTIONS } from "@/lib/post-mortem-domain";
import type { LiteraryCategory } from "@/types";
import type { PublicPostMortemData } from "@/lib/post-mortems-public";

type SectionKey = (typeof POST_MORTEM_SECTIONS)[number]["key"];

export function PostMortemDetail({ initialData }: { initialData: PublicPostMortemData }) {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [data, setData] = useState(initialData);
  const [markedUseful, setMarkedUseful] = useState(false);
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [deletePrompt, setDeletePrompt] = useState(false);
  const [title, setTitle] = useState(initialData.item.title);
  const [category, setCategory] = useState<LiteraryCategory>(initialData.item.categories[0] ?? "cuento");
  const [sections, setSections] = useState<Record<SectionKey, string>>({
    context: initialData.item.context,
    failedAttempts: initialData.item.failed_attempts,
    solution: initialData.item.solution,
    lessonsLearned: initialData.item.lessons_learned,
  });

  const postMortem = data.item;
  const isOwner = user?.id === postMortem.author_id;

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    fetch(`/api/post-mortems/${postMortem.id}`, { cache: "no-store" })
      .then((response) => response.ok ? response.json() : Promise.reject())
      .then((payload) => {
        if (!cancelled) {
          setMarkedUseful(Boolean(payload.markedUseful));
          setData({ item: payload.item, versions: payload.versions });
        }
      })
      .catch(() => undefined);
    return () => { cancelled = true; };
  }, [postMortem.id, user]);

  function setSection(key: SectionKey, value: string) {
    setSections((current) => ({ ...current, [key]: value }));
  }

  async function save() {
    setBusy(true);
    try {
      const response = await fetch(`/api/post-mortems/${postMortem.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, category, ...sections }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "No fue posible actualizar la reflexión");
      toast.success(`Versión ${payload.item.version} guardada`);
      setEditing(false);
      const refreshed = await fetch(`/api/post-mortems/${postMortem.id}`, { cache: "no-store" }).then((result) => result.json());
      setData({ item: refreshed.item, versions: refreshed.versions });
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No fue posible actualizar la reflexión");
    } finally {
      setBusy(false);
    }
  }

  async function toggleUseful() {
    setBusy(true);
    try {
      const response = await fetch(`/api/post-mortems/${postMortem.id}/useful`, {
        method: markedUseful ? "DELETE" : "POST",
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "No fue posible actualizar la marca");
      setMarkedUseful(payload.markedUseful);
      setData((current) => ({
        ...current,
        item: { ...current.item, unblocked_count: payload.count },
      }));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No fue posible actualizar la marca");
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    setBusy(true);
    try {
      const response = await fetch(`/api/post-mortems/${postMortem.id}`, { method: "DELETE" });
      if (!response.ok) {
        const payload = await response.json();
        throw new Error(payload.error || "No fue posible eliminar el Post-Mortem");
      }
      toast.success("Post-Mortem eliminado");
      router.push("/feed");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No fue posible eliminar el Post-Mortem");
    } finally {
      setBusy(false);
      setDeletePrompt(false);
    }
  }

  const sectionsForDisplay = [
    { label: "Contexto", value: postMortem.context, icon: Compass },
    { label: "Qué no funcionó", value: postMortem.failed_attempts, icon: RotateCcw },
    { label: "Qué funcionó", value: postMortem.solution, icon: Route },
    { label: "Lecciones aprendidas", value: postMortem.lessons_learned, icon: Lightbulb },
  ];

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
        <Button asChild variant="ghost" className="min-h-11 rounded-full text-muted-foreground"><Link href="/feed"><ArrowLeft />Volver al feed</Link></Button>
        <Button asChild variant="outline" className="min-h-11 rounded-full bg-card/60"><Link href="/post-mortems"><Search />Explorar reflexiones</Link></Button>
      </div>

      <article className="glass-panel overflow-hidden rounded-3xl">
        <header className="border-b border-border/70 bg-postmortem-soft/35 p-6 sm:p-10">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="inline-flex min-h-7 items-center gap-1.5 rounded-full bg-postmortem-soft px-3 font-semibold text-postmortem"><HeartCrack className="h-3.5 w-3.5" />Post-Mortem</span>
            <span className="inline-flex min-h-7 items-center rounded-full bg-card/70 px-3 text-foreground">{CATEGORY_LABELS[postMortem.categories[0]]}</span>
            <span className="inline-flex min-h-7 items-center rounded-full border border-border/70 bg-background/50 px-3 tabular-nums text-muted-foreground">Versión {postMortem.version}</span>
          </div>
          <h1 className="mt-6 max-w-4xl font-serif text-4xl leading-[1.08] text-foreground sm:text-6xl">{postMortem.title}</h1>
          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground"><span>Por <strong className="font-medium text-foreground">{postMortem.author?.name ?? "Autor"}</strong></span><span className="inline-flex items-center gap-1.5"><CalendarDays className="h-4 w-4" />Actualizado el <time>{new Date(postMortem.updated_at).toLocaleDateString("es-MX")}</time></span></div>
          {postMortem.wip && (
            <Link href={`/wip/${postMortem.wip.id}`} className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-xl border border-wip/25 bg-wip-soft/60 px-4 text-sm font-medium text-wip transition-colors duration-200 hover:bg-wip-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wip focus-visible:ring-offset-2">
              <BookOpen className="h-4 w-4" />WIP de origen: {postMortem.wip.title}
            </Link>
          )}
        </header>

        {editing ? (
          <div className="mx-auto max-w-3xl space-y-6 p-6 sm:p-10">
            <div><label htmlFor="edit-pm-title" className="text-sm font-semibold">Título</label><input id="edit-pm-title" value={title} maxLength={200} onChange={(event) => setTitle(event.target.value)} className="mt-2 min-h-12 w-full rounded-2xl border border-input bg-background/60 px-4 py-3 font-serif text-3xl outline-none focus:border-postmortem focus:ring-2 focus:ring-postmortem/15" /></div>
            <div><label htmlFor="edit-pm-category" className="text-sm font-semibold">Categoría</label><select id="edit-pm-category" value={category} onChange={(event) => setCategory(event.target.value as LiteraryCategory)} className="mt-2 min-h-11 w-full rounded-xl border border-input bg-background/60 px-3 text-base">
              {(Object.entries(CATEGORY_LABELS) as [LiteraryCategory, string][]).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select></div>
            {POST_MORTEM_SECTIONS.map((section) => (
              <div key={section.key}><label className="font-serif text-xl" htmlFor={`edit-${section.key}`}>{section.label}</label><p className="mt-1 text-sm text-muted-foreground">{section.prompt}</p><Textarea id={`edit-${section.key}`} value={sections[section.key]} onChange={(event) => setSection(section.key, event.target.value)} className="mt-3 min-h-40 rounded-2xl bg-background/60 p-4 font-serif text-base leading-7 focus-visible:border-postmortem focus-visible:ring-postmortem/15" /></div>
            ))}
            <div className="flex flex-col-reverse gap-2 border-t border-border/70 pt-5 sm:flex-row sm:justify-end"><Button className="min-h-11" variant="outline" onClick={() => setEditing(false)}>Cancelar</Button><Button className="min-h-11" onClick={save} disabled={busy || !title.trim() || Object.values(sections).some((value) => !value.trim())}>{busy && <Loader2 className="animate-spin" />}Guardar nueva versión</Button></div>
          </div>
        ) : (
          <div className="p-6 sm:p-10">
            <div className="mx-auto max-w-3xl space-y-12">
              {sectionsForDisplay.map((section, index) => {
                const Icon = section.icon;
                return <section key={section.label} aria-labelledby={`pm-section-${index}`}>
                  <h2 id={`pm-section-${index}`} className="flex items-center gap-3 font-serif text-2xl"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-postmortem-soft text-postmortem"><Icon className="h-5 w-5" /></span>{section.label}</h2>
                  <p className="mt-4 max-w-prose whitespace-pre-wrap font-serif text-lg leading-9 text-foreground/90">{section.value}</p>
                </section>
              })}
            </div>

            <div className="mx-auto mt-12 flex max-w-3xl flex-col gap-5 rounded-3xl border border-postmortem/20 bg-postmortem-soft/45 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
              <div className="flex gap-3"><Lightbulb className="mt-0.5 h-5 w-5 text-postmortem" /><div><p className="font-semibold">¿Esta reflexión te desbloqueó?</p><p className="text-sm text-muted-foreground">Tu marca reconoce la utilidad y otorga XP al autor.</p></div></div>
              {!isOwner && (
                <Button variant={markedUseful ? "default" : "outline"} onClick={toggleUseful} disabled={busy || authLoading} className="min-h-11 shrink-0 rounded-full"><Flame className={markedUseful ? "fill-current" : ""} />{markedUseful ? "Me desbloqueó" : "Marcar como útil"}<span className="tabular-nums">{postMortem.unblocked_count}</span></Button>
              )}
              {isOwner && <span className="text-sm font-semibold text-postmortem">{postMortem.unblocked_count} personas desbloqueadas</span>}
            </div>
          </div>
        )}
      </article>

      <div className="mt-6 grid gap-6 md:grid-cols-[1fr_300px]">
        <div className="rounded-3xl border border-card/80 bg-card/75 p-5 shadow-soft"><div className="flex items-center gap-2"><History className="h-4 w-4 text-postmortem" /><h2 className="font-serif text-xl">Historial inmutable</h2></div><p className="mt-1 text-xs text-muted-foreground">Cada edición conserva la reflexión anterior.</p><div className="mt-4 space-y-2">{data.versions.map((version) => <div key={version.version} className="flex min-h-11 items-center justify-between rounded-xl border border-border/60 bg-background/45 px-3 text-sm"><span>Versión {version.version}</span><time className="text-xs text-muted-foreground">{new Date(version.created_at).toLocaleDateString("es-MX")}</time></div>)}</div></div>
        {isOwner && <aside className="rounded-3xl border border-card/80 bg-card/75 p-5 shadow-soft"><p className="text-sm font-semibold">Gestionar reflexión</p><p className="mt-1 text-xs leading-5 text-muted-foreground">Editar crea una nueva versión sin modificar las anteriores.</p><div className="mt-4 grid gap-2"><Button className="min-h-11 justify-start" variant="outline" onClick={() => setEditing(true)}><Pencil />Editar contenido</Button></div><div className="mt-4 border-t border-border/70 pt-4"><Button className="min-h-11 w-full justify-start" variant="ghost" onClick={() => setDeletePrompt(true)}><Trash2 className="text-destructive" /><span className="text-destructive">Eliminar Post-Mortem</span></Button></div></aside>}
      </div>

      <AlertDialog open={deletePrompt} onOpenChange={setDeletePrompt}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Eliminar Post-Mortem</AlertDialogTitle><AlertDialogDescription>La reflexión dejará de estar visible y se retirará su vínculo del WIP.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel className="min-h-11">Cancelar</AlertDialogCancel><AlertDialogAction className="min-h-11 bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={remove}>Eliminar</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
    </div>
  );
}
