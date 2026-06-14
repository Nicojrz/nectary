"use client";
import { useState } from "react";
import { BookOpen, Check, FileText, Lightbulb, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface WritingWorkspaceProps {
  mode: "wip" | "postmortem";
}

export function WritingWorkspace({ mode }: WritingWorkspaceProps) {
  const [title, setTitle] = useState("");
  const [draft, setDraft] = useState("");
  const isWip = mode === "wip";

  return (
    <section className="glass-panel overflow-hidden rounded-[2rem]" aria-label={isWip ? "Nuevo WIP" : "Nuevo Post-Mortem"}>
      <div className="flex flex-col gap-3 border-b border-border/60 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-7">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">Estudio privado</p>
          <h2 className="mt-1 font-serif text-2xl text-foreground">{isWip ? "Continúa tu manuscrito" : "Entiende lo que pasó"}</h2>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground"><Check className="h-3.5 w-3.5" /> Guardado localmente</span>
          <Button variant="outline" size="sm" className="rounded-full bg-card/50"><Save className="h-3.5 w-3.5" />Guardar borrador</Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-[minmax(0,1fr)_220px]">
        <div className="p-5 sm:p-7">
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder={isWip ? "Título de tu proyecto" : "¿Qué proyecto estás cerrando?"}
            className="w-full border-0 bg-transparent font-serif text-3xl text-foreground outline-none placeholder:text-muted-foreground/55 focus:ring-0 sm:text-4xl"
          />
          <Textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder={isWip ? "Empieza por la escena, la pregunta o el fragmento que hoy necesita atención…" : "Cuenta qué intentaste, dónde se rompió y qué entiendes ahora…"}
            className="mt-5 min-h-[360px] resize-none rounded-none border-0 bg-transparent p-0 font-serif text-lg leading-[1.8] shadow-none placeholder:text-muted-foreground/60 focus-visible:ring-0"
          />
          <div className="mt-4 flex items-center justify-between border-t border-border/60 pt-4 text-xs text-muted-foreground">
            <span>{draft.trim() ? draft.trim().split(/\s+/).length : 0} palabras</span>
            <Button className="rounded-full px-5">Publicar {isWip ? "actualización" : "reflexión"}</Button>
          </div>
        </div>

        <aside className="border-t border-border/60 bg-secondary/25 p-5 lg:border-l lg:border-t-0">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            {isWip ? <BookOpen className="h-4 w-4 text-wip" /> : <Lightbulb className="h-4 w-4 text-postmortem" />}
            {isWip ? "Ficha del proyecto" : "Guía de reflexión"}
          </div>
          <div className="mt-5 space-y-5">
            {(isWip
              ? ["Sinopsis breve", "Meta de palabras", "Estado del manuscrito", "Bloque actual"]
              : ["Qué querías lograr", "Qué no funcionó", "El punto de quiebre", "La lección que conservas"]
            ).map((label, index) => (
              <label key={label} className="block">
                <span className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-muted-foreground"><FileText className={cn("h-3 w-3", index === 3 && "text-primary")} />{label}</span>
                <input className="h-9 w-full rounded-xl border border-border/70 bg-card/55 px-3 text-sm text-foreground outline-none focus:border-primary/40 focus:ring-2 focus:ring-ring/15" />
              </label>
            ))}
          </div>
        </aside>
      </div>
    </section>
  );
}


