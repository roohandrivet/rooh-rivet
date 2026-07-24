import {
  NextResponse,
} from "next/server";
import {
  createClient,
} from "@supabase/supabase-js";

type CouponRow = {
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
  const parsed =
    Number(value);

  return Number.isFinite(
    parsed
  )
    ? parsed
    : 0;
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

function hasReachedUsageLimit(
  coupon: CouponRow
): boolean {
  if (
    coupon.maximum_uses ===
    null
  ) {
    return false;
  }

  const maximumUses =
    toNumber(
      coupon.maximum_uses
    );

  const usageCount =
    toNumber(
      coupon.usage_count
    );

  return (
    usageCount >=
    maximumUses
  );
}

function createCouponMessage(
  coupon: CouponRow
): string {
  const discountValue =
    Math.max(
      0,
      toNumber(
        coupon.discount_value
      )
    );

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

  const discountText =
    coupon.discount_type ===
    "percentage"
      ? `${discountValue}% off`
      : `₹${discountValue.toLocaleString(
          "en-IN"
        )} off`;

  const minimumText =
    minimumOrder > 0
      ? ` on orders over ₹${minimumOrder.toLocaleString(
          "en-IN"
        )}`
      : "";

  return `${discountText}${minimumText}`;
}

export async function GET() {
  try {
    const supabase =
      getSupabaseAdmin();

    const {
      data,
      error,
    } = await supabase
      .from("coupons")
      .select(
        `
          code,
          discount_type,
          discount_value,
          minimum_order,
          expiry_date,
          maximum_uses,
          usage_count,
          active,
          created_at
        `
      )
      .eq("active", true)
      .order(
        "created_at",
        {
          ascending:
            false,
        }
      )
      .limit(20);

    if (error) {
      throw error;
    }

    const coupons =
      (data ??
        []) as CouponRow[];

    const activeCoupon =
      coupons.find(
        (coupon) =>
          !isCouponExpired(
            coupon.expiry_date
          ) &&
          !hasReachedUsageLimit(
            coupon
          )
      );

    const response =
      NextResponse.json({
        success: true,

        coupon:
          activeCoupon
            ? {
                code:
                  activeCoupon.code,

                message:
                  createCouponMessage(
                    activeCoupon
                  ),
              }
            : null,
      });

    response.headers.set(
      "Cache-Control",
      "public, s-maxage=60, stale-while-revalidate=300"
    );

    return response;
  } catch (error) {
    console.error(
      "Coupon banner error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        coupon: null,
      },
      {
        status: 500,
      }
    );
  }
}