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
import {
  resend,
  EMAIL_FROM,
} from "@/lib/resend";
import OrderConfirmation from "@/emails/OrderConfirmation";

type RequestedItem = {
  id: string;
  quantity: number;
};

type CheckoutRequest = {
  customer_name?: unknown;
  email?: unknown;
  phone?: unknown;
  address?: unknown;
  city?: unknown;
  state?: unknown;
  postal_code?: unknown;
  country?: unknown;
  payment_method?: unknown;
  coupon_code?: unknown;
  items?: unknown;
};

type ProductRow = {
  id: string;
  slug: string;
  name: string;
  price: number | string | null;
  image: string | null;
  stock: number | string | null;
  active: boolean | null;
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

type CouponResult = {
  coupon: CouponRow | null;
  discountAmount: number;
  code: string | null;
};

type ShippingSettingsRow = {
  india_shipping_cost:
    | number
    | string
    | null;
  india_free_shipping_threshold:
    | number
    | string
    | null;
  international_shipping_per_item:
    | number
    | string
    | null;
  international_discount_threshold:
    | number
    | string
    | null;
  international_shipping_discount_percent:
    | number
    | string
    | null;
};

type ShippingSettings = {
  indiaShippingCost: number;
  indiaFreeShippingThreshold: number;
  internationalShippingPerItem: number;
  internationalDiscountThreshold: number;
  internationalShippingDiscountPercent: number;
};

const ALLOWED_PAYMENT_METHODS =
  new Set<string>([
    "Credit / Debit Card",
    "Bank Transfer",
  ]);

const INDIA_COUNTRY_NAMES =
  new Set<string>([
    "india",
    "in",
    "bharat",
    "republic of india",
  ]);

const DEFAULT_SHIPPING_SETTINGS:
  ShippingSettings = {
    indiaShippingCost: 100,
    indiaFreeShippingThreshold: 999,
    internationalShippingPerItem: 1000,
    internationalDiscountThreshold: 10000,
    internationalShippingDiscountPercent: 50,
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

function toNonNegativeNumber(
  value:
    | number
    | string
    | null
    | undefined,
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
      (value + Number.EPSILON) *
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

function getString(
  value: unknown
): string {
  return typeof value ===
    "string"
    ? value.trim()
    : "";
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
      getString(entry.id);

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
  expiryDate:
    | string
    | null
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

async function validateCoupon(
  supabase:
    ReturnType<
      typeof getSupabaseAdmin
    >,
  rawCode: string,
  subtotal: number
): Promise<CouponResult> {
  const code =
    rawCode
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
    throw new Error(
      "This coupon has reached its usage limit."
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
  supabase:
    ReturnType<
      typeof getSupabaseAdmin
    >
): Promise<ShippingSettings> {
  const {
    data,
    error,
  } = await supabase
    .from("settings")
    .select(
      "india_shipping_cost, india_free_shipping_threshold, international_shipping_per_item, international_discount_threshold, international_shipping_discount_percent"
    )
    .limit(1)
    .maybeSingle();

  if (error) {
    throw error;
  }

  const row =
    data as
      | ShippingSettingsRow
      | null;

  if (!row) {
    return DEFAULT_SHIPPING_SETTINGS;
  }

  return {
    indiaShippingCost:
      toNonNegativeNumber(
        row.india_shipping_cost,
        DEFAULT_SHIPPING_SETTINGS
          .indiaShippingCost
      ),
    indiaFreeShippingThreshold:
      toNonNegativeNumber(
        row.india_free_shipping_threshold,
        DEFAULT_SHIPPING_SETTINGS
          .indiaFreeShippingThreshold
      ),
    internationalShippingPerItem:
      toNonNegativeNumber(
        row.international_shipping_per_item,
        DEFAULT_SHIPPING_SETTINGS
          .internationalShippingPerItem
      ),
    internationalDiscountThreshold:
      toNonNegativeNumber(
        row.international_discount_threshold,
        DEFAULT_SHIPPING_SETTINGS
          .internationalDiscountThreshold
      ),
    internationalShippingDiscountPercent:
      Math.min(
        100,
        toNonNegativeNumber(
          row.international_shipping_discount_percent,
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
  const normalizedCountry =
    country
      .trim()
      .toLowerCase();

  const isIndia =
    INDIA_COUNTRY_NAMES.has(
      normalizedCountry
    );

  if (isIndia) {
    if (
      subtotal >=
      settings
        .indiaFreeShippingThreshold
    ) {
      return 0;
    }

    return roundCurrency(
      settings.indiaShippingCost
    );
  }

  const fullInternationalShipping =
    settings
      .internationalShippingPerItem *
    totalItemQuantity;

  if (
    subtotal >=
    settings
      .internationalDiscountThreshold
  ) {
    return roundCurrency(
      fullInternationalShipping *
        (
          1 -
          settings
            .internationalShippingDiscountPercent /
            100
        )
    );
  }

  return roundCurrency(
    fullInternationalShipping
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
            "You must be signed in to place an order.",
        },
        {
          status: 401,
        }
      );
    }

    const body =
      (await request.json()) as
        CheckoutRequest;

    const customerName =
      getString(
        body.customer_name
      );

    const email =
      getString(
        body.email
      ).toLowerCase();

    const phone =
      getString(
        body.phone
      );

    const address =
      getString(
        body.address
      );

    const city =
      getString(
        body.city
      );

    const state =
      getString(
        body.state
      );

    const postalCode =
      getString(
        body.postal_code
      );

    const country =
      getString(
        body.country
      );

    const paymentMethod =
      getString(
        body.payment_method
      );

    const couponCode =
      getString(
        body.coupon_code
      );

    const requestedItems =
      parseItems(
        body.items
      );

    if (
      !customerName ||
      !email ||
      !phone ||
      !address ||
      !city ||
      !state ||
      !postalCode ||
      !country ||
      !ALLOWED_PAYMENT_METHODS.has(
        paymentMethod
      ) ||
      requestedItems.length ===
        0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Missing or invalid checkout information.",
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
          image,
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
            "One or more cart products no longer exist.",
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

    const canonicalItems:
      CanonicalOrderItem[] =
        [];

    let subtotal = 0;
    let totalItemQuantity = 0;

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
          toNumber(
            product.stock
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
            status: 400,
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

    subtotal =
      roundCurrency(
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
            couponError instanceof
            Error
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

    const total =
      roundCurrency(
        Math.max(
          0,
          subtotal +
            shipping -
            couponResult
              .discountAmount
        )
      );

    const orderStatus =
      "Pending";

    const paymentStatus =
      "Pending";

    const {
      data: order,
      error: orderError,
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
          paymentMethod,
        subtotal,
        shipping,
        coupon_code:
          couponResult.code,
        discount_amount:
          couponResult
            .discountAmount,
        total,
        status:
          orderStatus,
        payment_status:
          paymentStatus,
        items:
          canonicalItems,
      })
      .select()
      .single();

    if (
      orderError ||
      !order
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            orderError?.message ??
            "Failed to create order.",
        },
        {
          status: 500,
        }
      );
    }

    for (
      const item of
      canonicalItems
    ) {
      const product =
        productsById.get(
          item.id
        );

      if (!product) {
        continue;
      }

      const currentStock =
        Math.max(
          0,
          toNumber(
            product.stock
          )
        );

      const newStock =
        Math.max(
          0,
          currentStock -
            item.quantity
        );

      const {
        error: stockError,
      } = await supabase
        .from("products")
        .update({
          stock:
            newStock,
          ...(newStock === 0
            ? {
                active:
                  false,
              }
            : {}),
        })
        .eq(
          "id",
          item.id
        );

      if (stockError) {
        console.error(
          "Stock update error:",
          stockError
        );
      }
    }

    if (
      couponResult.coupon
    ) {
      const {
        error: usageError,
      } = await supabase.rpc(
        "increment_coupon_usage",
        {
          p_coupon_id:
            couponResult
              .coupon.id,
        }
      );

      if (usageError) {
        console.error(
          "Coupon usage update error:",
          usageError
        );
      }
    }

    try {
      await resend.emails.send({
        from:
          EMAIL_FROM,
        to:
          email,
        subject:
          `Your Rooh & Rivet Order #${order.id} is Confirmed`,
        react:
          OrderConfirmation({
            customerName,
            orderId:
              String(
                order.id
              ),
            subtotal,
            shipping,
            couponCode:
              couponResult.code,
            discountAmount:
              couponResult
                .discountAmount,
            total,
            paymentMethod,
            paymentStatus,
            orderStatus,
          }),
      });
    } catch (emailError) {
      console.error(
        "Email Error:",
        emailError
      );
    }

    return NextResponse.json(
      {
        success: true,
        order,
        pricing: {
          subtotal,
          shipping,
          coupon_code:
            couponResult.code,
          discount_amount:
            couponResult
              .discountAmount,
          total,
        },
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      "Checkout Error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof
          Error
            ? error.message
            : "An unexpected server error occurred.",
      },
      {
        status: 500,
      }
    );
  }
}