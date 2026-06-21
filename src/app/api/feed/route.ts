import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { FeedPost, SparkPost, WipPost, PostMortemPost } from "@/types/nectary";

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
    let sparksData: any[] = [];
    let wipsData: any[] = [];
    let pmData: any[] = [];

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
        sparksData = res.data || [];
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
        wipsData = res.data || [];
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
        pmData = res.data || [];
      }));
    }

    await Promise.all(promises);

    // Mappers
    const mapAuthor = (author: any) => ({
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
      currentBlock: w.current_block,
      wordCount: 0,
      createdAt: w.created_at,
      reactions: { likes: 0 },
      forks: w.fork_count || 0,
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

    return NextResponse.json(
      { items: paginatedItems, nextCursor: null, hasMore: false },
      { headers: { "Cache-Control": "no-store, max-age=0" } },
    );

  } catch (error) {
    console.error("Feed error:", error);
    return NextResponse.json({ error: "Failed to fetch feed" }, { status: 500 });
  }
}
