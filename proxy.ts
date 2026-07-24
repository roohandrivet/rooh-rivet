import { createServerClient } from "@supabase/ssr";
import {
  NextResponse,
  type NextRequest,
} from "next/server";

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
      "Missing Supabase publishable or anon key"
    );
  }

  return value;
}

const supabaseUrl = getSupabaseUrl();
const supabaseKey = getSupabaseKey();

function copyAuthCookies(
  source: NextResponse,
  destination: NextResponse
): NextResponse {
  source.cookies
    .getAll()
    .forEach((cookie) => {
      destination.cookies.set(cookie);
    });

  return destination;
}

export async function proxy(
  request: NextRequest
) {
  let supabaseResponse =
    NextResponse.next({
      request,
    });

  const supabase = createServerClient(
    supabaseUrl,
    supabaseKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },

        setAll(
          cookiesToSet,
          headers
        ) {
          cookiesToSet.forEach(
            ({ name, value }) => {
              request.cookies.set(
                name,
                value
              );
            }
          );

          supabaseResponse =
            NextResponse.next({
              request,
            });

          cookiesToSet.forEach(
            ({
              name,
              value,
              options,
            }) => {
              supabaseResponse.cookies.set(
                name,
                value,
                options
              );
            }
          );

          Object.entries(
            headers
          ).forEach(([key, value]) => {
            supabaseResponse.headers.set(
              key,
              value
            );
          });
        },
      },
    }
  );

  const { data: claimsData } =
    await supabase.auth.getClaims();

  const userId =
    claimsData?.claims?.sub;

  const pathname =
    request.nextUrl.pathname;

  const isAdminRoute =
    pathname === "/admin" ||
    pathname.startsWith("/admin/");

  const isAdminLoginRoute =
    pathname === "/admin-login";

  if (
    isAdminRoute &&
    !userId
  ) {
    const loginUrl =
      request.nextUrl.clone();

    loginUrl.pathname =
      "/admin-login";

    loginUrl.searchParams.set(
      "redirect",
      pathname
    );

    return copyAuthCookies(
      supabaseResponse,
      NextResponse.redirect(loginUrl)
    );
  }

  if (
    (isAdminRoute ||
      isAdminLoginRoute) &&
    userId
  ) {
    const {
      data: admin,
      error: adminError,
    } = await supabase
      .from("admins")
      .select("id, active")
      .eq("user_id", userId)
      .eq("active", true)
      .maybeSingle();

    const hasAdminAccess =
      !adminError &&
      Boolean(admin?.id);

    if (
      isAdminRoute &&
      !hasAdminAccess
    ) {
      const loginUrl =
        request.nextUrl.clone();

      loginUrl.pathname =
        "/admin-login";

      loginUrl.searchParams.set(
        "error",
        "unauthorized"
      );

      return copyAuthCookies(
        supabaseResponse,
        NextResponse.redirect(loginUrl)
      );
    }

    if (
      isAdminLoginRoute &&
      hasAdminAccess
    ) {
      const dashboardUrl =
        request.nextUrl.clone();

      dashboardUrl.pathname =
        "/admin";

      dashboardUrl.search = "";

      return copyAuthCookies(
        supabaseResponse,
        NextResponse.redirect(
          dashboardUrl
        )
      );
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};