import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Feather, BookOpen, HeartCrack } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { FeedLayout } from "@/components/feed/FeedLayout";
import { Button } from "@/components/ui/button";
import type { FeedPost, Author, LiteraryCategory, WipStatus } from "@/types/nectary";

interface ProfilePostRow {
  id: string;
  categories?: LiteraryCategory[];
  created_at: string;
  fork_count?: number;
  content?: string;
  title?: string;
  description?: string;
  status?: WipStatus;
  version?: number;
  context?: string;
  lessons_learned?: string;
}

// Tipos permitidos
type PostTypeRoute = "sparks" | "wips" | "post-mortems";

const ROUTE_CONFIG: Record<PostTypeRoute, { title: string; icon: React.ReactNode; table: "sparks" | "wips" | "post_mortems"; type: "spark" | "wip" | "post-mortem" }> = {
  "sparks": { title: "Sparks", icon: <Feather className="h-5 w-5 text-[var(--spark,#f59e0b)]" />, table: "sparks", type: "spark" },
  "wips": { title: "WIPs", icon: <BookOpen className="h-5 w-5 text-[var(--wip,#3b82f6)]" />, table: "wips", type: "wip" },
  "post-mortems": { title: "Post-Mortems", icon: <HeartCrack className="h-5 w-5 text-[var(--postmortem,#8b5cf6)]" />, table: "post_mortems", type: "post-mortem" },
};

function getInitials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default async function ProfilePostsPage({
  params,
}: {
  params: Promise<{ username: string; postType: string }>;
}) {
  const { username, postType } = await params;

  // 1. Validar que la ruta sea correcta
  if (!["sparks", "wips", "post-mortems"].includes(postType)) {
    notFound();
  }

  const config = ROUTE_CONFIG[postType as PostTypeRoute];
  const supabase = await createClient();

  // 2. Extraer el perfil del usuario para conocer su ID y armar el objeto Author
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, name, handle, level")
    .eq("handle", username)
    .single();

  if (!profile) {
    notFound();
  }

  const author: Author = {
    name: profile.name,
    handle: profile.handle,
    initials: getInitials(profile.name),
    tint: "primary", // TODO: Añadir color al perfil en BD en el futuro
    level: profile.level || 1,
  };

  // 3. Extraer las publicaciones
  let query = supabase
    .from(config.table)
    .select("*")
    .eq("author_id", profile.id)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  // Si son WIPs, excluir los borradores
  if (config.table === "wips") {
    query = query.eq("is_draft", false);
  }

  const { data: postsRaw } = await query;

  // 4. Mapear a FeedPost
  const posts: FeedPost[] = ((postsRaw || []) as unknown as ProfilePostRow[]).map((p) => {
    const base = {
      id: p.id,
      author,
      category: p.categories?.[0] || "cuento",
      createdAt: new Date(p.created_at).toLocaleDateString("es-MX", { day: "numeric", month: "short" }),
      reactions: { likes: 0 },
      forks: p.fork_count || 0,
    };

    if (config.type === "spark") {
      return { ...base, type: "spark", body: p.content } as FeedPost;
    } else if (config.type === "wip") {
      return { 
        ...base, 
        type: "wip", 
        title: p.title || "Sin título",
        summary: p.description || "",
        status: p.status || "in-progress",
        progress: p.status === "resolved" ? 100 : p.status === "blocked" ? 40 : 10,
        wordCount: p.description?.trim().split(/\s+/).filter(Boolean).length || 0,
        version: p.version || 1,
      } as FeedPost;
    } else {
      return { 
        ...base, 
        type: "postmortem", 
        title: p.title || "Post-Mortem",
        body: p.context || "",
        lesson: p.lessons_learned || "Sin lección"
      } as FeedPost;
    }
  });

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      {/* Header Back Button */}
      <div className="mb-8 flex items-center justify-between">
        <Button variant="ghost" asChild className="rounded-full pl-3 pr-4">
          <Link href={`/profile/${username}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver al perfil
          </Link>
        </Button>
      </div>

      {/* Page Title */}
      <div className="mb-10 flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-background/50 ring-1 ring-white/10 shadow-soft">
          {config.icon}
        </div>
        <div>
          <h1 className="font-serif text-3xl font-black text-foreground">{config.title}</h1>
          <p className="text-sm text-muted-foreground">Escritos por @{profile.handle}</p>
        </div>
      </div>

      {/* Feed List */}
      <FeedLayout posts={posts} />
    </div>
  );
}
