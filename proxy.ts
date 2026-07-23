import { NextRequest, NextResponse } from "next/server";

import { ADMIN_EMAILS } from "@/lib/admin";


export async function proxy(
  request: NextRequest
) {

  const pathname =
    request.nextUrl.pathname;


  if (
    !pathname.startsWith("/admin")
  ) {

    return NextResponse.next();

  }



  const accessToken =
    request.cookies.get(
      "sb-access-token"
    )?.value;



  if (!accessToken) {

    return NextResponse.redirect(
      new URL(
        "/login",
        request.url
      )
    );

  }



  try {

    const response =
      await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/user`,
        {
          headers: {
            Authorization:
              `Bearer ${accessToken}`,

            apikey:
              process.env
                .NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          },

          cache:
            "no-store",
        }
      );



    if (!response.ok) {

      return NextResponse.redirect(
        new URL(
          "/login",
          request.url
        )
      );

    }



    const user =
      await response.json();



    if (
      !ADMIN_EMAILS.includes(
        user.email
      )
    ) {

      return NextResponse.redirect(
        new URL(
          "/",
          request.url
        )
      );

    }



    return NextResponse.next();



  } catch (error) {

    console.error(
      "Proxy auth error:",
      error
    );


    return NextResponse.redirect(
      new URL(
        "/login",
        request.url
      )
    );

  }

}



export const config = {

  matcher: [
    "/admin/:path*",
  ],

};