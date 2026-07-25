import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  createClient,
} from "@/lib/supabase/server";

type ReservationRequest = {
  product_id?: unknown;
};

type ReserveProductResult = {
  success: boolean;
  message: string;
  reservation_expires_at:
    | string
    | null;
};

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function getProductId(
  value: unknown
): string {
  if (
    typeof value !== "string"
  ) {
    return "";
  }

  const productId =
    value.trim();

  return UUID_PATTERN.test(
    productId
  )
    ? productId
    : "";
}

async function readRequestBody(
  request: NextRequest
): Promise<ReservationRequest> {
  try {
    const body =
      (await request.json()) as unknown;

    if (
      typeof body !== "object" ||
      body === null ||
      Array.isArray(body)
    ) {
      return {};
    }

    return body as ReservationRequest;
  } catch {
    return {};
  }
}

export async function POST(
  request: NextRequest
) {
  try {
    const supabase =
      await createClient();

    const {
      data: {
        user,
      },
      error:
        userError,
    } =
      await supabase.auth.getUser();

    if (
      userError ||
      !user
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "You must be signed in to reserve this piece.",
        },
        {
          status: 401,
        }
      );
    }

    const body =
      await readRequestBody(
        request
      );

    const productId =
      getProductId(
        body.product_id
      );

    if (!productId) {
      return NextResponse.json(
        {
          success: false,
          message:
            "A valid product ID is required.",
        },
        {
          status: 400,
        }
      );
    }

    const {
      data,
      error,
    } = await supabase.rpc(
      "reserve_product",
      {
        p_product_id:
          productId,
      }
    );

    if (error) {
      console.error(
        "Product reservation error:",
        error
      );

      return NextResponse.json(
        {
          success: false,
          message:
            "Unable to reserve this piece.",
        },
        {
          status: 500,
        }
      );
    }

    const result =
      Array.isArray(data)
        ? (
            data[0] as
              | ReserveProductResult
              | undefined
          )
        : null;

    if (!result) {
      return NextResponse.json(
        {
          success: false,
          message:
            "The reservation service returned an invalid response.",
        },
        {
          status: 500,
        }
      );
    }

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          message:
            result.message,
          product_id:
            productId,
          reserved_until:
            null,
        },
        {
          status: 409,
        }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message:
          result.message,
        product_id:
          productId,
        reserved_until:
          result.reservation_expires_at,
        reservation_duration_seconds:
          30 * 60,
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "Reservation API error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof
          Error
            ? error.message
            : "An unexpected reservation error occurred.",
      },
      {
        status: 500,
      }
    );
  }
}

export async function DELETE(
  request: NextRequest
) {
  try {
    const supabase =
      await createClient();

    const {
      data: {
        user,
      },
      error:
        userError,
    } =
      await supabase.auth.getUser();

    if (
      userError ||
      !user
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "You must be signed in to release a reservation.",
        },
        {
          status: 401,
        }
      );
    }

    const body =
      await readRequestBody(
        request
      );

    const productId =
      getProductId(
        body.product_id
      );

    if (!productId) {
      return NextResponse.json(
        {
          success: false,
          message:
            "A valid product ID is required.",
        },
        {
          status: 400,
        }
      );
    }

    const {
      data,
      error,
    } = await supabase.rpc(
      "release_product_reservation",
      {
        p_product_id:
          productId,
      }
    );

    if (error) {
      console.error(
        "Reservation release error:",
        error
      );

      return NextResponse.json(
        {
          success: false,
          message:
            "Unable to release this reservation.",
        },
        {
          status: 500,
        }
      );
    }

    if (data !== true) {
      return NextResponse.json(
        {
          success: false,
          message:
            "No active reservation was found for this piece.",
          product_id:
            productId,
        },
        {
          status: 404,
        }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message:
          "The reservation has been released.",
        product_id:
          productId,
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "Reservation release API error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof
          Error
            ? error.message
            : "An unexpected reservation error occurred.",
      },
      {
        status: 500,
      }
    );
  }
}