import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { FeedPost, ForkOrigin, LiteraryCategory, SparkPost, WipPost, PostMortemPost, WipStatus } from "@/types/nectary";

interface AuthorRow { id: string; name: string; avatar_url: string | null; level: number }
interface SparkRow { id: string; content: string; categories: LiteraryCategory[]; fork_count: number; created_at: string; author: AuthorRow | null }
interface WipRow { id: string; title: string; description: string; categories: LiteraryCategory[]; status: WipStatus; current_block: string | null; fork_count: number; version: number; created_at: string; author: AuthorRow | null }
interface PostMortemRow { id: string; title: string; context: string; lessons_learned: string; categories: LiteraryCategory[]; created_at: string; author: AuthorRow | null }
interface SourceRecord { id: string; title: string; author_id: string }

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");
  const postType = searchParams.get("type");
  
  const cookieStore = await cookies();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.json({ items: [], error: "Supabase config missing" }, { status: 500 });
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) =>
          cookieStore.set(name, value, options)
        );
      },
    },
  });

  try {
    let sparksData: SparkRow[] = [];
    let wipsData: WipRow[] = [];
    let pmData: PostMortemRow[] = [];

    // Base query promises
    const promises = [];

    // 1. Fetch Sparks
    if (!postType || postType === "spark" || postType === "all") {
      let q = supabase
        .from("sparks")
        .select(`
          *,
          author:profiles(id, name, avatar_url, level)
        `)
        .is("deleted_at", null)
        .order("created_at", { ascending: false })
        .limit(20);
        
      if (category && category !== "all") {
        q = q.contains("categories", [category]);
      }
      
      promises.push(q.then(res => {
        if (res.error) throw res.error;
        sparksData = (res.data || []) as unknown as SparkRow[];
      }));
    }

    // 2. Fetch WIPs
    if (!postType || postType === "wip" || postType === "all") {
      let q = supabase
        .from("wips")
        .select(`
          *,
          author:profiles(id, name, avatar_url, level)
        `)
        .is("deleted_at", null)
        .eq("is_draft", false)
        .order("created_at", { ascending: false })
        .limit(20);

      if (category && category !== "all") {
        q = q.contains("categories", [category]);
      }
      
      promises.push(q.then(res => {
        if (res.error) throw res.error;
        wipsData = (res.data || []) as unknown as WipRow[];
      }));
    }

    // 3. Fetch Post-Mortems
    if (!postType || postType === "postmortem" || postType === "post-mortem" || postType === "all") {
      let q = supabase
        .from("post_mortems")
        .select(`
          *,
          author:profiles(id, name, avatar_url, level)
        `)
        .is("deleted_at", null)
        .order("created_at", { ascending: false })
        .limit(20);

      if (category && category !== "all") {
        q = q.contains("categories", [category]);
      }
      
      promises.push(q.then(res => {
        if (res.error) throw res.error;
        pmData = (res.data || []) as unknown as PostMortemRow[];
      }));
    }

    await Promise.all(promises);

    // Mappers
    const mapAuthor = (author: AuthorRow | null) => ({
      name: author?.name || "Unknown",
      handle: author?.name?.toLowerCase().replace(/\s+/g, "") || "user",
      initials: author?.name?.substring(0, 2).toUpperCase() || "U",
      tint: "primary", // can be dynamic based on author level or categories
      level: author?.level || 1,
    });

    const mappedSparks: SparkPost[] = sparksData.map((s) => ({
      id: s.id,
      type: "spark",
      category: s.categories[0] || "cuento",
      author: mapAuthor(s.author),
      body: s.content,
      createdAt: s.created_at,
      reactions: { likes: 0 }, // Reactions need to be fetched separately due to polymorphic relations
      forks: s.fork_count || 0,
      version: 1,
    }));

    const mappedWips: WipPost[] = wipsData.map((w) => ({
      id: w.id,
      type: "wip",
      category: w.categories[0] || "novela",
      author: mapAuthor(w.author),
      title: w.title,
      summary: w.description,
      status: w.status,
      progress: w.status === "resolved" ? 100 : w.status === "blocked" ? 40 : 10,
      currentBlock: w.current_block ?? undefined,
      wordCount: 0,
      createdAt: w.created_at,
      reactions: { likes: 0 },
      forks: w.fork_count || 0,
      version: w.version || 1,
    }));

    const mappedPms: PostMortemPost[] = pmData.map((p) => ({
      id: p.id,
      type: "postmortem",
      category: p.categories[0] || "ensayo",
      author: mapAuthor(p.author),
      title: p.title,
      body: p.context,
      lesson: p.lessons_learned,
      createdAt: p.created_at,
      reactions: { likes: 0 },
      forks: 0,
    }));

    // Combine and sort
    const allPosts: FeedPost[] = [...mappedSparks, ...mappedWips, ...mappedPms];
    allPosts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Simple pagination / limit
    const paginatedItems = allPosts.slice(0, 50);

    // Fetch reactions for the paginated items
    const postIds = paginatedItems.map(p => p.id);
    const { data: authData } = await supabase.auth.getUser();
    const currentUserId = authData?.user?.id;

    const likesMap: Record<string, { count: number, userLiked: boolean }> = {};
    const originMap: Record<string, ForkOrigin> = {};

    if (postIds.length > 0) {
      const [{ data: reactionsData }, { data: forkRows }] = await Promise.all([
        supabase.from("reactions").select("target_id, user_id").eq("emoji", "👏").in("target_id", postIds),
        supabase.from("forks").select("result_id,source_id,source_type,source_version,motivation").in("result_id", postIds),
      ]);

      if (reactionsData) {
        reactionsData.forEach((r) => {
          if (!likesMap[r.target_id]) {
            likesMap[r.target_id] = { count: 0, userLiked: false };
          }
          likesMap[r.target_id].count += 1;
          if (currentUserId && r.user_id === currentUserId) {
            likesMap[r.target_id].userLiked = true;
          }
        });
      }

      if (forkRows?.length) {
        const sparkIds = forkRows.filter((row) => row.source_type === "spark").map((row) => row.source_id);
        const wipIds = forkRows.filter((row) => row.source_type === "wip").map((row) => row.source_id);
        const sourcesSparks = sparkIds.length
          ? (await supabase.from("sparks").select("id,content,author_id").in("id", sparkIds)).data ?? []
          : [];
        const sourcesWips = wipIds.length
          ? (await supabase.from("wips").select("id,title,author_id").in("id", wipIds)).data ?? []
          : [];
        const sources: SourceRecord[] = [
          ...sourcesSparks.map((item) => ({ id: item.id, author_id: item.author_id, title: item.content.slice(0, 90) })),
          ...sourcesWips.map((item) => ({ id: item.id, author_id: item.author_id, title: item.title })),
        ];
        const authorIds = [...new Set(sources.map((item) => item.author_id))];
        const { data: sourceAuthors } = authorIds.length
          ? await supabase.from("profiles").select("id,name").in("id", authorIds)
          : { data: [] };
        const sourceById = new Map(sources.map((item) => [item.id, item]));
        const authorById = new Map((sourceAuthors ?? []).map((item) => [item.id, item.name]));

        for (const fork of forkRows) {
          const source = sourceById.get(fork.source_id);
          originMap[fork.result_id] = {
            sourceId: fork.source_id,
            sourceType: fork.source_type,
            sourceVersion: fork.source_version,
            authorName: source ? authorById.get(source.author_id) ?? "Autor desconocido" : "Autor desconocido",
            title: source?.title ?? "[Contenido eliminado]",
            motivation: fork.motivation,
          };
        }
      }
    }

    // Inject reactions into paginated items
    const finalItems = paginatedItems.map((post) => {
      const postReactionData = likesMap[post.id] || { count: 0, userLiked: false };
      return {
        ...post,
        reactions: {
          likes: postReactionData.count,
          userHasLiked: postReactionData.userLiked,
        },
        forkOrigin: originMap[post.id],
      };
    });

    return NextResponse.json(
      { items: finalItems, nextCursor: null, hasMore: false },
      { headers: { "Cache-Control": "no-store, max-age=0" } },
    );

  } catch (error) {
    console.error("Feed error:", error);
    return NextResponse.json({ error: "Failed to fetch feed" }, { status: 500 });
  }
}
