"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import type { PostType, LiteraryCategory } from "@/types/nectary";
import { X, Feather, BookOpen, HeartCrack, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WritingWorkspace } from "./WritingWorkspace";
import { useAuth } from "@/hooks";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

interface CreateModalProps {
  open: boolean;
  onClose: () => void;
  initialType?: PostType;
}

const CATEGORIES: { id: LiteraryCategory; label: string; colorClass: string }[] = [
  { id: "cuento", label: "Cuento", colorClass: "bg-cuento" },
  { id: "poesia", label: "Poesía", colorClass: "bg-poesia" },
  { id: "novela", label: "Novela", colorClass: "bg-novela" },
  { id: "ensayo", label: "Ensayo", colorClass: "bg-ensayo" },
];

export function CreateModal({ open, onClose, initialType = "spark" }: CreateModalProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [postType, setPostType] = useState<PostType>(initialType);
  const [spark, setSpark] = useState("");
  const [categories, setCategories] = useState<LiteraryCategory[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!open) {
      // Reset state when closed
      setSpark("");
      setCategories([]);
      return;
    }
    setPostType(initialType);
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [initialType, open, onClose]);

  const toggleCategory = (cat: LiteraryCategory) => {
    setCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  const handlePublishSpark = async () => {
    if (!spark.trim() || categories.length === 0 || !user) return;

    setIsSaving(true);
    const supabase = createClient();

    try {
      const { error } = await supabase.from('sparks').insert({
        author_id: user.id,
        content: spark.trim(),
        categories: categories,
      });

      if (error) throw error;

      toast.success("¡Spark publicado con éxito!");
      setSpark("");
      setCategories([]);
      onClose();
      // Refrescar el feed disparando un evento o recargando
      window.dispatchEvent(new CustomEvent('feed-updated'));
      router.refresh();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Error al publicar el Spark");
    } finally {
      setIsSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-background/90 p-3 backdrop-blur-xl sm:p-6">
      <div className="mx-auto max-w-6xl">
        <header className="mb-5 flex items-center justify-between">
          <div><p className="font-serif text-2xl text-foreground">Nectary</p><p className="text-xs text-muted-foreground">Tu espacio para pensar y escribir</p></div>
          <Button variant="outline" size="icon" onClick={onClose} aria-label="Cerrar estudio" className="h-11 w-11 rounded-full bg-card/60"><X /></Button>
        </header>

        <nav className="mb-5 grid grid-cols-3 gap-2 rounded-2xl border border-border/60 bg-card/50 p-1.5" aria-label="Tipo de publicación">
          {([["spark", "Spark", Feather], ["wip", "WIP", BookOpen], ["postmortem", "Post-Mortem", HeartCrack]] as const).map(([type, label, Icon]) => (
            <Button key={type} variant="ghost" onClick={() => setPostType(type)} className={cn("min-h-11 rounded-xl", postType === type && "bg-background text-primary shadow-soft")}><Icon className="h-4 w-4" />{label}</Button>
          ))}
        </nav>

        {postType === "spark" ? (
          <section className="glass-panel mx-auto max-w-2xl rounded-[2rem] p-6 sm:p-8">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-spark">Una idea breve</p>
            <h2 className="mt-2 font-serif text-3xl text-foreground">Captura el destello antes de que se vaya.</h2>
            
            <textarea 
              autoFocus 
              value={spark} 
              onChange={(event) => setSpark(event.target.value)} 
              maxLength={280} 
              placeholder="Una imagen, una primera línea, una pregunta…" 
              className="mt-6 min-h-[160px] w-full resize-none rounded-2xl border border-border/70 bg-card/55 p-5 font-serif text-xl leading-relaxed text-foreground outline-none placeholder:text-muted-foreground/55 focus:border-primary/40 focus:ring-2 focus:ring-ring/15" 
            />
            
            {/* Categorías (Obligatorias) */}
            <div className="mt-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Etiquetas (mínimo 1)</p>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((cat) => {
                  const isSelected = categories.includes(cat.id);
                  return (
                    <button
                      key={cat.id}
                      onClick={() => toggleCategory(cat.id)}
                      className={cn(
                        "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                        isSelected 
                          ? "border-primary/50 bg-primary/10 text-foreground" 
                          : "border-border/50 bg-card/50 text-muted-foreground hover:bg-card/80 hover:text-foreground"
                      )}
                    >
                      <span className={cn("h-1.5 w-1.5 rounded-full", cat.colorClass)} />
                      {cat.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between">
              <span className="text-xs tabular-nums text-muted-foreground">{spark.length}/280</span>
              <Button 
                disabled={!spark.trim() || categories.length === 0 || isSaving} 
                className="rounded-full px-6" 
                onClick={handlePublishSpark}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Publicando...
                  </>
                ) : (
                  "Publicar Spark"
                )}
              </Button>
            </div>
          </section>
        ) : <WritingWorkspace mode={postType} onCreated={onClose} />}
      </div>
    </div>
  );
}
