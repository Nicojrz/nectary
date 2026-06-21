import { unstable_cache } from "next/cache";
import { createClient } from "@supabase/supabase-js";
import type { LiteraryCategory } from "@/types";

export interface PublicPostMortem {
  id: string;
  author_id: string;
  title: string;
  context: string;
  failed_attempts: string;
  solution: string;
  lessons_learned: string;
  categories: LiteraryCategory[];
  wip_origin_id: string | null;
  unblocked_count: number;
  version: number;
  created_at: string;
  updated_at: string;
  author: { id: string; name: string; avatar_url: string | null; level: number } | null;
  wip: { id: string; title: string; status: string } | null;
}

export interface PublicPostMortemVersion {
  version: number;
  title: string;
  context: string;
  failed_attempts: string;
  solution: string;
  lessons_learned: string;
  created_at: string;
}

export interface PublicPostMortemData {
  item: PublicPostMortem;
  versions: PublicPostMortemVersion[];
}

export async function getPublicPostMortemIds(): Promise<string[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return [];
  const supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data } = await supabase
    .from("post_mortems")
    .select("id")
    .is("deleted_at", null)
    .limit(100);
  return (data ?? []).map((item) => item.id);
}

export const getPublicPostMortem = unstable_cache(
  async (id: string): Promise<PublicPostMortemData | null> => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) return null;

    const supabase = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: item, error } = await supabase
      .from("post_mortems")
      .select("id,author_id,title,context,failed_attempts,solution,lessons_learned,categories,wip_origin_id,unblocked_count,version,created_at,updated_at")
      .eq("id", id)
      .is("deleted_at", null)
      .maybeSingle();
    if (error || !item) return null;

    const [{ data: author }, { data: wip }, { data: versions }] = await Promise.all([
      supabase.from("profiles").select("id,name,avatar_url,level").eq("id", item.author_id).maybeSingle(),
      item.wip_origin_id
        ? supabase.from("wips").select("id,title,status").eq("id", item.wip_origin_id).maybeSingle()
        : Promise.resolve({ data: null }),
      supabase
        .from("post_mortem_versions")
        .select("version,title,context,failed_attempts,solution,lessons_learned,created_at")
        .eq("post_mortem_id", id)
        .order("version", { ascending: false }),
    ]);

    return {
      item: { ...item, author, wip } as PublicPostMortem,
      versions: (versions ?? []) as PublicPostMortemVersion[],
    };
  },
  ["public-post-mortem"],
  { revalidate: 300 },
);
