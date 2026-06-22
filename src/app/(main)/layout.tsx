"use client";

/**
 * (main) Layout — Authenticated App Shell
 *
 * Wraps all main application pages with:
 * - Top navigation bar (with creative state selector — RF-FD-03)
 * - Sidebar (optional)
 * - Notification bell
 *
 * All child routes require authentication (RNF-GU-02).
 */
import { useState, useEffect } from "react";
import { Navbar } from "@/components/layout/navbar";
import { CreateModal } from "@/components/shared/CreateModal";
import type { PostType } from "@/types/nectary";
import type { FeedPost } from "@/types/nectary";
import { ForkDialog, type ForkableFeedPost } from "@/components/fork/ForkDialog";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [createOpen, setCreateOpen] = useState(false);
  const [createType, setCreateType] = useState<PostType>("spark");
  const [forkSource, setForkSource] = useState<ForkableFeedPost | null>(null);

  const openWriter = (type: PostType = "spark") => {
    setCreateType(type);
    setCreateOpen(true);
  };

  useEffect(() => {
    const handleOpen = (e: Event) => {
      const customEvent = e as CustomEvent<PostType>;
      openWriter(customEvent.detail || "spark");
    };
    window.addEventListener("open-compose", handleOpen);
    const handleFork = (event: Event) => {
      const post = (event as CustomEvent<FeedPost>).detail;
      if (post?.type === "spark" || post?.type === "wip") setForkSource(post);
    };
    window.addEventListener("open-fork", handleFork);
    return () => {
      window.removeEventListener("open-compose", handleOpen);
      window.removeEventListener("open-fork", handleFork);
    };
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar 
        onCreate={() => openWriter("spark")} 
        creativeState="flow" // TODO: handle global creative state if needed
        onCreativeStateChange={() => {}}
      />
      <main className="flex-1 mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:py-10">
        {children}
      </main>

      <CreateModal 
        open={createOpen} 
        initialType={createType} 
        onClose={() => setCreateOpen(false)} 
      />
      <ForkDialog source={forkSource} open={Boolean(forkSource)} onOpenChange={(next) => !next && setForkSource(null)} />
    </div>
  );
}
