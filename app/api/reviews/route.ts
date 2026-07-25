import {
  NextRequest,
  NextResponse,
} from "next/server";
import {
  createClient as createAdminClient,
} from "@supabase/supabase-js";

import {
  createClient as createServerClient,
} from "@/lib/supabase/server";

export const runtime = "nodejs";

type CreateReviewBody = {
  order_id?: unknown;
  product_id?: unknown;
  rating?: unknown;
  title?: unknown;
  review?: unknown;
};

type OrderItem = {
  id: string;
  name: string;
};

type OrderRow = {
  id: string;
  user_id:
    | string
    | null;
  customer_name:
    | string
    | null;
  email:
    | string
    | null;
  status:
    | string
    | null;
  items: unknown;
};

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const MIN_TITLE_LENGTH = 3;
const MAX_TITLE_LENGTH = 120;
const MIN_REVIEW_LENGTH = 10;
const MAX_REVIEW_LENGTH = 2000;

function getSupabaseAdmin() {
  const supabaseUrl =
    process.env
      .NEXT_PUBLIC_SUPABASE_URL;

  const serviceRoleKey =
    process.env
      .SUPABASE_SERVICE_ROLE_KEY;

  if (
    !supabaseUrl ||
    !serviceRoleKey
  ) {
    throw new Error(
      "Missing Supabase server environment variables."
    );
  }

  return createAdminClient(
    supabaseUrl,
    serviceRoleKey,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  );
}

function isRecord(
  value: unknown
): value is Record<
  string,
  unknown
> {
  return (
    typeof value ===
      "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

function getString(
  value: unknown
): string {
  return typeof value ===
    "string"
    ? value.trim()
    : "";
}

async function readRequestBody(
  request: NextRequest
): Promise<
  CreateReviewBody | null
> {
  try {
    const body =
      (await request.json()) as
        unknown;

    if (
      !isRecord(body)
    ) {
      return null;
    }

    return body;
  } catch {
    return null;
  }
}

function parseOrderItems(
  value: unknown
): OrderItem[] {
  if (
    !Array.isArray(value)
  ) {
    return [];
  }

  return value
    .map(
      (
        item
      ): OrderItem | null => {
        if (
          !isRecord(item)
        ) {
          return null;
        }

        const id =
          getString(
            item.id
          );

        const name =
          getString(
            item.name
          );

        if (
          !id ||
          !name
        ) {
          return null;
        }

        return {
          id,
          name,
        };
      }
    )
    .filter(
      (
        item
      ): item is OrderItem =>
        item !== null
    );
}

export async function POST(
  request: NextRequest
) {
  try {
    const authClient =
      await createServerClient();

    const {
      data: {
        user,
      },
      error:
        userError,
    } =
      await authClient.auth.getUser();

    if (
      userError ||
      !user
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "You must be signed in to submit a review.",
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

    if (!body) {
      return NextResponse.json(
        {
          success: false,
          message:
            "The review request was invalid.",
        },
        {
          status: 400,
        }
      );
    }

    const orderId =
      getString(
        body.order_id
      );

    const productId =
      getString(
        body.product_id
      );

    const title =
      getString(
        body.title
      );

    const review =
      getString(
        body.review
      );

    const rating =
      Number(
        body.rating
      );

    if (
      !UUID_PATTERN.test(
        orderId
      ) ||
      !UUID_PATTERN.test(
        productId
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "The order or product reference is invalid.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      !Number.isInteger(
        rating
      ) ||
      rating < 1 ||
      rating > 5
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Select a rating between one and five stars.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      title.length <
        MIN_TITLE_LENGTH ||
      title.length >
        MAX_TITLE_LENGTH
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            `The review title must be between ${MIN_TITLE_LENGTH} and ${MAX_TITLE_LENGTH} characters.`,
        },
        {
          status: 400,
        }
      );
    }

    if (
      review.length <
        MIN_REVIEW_LENGTH ||
      review.length >
        MAX_REVIEW_LENGTH
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            `The review must be between ${MIN_REVIEW_LENGTH} and ${MAX_REVIEW_LENGTH} characters.`,
        },
        {
          status: 400,
        }
      );
    }

    const supabase =
      getSupabaseAdmin();

    const {
      data:
        orderData,
      error:
        orderError,
    } = await supabase
      .from("orders")
      .select(
        `
          id,
          user_id,
          customer_name,
          email,
          status,
          items
        `
      )
      .eq(
        "id",
        orderId
      )
      .eq(
        "user_id",
        user.id
      )
      .maybeSingle();

    if (orderError) {
      throw orderError;
    }

    if (!orderData) {
      return NextResponse.json(
        {
          success: false,
          message:
            "This order could not be found or does not belong to your account.",
        },
        {
          status: 404,
        }
      );
    }

    const order =
      orderData as OrderRow;

    const orderStatus =
      order.status
        ?.trim()
        .toLowerCase() ??
      "";

    if (
      orderStatus !==
      "delivered"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Reviews can only be submitted after the order has been delivered.",
        },
        {
          status: 409,
        }
      );
    }

    const orderItems =
      parseOrderItems(
        order.items
      );

    const orderedProduct =
      orderItems.find(
        (item) =>
          item.id ===
          productId
      );

    if (!orderedProduct) {
      return NextResponse.json(
        {
          success: false,
          message:
            "The selected product is not part of this order.",
        },
        {
          status: 400,
        }
      );
    }

    const {
      data:
        existingReview,
      error:
        duplicateCheckError,
    } = await supabase
      .from("reviews")
      .select(
        "id"
      )
      .eq(
        "order_id",
        order.id
      )
      .eq(
        "product_id",
        orderedProduct.id
      )
      .maybeSingle();

    if (
      duplicateCheckError
    ) {
      throw duplicateCheckError;
    }

    if (
      existingReview
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "A review has already been submitted for this product.",
        },
        {
          status: 409,
        }
      );
    }

    const customerName =
      order.customer_name
        ?.trim() ||
      (
        typeof user
          .user_metadata
          ?.full_name ===
        "string"
          ? user
              .user_metadata
              .full_name
              .trim()
          : ""
      ) ||
      user.email
        ?.split("@")[0] ||
      "Customer";

    const customerEmail =
      order.email
        ?.trim()
        .toLowerCase() ||
      user.email
        ?.trim()
        .toLowerCase() ||
      "";

    const {
      data:
        createdReview,
      error:
        insertError,
    } = await supabase
      .from("reviews")
      .insert({
        order_id:
          order.id,
        product_id:
          orderedProduct.id,
        customer_email:
          customerEmail,
        name:
          customerName,
        title,
        rating,
        review,
        verified_purchase:
          true,
        approved:
          false,
        featured:
          false,
      })
      .select(
        `
          id,
          order_id,
          product_id,
          name,
          title,
          rating,
          review,
          verified_purchase,
          approved,
          featured,
          created_at
        `
      )
      .single();

    if (
      insertError ||
      !createdReview
    ) {
      if (
        insertError?.code ===
        "23505"
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "A review has already been submitted for this product.",
          },
          {
            status: 409,
          }
        );
      }

      throw (
        insertError ??
        new Error(
          "The review could not be created."
        )
      );
    }

    return NextResponse.json(
      {
        success: true,
        message:
          "Your verified purchase review was submitted successfully.",
        review:
          createdReview,
      },
      {
        status: 201,
      }
    );
  } catch (
    error: unknown
  ) {
    console.error(
      "Review creation error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof
          Error
            ? error.message
            : "Unable to submit your review.",
      },
      {
        status: 500,
      }
    );
  }
}