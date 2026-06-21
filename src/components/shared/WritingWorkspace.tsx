"use client";

import { PostMortemEditor } from "@/components/post-mortem/PostMortemEditor";
import { WipEditor } from "@/components/wip/WipEditor";

interface WritingWorkspaceProps {
  mode: "wip" | "postmortem";
  onCreated?: () => void;
}

export function WritingWorkspace({ mode, onCreated }: WritingWorkspaceProps) {
  return mode === "wip"
    ? <WipEditor onCreated={onCreated} />
    : <PostMortemEditor onCreated={onCreated} />;
}
