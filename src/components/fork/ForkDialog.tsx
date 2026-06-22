"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { GitFork, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { CATEGORY_LABELS, WIP_STATUS_LABELS } from "@/lib/wip-domain";
import type { FeedPost, LiteraryCategory, WipStatus } from "@/types/nectary";

export type ForkableFeedPost = Extract<FeedPost, { type: "spark" | "wip" }>;

interface ForkDialogProps {
  source: ForkableFeedPost | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ForkDialog({ source, open, onOpenChange }: ForkDialogProps) {
  if (!source) return null;
  return <ForkDialogForm key={`${source.id}:${open}`} source={source} open={open} onOpenChange={onOpenChange} />;
}

function ForkDialogForm({ source, open, onOpenChange }: { source: ForkableFeedPost; open: boolean; onOpenChange: (open: boolean) => void }) {
  const router = useRouter();
  const [motivation, setMotivation] = useState("");
  const [title, setTitle] = useState(source.type === "wip" ? source.title : "");
  const [content, setContent] = useState(source.type === "spark" ? source.body : source.summary);
  const [category, setCategory] = useState<LiteraryCategory>(source.category);
  const [currentBlock, setCurrentBlock] = useState(source.type === "wip" ? source.currentBlock ?? "" : "");
  const [status, setStatus] = useState<WipStatus>("in-progress");
  const [saving, setSaving] = useState(false);

  const sourceVersion = source.type === "wip" ? source.version ?? 1 : 1;
  const canSubmit = Boolean(
    motivation.trim() && content.trim() && category && (source.type === "spark" || title.trim()),
  );

  async function submit() {
    if (!canSubmit || saving) return;
    setSaving(true);
    try {
      const result = source.type === "spark"
        ? { content, category }
        : { title, content, category, currentBlock: currentBlock || null, status };
      const response = await fetch("/api/forks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceId: source.id,
          sourceType: source.type,
          sourceVersion,
          motivation,
          result,
        }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "No fue posible crear el fork");

      toast.success("Fork creado y vinculado al texto original");
      onOpenChange(false);
      window.dispatchEvent(new CustomEvent("feed-updated"));
      const resultId = payload.item.resultId as string;
      router.push(source.type === "spark" ? `/spark/${resultId}` : `/wip/${resultId}`);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No fue posible crear el fork");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !saving && onOpenChange(next)}>
      <DialogContent className="max-h-[92vh] max-w-3xl overflow-y-auto rounded-3xl border-card/80 bg-background/95 p-0 backdrop-blur-xl">
        <DialogHeader className="border-b border-border/70 bg-card/65 p-6 pr-12 text-left sm:p-8">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-primary">
            <GitFork className="h-4 w-4" /> Nueva rama
          </div>
          <DialogTitle className="mt-2 font-serif text-3xl">Deriva esta idea con atribución</DialogTitle>
          <DialogDescription className="leading-6">
            El fork quedará vinculado permanentemente a la versión {sourceVersion} de {source.author.name}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 p-6 sm:p-8">
          <div>
            <label htmlFor="fork-motivation" className="text-sm font-semibold">Motivación <span className="text-destructive">*</span></label>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">Explica qué tomas del original y hacia dónde quieres llevarlo.</p>
            <Textarea id="fork-motivation" autoFocus value={motivation} maxLength={500} onChange={(event) => setMotivation(event.target.value)} placeholder="Esta imagen me hizo pensar en…" className="mt-2 min-h-24 bg-card/60 text-base" />
            <p className="mt-1 text-right text-xs tabular-nums text-muted-foreground">{motivation.length}/500</p>
          </div>

          {source.type === "wip" && (
            <div>
              <label htmlFor="fork-title" className="text-sm font-semibold">Título derivado <span className="text-destructive">*</span></label>
              <input id="fork-title" value={title} maxLength={200} onChange={(event) => setTitle(event.target.value)} className="mt-2 min-h-12 w-full rounded-2xl border border-input bg-card/60 px-4 font-serif text-xl outline-none focus:border-primary focus:ring-2 focus:ring-primary/15" />
            </div>
          )}

          <div>
            <label htmlFor="fork-content" className="text-sm font-semibold">Tu versión <span className="text-destructive">*</span></label>
            <Textarea id="fork-content" value={content} maxLength={source.type === "spark" ? 2000 : undefined} onChange={(event) => setContent(event.target.value)} className="mt-2 min-h-64 bg-card/60 p-4 font-serif text-lg leading-8" />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="fork-category" className="text-sm font-semibold">Categoría</label>
              <select id="fork-category" value={category} onChange={(event) => setCategory(event.target.value as LiteraryCategory)} className="mt-2 min-h-11 w-full rounded-xl border border-input bg-card/60 px-3 text-base">
                {(Object.entries(CATEGORY_LABELS) as [LiteraryCategory, string][]).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </div>
            {source.type === "wip" && (
              <div>
                <label htmlFor="fork-status" className="text-sm font-semibold">Estado inicial</label>
                <select id="fork-status" value={status} onChange={(event) => setStatus(event.target.value as WipStatus)} className="mt-2 min-h-11 w-full rounded-xl border border-input bg-card/60 px-3 text-base">
                  {(Object.entries(WIP_STATUS_LABELS) as [WipStatus, string][]).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
              </div>
            )}
          </div>

          {source.type === "wip" && (
            <div>
              <label htmlFor="fork-block" className="text-sm font-semibold">Bloqueo actual <span className="font-normal text-muted-foreground">(opcional)</span></label>
              <Textarea id="fork-block" value={currentBlock} maxLength={1000} onChange={(event) => setCurrentBlock(event.target.value)} className="mt-2 min-h-24 bg-card/60 text-base" />
            </div>
          )}
        </div>

        <DialogFooter className="border-t border-border/70 bg-card/65 p-5 sm:p-6">
          <Button variant="outline" className="min-h-11 rounded-full" disabled={saving} onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button className="min-h-11 rounded-full px-6" disabled={!canSubmit || saving} onClick={() => void submit()}>
            {saving ? <Loader2 className="animate-spin" /> : <GitFork />} Crear fork
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
