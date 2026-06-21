"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FeedFilters } from "@/components/feed/FeedFilters";
import { FeedLayout } from "@/components/feed/FeedLayout";
import { ProfilePanel } from "@/components/profile/ProfilePanel";
import { ForkPanel } from "@/components/fork/ForkPanel";
import type {
  CreativeState,
  FeedPost,
  LiteraryCategory,
  PostType,
} from "@/types/nectary";
import { Flame, Loader2, PenLine } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function FeedPage() {
  const [creativeState, setCreativeState] = useState<CreativeState>("flow");
  const [category, setCategory] = useState<LiteraryCategory | "all">("all");
  const [postType, setPostType] = useState<PostType | "all">("all");
  
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchPosts = async () => {
      setIsLoading(true);
      try {
        const params = new URLSearchParams();
        if (category !== "all") params.set("category", category);
        if (postType !== "all") params.set("type", postType);
        
        const res = await fetch(`/api/feed?${params.toString()}`);
        if (!res.ok) throw new Error("Error fetching feed");
        const data = await res.json();
        
        if (isMounted) {
          setPosts(data.items || []);
        }
      } catch (error) {
        console.error("Failed to fetch feed:", error);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchPosts();
    return () => { isMounted = false; };
  }, [category, postType]);

  const handleFork = (post: FeedPost) => {
    // TODO: implement fork
    console.log("Forking post", post.id);
  };

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-[230px_minmax(0,680px)] xl:grid-cols-[230px_minmax(0,680px)_250px]">
      {/* left rail — filters */}
      <aside className="hidden lg:block">
        <div className="sticky space-y-5" style={{ top: "6.5rem" }}>
          <ProfilePanel creativeState={creativeState} onCreativeStateChange={setCreativeState} />
          <FeedFilters
            category={category}
            postType={postType}
            onCategory={setCategory}
            onPostType={setPostType}
          />
        </div>
      </aside>

      {/* center — feed */}
      <section>
        <div className="mb-8 flex items-end justify-between">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-primary">Nectary journal</p>
            <h1 className="font-serif text-4xl tracking-tight text-foreground">
              Tu mesa de lectura
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Ideas, borradores y hallazgos de escritores que sigues.
            </p>
          </div>
          <Button variant="outline" size="sm" className="hidden rounded-full border-card/80 bg-card/55 text-muted-foreground backdrop-blur-xl sm:inline-flex">
            <Flame className="h-3.5 w-3.5 text-spark" />
            En tendencia
          </Button>
        </div>

        {/* mobile filters */}
        <FeedFilters
          className="mb-5 lg:hidden"
          category={category}
          postType={postType}
          onCategory={setCategory}
          onPostType={setPostType}
        />

        <div className="mb-6 grid grid-cols-2 gap-3">
          <Button 
            variant="outline" 
            onClick={() => window.dispatchEvent(new CustomEvent('open-compose', { detail: 'wip' }))} 
            className="h-auto justify-start rounded-2xl border-card/80 bg-card/55 px-4 py-3 text-left backdrop-blur-xl hover:border-wip/30"
          >
            <PenLine className="h-4 w-4 text-wip" />
            <span><span className="block text-sm font-semibold text-foreground">Escribir un WIP</span><span className="block text-[11px] font-normal text-muted-foreground">Manuscrito y progreso</span></span>
          </Button>
          <Button 
            variant="outline" 
            onClick={() => window.dispatchEvent(new CustomEvent('open-compose', { detail: 'postmortem' }))} 
            className="h-auto justify-start rounded-2xl border-card/80 bg-card/55 px-4 py-3 text-left backdrop-blur-xl hover:border-postmortem/30"
          >
            <PenLine className="h-4 w-4 text-postmortem" />
            <span><span className="block text-sm font-semibold text-foreground">Crear Post-Mortem</span><span className="block text-[11px] font-normal text-muted-foreground">Reflexiona sin prisa</span></span>
          </Button>
        </div>

        {isLoading ? (
          <div className="flex h-40 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary/50" />
          </div>
        ) : posts.length === 0 ? (
          <div className="flex h-40 flex-col items-center justify-center rounded-2xl border border-dashed border-card/80 text-center">
            <p className="font-serif text-lg text-foreground">No hay publicaciones</p>
            <p className="text-sm text-muted-foreground">Sé el primero en compartir algo.</p>
          </div>
        ) : (
          <FeedLayout posts={posts} onFork={handleFork} />
        )}
      </section>

      {/* right rail — gamification */}
      <aside className="hidden xl:block">
        <div className="sticky space-y-5" style={{ top: "6.5rem" }}>
          <ForkPanel />
        </div>
      </aside>
    </div>
  );
}
