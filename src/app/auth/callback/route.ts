import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  // if "next" is in param, use it as the redirect URL
  const next = searchParams.get("next") ?? "/feed";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // Successful authentication via PKCE
      // We redirect to the requested next route, which handles things like update-password
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // If there's an error or no code, return the user to login with an error message
  return NextResponse.redirect(`${origin}/login?error=Invalid+Link`);
}
