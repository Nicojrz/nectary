"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  FileText,
  History,
  GitFork,
  Link2,
  Loader2,
  MessageSquareText,
  Pencil,
  Send,
  Trash2,
} from "lucide-react";
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
import { CATEGORY_LABELS, WIP_STATUS_LABELS } from "@/lib/wip-domain";
import { cn } from "@/lib/utils";
import type { LiteraryCategory, WIPStatus } from "@/types";
import { ForkTree } from "@/components/fork/ForkTree";

interface WipRecord {
  id: string;
  author_id: string;
  title: string;
  description: string;
  current_block: string | null;
  status: WIPStatus;
  categories: LiteraryCategory[];
  comment_count: number;
  post_mortem_id: string | null;
  is_draft: boolean;
  version: number;
  created_at: string;
  updated_at: string;
  author: { id: string; name: string; avatar_url: string | null; level: number } | null;
}

interface WipVersion {
  version: number;
  title: string;
  description: string;
  current_block: string | null;
  categories: LiteraryCategory[];
  created_at: string;
}

interface WipComment {
  id: string;
  author_id: string;
  content: string;
  wip_version: number;
  created_at: string;
  author: { id: string; name: string; avatar_url: string | null; level: number } | null;
}

export function WipDetail({ id }: { id: string }) {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [wip, setWip] = useState<WipRecord | null>(null);
  const [versions, setVersions] = useState<WipVersion[]>([]);
  const [comments, setComments] = useState<WipComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [currentBlock, setCurrentBlock] = useState("");
  const [category, setCategory] = useState<LiteraryCategory>("cuento");
  const [status, setStatus] = useState<WIPStatus>("in-progress");
  const [comment, setComment] = useState("");
  const [commentVersion, setCommentVersion] = useState(1);
  const [busy, setBusy] = useState(false);
  const [postMortemPrompt, setPostMortemPrompt] = useState(false);
  const [deletePrompt, setDeletePrompt] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [wipResponse, commentsResponse] = await Promise.all([
        fetch(`/api/wips/${id}`, { cache: "no-store" }),
        fetch(`/api/wips/${id}/comments`, { cache: "no-store" }),
      ]);
      const wipPayload = await wipResponse.json();
      const commentsPayload = await commentsResponse.json();
      if (!wipResponse.ok) throw new Error(wipPayload.error || "No fue posible cargar el WIP");
      if (!commentsResponse.ok) throw new Error(commentsPayload.error || "No fue posible cargar los comentarios");

      const item = wipPayload.item as WipRecord;
      setWip(item);
      setVersions(wipPayload.versions ?? []);
      setComments(commentsPayload.items ?? []);
      setTitle(item.title);
      setContent(item.description);
      setCurrentBlock(item.current_block ?? "");
      setCategory(item.categories[0] ?? "cuento");
      setStatus(item.status);
      setCommentVersion(item.version);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "No fue posible cargar el WIP");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    const timeout = window.setTimeout(() => { void load(); }, 0);
    return () => window.clearTimeout(timeout);
  }, [load]);

  async function updateWip(values: Record<string, unknown>) {
    setBusy(true);
    try {
      const response = await fetch(`/api/wips/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "No fue posible actualizar el WIP");
      toast.success("WIP actualizado");
      setEditing(false);
      if (payload.suggestPostMortem) setPostMortemPrompt(true);
      await load();
    } catch (updateError) {
      toast.error(updateError instanceof Error ? updateError.message : "No fue posible actualizar el WIP");
    } finally {
      setBusy(false);
    }
  }

  async function submitComment() {
    if (!comment.trim()) return;
    setBusy(true);
    try {
      const response = await fetch(`/api/wips/${id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: comment, version: commentVersion }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "No fue posible comentar");
      setComment("");
      toast.success(`Comentario guardado en la versión ${commentVersion}`);
      await load();
    } catch (commentError) {
      toast.error(commentError instanceof Error ? commentError.message : "No fue posible comentar");
    } finally {
      setBusy(false);
    }
  }

  async function deleteWip() {
    setBusy(true);
    try {
      const response = await fetch(`/api/wips/${id}`, { method: "DELETE" });
      if (!response.ok) {
        const payload = await response.json();
        throw new Error(payload.error || "No fue posible eliminar el WIP");
      }
      toast.success("WIP eliminado");
      router.push("/feed");
      router.refresh();
    } catch (deleteError) {
      toast.error(deleteError instanceof Error ? deleteError.message : "No fue posible eliminar el WIP");
    } finally {
      setBusy(false);
      setDeletePrompt(false);
    }
  }

  function openFork() {
    if (!wip) return;
    window.dispatchEvent(new CustomEvent("open-fork", {
      detail: {
        id: wip.id,
        type: "wip",
        category: wip.categories[0],
        author: {
          name: wip.author?.name ?? "Autor",
          handle: "",
          initials: "",
          tint: "primary",
          level: wip.author?.level ?? 1,
        },
        title: wip.title,
        summary: wip.description,
        status: wip.status,
        progress: 0,
        currentBlock: wip.current_block ?? undefined,
        wordCount: 0,
        createdAt: wip.created_at,
        reactions: { likes: 0 },
        forks: 0,
        version: wip.version,
      },
    }));
  }

  if (loading) return (
    <div className="mx-auto max-w-6xl animate-pulse space-y-6" aria-label="Cargando WIP" role="status">
      <div className="h-11 w-36 rounded-full bg-muted" />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="min-h-[520px] rounded-3xl border border-border/60 bg-card/50 p-8"><div className="h-5 w-44 rounded bg-muted" /><div className="mt-8 h-12 w-4/5 rounded bg-muted" /><div className="mt-5 h-4 w-48 rounded bg-muted" /><div className="mt-10 space-y-3">{[1, 2, 3, 4, 5].map((line) => <div key={line} className="h-4 rounded bg-muted" />)}</div></div>
        <div className="h-72 rounded-3xl border border-border/60 bg-card/50" />
      </div>
      <span className="sr-only">Cargando contenido del WIP</span>
    </div>
  );
  if (error || !wip) {
    return (
      <div className="mx-auto max-w-xl rounded-3xl border border-destructive/20 bg-destructive/5 p-8 text-center" role="alert">
        <p className="font-serif text-2xl">No pudimos abrir este WIP</p>
        <p className="mt-2 text-sm text-muted-foreground">{error}</p>
        <Button asChild variant="outline" className="mt-5 min-h-11 rounded-full"><Link href="/feed"><ArrowLeft />Volver al feed</Link></Button>
      </div>
    );
  }

  const isOwner = user?.id === wip.author_id;

  return (
    <div className="mx-auto max-w-6xl">
      <Button asChild variant="ghost" className="mb-5 min-h-11 rounded-full text-muted-foreground">
        <Link href="/feed"><ArrowLeft /> Volver al feed</Link>
      </Button>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
        <article className="glass-panel overflow-hidden rounded-3xl">
          <header className="border-b border-border/70 bg-card/65 p-6 sm:p-9">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="inline-flex min-h-7 items-center gap-1.5 rounded-full bg-wip-soft px-3 font-semibold text-wip"><BookOpen className="h-3.5 w-3.5" />WIP</span>
              <span className="inline-flex min-h-7 items-center rounded-full bg-secondary px-3 text-secondary-foreground">{CATEGORY_LABELS[wip.categories[0]]}</span>
              <span className="inline-flex min-h-7 items-center gap-1.5 rounded-full border border-border/70 bg-background/55 px-3 text-foreground"><span className={cn("h-1.5 w-1.5 rounded-full", wip.status === "blocked" ? "bg-destructive" : wip.status === "resolved" ? "bg-ensayo" : "bg-wip")} />{WIP_STATUS_LABELS[wip.status]}</span>
              <span className="inline-flex min-h-7 items-center rounded-full border border-border/70 bg-background/55 px-3 tabular-nums text-muted-foreground">Versión {wip.version}</span>
              {wip.is_draft && <span className="inline-flex min-h-7 items-center rounded-full bg-mild/15 px-3 font-medium text-foreground">Borrador privado</span>}
            </div>

            {!editing && <><h1 className="mt-6 max-w-3xl font-serif text-4xl leading-tight text-foreground sm:text-5xl">{wip.title}</h1><div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground"><span>Por <strong className="font-medium text-foreground">{wip.author?.name ?? "Autor"}</strong></span><span className="inline-flex items-center gap-1.5"><CalendarDays className="h-4 w-4" />Actualizado el <time>{new Date(wip.updated_at).toLocaleDateString("es-MX")}</time></span></div></>}
          </header>

          {editing ? (
            <div className="space-y-6 p-6 sm:p-9">
              <div><label htmlFor="edit-wip-title" className="text-sm font-semibold">Título</label><input id="edit-wip-title" value={title} maxLength={200} onChange={(event) => setTitle(event.target.value)} className="mt-2 min-h-12 w-full rounded-2xl border border-input bg-background/60 px-4 py-3 font-serif text-2xl outline-none focus:border-wip focus:ring-2 focus:ring-wip/15" /></div>
              <div><label htmlFor="edit-wip-content" className="text-sm font-semibold">Texto en progreso</label><Textarea id="edit-wip-content" value={content} onChange={(event) => setContent(event.target.value)} className="mt-2 min-h-[420px] rounded-2xl bg-background/60 p-5 font-serif text-lg leading-8 focus-visible:border-wip focus-visible:ring-wip/15" /></div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div><label htmlFor="edit-wip-category" className="text-sm font-semibold">Categoría</label><select id="edit-wip-category" value={category} onChange={(event) => setCategory(event.target.value as LiteraryCategory)} className="mt-2 min-h-11 w-full rounded-xl border border-input bg-background/60 px-3 text-base outline-none focus:border-wip">
                  {(Object.entries(CATEGORY_LABELS) as [LiteraryCategory, string][]).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select></div>
                <div><label htmlFor="edit-wip-status" className="text-sm font-semibold">Estado</label><select id="edit-wip-status" value={status} onChange={(event) => setStatus(event.target.value as WIPStatus)} className="mt-2 min-h-11 w-full rounded-xl border border-input bg-background/60 px-3 text-base outline-none focus:border-wip">
                  {(Object.entries(WIP_STATUS_LABELS) as [WIPStatus, string][]).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select></div>
              </div>
              <div><label htmlFor="edit-wip-block" className="text-sm font-semibold">Bloqueo actual <span className="font-normal text-muted-foreground">(opcional)</span></label><Textarea id="edit-wip-block" value={currentBlock} maxLength={1000} onChange={(event) => setCurrentBlock(event.target.value)} className="mt-2 min-h-28 rounded-xl bg-background/60 text-base" /></div>
              <div className="flex flex-col-reverse gap-2 border-t border-border/70 pt-5 sm:flex-row sm:justify-end">
                <Button className="min-h-11" variant="outline" onClick={() => setEditing(false)} disabled={busy}>Cancelar</Button>
                <Button className="min-h-11" onClick={() => updateWip({ title, content, category, status, currentBlock: currentBlock || null })} disabled={busy || !title.trim() || !content.trim()}>
                  {busy && <Loader2 className="animate-spin" />} Guardar nueva versión
                </Button>
              </div>
            </div>
          ) : (
            <div className="p-6 sm:p-9">
              {wip.current_block && (
                <div className="flex gap-3 rounded-2xl border border-destructive/20 bg-destructive/5 p-4">
                  <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
                  <div><p className="text-xs font-bold uppercase tracking-wide text-destructive">Bloqueo actual</p><p className="mt-1 text-sm leading-6">{wip.current_block}</p></div>
                </div>
              )}
              <div className={cn("max-w-prose whitespace-pre-wrap font-serif text-lg leading-9 text-foreground/90", wip.current_block ? "mt-8" : "")}>{wip.description}</div>
            </div>
          )}
        </article>

        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          {isOwner && (
            <div className="rounded-3xl border border-card/80 bg-card/75 p-5 shadow-soft">
              <p className="text-sm font-semibold text-foreground">Gestionar WIP</p><p className="mt-1 text-xs leading-5 text-muted-foreground">Los cambios de contenido generan una nueva versión.</p>
              <div className="mt-3 grid gap-2">
                <Button className="min-h-11 justify-start" variant="outline" onClick={() => setEditing(true)}><Pencil /> Editar contenido</Button>
                <Button
                  className="min-h-11 justify-start"
                  variant="outline"
                  disabled={busy || wip.status === "resolved"}
                  onClick={() => updateWip({ status: "resolved" })}
                ><CheckCircle2 /> Marcar como resuelto</Button>
                {wip.is_draft && <Button className="min-h-11 justify-start" onClick={() => updateWip({ isDraft: false })}><BookOpen /> Publicar borrador</Button>}
              </div>
              <div className="mt-4 border-t border-border/70 pt-4"><Button className="min-h-11 w-full justify-start" variant="ghost" onClick={() => setDeletePrompt(true)}><Trash2 className="text-destructive" /><span className="text-destructive">Eliminar WIP</span></Button></div>
            </div>
          )}

          {wip.post_mortem_id && <div className="rounded-3xl border border-postmortem/20 bg-postmortem-soft/45 p-5"><div className="flex items-center gap-2 text-sm font-semibold"><Link2 className="h-4 w-4 text-postmortem" />Reflexión vinculada</div><p className="mt-2 text-xs leading-5 text-muted-foreground">Este proceso ya tiene un Post-Mortem publicado.</p><Button asChild variant="outline" className="mt-3 min-h-11 w-full rounded-xl bg-background/50"><Link href={`/post-mortem/${wip.post_mortem_id}`}>Abrir Post-Mortem</Link></Button></div>}

          <div className="rounded-3xl border border-primary/15 bg-primary/5 p-5">
            <div className="flex items-center gap-2 text-sm font-semibold"><GitFork className="h-4 w-4 text-primary" />Crear una rama</div>
            <p className="mt-2 text-xs leading-5 text-muted-foreground">Tu versión quedará atribuida a la revisión {wip.version} de este WIP.</p>
            <Button className="mt-3 min-h-11 w-full rounded-xl" onClick={openFork}><GitFork /> Hacer fork de la versión {wip.version}</Button>
          </div>

          <div className="rounded-3xl border border-card/80 bg-card/75 p-5">
            <div className="flex items-center gap-2"><History className="h-4 w-4 text-wip" /><p className="text-sm font-semibold text-foreground">Historial</p></div>
            <div className="mt-3 space-y-2">
              {versions.map((version) => (
                <div key={version.version} className="flex min-h-11 items-center justify-between rounded-xl border border-border/60 bg-background/45 px-3 text-sm">
                  <span>Versión {version.version}</span>
                  <time className="text-xs text-muted-foreground">{new Date(version.created_at).toLocaleDateString("es-MX")}</time>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>

      <ForkTree postId={wip.id} postType="wip" className="mt-6" />

      <section className="mt-6 rounded-3xl border border-card/80 bg-card/75 p-5 shadow-soft sm:p-8" aria-labelledby="wip-comments-title">
        <div className="flex items-start gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-wip-soft text-wip"><MessageSquareText className="h-5 w-5" /></span><div><h2 id="wip-comments-title" className="font-serif text-2xl">Comentarios de colaboradores</h2><p className="mt-1 text-sm leading-6 text-muted-foreground">Cada comentario queda ligado a la versión exacta que fue revisada.</p></div></div>

        <div className="mt-6 space-y-3">
          {comments.length === 0 && <div className="rounded-2xl border border-dashed border-border p-8 text-center"><FileText className="mx-auto h-6 w-6 text-muted-foreground" /><p className="mt-3 font-medium">Aún no hay comentarios</p><p className="mt-1 text-sm text-muted-foreground">La primera revisión aparecerá aquí con su versión correspondiente.</p></div>}
          {comments.map((item) => (
            <article key={item.id} className="rounded-2xl border border-border/60 bg-background/50 p-4 sm:p-5">
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <strong className="text-foreground">{item.author?.name ?? "Colaborador"}</strong><span>·</span><span>Versión {item.wip_version}</span><span>·</span><time>{new Date(item.created_at).toLocaleDateString("es-MX")}</time>
              </div>
              <p className="mt-3 max-w-prose whitespace-pre-wrap text-base leading-7">{item.content}</p>
            </article>
          ))}
        </div>

        {!authLoading && user && !isOwner && (
          <div className="mt-6 rounded-2xl border border-wip/20 bg-wip-soft/25 p-4 sm:p-5">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <label htmlFor="comment-version" className="text-sm font-semibold">Comentar sobre</label>
              <select id="comment-version" value={commentVersion} onChange={(event) => setCommentVersion(Number(event.target.value))} className="min-h-11 rounded-xl border border-input bg-background px-3 text-base">
                {versions.map((version) => <option key={version.version} value={version.version}>Versión {version.version}</option>)}
              </select>
            </div>
            <label className="sr-only" htmlFor="wip-comment">Comentario</label><Textarea id="wip-comment" value={comment} maxLength={1000} onChange={(event) => setComment(event.target.value)} placeholder="Explica qué observaste y propone un siguiente paso concreto…" className="min-h-32 bg-background text-base" />
            <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><span className="text-xs tabular-nums text-muted-foreground">{comment.length}/1000 caracteres</span><Button className="min-h-11 rounded-full px-5" onClick={submitComment} disabled={busy || !comment.trim()}>{busy ? <Loader2 className="animate-spin" /> : <Send />} Publicar comentario</Button></div>
          </div>
        )}
      </section>

      <AlertDialog open={postMortemPrompt} onOpenChange={setPostMortemPrompt}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>¿Quieres documentar lo aprendido?</AlertDialogTitle><AlertDialogDescription>Tu WIP quedó resuelto. Puedes convertir el proceso en un Post-Mortem vinculado a este texto.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel className="min-h-11">Ahora no</AlertDialogCancel><AlertDialogAction className="min-h-11" asChild><Link href={`/post-mortem/new?wip=${id}`}>Crear Post-Mortem</Link></AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={deletePrompt} onOpenChange={setDeletePrompt}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Eliminar WIP</AlertDialogTitle><AlertDialogDescription>El texto dejará de estar visible. Esta acción no elimina la trazabilidad existente.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel className="min-h-11">Cancelar</AlertDialogCancel><AlertDialogAction className="min-h-11 bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={deleteWip}>Eliminar</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
