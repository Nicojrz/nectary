import Link from "next/link";
import { Ghost, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ProfileNotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
      <div className="glass-panel flex max-w-md flex-col items-center rounded-[2rem] p-8 sm:p-12 shadow-lift">
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Ghost className="h-10 w-10 animate-pulse" />
        </div>
        
        <h1 className="font-serif text-3xl font-black tracking-tight text-foreground sm:text-4xl">
          Escritor fantasma
        </h1>
        
        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
          No pudimos encontrar el perfil que buscas. Es posible que el escritor haya cambiado su seudónimo o que el enlace sea incorrecto.
        </p>

        <Button asChild className="mt-8 rounded-full px-8 shadow-soft" size="lg">
          <Link href="/feed" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Volver al feed
          </Link>
        </Button>
      </div>
    </div>
  );
}
