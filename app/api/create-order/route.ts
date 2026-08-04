import {
  NextRequest,
  NextResponse,
} from "next/server";
import {
  createClient as createAdminClient,
} from "@supabase/supabase-js";

import {
  getRazorpayClient,
  getRazorpayKeyId,
} from "@/lib/razorpay";
import {
  createClient as createServerClient,
} from "@/lib/supabase/server";

export const runtime = "nodejs";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const EMAIL_PATTERN =
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const INDIA_COUNTRY_NAMES =
  new Set<string>([
    "india",
    "in",
    "bharat",
    "republic of india",
  ]);
const MAX_DISTINCT_ITEMS = 50;
const MAX_ITEM_QUANTITY = 100;

const DEFAULT_SHIPPING_SETTINGS = {
  indiaShippingCost: 100,
  indiaFreeShippingThreshold: 999,
  internationalShippingPerItem: 1000,
  internationalDiscountThreshold: 10000,
  internationalShippingDiscountPercent: 50,
};

type RequestedItem = {
  id: string;
  quantity: number;
};

type CreateOrderRequest = {
  customer_name?: unknown;
  email?: unknown;
  phone?: unknown;
  address?: unknown;
  city?: unknown;
  state?: unknown;
  postal_code?: unknown;
  country?: unknown;
  coupon_code?: unknown;
  items?: unknown;
};

type ProductRow = {
  id: string;
  slug: string;
  name: string;
  price: number | string | null;
  stock: number | string | null;
  active: boolean | null;
  reservation_enabled: boolean | null;
  reserved_by: string | null;
  reserved_until: string | null;
  image: string | null;
};

