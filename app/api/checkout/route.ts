import {
  NextRequest,
  NextResponse,
} from "next/server";
import {
  createClient as createAdminClient,
} from "@supabase/supabase-js";

import OrderConfirmation from "@/emails/OrderConfirmation";
import {
  EMAIL_FROM,
  resend,
} from "@/lib/resend";
import {
  createClient as createServerClient,
} from "@/lib/supabase/server";

export const runtime = "nodejs";

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
  price:
    | number
    | string
    | null;
  image:
    | string
    | null;
  stock:
    | number
    | string
    | null;
  active:
    | boolean
    | null;
  reservation_enabled:
    | boolean
    | null;
  reserved_by:
    | string
    | null;
  reserved_until:
    | string
    | null;
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
  coupon:
    | CouponRow
    | null;
  discountAmount: number;
  code:
    | string
    | null;
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

type InventoryMutation = {
  productId: string;
  originalStock: number;
  updatedStock: number;
  originalActive:
    | boolean
    | null;
  originalReservedBy:
    | string
    | null;
  originalReservedUntil:
    | string
    | null;
};

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const EMAIL_PATTERN =
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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
  const parsed =
    Number(value);

  return Number.isFinite(
    parsed
  )
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
  const parsed =
    Number(value);

  if (
    !Number.isFinite(
      parsed
    ) ||
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
      (
        value +
        Number.EPSILON
      ) * 100
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

async function readCheckoutRequest(
  request: NextRequest
): Promise<
  CheckoutRequest | null
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

function getTimestamp(
  value:
    | string
    | null
): number | null {
  if (!value) {
    return null;
  }

  const timestamp =
    new Date(
      value
    ).getTime();

  return Number.isNaN(
    timestamp
  )
    ? null
    : timestamp;
}

function hasActiveReservation(
  product: ProductRow,
  currentTime: number
): boolean {
  const reservationExpiry =
    getTimestamp(
      product.reserved_until
    );

  return (
    Boolean(
      product.reserved_by
    ) &&
    reservationExpiry !==
      null &&
    reservationExpiry >
      currentTime
  );
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

  const activeReservation =
    hasActiveReservation(
      product,
      currentTime
    );

  if (
    activeReservation &&
    product.reserved_by !==
      userId
  ) {
    return `${product.name} is currently reserved by another customer.`;
  }

  if (
    product.reservation_enabled !==
    true
  ) {
    return null;
  }

  if (
    requestedQuantity !== 1
  ) {
    return `${product.name} is a one-of-a-kind piece and can only be purchased in a quantity of one.`;
  }

  if (
    product.reserved_by ===
      userId &&
    reservationExpiry !==
      null &&
    reservationExpiry <=
      currentTime
  ) {
    return `Your reservation for ${product.name} has expired. Please return to the product page and reserve it again.`;
  }

  if (
    !activeReservation ||
    product.reserved_by !==
      userId
  ) {
    return `${product.name} must be reserved before checkout. Please return to the product page and add it to your cart again.`;
  }

  return null;
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
    .eq(
      "code",
      code
    )
    .maybeSingle();

  if (error) {
    throw error;
  }

  const coupon =
    data as
      | CouponRow
      | null;

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
    throw new Error(
      "This coupon has reached its usage limit."
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
    code:
      coupon.code,
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
    .eq(
      "setting_key",
      "store"
    )
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
      settings
        .indiaShippingCost
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

async function rollbackInventory(
  supabase:
    ReturnType<
      typeof getSupabaseAdmin
    >,
  mutations: InventoryMutation[]
): Promise<void> {
  for (
    const mutation of
    [...mutations].reverse()
  ) {
    const {
      error,
    } = await supabase
      .from("products")
      .update({
        stock:
          mutation.originalStock,
        active:
          mutation.originalActive,
        reserved_by:
          mutation.originalReservedBy,
        reserved_until:
          mutation.originalReservedUntil,
      })
      .eq(
        "id",
        mutation.productId
      )
      .eq(
        "stock",
        mutation.updatedStock
      );

    if (error) {
      console.error(
        "Inventory rollback failed:",
        {
          productId:
            mutation.productId,
          error,
        }
      );
    }
  }
}

async function reserveInventoryForOrder(
  supabase:
    ReturnType<
      typeof getSupabaseAdmin
    >,
  productsById:
    Map<
      string,
      ProductRow
    >,
  items: CanonicalOrderItem[],
  userId: string,
  reservationValidationTime:
    number
): Promise<
  | {
      success: true;
      mutations:
        InventoryMutation[];
    }
  | {
      success: false;
      message: string;
      productId: string;
    }
> {
  const mutations:
    InventoryMutation[] = [];

  for (
    const item of items
  ) {
    const product =
      productsById.get(
        item.id
      );

    if (!product) {
      await rollbackInventory(
        supabase,
        mutations
      );

      return {
        success: false,
        message:
          "A cart product could not be found.",
        productId:
          item.id,
      };
    }

    const currentStock =
      Math.max(
        0,
        Math.floor(
          toNumber(
            product.stock
          )
        )
      );

    const newStock =
      Math.max(
        0,
        currentStock -
          item.quantity
      );

    const updatePayload = {
      stock:
        newStock,
      reserved_by:
        null,
      reserved_until:
        null,
      ...(newStock ===
      0
        ? {
            active:
              false,
          }
        : {}),
    };

    let updateQuery =
      supabase
        .from("products")
        .update(
          updatePayload
        )
        .eq(
          "id",
          item.id
        )
        .eq(
          "stock",
          currentStock
        );

    if (
      product.reservation_enabled ===
      true
    ) {
      updateQuery =
        updateQuery
          .eq(
            "reserved_by",
            userId
          )
          .gt(
            "reserved_until",
            new Date(
              reservationValidationTime
            ).toISOString()
          );
    }

    const {
      data,
      error,
    } = await updateQuery
      .select(
        "id"
      )
      .maybeSingle();

    if (
      error ||
      !data
    ) {
      await rollbackInventory(
        supabase,
        mutations
      );

      return {
        success: false,
        message:
          `${product.name} changed while your order was being placed. Please review your cart and try again.`,
        productId:
          product.id,
      };
    }

    mutations.push({
      productId:
        product.id,
      originalStock:
        currentStock,
      updatedStock:
        newStock,
      originalActive:
        product.active,
      originalReservedBy:
        product.reserved_by,
      originalReservedUntil:
        product.reserved_until,
    });
  }

  return {
    success: true,
    mutations,
  };
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
            "You must be signed in to place an order.",
        },
        {
          status: 401,
        }
      );
    }

    const body =
      await readCheckoutRequest(
        request
      );

    if (!body) {
      return NextResponse.json(
        {
          success: false,
          message:
            "The checkout request was invalid.",
        },
        {
          status: 400,
        }
      );
    }

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
      !EMAIL_PATTERN.test(
        email
      ) ||
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

    if (
      paymentMethod ===
      "Credit / Debit Card"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Credit / Debit Card orders must be processed through the Razorpay checkout flow.",
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
          slug,
          name,
          price,
          image,
          stock,
          active,
          reservation_enabled,
          reserved_by,
          reserved_until
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
            "One or more cart products no longer exist.",
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

    const canonicalItems:
      CanonicalOrderItem[] =
        [];

    let subtotal = 0;
    let totalItemQuantity = 0;

    const reservationValidationTime =
      Date.now();

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

      const reservationError =
        getReservationError(
          product,
          requestedItem.quantity,
          user.id,
          reservationValidationTime
        );

      if (
        reservationError
      ) {
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
        id:
          product.id,
        slug:
          product.slug,
        name:
          product.name,
        quantity:
          requestedItem.quantity,
        price,
        image:
          product.image ??
          "",
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
    } catch (
      couponError: unknown
    ) {
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

    const inventoryResult =
      await reserveInventoryForOrder(
        supabase,
        productsById,
        canonicalItems,
        user.id,
        reservationValidationTime
      );

    if (
      !inventoryResult.success
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            inventoryResult.message,
          code:
            "INVENTORY_CHANGED",
          product_id:
            inventoryResult.productId,
        },
        {
          status: 409,
        }
      );
    }

    const orderStatus =
      "Pending";

    const paymentStatus =
      "Pending";

    const {
      data:
        order,
      error:
        orderError,
    } = await supabase
      .from("orders")
      .insert({
        user_id:
          user.id,

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
      await rollbackInventory(
        supabase,
        inventoryResult.mutations
      );

      return NextResponse.json(
        {
          success: false,
          message:
            orderError
              ?.message ??
            "Failed to create order.",
        },
        {
          status: 500,
        }
      );
    }

    if (
      couponResult.coupon
    ) {
      const {
        error:
          usageError,
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
          {
            orderId:
              order.id,
            couponId:
              couponResult
                .coupon.id,
            error:
              usageError,
          }
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
    } catch (
      emailError: unknown
    ) {
      console.error(
        "Order confirmation email error:",
        {
          orderId:
            order.id,
          email,
          error:
            emailError,
        }
      );
    }

    return NextResponse.json(
      {
        success: true,

        order,

        pricing: {
          currency:
            "INR",

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
  } catch (
    error: unknown
  ) {
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