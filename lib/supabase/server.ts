import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

function getSupabaseUrl(): string {
  const value =
    process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (!value) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL"
    );
  }

  return value;
}

function getSupabaseKey(): string {
  const value =
    process.env
      .NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env
      .NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!value) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY"
    );
  }

  return value;
}

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    getSupabaseUrl(),
    getSupabaseKey(),
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },

        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(
              ({
                name,
                value,
                options,
              }) => {
                cookieStore.set(
                  name,
                  value,
                  options
                );
              }
            );
          } catch {
            // Cookies cannot be written from
            // a Server Component.
            // Proxy middleware refreshes sessions.
          }
        },
      },
    }
  );
}

export default createClient;