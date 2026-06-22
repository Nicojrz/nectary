import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function POST(request: Request) {
  try {
    let { target_id, target_type, emoji = "👏" } = await request.json();

    if (!target_id || !target_type) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // El frontend usa "postmortem" pero el ENUM de Supabase es "post-mortem"
    if (target_type === "postmortem") {
      target_type = "post-mortem";
    }

    const cookieStore = await cookies();
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json({ error: "Supabase config missing" }, { status: 500 });
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

    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || !authData?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = authData.user.id;

    // Check if reaction already exists
    const { data: existingReaction } = await supabase
      .from("reactions")
      .select("id")
      .eq("user_id", userId)
      .eq("target_id", target_id)
      .eq("emoji", emoji)
      .single();

    if (existingReaction) {
      // Unlike: Delete the reaction
      const { error: deleteError } = await supabase
        .from("reactions")
        .delete()
        .eq("id", existingReaction.id);

      if (deleteError) throw deleteError;

      return NextResponse.json({ action: "unliked" });
    } else {
      // Like: Insert the reaction
      const { error: insertError } = await supabase
        .from("reactions")
        .insert({
          user_id: userId,
          target_id: target_id,
          target_type: target_type,
          emoji: emoji,
        });

      if (insertError) throw insertError;

      return NextResponse.json({ action: "liked" });
    }
  } catch (error: any) {
    console.error("Reactions API Error:", error);
    return NextResponse.json({ error: error.message || "Failed to process reaction" }, { status: 500 });
  }
}
