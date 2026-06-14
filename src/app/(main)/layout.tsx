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
import { useState } from "react";
import { Navbar } from "@/components/layout/navbar";
import { CreateModal } from "@/components/shared/CreateModal";
import type { PostType } from "@/types/nectary";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [createOpen, setCreateOpen] = useState(false);
  const [createType, setCreateType] = useState<PostType>("spark");

  const openWriter = (type: PostType = "spark") => {
    setCreateType(type);
    setCreateOpen(true);
  };

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
    </div>
  );
}

