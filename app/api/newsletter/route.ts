import {
  NextResponse,
  type NextRequest,
} from "next/server";

import { createClient } from "@/lib/supabase/server";

type NewsletterRequestBody = {
  email?: unknown;
  source?: unknown;
};

const EMAIL_PATTERN =
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normaliseSource(
  value: unknown
): string {
  if (typeof value !== "string") {
    return "website";
  }

  const trimmed =
    value.trim();

  return trimmed
    ? trimmed.slice(0, 80)
    : "website";
}

export async function POST(
  request: NextRequest
) {
  try {
    const body =
      (await request.json()) as NewsletterRequestBody;

    const email =
      typeof body.email ===
      "string"
        ? body.email
            .trim()
            .toLowerCase()
        : "";

    if (!email) {
      return NextResponse.json(
        {
          error:
            "Email address is required.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      email.length > 320 ||
      !EMAIL_PATTERN.test(email)
    ) {
      return NextResponse.json(
        {
          error:
            "Enter a valid email address.",
        },
        {
          status: 400,
        }
      );
    }

    const supabase =
      await createClient();

    const {
      error: insertError,
    } = await supabase
      .from(
        "newsletter_subscribers"
      )
      .insert({
        email,
        source:
          normaliseSource(
            body.source
          ),
        status:
          "subscribed",
      });

    if (insertError) {
      if (
        insertError.code ===
        "23505"
      ) {
        return NextResponse.json(
          {
            success: true,
            message:
              "You are already subscribed.",
          }
        );
      }

      throw insertError;
    }

    return NextResponse.json(
      {
        success: true,
        message:
          "Thank you for subscribing.",
      },
      {
        status: 201,
      }
    );
  } catch (
    error: unknown
  ) {
    console.error(
      "Newsletter API error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Unable to subscribe right now. Please try again.",
      },
      {
        status: 500,
      }
    );
  }
}