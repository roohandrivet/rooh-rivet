import {
  NextRequest,
  NextResponse,
} from "next/server";
import {
  createClient,
} from "@supabase/supabase-js";

type RequestedItem = {
  id: string;
  quantity: number;
};

type ValidateCouponBody = {
  code?: unknown;
  items?: unknown;
};

type ProductRow = {
  id: string;
  price: number | string | null;
  stock: number | string | null;
  active: boolean | null;
};

type CouponRow = {
  id: string;
  code: string;
  discount_type:
    | "percentage"
    | "fixed";
  discount_value:
    | number
    | string;
  minimum_order:
    | number
    | string
    | null;
  expiry_date: string | null;
  maximum_uses:
    | number
    | string
    | null;
  usage_count:
    | number
    | string
    | null;
  active: boolean;
};

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

  return createClient(
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

function toNumber(
  value:
    | number
    | string
    | null
    | undefined
): number {
  const parsed = Number(value);

  return Number.isFinite(parsed)
    ? parsed
    : 0;
}

function roundCurrency(
  value: number
): number {
  return (
    Math.round(
      (value +
        Number.EPSILON) *
        100
    ) / 100
  );
}

function isRecord(
  value: unknown
): value is Record<
  string,
  unknown
> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

function parseItems(
  value: unknown
): RequestedItem[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const quantities =
    new Map<string, number>();

  value.forEach((entry) => {
    if (!isRecord(entry)) {
      return;
    }

    const id =
      typeof entry.id === "string"
        ? entry.id.trim()
        : "";

    const quantity =
      Number(entry.quantity);

    if (
      !id ||
      !Number.isInteger(
        quantity
      ) ||
      quantity <= 0
    ) {
      return;
    }

    quantities.set(
      id,
      (quantities.get(id) ??
        0) + quantity
    );
  });

  return Array.from(
    quantities.entries()
  ).map(
    ([id, quantity]) => ({
      id,
      quantity,
    })
  );
}

function isCouponExpired(
  expiryDate: string | null
): boolean {
  if (!expiryDate) {
    return false;
  }

  const expiresAt =
    new Date(
      `${expiryDate}T23:59:59.999Z`
    );

  if (
    Number.isNaN(
      expiresAt.getTime()
    )
  ) {
    return true;
  }

  return (
    expiresAt.getTime() <
    Date.now()
  );
}

function calculateDiscount(
  coupon: CouponRow,
  subtotal: number
): number {
  const discountValue =
    Math.max(
      0,
      toNumber(
        coupon.discount_value
      )
    );

  if (
    coupon.discount_type ===
    "percentage"
  ) {
    const percentage =
      Math.min(
        discountValue,
        100
      );

    return roundCurrency(
      subtotal *
        (percentage / 100)
    );
  }

  return roundCurrency(
    Math.min(
      discountValue,
      subtotal
    )
  );
}

export async function POST(
  request: NextRequest
) {
  try {
    const body =
      (await request.json()) as
        ValidateCouponBody;

    const code =
      typeof body.code ===
      "string"
        ? body.code
            .trim()
            .toUpperCase()
        : "";

    const items =
      parseItems(body.items);

    if (!code) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Enter a coupon code.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      items.length === 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Your cart is empty.",
        },
        {
          status: 400,
        }
      );
    }

    const supabase =
      getSupabaseAdmin();

    const productIds =
      items.map(
        (item) => item.id
      );

    const {
      data: productData,
      error: productError,
    } = await supabase
      .from("products")
      .select(
        `
          id,
          price,
          stock,
          active
        `
      )
      .in("id", productIds);

    if (productError) {
      throw productError;
    }

    const products =
      (productData ??
        []) as ProductRow[];

    if (
      products.length !==
      productIds.length
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "One or more cart products are unavailable.",
        },
        {
          status: 400,
        }
      );
    }

    const productsById =
      new Map(
        products.map(
          (product) => [
            product.id,
            product,
          ]
        )
      );

    let subtotal = 0;

    for (
      const item of items
    ) {
      const product =
        productsById.get(
          item.id
        );

      if (
        !product ||
        product.active ===
          false
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "One or more cart products are unavailable.",
          },
          {
            status: 400,
          }
        );
      }

      const stock =
        Math.max(
          0,
          toNumber(
            product.stock
          )
        );

      if (
        stock <
        item.quantity
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "One or more cart quantities exceed available stock.",
          },
          {
            status: 400,
          }
        );
      }

      subtotal +=
        toNumber(
          product.price
        ) * item.quantity;
    }

    subtotal =
      roundCurrency(
        subtotal
      );

    const {
      data: couponData,
      error: couponError,
    } = await supabase
      .from("coupons")
      .select(
        `
          id,
          code,
          discount_type,
          discount_value,
          minimum_order,
          expiry_date,
          maximum_uses,
          usage_count,
          active
        `
      )
      .eq("code", code)
      .maybeSingle();

    if (couponError) {
      throw couponError;
    }

    const coupon =
      couponData as
        | CouponRow
        | null;

    if (
      !coupon ||
      !coupon.active
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "This coupon is invalid or inactive.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      isCouponExpired(
        coupon.expiry_date
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "This coupon has expired.",
        },
        {
          status: 400,
        }
      );
    }

    const maximumUses =
      coupon.maximum_uses ===
      null
        ? null
        : toNumber(
            coupon.maximum_uses
          );

    const usageCount =
      toNumber(
        coupon.usage_count
      );

    if (
      maximumUses !== null &&
      usageCount >=
        maximumUses
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "This coupon has reached its usage limit.",
        },
        {
          status: 400,
        }
      );
    }

    const minimumOrder =
      coupon.minimum_order ===
      null
        ? 0
        : toNumber(
            coupon.minimum_order
          );

    if (
      subtotal <
      minimumOrder
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            `A minimum order of ₹${minimumOrder.toLocaleString(
              "en-IN"
            )} is required for this coupon.`,
        },
        {
          status: 400,
        }
      );
    }

    const discountAmount =
      calculateDiscount(
        coupon,
        subtotal
      );

    const total =
      roundCurrency(
        Math.max(
          0,
          subtotal -
            discountAmount
        )
      );

    return NextResponse.json({
      success: true,

      message:
        `${coupon.code} applied successfully.`,

      coupon: {
        code:
          coupon.code,

        discount_type:
          coupon.discount_type,

        discount_value:
          toNumber(
            coupon.discount_value
          ),
      },

      subtotal,

      discount_amount:
        discountAmount,

      total,
    });
  } catch (error) {
    console.error(
      "Coupon validation error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Unable to validate the coupon.",
      },
      {
        status: 500,
      }
    );
  }
}