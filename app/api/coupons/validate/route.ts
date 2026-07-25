import {
  NextRequest,
  NextResponse,
} from "next/server";
import {
  createClient,
} from "@supabase/supabase-js";

export const runtime = "nodejs";

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
  name: string;
  price:
    | number
    | string
    | null;
  stock:
    | number
    | string
    | null;
  active:
    | boolean
    | null;
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
  expiry_date:
    | string
    | null;
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

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const MAX_DISTINCT_ITEMS = 50;
const MAX_ITEM_QUANTITY = 100;

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

function toNumber(
  value:
    | number
    | string
    | null
    | undefined
): number {
  const parsed =
    Number(value);

  return Number.isFinite(
    parsed
  )
    ? parsed
    : 0;
}

function roundCurrency(
  value: number
): number {
  return (
    Math.round(
      (
        value +
        Number.EPSILON
      ) * 100
    ) / 100
  );
}

async function readRequestBody(
  request: NextRequest
): Promise<
  ValidateCouponBody | null
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

function parseItems(
  value: unknown
): RequestedItem[] {
  if (
    !Array.isArray(value)
  ) {
    return [];
  }

  const quantities =
    new Map<
      string,
      number
    >();

  for (
    const entry of value
  ) {
    if (
      !isRecord(entry)
    ) {
      continue;
    }

    const id =
      getString(
        entry.id
      );

    const quantity =
      Number(
        entry.quantity
      );

    if (
      !id ||
      !UUID_PATTERN.test(id) ||
      !Number.isInteger(
        quantity
      ) ||
      quantity <= 0 ||
      quantity >
        MAX_ITEM_QUANTITY
    ) {
      continue;
    }

    const nextQuantity =
      (
        quantities.get(id) ??
        0
      ) + quantity;

    if (
      nextQuantity >
      MAX_ITEM_QUANTITY
    ) {
      continue;
    }

    quantities.set(
      id,
      nextQuantity
    );

    if (
      quantities.size >
      MAX_DISTINCT_ITEMS
    ) {
      return [];
    }
  }

  return Array.from(
    quantities.entries()
  ).map(
    ([
      id,
      quantity,
    ]) => ({
      id,
      quantity,
    })
  );
}

function isCouponExpired(
  expiryDate:
    | string
    | null
): boolean {
  if (!expiryDate) {
    return false;
  }

  const dateOnly =
    expiryDate.slice(
      0,
      10
    );

  const expiresAt =
    new Date(
      `${dateOnly}T23:59:59.999Z`
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
        (
          percentage /
          100
        )
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
      await readRequestBody(
        request
      );

    if (!body) {
      return NextResponse.json(
        {
          success: false,
          message:
            "The coupon validation request was invalid.",
        },
        {
          status: 400,
        }
      );
    }

    const code =
      getString(
        body.code
      ).toUpperCase();

    const items =
      parseItems(
        body.items
      );

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
      items.length ===
      0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Your cart is empty or contains invalid items.",
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
        (item) =>
          item.id
      );

    const {
      data:
        productData,
      error:
        productError,
    } = await supabase
      .from("products")
      .select(
        `
          id,
          name,
          price,
          stock,
          active
        `
      )
      .in(
        "id",
        productIds
      );

    if (productError) {
      throw productError;
    }

    const products =
      (
        productData ??
        []
      ) as ProductRow[];

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
      new Map<
        string,
        ProductRow
      >(
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

      if (!product) {
        return NextResponse.json(
          {
            success: false,
            message:
              "A cart product could not be found.",
          },
          {
            status: 400,
          }
        );
      }

      if (
        product.active ===
        false
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              `${product.name} is currently unavailable.`,
          },
          {
            status: 400,
          }
        );
      }

      const stock =
        Math.max(
          0,
          Math.floor(
            toNumber(
              product.stock
            )
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
              `${product.name} only has ${stock} remaining.`,
          },
          {
            status: 409,
          }
        );
      }

      const price =
        roundCurrency(
          Math.max(
            0,
            toNumber(
              product.price
            )
          )
        );

      subtotal +=
        price *
        item.quantity;
    }

    subtotal =
      roundCurrency(
        subtotal
      );

    const {
      data:
        couponData,
      error:
        couponError,
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
      .eq(
        "code",
        code
      )
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
        : Math.max(
            0,
            Math.floor(
              toNumber(
                coupon.maximum_uses
              )
            )
          );

    const usageCount =
      Math.max(
        0,
        Math.floor(
          toNumber(
            coupon.usage_count
          )
        )
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
        : Math.max(
            0,
            toNumber(
              coupon.minimum_order
            )
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

    return NextResponse.json(
      {
        success: true,

        message:
          `${coupon.code} applied successfully.`,

        currency:
          "INR",

        coupon: {
          code:
            coupon.code,

          discount_type:
            coupon.discount_type,

          discount_value:
            Math.max(
              0,
              toNumber(
                coupon.discount_value
              )
            ),
        },

        subtotal,

        discount_amount:
          discountAmount,

        total,
      },
      {
        status: 200,
      }
    );
  } catch (
    error: unknown
  ) {
    console.error(
      "Coupon validation error:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        message:
          error instanceof
          Error
            ? error.message
            : "Unable to validate the coupon.",
      },
      {
        status: 500,
      }
    );
  }
}