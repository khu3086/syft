import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// OAuth + email-confirmation landing. Supabase redirects here with a `code`; we
// exchange it for a session cookie, then send the user back into the app.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const oauthError = searchParams.get("error_description") || searchParams.get("error");
  const next = searchParams.get("next") ?? "/";

  // Behind a TLS-terminating proxy (Railway/Vercel) request.url is the INTERNAL
  // http host, so redirecting to that `origin` would bounce the browser off-site
  // and drop the just-set session cookie. Honour the forwarded host/proto so we
  // always return to the real public URL.
  const fwdHost = request.headers.get("x-forwarded-host");
  const fwdProto = request.headers.get("x-forwarded-proto") ?? "https";
  const base = fwdHost ? `${fwdProto}://${fwdHost}` : origin;

  if (oauthError) {
    return NextResponse.redirect(`${base}/?auth_error=${encodeURIComponent(oauthError)}`);
  }

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${base}${next}`);
    return NextResponse.redirect(`${base}/?auth_error=${encodeURIComponent(error.message)}`);
  }

  return NextResponse.redirect(`${base}/?auth_error=missing_code`);
}
