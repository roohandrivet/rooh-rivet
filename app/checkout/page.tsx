"use client";

import {
  type FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  Check,
  Clock3,
  Loader2,
  ShieldCheck,
  Tag,
  X,
} from "lucide-react";

import { supabase } from "@/lib/supabase";
import { useCart } from "@/context/CartContext";
import { useCurrency } from "@/context/CurrencyContext";

type CheckoutForm = {
  fullName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  paymentMethod: string;
};

type CheckoutRequestItem = {
  id: string;
  quantity: number;
};

type CheckoutRequest = {
  customer_name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  payment_method: string;
  coupon_code: string | null;
  items: CheckoutRequestItem[];
};

type CouponDetails = {
  code: string;
  discount_type: "percentage" | "fixed";
  discount_value: number;
};

type CouponResponse = {
  success: boolean;
  message?: string;
  coupon?: CouponDetails;
  subtotal?: number;
  discount_amount?: number;
  total?: number;
};

type AppliedCoupon = {
  code: string;
  discountType: "percentage" | "fixed";
  discountValue: number;
  discountAmount: number;
  subtotal: number;
  total: number;
  cartSignature: string;
};

type CheckoutResponse = {
  success: boolean;
  message?: string;
  code?: string;
  product_id?: string;
  order?: {
    id: string | number;
  };
};

type ShippingSettings = {
  indiaShippingCost: number;
  indiaFreeShippingThreshold: number;
  internationalShippingPerItem: number;
  internationalDiscountThreshold: number;
  internationalShippingDiscountPercent: number;
};

const INITIAL_FORM: CheckoutForm = {
  fullName: "",
  email: "",
  phone: "",
  address: "",
  city: "",
  state: "",
  postalCode: "",
  country: "",
  paymentMethod: "Credit / Debit Card",
};

const DEFAULT_SHIPPING_SETTINGS: ShippingSettings = {
  indiaShippingCost: 100,
  indiaFreeShippingThreshold: 999,
  internationalShippingPerItem: 1000,
  internationalDiscountThreshold: 10000,
  internationalShippingDiscountPercent: 50,
};

const INDIA_COUNTRY_NAMES = new Set([
  "india",
  "in",
  "bharat",
  "republic of india",
]);

function toSafeNumber(
  value: unknown,
  fallback: number
): number {
  const parsedValue = Number(value);

  if (
    !Number.isFinite(parsedValue) ||
    parsedValue < 0
  ) {
    return fallback;
  }

  return parsedValue;
}

