import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") ?? "/";

  try {
    const cookieStore = await cookies();

    const ssrClient = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options),
              );
            } catch {
              console.log("Error while writing cookie");
            }
          },
        },
      },
    );

    if (!code) {
      return NextResponse.redirect(`${url.origin}/`);
    }

    const { error } = await ssrClient.auth.exchangeCodeForSession(code);

    if (!error) {
      return NextResponse.redirect(`${url.origin}${next}`);
    }

    const errorUrl = new URL(`${url.origin}/`);
    errorUrl.searchParams.set("auth_error", error.message);
    return NextResponse.redirect(errorUrl.toString());
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
