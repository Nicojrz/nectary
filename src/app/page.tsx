import Link from "next/link";
import Image from "next/image";
import { ArrowRight, BookOpen, Feather, GitBranch, Quote, Sprout } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="min-h-screen overflow-hidden bg-background">
      <header className="absolute inset-x-0 top-0 z-30">
        <nav className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 sm:px-8" aria-label="Navegación principal">
          <Link href="/" className="flex items-center gap-2.5">
            <Image 
              src="/logo.png" 
              alt="Nectary Logo" 
              width={32} 
              height={32} 
              style={{ width: "auto", height: "auto" }}
              className="h-8 w-8 object-cover"
            />
            <span className="font-serif text-2xl text-foreground">Nectary</span>
          </Link>
          <div className="flex items-center gap-2 sm:gap-3">
            <Button variant="ghost" asChild className="hidden rounded-full sm:inline-flex"><Link href="/feed">Explorar comunidad</Link></Button>
            <Button asChild className="rounded-full px-5 shadow-soft"><Link href="/feed">Empieza a escribir <ArrowRight /></Link></Button>
          </div>
        </nav>
      </header>

      <main>
        <section className="relative mx-auto grid min-h-[760px] max-w-7xl items-center gap-12 px-5 pb-20 pt-32 sm:px-8 lg:grid-cols-[1.05fr_.95fr] lg:pt-28">
          <div className="relative z-10 max-w-2xl">
            <p className="mb-6 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-primary"><Sprout /> Un refugio para volver a escribir</p>
            <h1 className="font-serif text-5xl leading-[0.98] tracking-[-0.035em] text-foreground sm:text-6xl lg:text-7xl xl:text-[5.5rem]">
              Tu bloqueo no es el final <span className="italic text-primary">de la historia.</span>
            </h1>
            <p className="mt-7 max-w-xl text-lg leading-8 text-muted-foreground sm:text-xl">
              Nectary convierte la presión de crear en pequeños pasos: guarda una chispa, comparte el proceso y deja que otros escritores te ayuden a encontrar la siguiente frase.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Button size="lg" asChild className="h-12 rounded-full px-7 text-base shadow-lift"><Link href="/feed">Romper el bloqueo <ArrowRight /></Link></Button>
              <Button size="lg" variant="outline" asChild className="h-12 rounded-full border-border/80 bg-card/50 px-7 text-base backdrop-blur-xl"><a href="#metodo">Conoce el método</a></Button>
            </div>
            <div className="mt-10 flex items-center gap-4 border-t border-border/70 pt-5">
              <div className="flex -space-x-2" aria-hidden>
                {['MS', 'IR', 'LP'].map((initials) => <span key={initials} className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-background bg-accent text-[10px] font-semibold text-accent-foreground">{initials}</span>)}
              </div>
              <p className="text-sm text-muted-foreground"><strong className="font-semibold text-foreground">Escribir acompañado cambia todo.</strong><br />Una comunidad que entiende los días difíciles.</p>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-xl lg:ml-auto">
            <div className="absolute -left-8 -top-8 h-32 w-32 rounded-full bg-accent/70 blur-2xl" />
            <figure className="relative overflow-hidden rounded-[2.5rem] border border-card/80 shadow-lift">
              <Image src="/nectary-writers-desk.jpg" alt="Cuaderno abierto, manuscritos y pluma sobre un escritorio cálido" width={1408} height={1024} className="aspect-[4/5] w-full object-cover" priority />
              <figcaption className="glass-strong absolute inset-x-5 bottom-5 rounded-3xl p-5 shadow-glass sm:inset-x-7 sm:bottom-7">
                <Quote className="mb-2 text-primary" />
                <p className="font-serif text-xl leading-snug text-foreground sm:text-2xl">“Hoy no terminé el capítulo. Pero encontré la pregunta que lo abre.”</p>
                <p className="mt-3 text-xs font-medium text-muted-foreground">Mara · WIP, día 43</p>
              </figcaption>
            </figure>
          </div>
        </section>

        <section id="metodo" className="border-y border-border/70 bg-card/35 py-24 backdrop-blur-sm">
          <div className="mx-auto max-w-7xl px-5 sm:px-8">
            <div className="grid gap-10 lg:grid-cols-[.72fr_1.28fr]">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Cuando no salen las palabras</p>
                <h2 className="mt-4 max-w-md font-serif text-4xl leading-tight text-foreground sm:text-5xl">No fuerces una obra. Empieza con algo vivo.</h2>
                <p className="mt-5 max-w-md leading-7 text-muted-foreground">En Nectary no vienes a demostrar productividad. Vienes a mantener tu escritura en movimiento, incluso cuando solo tienes una línea.</p>
              </div>
              <div className="grid gap-px overflow-hidden rounded-[2rem] border border-border/70 bg-border/70 md:grid-cols-3">
                <MethodStep number="01" icon={Feather} title="Suelta una Spark" text="Captura esa frase, escena o pregunta antes de que desaparezca." />
                <MethodStep number="02" icon={BookOpen} title="Haz visible el proceso" text="Documenta tu WIP sin fingir que el camino es limpio o lineal." />
                <MethodStep number="03" icon={GitBranch} title="Deja que se ramifique" text="Recibe una mirada nueva o bifurca una idea cuando te quedes sin salida." />
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-5 py-24 text-center sm:px-8 sm:py-32">
          <p className="font-serif text-3xl leading-snug text-foreground sm:text-5xl">La página en blanco pesa menos<br className="hidden sm:block" /> cuando no estás frente a ella a solas.</p>
          <p className="mx-auto mt-5 max-w-xl leading-7 text-muted-foreground">Comparte lo que apenas comienza, aprende de lo que no funcionó y vuelve mañana con una dirección posible.</p>
          <Button size="lg" asChild className="mt-8 h-12 rounded-full px-8 text-base"><Link href="/feed">Entrar a Nectary <ArrowRight /></Link></Button>
        </section>
      </main>

      <footer className="border-t border-border/70 px-5 py-8 sm:px-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-2 font-serif text-xl text-foreground">
            <Image src="/logo.png" alt="Nectary Logo" width={24} height={24} style={{ width: "auto", height: "auto" }} className="h-6 w-6 object-cover" />
            Nectary
          </div>
          <p className="text-xs text-muted-foreground">Un lugar para escribir sin tener todas las respuestas.</p>
        </div>
      </footer>
    </div>
  );
}

function MethodStep({ number, icon: Icon, title, text }: { number: string; icon: typeof Feather; title: string; text: string }) {
  return (
    <article className="bg-background/80 p-7 text-left sm:p-8">
      <div className="flex items-center justify-between"><Icon className="h-5 w-5 text-primary" /><span className="font-serif text-lg italic text-muted-foreground/60">{number}</span></div>
      <h3 className="mt-12 font-serif text-2xl text-foreground">{title}</h3>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">{text}</p>
    </article>
  );
}