function roundCurrency(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function formatRemainingTime(
  totalSeconds: number
): string {
  const safeSeconds = Math.max(
    0,
    Math.floor(totalSeconds)
  );

  const minutes = Math.floor(
    safeSeconds / 60
  );

  const seconds = safeSeconds % 60;

  return `${minutes}:${seconds
    .toString()
    .padStart(2, "0")}`;
}

export default function CheckoutPage() {
  const router = useRouter();

  const {
    cart,
    clearCart,
    hydrated,
    reservationError,
    clearReservationError,
    getReservationRemainingSeconds,
    isReservationExpired,
  } = useCart();

  const {
    formatPrice,
  } = useCurrency();

  const [
    checkingAuth,
    setCheckingAuth,
  ] = useState(true);

  const [
    loadingShippingSettings,
    setLoadingShippingSettings,
  ] = useState(true);

  const [
    loading,
    setLoading,
  ] = useState(false);

  const [
    checkoutError,
    setCheckoutError,
  ] = useState("");

  const [
    applyingCoupon,
    setApplyingCoupon,
  ] = useState(false);

  const [
    couponCode,
    setCouponCode,
  ] = useState("");

  const [
    couponError,
    setCouponError,
  ] = useState("");

  const [
    shippingSettingsError,
    setShippingSettingsError,
  ] = useState("");

  const [
    appliedCoupon,
    setAppliedCoupon,
  ] = useState<AppliedCoupon | null>(null);

  const [
    shippingSettings,
    setShippingSettings,
  ] = useState<ShippingSettings>(
    DEFAULT_SHIPPING_SETTINGS
  );

  const [
    form,
    setForm,
  ] = useState<CheckoutForm>(INITIAL_FORM);

  const cartSignature = useMemo(
    () =>
      cart
        .map(
          (item) =>
            `${item.id}:${item.quantity}`
        )
        .sort()
        .join("|"),
    [cart]
  );

  const localSubtotal = useMemo(
    () =>
      cart.reduce(
        (
          runningTotal,
          item
        ) =>
          runningTotal +
          Number(item.price || 0) *
            Number(item.quantity || 0),
        0
      ),
    [cart]
  );

  const totalItemQuantity = useMemo(
    () =>
      cart.reduce(
        (
          runningQuantity,
          item
        ) =>
          runningQuantity +
          Number(item.quantity || 0),
        0
      ),
    [cart]
  );

  const displayedSubtotal = appliedCoupon
    ? appliedCoupon.subtotal
    : localSubtotal;

  const discountAmount = appliedCoupon
    ? appliedCoupon.discountAmount
    : 0;

  const merchandiseTotal = appliedCoupon
    ? appliedCoupon.total
    : localSubtotal;

  const normalizedCountry = form.country
    .trim()
    .toLowerCase();

  const hasDestination =
    normalizedCountry.length > 0;

  const isIndiaDestination =
    INDIA_COUNTRY_NAMES.has(normalizedCountry);

  const shipping = useMemo(() => {
    if (
      cart.length === 0 ||
      !hasDestination
    ) {
      return 0;
    }

    if (isIndiaDestination) {
      if (
        displayedSubtotal >=
        shippingSettings.indiaFreeShippingThreshold
      ) {
        return 0;
      }

      return roundCurrency(
        shippingSettings.indiaShippingCost
      );
    }

    const fullInternationalShipping =
      shippingSettings
        .internationalShippingPerItem *
      totalItemQuantity;

    if (
      displayedSubtotal >=
      shippingSettings
        .internationalDiscountThreshold
    ) {
      const discountPercent = Math.min(
        100,
        Math.max(
          0,
          shippingSettings
            .internationalShippingDiscountPercent
        )
      );

      return roundCurrency(
        fullInternationalShipping *
          (1 - discountPercent / 100)
      );
    }

    return roundCurrency(
      fullInternationalShipping
    );
  }, [
    cart.length,
    displayedSubtotal,
    hasDestination,
    isIndiaDestination,
    shippingSettings,
    totalItemQuantity,
  ]);

  const displayedTotal = Math.max(
    0,
    merchandiseTotal + shipping
  );

  const internationalShippingDiscountApplied =
    hasDestination &&
    !isIndiaDestination &&
    displayedSubtotal >=
      shippingSettings
        .internationalDiscountThreshold &&
    shipping > 0;

  const invalidReservedItem = cart.find(
    (item) =>
      item.reservationEnabled === true &&
      (
        !item.reservedUntil ||
        isReservationExpired(item.id) ||
        getReservationRemainingSeconds(
          item.id
        ) <= 0
      )
  );

  const hasInvalidReservation =
    Boolean(invalidReservedItem);

  useEffect(() => {
    void checkLogin();
    void loadShippingSettings();
  }, []);

  useEffect(() => {
    if (
      appliedCoupon &&
      appliedCoupon.cartSignature !==
        cartSignature
    ) {
      setAppliedCoupon(null);
      setCouponCode("");
      setCouponError(
        "Your cart changed. Apply the coupon again."
      );
    }
  }, [
    appliedCoupon,
    cartSignature,
  ]);

  async function checkLogin() {
    try {
      const {
        data: {
          user,
        },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace(
          "/auth/login?redirect=/checkout"
        );

        return;
      }

      setForm(
        (previous) => ({
          ...previous,
          fullName:
            typeof user.user_metadata
              ?.full_name === "string"
              ? user.user_metadata.full_name
              : "",
          email: user.email ?? "",
          phone:
            typeof user.user_metadata
              ?.phone === "string"
              ? user.user_metadata.phone
              : "",
          address:
            typeof user.user_metadata
              ?.address === "string"
              ? user.user_metadata.address
              : "",
          city:
            typeof user.user_metadata
              ?.city === "string"
              ? user.user_metadata.city
              : "",
          state:
            typeof user.user_metadata
              ?.state === "string"
              ? user.user_metadata.state
              : "",
          postalCode:
            typeof user.user_metadata
              ?.postal_code === "string"
              ? user.user_metadata.postal_code
              : "",
          country:
            typeof user.user_metadata
              ?.country === "string"
              ? user.user_metadata.country
              : "",
        })
      );
    } catch (error) {
      console.error(
        "Unable to check checkout user:",
        error
      );

      router.replace(
        "/auth/login?redirect=/checkout"
      );
    } finally {
      setCheckingAuth(false);
    }
  }

  async function loadShippingSettings() {
    setLoadingShippingSettings(true);
    setShippingSettingsError("");

    try {
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

      if (!data) {
        setShippingSettings(
          DEFAULT_SHIPPING_SETTINGS
        );

        return;
      }

      setShippingSettings({
        indiaShippingCost: toSafeNumber(
          data.india_shipping_cost,
          DEFAULT_SHIPPING_SETTINGS
            .indiaShippingCost
        ),
        indiaFreeShippingThreshold:
          toSafeNumber(
            data.india_free_shipping_threshold,
            DEFAULT_SHIPPING_SETTINGS
              .indiaFreeShippingThreshold
          ),
        internationalShippingPerItem:
          toSafeNumber(
            data.international_shipping_per_item,
            DEFAULT_SHIPPING_SETTINGS
              .internationalShippingPerItem
          ),
        internationalDiscountThreshold:
          toSafeNumber(
            data.international_discount_threshold,
            DEFAULT_SHIPPING_SETTINGS
              .internationalDiscountThreshold
          ),
        internationalShippingDiscountPercent:
          toSafeNumber(
            data.international_shipping_discount_percent,
            DEFAULT_SHIPPING_SETTINGS
              .internationalShippingDiscountPercent
          ),
      });
    } catch (error) {
      console.error(
        "Unable to load shipping settings:",
        error
      );

      setShippingSettings(
        DEFAULT_SHIPPING_SETTINGS
      );

      setShippingSettingsError(
        "Live shipping rates could not be loaded. Default shipping rates are being used."
      );
    } finally {
      setLoadingShippingSettings(false);
    }
  }

  function updateField(
    field: keyof CheckoutForm,
    value: string
  ) {
    setForm(
      (previous) => ({
        ...previous,
        [field]: value,
      })
    );

    setCheckoutError("");
    clearReservationError();
  }

  function getRequestItems():
    CheckoutRequestItem[] {
    return cart.map(
      (item) => ({
        id: item.id,
        quantity: Number(item.quantity),
      })
    );
  }

  async function applyCoupon() {
    const normalizedCode = couponCode
      .trim()
      .toUpperCase();

    if (!normalizedCode) {
      setCouponError(
        "Enter a coupon code."
      );

      return;
    }

    if (cart.length === 0) {
      setCouponError(
        "Your cart is empty."
      );

      return;
    }

    setApplyingCoupon(true);
    setCouponError("");

    try {
      const response = await fetch(
        "/api/coupons/validate",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            code: normalizedCode,
            items: getRequestItems(),
          }),
        }
      );

      const result =
        (await response.json()) as
          CouponResponse;

      if (
        !response.ok ||
        !result.success ||
        !result.coupon ||
        typeof result.subtotal !==
          "number" ||
        typeof result.discount_amount !==
          "number" ||
        typeof result.total !==
          "number"
      ) {
        throw new Error(
          result.message ??
            "Unable to apply coupon."
        );
      }

      setAppliedCoupon({
        code: result.coupon.code,
        discountType:
          result.coupon.discount_type,
        discountValue:
          result.coupon.discount_value,
        discountAmount:
          result.discount_amount,
        subtotal: result.subtotal,
        total: result.total,
        cartSignature,
      });

      setCouponCode(
        result.coupon.code
      );

      setCouponError("");
    } catch (error) {
      setAppliedCoupon(null);

      setCouponError(
        error instanceof Error
          ? error.message
          : "Unable to apply coupon."
      );
    } finally {
      setApplyingCoupon(false);
    }
  }

  function removeCoupon() {
    setAppliedCoupon(null);
    setCouponCode("");
    setCouponError("");
  }

  async function handleCheckout(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setCheckoutError("");
    clearReservationError();

    if (cart.length === 0) {
      setCheckoutError(
        "Your cart is empty."
      );

      return;
    }

    const expiredReservation =
      cart.find(
        (item) =>
          item.reservationEnabled ===
            true &&
          (
            !item.reservedUntil ||
            isReservationExpired(
              item.id
            ) ||
            getReservationRemainingSeconds(
              item.id
            ) <= 0
          )
      );

    if (expiredReservation) {
      setCheckoutError(
        `${expiredReservation.name} is no longer reserved. Return to the product page and reserve it again before placing your order.`
      );

      return;
    }

    if (loadingShippingSettings) {
      setCheckoutError(
        "Shipping rates are still loading."
      );

      return;
    }

    setLoading(true);

    try {
      const {
        data: {
          user,
        },
        error: userError,
      } = await supabase.auth.getUser();

      if (
        userError ||
        !user
      ) {
        router.replace(
          "/auth/login?redirect=/checkout"
        );

        return;
      }

      const {
        error: profileUpdateError,
      } =
        await supabase.auth.updateUser({
          data: {
            full_name:
              form.fullName.trim(),
            phone:
              form.phone.trim(),
            address:
              form.address.trim(),
            city:
              form.city.trim(),
            state:
              form.state.trim(),
            postal_code:
              form.postalCode.trim(),
            country:
              form.country.trim(),
          },
        });

      if (profileUpdateError) {
        console.error(
          "Profile update error:",
          profileUpdateError
        );
      }

      const payload: CheckoutRequest = {
        customer_name:
          form.fullName.trim(),
        email: form.email
          .trim()
          .toLowerCase(),
        phone:
          form.phone.trim(),
        address:
          form.address.trim(),
        city:
          form.city.trim(),
        state:
          form.state.trim(),
        postal_code:
          form.postalCode.trim(),
        country:
          form.country.trim(),
        payment_method:
          form.paymentMethod,
        coupon_code:
          appliedCoupon?.code ??
          null,
        items:
          getRequestItems(),
      };

      const response = await fetch(
        "/api/checkout",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body:
            JSON.stringify(
              payload
            ),
        }
      );

      const result =
        (await response
          .json()
          .catch(
            () => ({
              success: false,
              message:
                "The checkout service returned an invalid response.",
            })
          )) as CheckoutResponse;

      if (
        !response.ok ||
        !result.success ||
        !result.order
      ) {
        const message =
          result.message ??
          "Failed to place order.";

        if (
          result.code ===
          "RESERVATION_INVALID"
        ) {
          setCheckoutError(
            message
          );

          return;
        }

        throw new Error(
          message
        );
      }

      clearCart();

      router.push(
        `/order-success?id=${result.order.id}`
      );
    } catch (error) {
      console.error(
        "Checkout error:",
        error
      );

      setCheckoutError(
        error instanceof Error
          ? error.message
          : "Something went wrong while placing your order."
      );
    } finally {
      setLoading(false);
    }
  }

  if (
    !hydrated ||
    checkingAuth ||
    loadingShippingSettings
  ) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F8F4EF]">
        <div className="text-center">
          <Loader2
            size={38}
            className="mx-auto animate-spin text-[#5A2D2D]"
          />

          <p className="mt-4 text-[#5A2D2D]">
            Preparing checkout...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F8F4EF] py-12">
      <div className="mx-auto max-w-7xl px-6">
        <Link
          href="/cart"
          className="mb-8 inline-flex items-center gap-2 text-[#5A2D2D] transition hover:underline"
        >
          <ArrowLeft size={18} />
          Back to Cart
        </Link>

        <h1 className="mb-10 font-serif text-5xl text-[#4B2E2E]">
          Checkout
        </h1>

        {shippingSettingsError ? (
          <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-800">
            {shippingSettingsError}
          </div>
        ) : null}

        {reservationError ? (
          <div className="mb-6 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-800">
            <AlertCircle
              size={20}
              className="mt-0.5 shrink-0"
            />

            <p>
              {reservationError}
            </p>
          </div>
        ) : null}

        {checkoutError ? (
          <div className="mb-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
            <AlertCircle
              size={20}
              className="mt-0.5 shrink-0"
            />

            <p>
              {checkoutError}
            </p>
          </div>
        ) : null}

        <form
          onSubmit={handleCheckout}
          className="grid gap-10 lg:grid-cols-[2fr_1fr]"
        >
          <section className="rounded-3xl border border-[#E8DDD3] bg-white p-6 shadow-sm sm:p-8">
            <h2 className="mb-8 font-serif text-3xl text-[#4B2E2E]">
              Shipping Information
            </h2>

            <div className="grid gap-6 md:grid-cols-2">
              <input
                required
                autoComplete="name"
                placeholder="Full Name"
                value={form.fullName}
                onChange={(event) =>
                  updateField(
                    "fullName",
                    event.target.value
                  )
                }
                className="rounded-xl border border-[#DED3CB] bg-white p-4 text-[#4B2E2E] outline-none transition placeholder:text-[#A79084] focus:border-[#5A2D2D]"
              />

              <input
                required
                type="email"
                autoComplete="email"
                placeholder="Email Address"
                value={form.email}
                onChange={(event) =>
                  updateField(
                    "email",
                    event.target.value
                  )
                }
                className="rounded-xl border border-[#DED3CB] bg-white p-4 text-[#4B2E2E] outline-none transition placeholder:text-[#A79084] focus:border-[#5A2D2D]"
              />

              <input
                required
                type="tel"
                autoComplete="tel"
                placeholder="Phone Number"
                value={form.phone}
                onChange={(event) =>
                  updateField(
                    "phone",
                    event.target.value
                  )
                }
                className="rounded-xl border border-[#DED3CB] bg-white p-4 text-[#4B2E2E] outline-none transition placeholder:text-[#A79084] focus:border-[#5A2D2D] md:col-span-2"
              />

              <input
                required
                autoComplete="street-address"
                placeholder="Street Address"
                value={form.address}
                onChange={(event) =>
                  updateField(
                    "address",
                    event.target.value
                  )
                }
                className="rounded-xl border border-[#DED3CB] bg-white p-4 text-[#4B2E2E] outline-none transition placeholder:text-[#A79084] focus:border-[#5A2D2D] md:col-span-2"
              />

              <input
                required
                autoComplete="address-level2"
                placeholder="City"
                value={form.city}
                onChange={(event) =>
                  updateField(
                    "city",
                    event.target.value
                  )
                }
                className="rounded-xl border border-[#DED3CB] bg-white p-4 text-[#4B2E2E] outline-none transition placeholder:text-[#A79084] focus:border-[#5A2D2D]"
              />

              <input
                required
                autoComplete="address-level1"
                placeholder="State / Province"
                value={form.state}
                onChange={(event) =>
                  updateField(
                    "state",
                    event.target.value
                  )
                }
                className="rounded-xl border border-[#DED3CB] bg-white p-4 text-[#4B2E2E] outline-none transition placeholder:text-[#A79084] focus:border-[#5A2D2D]"
              />

              <input
                required
                autoComplete="postal-code"
                placeholder="Postal / ZIP Code"
                value={form.postalCode}
                onChange={(event) =>
                  updateField(
                    "postalCode",
                    event.target.value
                  )
                }
                className="rounded-xl border border-[#DED3CB] bg-white p-4 text-[#4B2E2E] outline-none transition placeholder:text-[#A79084] focus:border-[#5A2D2D]"
              />

              <input
                required
                autoComplete="country-name"
                placeholder="Country"
                value={form.country}
                onChange={(event) =>
                  updateField(
                    "country",
                    event.target.value
                  )
                }
                className="rounded-xl border border-[#DED3CB] bg-white p-4 text-[#4B2E2E] outline-none transition placeholder:text-[#A79084] focus:border-[#5A2D2D]"
              />
            </div>

            <div className="mt-10">
              <h3 className="mb-5 font-serif text-2xl text-[#4B2E2E]">
                Payment Method
              </h3>

              <div className="space-y-4">
                {[
                  {
                    value:
                      "Credit / Debit Card",
                    description:
                      "Secure online payment.",
                  },
                  {
                    value:
                      "Bank Transfer",
                    description:
                      "Bank instructions will be emailed after ordering.",
                  },
                ].map((method) => (
                  <label
                    key={method.value}
                    className={`flex cursor-pointer items-center gap-4 rounded-xl border p-5 transition ${
                      form.paymentMethod ===
                      method.value
                        ? "border-[#5A2D2D] bg-[#FCF8F4]"
                        : "border-[#DED3CB] hover:border-[#5A2D2D]"
                    }`}
                  >
                    <input
                      type="radio"
                      name="payment"
                      value={method.value}
                      checked={
                        form.paymentMethod ===
                        method.value
                      }
                      onChange={(event) =>
                        updateField(
                          "paymentMethod",
                          event.target.value
                        )
                      }
                      className="accent-[#5A2D2D]"
                    />

                    <div>
                      <p className="font-semibold text-[#4B2E2E]">
                        {method.value}
                      </p>

                      <p className="mt-1 text-sm text-[#8B6B5B]">
                        {method.description}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </section>

          <aside className="h-fit rounded-3xl border border-[#E8DDD3] bg-white p-6 shadow-sm sm:p-8 lg:sticky lg:top-32">
            <h2 className="mb-6 font-serif text-3xl text-[#4B2E2E]">
              Order Summary
            </h2>

            <div className="space-y-5">
              {cart.length === 0 ? (
                <p className="text-sm text-[#8B6B5B]">
                  Your cart is empty.
                </p>
              ) : (
                cart.map((item) => {
                  const isReserved =
                    item.reservationEnabled ===
                    true;

                  const remainingSeconds =
                    isReserved
                      ? getReservationRemainingSeconds(
                          item.id
                        )
                      : 0;

                  const expired =
                    isReserved &&
                    isReservationExpired(
                      item.id
                    );

                  return (
                    <div
                      key={item.id}
                      className="rounded-2xl border border-[#EEE4DC] bg-[#FCFAF7] p-4"
                    >
                      <div className="flex justify-between gap-4 text-sm text-[#4B2E2E]">
                        <span className="leading-6">
                          {item.name} ×{" "}
                          {item.quantity}
                        </span>

                        <span className="shrink-0 font-medium">
                          {formatPrice(
                            Number(
                              item.price
                            ) *
                              Number(
                                item.quantity
                              )
                          )}
                        </span>
                      </div>

                      {isReserved ? (
                        <div
                          className={`mt-3 flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold ${
                            expired
                              ? "bg-red-50 text-red-700"
                              : "bg-[#F3E8E0] text-[#5A2D2D]"
                          }`}
                        >
                          <Clock3
                            size={15}
                            className="shrink-0"
                          />

                          {expired
                            ? "Reservation expired"
                            : `Reserved · ${formatRemainingTime(
                                remainingSeconds
                              )} remaining`}
                        </div>
                      ) : null}
                    </div>
                  );
                })
              )}

              <div className="border-t border-[#E8DDD3] pt-5">
                <div className="mb-3 flex justify-between text-[#8B6B5B]">
                  <span>Subtotal</span>

                  <span>
                    {formatPrice(
                      displayedSubtotal
                    )}
                  </span>
                </div>

                <div className="mb-3 flex justify-between gap-4 text-[#8B6B5B]">
                  <span>Shipping</span>

                  <span
                    className={
                      shipping === 0 &&
                      hasDestination
                        ? "text-emerald-600"
                        : "text-right"
                    }
                  >
                    {!hasDestination
                      ? "Enter country"
                      : shipping === 0
                        ? "Free"
                        : formatPrice(
                            shipping
                          )}
                  </span>
                </div>

                {internationalShippingDiscountApplied ? (
                  <p className="mb-3 text-right text-xs leading-5 text-emerald-700">
                    International shipping
                    discount applied (
                    {
                      shippingSettings
                        .internationalShippingDiscountPercent
                    }
                    % off).
                  </p>
                ) : null}

                {appliedCoupon ? (
                  <div className="mb-3 flex items-center justify-between gap-4 text-emerald-700">
                    <span className="inline-flex items-center gap-2">
                      <Tag size={15} />
                      {appliedCoupon.code}
                    </span>

                    <span>
                      -
                      {formatPrice(
                        discountAmount
                      )}
                    </span>
                  </div>
                ) : null}

                <div className="mb-5 flex justify-between gap-4 text-[#8B6B5B]">
                  <span>Payment</span>

                  <span className="text-right">
                    {form.paymentMethod}
                  </span>
                </div>

                <div className="border-t border-[#E8DDD3] pt-5">
                  <p className="mb-3 text-sm font-semibold uppercase tracking-[0.14em] text-[#8B6B5B]">
                    Coupon
                  </p>

                  {appliedCoupon ? (
                    <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-100">
                          <Check
                            size={17}
                            className="text-emerald-700"
                          />
                        </div>

                        <div className="min-w-0">
                          <p className="truncate font-semibold text-emerald-800">
                            {
                              appliedCoupon.code
                            }
                          </p>

                          <p className="text-xs text-emerald-700">
                            Coupon applied
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={
                          removeCoupon
                        }
                        aria-label="Remove coupon"
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-emerald-700 transition hover:bg-emerald-100"
                      >
                        <X size={17} />
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <input
                        value={couponCode}
                        onChange={(
                          event
                        ) => {
                          setCouponCode(
                            event.target.value.toUpperCase()
                          );

                          setCouponError(
                            ""
                          );
                        }}
                        onKeyDown={(
                          event
                        ) => {
                          if (
                            event.key ===
                            "Enter"
                          ) {
                            event.preventDefault();
                            void applyCoupon();
                          }
                        }}
                        placeholder="Enter code"
                        autoComplete="off"
                        className="min-w-0 flex-1 rounded-xl border border-[#DED3CB] px-4 py-3 uppercase text-[#4B2E2E] outline-none transition placeholder:normal-case placeholder:text-[#A79084] focus:border-[#5A2D2D]"
                      />

                      <button
                        type="button"
                        onClick={() =>
                          void applyCoupon()
                        }
                        disabled={
                          applyingCoupon ||
                          !couponCode.trim()
                        }
                        className="rounded-xl border border-[#5A2D2D] px-4 py-3 text-sm font-semibold text-[#5A2D2D] transition hover:bg-[#F8F4EF] disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {applyingCoupon
                          ? "Applying..."
                          : "Apply"}
                      </button>
                    </div>
                  )}

                  {couponError ? (
                    <p className="mt-2 text-sm leading-5 text-red-600">
                      {couponError}
                    </p>
                  ) : null}
                </div>

                <div className="mt-5 flex justify-between border-t border-[#E8DDD3] pt-5 text-2xl font-bold text-[#4B2E2E]">
                  <span>Total</span>

                  <span>
                    {formatPrice(
                      displayedTotal
                    )}
                  </span>
                </div>
              </div>

              <button
                type="submit"
                disabled={
                  loading ||
                  applyingCoupon ||
                  loadingShippingSettings ||
                  cart.length === 0 ||
                  hasInvalidReservation
                }
                className="mt-8 flex w-full items-center justify-center gap-2 rounded-xl bg-[#5A2D2D] px-6 py-4 text-lg font-semibold text-white transition hover:bg-[#4B2E2E] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <Loader2
                      size={20}
                      className="animate-spin"
                    />

                    Placing Order...
                  </>
                ) : hasInvalidReservation ? (
                  <>
                    <AlertCircle
                      size={20}
                    />

                    Reservation Expired
                  </>
                ) : (
                  <>
                    <ShieldCheck
                      size={20}
                    />

                    Place Order
                  </>
                )}
              </button>

              {cart.some(
                (item) =>
                  item.reservationEnabled ===
                  true
              ) ? (
                <p className="mt-4 text-center text-sm leading-6 text-[#5A2D2D]">
                  Reserved pieces must be
                  purchased before their
                  countdown expires.
                </p>
              ) : null}

              <p className="mt-4 text-center text-sm leading-6 text-[#8B6B5B]">
                By placing your order you agree
                to our Terms &amp; Conditions and
                Privacy Policy.
              </p>
            </div>
          </aside>
        </form>
      </div>
    </main>
  );
}