type CanonicalOrderItem = {
  id: string;
  slug: string;
  name: string;
  quantity: number;
  price: number;
  image: string;
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

type CouponResult = {
  coupon: CouponRow | null;
  discountAmount: number;
  code: string | null;
};

type ShippingSettings =
  typeof DEFAULT_SHIPPING_SETTINGS;

function getSupabaseAdmin() {
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY;

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
): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

function getString(
  value: unknown
): string {
  return typeof value === "string"
    ? value.trim()
    : "";
}

function toNumber(
  value: unknown
): number {
  const parsed = Number(value);

  return Number.isFinite(parsed)
    ? parsed
    : 0;
}

function toNonNegativeNumber(
  value: unknown,
  fallback: number
): number {
  const parsed = Number(value);

  if (
    !Number.isFinite(parsed) ||
    parsed < 0
  ) {
    return fallback;
  }

  return parsed;
}

function roundCurrency(
  value: number
): number {
  return (
    Math.round(
      (value + Number.EPSILON) * 100
    ) / 100
  );
}

async function readRequest(
  request: NextRequest
): Promise<CreateOrderRequest | null> {
  try {
    const value =
      (await request.json()) as unknown;

    return isRecord(value)
      ? value
      : null;
  } catch {
    return null;
  }
}

function parseItems(
  value: unknown
): RequestedItem[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const quantities =
    new Map<string, number>();

  for (const entry of value) {
    if (!isRecord(entry)) {
      continue;
    }

    const id = getString(entry.id);
    const quantity =
      Number(entry.quantity);

    if (
      !UUID_PATTERN.test(id) ||
      !Number.isInteger(quantity) ||
      quantity <= 0 ||
      quantity > MAX_ITEM_QUANTITY
    ) {
      return [];
    }

    const nextQuantity =
      (quantities.get(id) ?? 0) +
      quantity;

    if (
      nextQuantity >
      MAX_ITEM_QUANTITY
    ) {
      return [];
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
    ([id, quantity]) => ({
      id,
      quantity,
    })
  );
}

function getTimestamp(
  value: string | null
): number | null {
  if (!value) {
    return null;
  }

  const timestamp =
    new Date(value).getTime();

  return Number.isNaN(timestamp)
    ? null
    : timestamp;
}

function getReservationError(
  product: ProductRow,
  requestedQuantity: number,
  userId: string,
  currentTime: number
): string | null {
  const reservationExpiry =
    getTimestamp(
      product.reserved_until
    );
  const hasActiveReservation =
    Boolean(product.reserved_by) &&
    reservationExpiry !== null &&
    reservationExpiry > currentTime;

  if (
    hasActiveReservation &&
    product.reserved_by !== userId
  ) {
    return `${product.name} is currently reserved by another customer.`;
  }

  if (
    product.reservation_enabled !==
    true
  ) {
    return null;
  }

  if (requestedQuantity !== 1) {
    return `${product.name} is a one-of-a-kind piece and can only be purchased in a quantity of one.`;
  }

  if (
    product.reserved_by === userId &&
    reservationExpiry !== null &&
    reservationExpiry <= currentTime
  ) {
    return `Your reservation for ${product.name} has expired. Please reserve it again.`;
  }

  if (
    !hasActiveReservation ||
    product.reserved_by !== userId
  ) {
    return `${product.name} must be reserved before checkout. Please add it to your cart again.`;
  }

  return null;
}

function isCouponExpired(
  expiryDate: string | null
): boolean {
  if (!expiryDate) {
    return false;
  }

  const dateOnly =
    expiryDate.slice(0, 10);
  const expiresAt = new Date(
    `${dateOnly}T23:59:59.999Z`
  );

  return (
    Number.isNaN(
      expiresAt.getTime()
    ) ||
    expiresAt.getTime() < Date.now()
  );
}

function calculateDiscount(
  coupon: CouponRow,
  subtotal: number
): number {
  const discountValue = Math.max(
    0,
    toNumber(
      coupon.discount_value
    )
  );

  if (
    coupon.discount_type ===
    "percentage"
  ) {
    return roundCurrency(
      subtotal *
        (Math.min(
          discountValue,
          100
        ) /
          100)
    );
  }

  return roundCurrency(
    Math.min(
      discountValue,
      subtotal
    )
  );
}

async function validateCoupon(
  supabase: ReturnType<
    typeof getSupabaseAdmin
  >,
  rawCode: string,
  subtotal: number
): Promise<CouponResult> {
  const code = rawCode
    .trim()
    .toUpperCase();

  if (!code) {
    return {
      coupon: null,
      discountAmount: 0,
      code: null,
    };
  }

  const {
    data,
    error,
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

  if (error) {
    throw error;
  }

  const coupon =
    data as CouponRow | null;

  if (
    !coupon ||
    !coupon.active
  ) {
    throw new Error(
      "This coupon is invalid or inactive."
    );
  }

  if (
    isCouponExpired(
      coupon.expiry_date
    )
  ) {
    throw new Error(
      "This coupon has expired."
    );
  }

  const maximumUses =
    coupon.maximum_uses === null
      ? null
      : Math.max(
          0,
          Math.floor(
            toNumber(
              coupon.maximum_uses
            )
          )
        );
  const usageCount = Math.max(
    0,
    Math.floor(
      toNumber(
        coupon.usage_count
      )
    )
  );

  if (
    maximumUses !== null &&
    usageCount >= maximumUses
  ) {
    throw new Error(
      "This coupon has reached its usage limit."
    );
  }

  const minimumOrder =
    coupon.minimum_order === null
      ? 0
      : Math.max(
          0,
          toNumber(
            coupon.minimum_order
          )
        );

  if (subtotal < minimumOrder) {
    throw new Error(
      `A minimum order of ₹${minimumOrder.toLocaleString(
        "en-IN"
      )} is required for this coupon.`
    );
  }

  return {
    coupon,
    discountAmount:
      calculateDiscount(
        coupon,
        subtotal
      ),
    code: coupon.code,
  };
}

async function loadShippingSettings(
  supabase: ReturnType<
    typeof getSupabaseAdmin
  >
): Promise<ShippingSettings> {
  const {
    data,
    error,
  } = await supabase
    .from("settings")
    .select(
      `
        india_shipping_cost,
        india_free_shipping_threshold,
        international_shipping_per_item,
        international_discount_threshold,
        international_shipping_discount_percent
      `
    )
    .eq("setting_key", "store")
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    return DEFAULT_SHIPPING_SETTINGS;
  }

  return {
    indiaShippingCost:
      toNonNegativeNumber(
        data.india_shipping_cost,
        DEFAULT_SHIPPING_SETTINGS
          .indiaShippingCost
      ),
    indiaFreeShippingThreshold:
      toNonNegativeNumber(
        data.india_free_shipping_threshold,
        DEFAULT_SHIPPING_SETTINGS
          .indiaFreeShippingThreshold
      ),
    internationalShippingPerItem:
      toNonNegativeNumber(
        data.international_shipping_per_item,
        DEFAULT_SHIPPING_SETTINGS
          .internationalShippingPerItem
      ),
    internationalDiscountThreshold:
      toNonNegativeNumber(
        data.international_discount_threshold,
        DEFAULT_SHIPPING_SETTINGS
          .internationalDiscountThreshold
      ),
    internationalShippingDiscountPercent:
      Math.min(
        100,
        toNonNegativeNumber(
          data.international_shipping_discount_percent,
          DEFAULT_SHIPPING_SETTINGS
            .internationalShippingDiscountPercent
        )
      ),
  };
}

function calculateShipping(
  country: string,
  subtotal: number,
  totalItemQuantity: number,
  settings: ShippingSettings
): number {
  const normalizedCountry = country
    .trim()
    .toLowerCase();

  if (
    INDIA_COUNTRY_NAMES.has(
      normalizedCountry
    )
  ) {
    return subtotal >=
      settings.indiaFreeShippingThreshold
      ? 0
      : roundCurrency(
          settings.indiaShippingCost
        );
  }

  const fullShipping =
    settings
      .internationalShippingPerItem *
    totalItemQuantity;

  if (
    subtotal >=
    settings
      .internationalDiscountThreshold
  ) {
    return roundCurrency(
      fullShipping *
        (1 -
          settings
            .internationalShippingDiscountPercent /
            100)
    );
  }

  return roundCurrency(
    fullShipping
  );
}

export async function POST(
  request: NextRequest
) {
  let pendingOrderId:
    | string
    | null = null;

  try {
    const authClient =
      await createServerClient();
    const {
      data: {
        user,
      },
      error: userError,
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
            "You must be signed in to continue to payment.",
        },
        {
          status: 401,
        }
      );
    }

    const body =
      await readRequest(request);

    if (!body) {
      return NextResponse.json(
        {
          success: false,
          message:
            "The payment request was invalid.",
        },
        {
          status: 400,
        }
      );
    }

    const customerName = getString(
      body.customer_name
    );
    const email = getString(
      body.email
    ).toLowerCase();
    const phone = getString(
      body.phone
    );
    const address = getString(
      body.address
    );
    const city = getString(
      body.city
    );
    const state = getString(
      body.state
    );
    const postalCode = getString(
      body.postal_code
    );
    const country = getString(
      body.country
    );
    const couponCode = getString(
      body.coupon_code
    );
    const requestedItems =
      parseItems(body.items);

    if (
      !customerName ||
      !EMAIL_PATTERN.test(email) ||
      !phone ||
      !address ||
      !city ||
      !state ||
      !postalCode ||
      !country ||
      requestedItems.length === 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Please complete all checkout fields and try again.",
        },
        {
          status: 400,
        }
      );
    }

    const supabase =
      getSupabaseAdmin();
    const productIds =
      requestedItems.map(
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
          slug,
          name,
          price,
          stock,
          active,
          reservation_enabled,
          reserved_by,
          reserved_until,
          image
        `
      )
      .in("id", productIds);

    if (productError) {
      throw productError;
    }

    const products =
      (productData ?? []) as ProductRow[];

    if (
      products.length !==
      productIds.length
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "One or more cart products are no longer available.",
        },
        {
          status: 400,
        }
      );
    }

    const productsById = new Map(
      products.map(
        (product) => [
          product.id,
          product,
        ]
      )
    );
    const canonicalItems:
      CanonicalOrderItem[] = [];
    let subtotal = 0;
    let totalItemQuantity = 0;
    const validationTime = Date.now();

    for (
      const requestedItem of
      requestedItems
    ) {
      const product =
        productsById.get(
          requestedItem.id
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
        product.active === false
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              `${product.name} is currently unavailable.`,
          },
          {
            status: 409,
          }
        );
      }

      const reservationError =
        getReservationError(
          product,
          requestedItem.quantity,
          user.id,
          validationTime
        );

      if (reservationError) {
        return NextResponse.json(
          {
            success: false,
            message:
              reservationError,
            code:
              "RESERVATION_INVALID",
            product_id:
              product.id,
          },
          {
            status: 409,
          }
        );
      }

      const stock = Math.max(
        0,
        Math.floor(
          toNumber(product.stock)
        )
      );

      if (
        stock <
        requestedItem.quantity
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

      const price = roundCurrency(
        Math.max(
          0,
          toNumber(product.price)
        )
      );

      subtotal +=
        price *
        requestedItem.quantity;
      totalItemQuantity +=
        requestedItem.quantity;

      canonicalItems.push({
        id: product.id,
        slug: product.slug,
        name: product.name,
        quantity:
          requestedItem.quantity,
        price,
        image:
          product.image ?? "",
      });
    }

    subtotal = roundCurrency(
      subtotal
    );

    let couponResult:
      CouponResult;

    try {
      couponResult =
        await validateCoupon(
          supabase,
          couponCode,
          subtotal
        );
    } catch (couponError) {
      return NextResponse.json(
        {
          success: false,
          message:
            couponError instanceof Error
              ? couponError.message
              : "The coupon could not be applied.",
        },
        {
          status: 400,
        }
      );
    }

    const shippingSettings =
      await loadShippingSettings(
        supabase
      );
    const shipping =
      calculateShipping(
        country,
        subtotal,
        totalItemQuantity,
        shippingSettings
      );
    const total = roundCurrency(
      Math.max(
        0,
        subtotal +
          shipping -
          couponResult.discountAmount
      )
    );
    const amountInPaise =
      Math.round(total * 100);

    if (amountInPaise < 100) {
      return NextResponse.json(
        {
          success: false,
          message:
            "The order total must be at least ₹1.",
        },
        {
          status: 400,
        }
      );
    }

    const {
      data: pendingOrder,
      error: pendingOrderError,
    } = await supabase
      .from("orders")
      .insert({
        user_id: user.id,
        customer_name:
          customerName,
        email,
        phone,
        address,
        city,
        state,
        postal_code:
          postalCode,
        country,
        payment_method:
          "Razorpay",
        subtotal,
        shipping,
        coupon_code:
          couponResult.code,
        discount_amount:
          couponResult.discountAmount,
        total,
        status: "Pending",
        payment_status:
          "Pending",
        items: canonicalItems,
      })
      .select("id")
      .single();

    if (
      pendingOrderError ||
      !pendingOrder
    ) {
      throw (
        pendingOrderError ??
        new Error(
          "Unable to create the pending order."
        )
      );
    }

    pendingOrderId =
      String(pendingOrder.id);

    const razorpay =
      getRazorpayClient();
    const receipt =
      `rr_${pendingOrderId
        .replace(/-/g, "")
        .slice(0, 30)}`;
    const razorpayOrder =
      await razorpay.orders.create({
        amount: amountInPaise,
        currency: "INR",
        receipt,
        notes: {
          supabase_order_id:
            pendingOrderId,
          user_id: user.id,
        },
      });

    const {
      error: linkError,
    } = await supabase
      .from("orders")
      .update({
        razorpay_order_id:
          razorpayOrder.id,
      })
      .eq("id", pendingOrderId)
      .eq("user_id", user.id)
      .eq(
        "payment_status",
        "Pending"
      );

    if (linkError) {
      throw linkError;
    }

    return NextResponse.json(
      {
        success: true,
        key_id:
          getRazorpayKeyId(),
        supabase_order_id:
          pendingOrderId,
        razorpay_order: {
          id: razorpayOrder.id,
          amount: Number(
            razorpayOrder.amount
          ),
          currency:
            razorpayOrder.currency,
        },
        pricing: {
          subtotal,
          shipping,
          discount_amount:
            couponResult.discountAmount,
          total,
        },
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      "Razorpay create-order error:",
      error
    );

    if (pendingOrderId) {
      try {
        const supabase =
          getSupabaseAdmin();

        await supabase
          .from("orders")
          .update({
            status: "Cancelled",
            payment_status:
              "Failed",
          })
          .eq("id", pendingOrderId)
          .eq(
            "payment_status",
            "Pending"
          );
      } catch (cleanupError) {
        console.error(
          "Pending order cleanup error:",
          cleanupError
        );
      }
    }

    return NextResponse.json(
      {
        success: false,
        message:
          "Payment could not be started. Please try again.",
      },
      {
        status: 500,
      }
    );
  }
}