"use client";

import {
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import Link from "next/link";
import {
  useParams,
  useRouter,
} from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Package,
  Star,
} from "lucide-react";

import {
  supabase,
} from "@/lib/supabase";

type OrderItem = {
  id: string;
  slug: string;
  name: string;
  image: string | null;
  quantity: number;
  price: number;
};

type Order = {
  id: string;
  user_id: string | null;
  customer_name: string | null;
  email: string | null;
  status: string | null;
  items: OrderItem[];
};

type RawOrder = Omit<
  Order,
  "items"
> & {
  items: unknown;
};

type ExistingReviewRow = {
  product_id:
    | string
    | null;
};

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
  value: unknown
): number {
  const parsed =
    Number(value);

  return Number.isFinite(
    parsed
  )
    ? parsed
    : 0;
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
        rawItem,
        index
      ): OrderItem | null => {
        if (
          !isRecord(rawItem)
        ) {
          return null;
        }

        const id =
          getString(
            rawItem.id
          );

        const name =
          getString(
            rawItem.name
          );

        if (
          !id ||
          !name
        ) {
          return null;
        }

        const slug =
          getString(
            rawItem.slug
          );

        const image =
          getString(
            rawItem.image
          );

        const quantity =
          Math.max(
            1,
            Math.floor(
              toNumber(
                rawItem.quantity
              )
            )
          );

        const price =
          Math.max(
            0,
            toNumber(
              rawItem.price
            )
          );

        return {
          id:
            id ||
            `item-${index}`,
          slug,
          name,
          image:
            image || null,
          quantity,
          price,
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

function getOrderId(
  value:
    | string
    | string[]
    | undefined
): string {
  if (
    Array.isArray(value)
  ) {
    return value[0]?.trim() ?? "";
  }

  return value?.trim() ?? "";
}

export default function ReviewPage() {
  const params =
    useParams<{
      id:
        | string
        | string[];
    }>();

  const router =
    useRouter();

  const orderId =
    getOrderId(
      params.id
    );

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    saving,
    setSaving,
  ] =
    useState(false);

  const [
    order,
    setOrder,
  ] =
    useState<Order | null>(
      null
    );

  const [
    reviewedProductIds,
    setReviewedProductIds,
  ] =
    useState<string[]>([]);

  const [
    selectedProductId,
    setSelectedProductId,
  ] =
    useState("");

  const [
    rating,
    setRating,
  ] =
    useState(5);

  const [
    title,
    setTitle,
  ] =
    useState("");

  const [
    review,
    setReview,
  ] =
    useState("");

  const [
    error,
    setError,
  ] =
    useState("");

  const loadOrder =
    useCallback(
      async (): Promise<void> => {
        if (!orderId) {
          setError(
            "Invalid order reference."
          );
          setLoading(false);
          return;
        }

        setLoading(true);
        setError("");

        try {
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
            router.replace(
              `/auth/login?redirect=${encodeURIComponent(
                `/account/orders/${orderId}/review`
              )}`
            );

            return;
          }

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

          if (
            orderError
          ) {
            throw orderError;
          }

          if (
            !orderData
          ) {
            setOrder(null);
            setError(
              "This order could not be found or does not belong to your account."
            );
            return;
          }

          const rawOrder =
            orderData as RawOrder;

          const parsedOrder:
            Order = {
              ...rawOrder,
              items:
                parseOrderItems(
                  rawOrder.items
                ),
            };

          const normalizedStatus =
            parsedOrder.status
              ?.trim()
              .toLowerCase() ??
            "";

          if (
            normalizedStatus !==
            "delivered"
          ) {
            router.replace(
              `/account/orders/${encodeURIComponent(
                orderId
              )}`
            );

            return;
          }

          if (
            parsedOrder.items.length ===
            0
          ) {
            setOrder(
              parsedOrder
            );
            setError(
              "No reviewable products were found in this order."
            );
            return;
          }

          const productIds =
            parsedOrder.items.map(
              (item) =>
                item.id
            );

          const {
            data:
              existingReviews,
            error:
              reviewError,
          } = await supabase
            .from("reviews")
            .select(
              "product_id"
            )
            .eq(
              "order_id",
              parsedOrder.id
            )
            .in(
              "product_id",
              productIds
            );

          if (
            reviewError
          ) {
            throw reviewError;
          }

          const reviewedIds =
            (
              (existingReviews ??
                []) as ExistingReviewRow[]
            )
              .map(
                (existingReview) =>
                  existingReview
                    .product_id
              )
              .filter(
                (
                  productId
                ): productId is string =>
                  Boolean(productId)
              );

          const firstAvailableProduct =
            parsedOrder.items.find(
              (item) =>
                !reviewedIds.includes(
                  item.id
                )
            );

          setOrder(
            parsedOrder
          );

          setReviewedProductIds(
            reviewedIds
          );

          setSelectedProductId(
            firstAvailableProduct
              ?.id ??
              ""
          );
        } catch (
          loadError: unknown
        ) {
          console.error(
            "Failed to load review order:",
            loadError
          );

          setOrder(null);

          setError(
            loadError instanceof
            Error
              ? loadError.message
              : "Unable to load this order."
          );
        } finally {
          setLoading(false);
        }
      },
      [
        orderId,
        router,
      ]
    );

  useEffect(() => {
    void loadOrder();
  }, [loadOrder]);

  const availableProducts =
    useMemo(
      () =>
        order?.items.filter(
          (item) =>
            !reviewedProductIds.includes(
              item.id
            )
        ) ??
        [],
      [
        order,
        reviewedProductIds,
      ]
    );

  const selectedProduct =
    useMemo(
      () =>
        availableProducts.find(
          (item) =>
            item.id ===
            selectedProductId
        ) ??
        null,
      [
        availableProducts,
        selectedProductId,
      ]
    );

  const allProductsReviewed =
    order !== null &&
    order.items.length > 0 &&
    availableProducts.length === 0;

  async function handleSubmit(
    event:
      FormEvent<HTMLFormElement>
  ): Promise<void> {
    event.preventDefault();

    if (
      !order ||
      !selectedProduct
    ) {
      setError(
        "Select a product from this order."
      );
      return;
    }

    const normalizedTitle =
      title.trim();

    const normalizedReview =
      review.trim();

    if (
      rating < 1 ||
      rating > 5
    ) {
      setError(
        "Select a rating between one and five stars."
      );
      return;
    }

    if (
      normalizedTitle.length <
      3
    ) {
      setError(
        "Enter a review title of at least three characters."
      );
      return;
    }

    if (
      normalizedTitle.length >
      120
    ) {
      setError(
        "Keep the review title under 120 characters."
      );
      return;
    }

    if (
      normalizedReview.length <
      10
    ) {
      setError(
        "Write at least ten characters in your review."
      );
      return;
    }

    if (
      normalizedReview.length >
      2000
    ) {
      setError(
        "Keep your review under 2,000 characters."
      );
      return;
    }

    setSaving(true);
    setError("");

    try {
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
        router.replace(
          `/auth/login?redirect=${encodeURIComponent(
            `/account/orders/${order.id}/review`
          )}`
        );

        return;
      }

      const {
        data:
          verifiedOrder,
        error:
          orderError,
      } = await supabase
        .from("orders")
        .select(
          "id, user_id, customer_name, email, status, items"
        )
        .eq(
          "id",
          order.id
        )
        .eq(
          "user_id",
          user.id
        )
        .maybeSingle();

      if (
        orderError
      ) {
        throw orderError;
      }

      if (
        !verifiedOrder
      ) {
        throw new Error(
          "This order no longer belongs to your account."
        );
      }

      const verifiedStatus =
        typeof verifiedOrder
          .status ===
        "string"
          ? verifiedOrder.status
              .trim()
              .toLowerCase()
          : "";

      if (
        verifiedStatus !==
        "delivered"
      ) {
        throw new Error(
          "Reviews can only be submitted after delivery."
        );
      }

      const verifiedItems =
        parseOrderItems(
          verifiedOrder.items
        );

      const verifiedProduct =
        verifiedItems.find(
          (item) =>
            item.id ===
            selectedProduct.id
        );

      if (
        !verifiedProduct
      ) {
        throw new Error(
          "The selected product is not part of this order."
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
          verifiedProduct.id
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
        throw new Error(
          "A review has already been submitted for this product."
        );
      }

      const customerName =
        typeof verifiedOrder
          .customer_name ===
          "string" &&
        verifiedOrder
          .customer_name
          .trim()
          ? verifiedOrder
              .customer_name
              .trim()
          : (
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
        typeof verifiedOrder
          .email ===
          "string" &&
        verifiedOrder.email.trim()
          ? verifiedOrder.email
              .trim()
              .toLowerCase()
          : user.email
              ?.trim()
              .toLowerCase() ??
            "";

      const {
        error:
          insertError,
      } = await supabase
        .from("reviews")
        .insert({
          order_id:
            order.id,
          product_id:
            verifiedProduct.id,
          customer_email:
            customerEmail,
          name:
            customerName,
          title:
            normalizedTitle,
          rating,
          review:
            normalizedReview,
          verified_purchase:
            true,
          approved:
            false,
          featured:
            false,
        });

      if (
        insertError
      ) {
        throw insertError;
      }

      router.replace(
        `/account/orders/${encodeURIComponent(
          order.id
        )}`
      );

      router.refresh();
    } catch (
      submitError: unknown
    ) {
      console.error(
        "Failed to submit review:",
        submitError
      );

      setError(
        submitError instanceof
        Error
          ? submitError.message
          : "Unable to submit your review."
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#F8F4EF]">
        <div className="mx-auto flex max-w-3xl items-center justify-center px-6 py-32">
          <div className="rounded-3xl border border-[#E8DDD3] bg-white px-10 py-12 text-center shadow-sm">
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-[#E8DDD3] border-t-[#5A2D2D]" />

            <p className="mt-5 text-lg text-[#7A6464]">
              Loading your order...
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (!order) {
    return (
      <main className="min-h-screen bg-[#F8F4EF]">
        <div className="mx-auto max-w-3xl px-6 py-20">
          <div className="rounded-[36px] border border-[#E8DDD3] bg-white p-12 text-center shadow-sm">
            <AlertCircle
              className="mx-auto text-red-500"
              size={64}
            />

            <h1 className="mt-6 font-serif text-4xl text-[#4B2E2E]">
              Review Unavailable
            </h1>

            <p className="mt-4 leading-8 text-[#7A6464]">
              {error ||
                "This order could not be loaded."}
            </p>

            <Link
              href="/account/orders"
              className="mt-8 inline-flex rounded-full bg-[#5A2D2D] px-8 py-4 text-white transition hover:bg-[#472323]"
            >
              Back to Orders
            </Link>
          </div>
        </div>
      </main>
    );
  }

  if (
    allProductsReviewed
  ) {
    return (
      <main className="min-h-screen bg-[#F8F4EF]">
        <div className="mx-auto max-w-3xl px-6 py-20">
          <div className="rounded-[36px] border border-[#E8DDD3] bg-white p-12 text-center shadow-sm">
            <CheckCircle2
              className="mx-auto text-emerald-600"
              size={70}
            />

            <h1 className="mt-6 font-serif text-4xl text-[#4B2E2E]">
              Reviews Submitted
            </h1>

            <p className="mt-4 leading-8 text-[#7A6464]">
              Thank you for reviewing the products in this order.
              Submitted reviews will appear after approval.
            </p>

            <Link
              href={`/account/orders/${encodeURIComponent(
                order.id
              )}`}
              className="mt-8 inline-flex rounded-full bg-[#5A2D2D] px-8 py-4 text-white transition hover:bg-[#472323]"
            >
              Back to Order
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F8F4EF]">
      <div className="mx-auto max-w-4xl px-6 py-16">
        <Link
          href={`/account/orders/${encodeURIComponent(
            order.id
          )}`}
          className="inline-flex items-center gap-2 text-[#5A2D2D] transition hover:underline"
        >
          <ArrowLeft
            size={18}
          />

          Back to Order
        </Link>

        <div className="mt-8 rounded-[36px] border border-[#E8DDD3] bg-white p-8 shadow-sm sm:p-10">
          <p className="text-sm uppercase tracking-[0.35em] text-[#8B6B5B]">
            Verified Purchase
          </p>

          <h1 className="mt-4 font-serif text-4xl text-[#4B2E2E] sm:text-5xl">
            Share Your Experience
          </h1>

          <p className="mt-5 max-w-2xl leading-8 text-[#7A6464]">
            Tell us about a product from your delivered Rooh &amp;
            Rivet order. Your feedback helps future customers shop
            with confidence.
          </p>

          {error ? (
            <div className="mt-7 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-5 text-red-700">
              <AlertCircle
                size={20}
                className="mt-0.5 shrink-0"
              />

              <p>
                {error}
              </p>
            </div>
          ) : null}

          <form
            onSubmit={
              handleSubmit
            }
            className="mt-10 space-y-8"
          >
            <div>
              <label
                htmlFor="review-product"
                className="mb-3 block font-medium text-[#4B2E2E]"
              >
                Product
              </label>

              <div className="relative">
                <Package
                  size={19}
                  className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-[#8B6B5B]"
                />

                <select
                  id="review-product"
                  required
                  value={
                    selectedProductId
                  }
                  onChange={(
                    event
                  ) =>
                    setSelectedProductId(
                      event.target.value
                    )
                  }
                  className="w-full appearance-none rounded-2xl border border-stone-300 bg-white py-4 pl-14 pr-5 text-[#4B2E2E] outline-none transition focus:border-[#5A2D2D]"
                >
                  {availableProducts.map(
                    (item) => (
                      <option
                        key={
                          item.id
                        }
                        value={
                          item.id
                        }
                      >
                        {item.name}
                      </option>
                    )
                  )}
                </select>
              </div>

              {selectedProduct ? (
                <p className="mt-3 text-sm text-[#8B6B5B]">
                  Reviewing{" "}
                  <span className="font-semibold text-[#4B2E2E]">
                    {
                      selectedProduct.name
                    }
                  </span>
                </p>
              ) : null}
            </div>

            <div>
              <p className="mb-3 block font-medium text-[#4B2E2E]">
                Overall Rating
              </p>

              <div
                className="flex gap-2"
                role="radiogroup"
                aria-label="Overall rating"
              >
                {Array.from({
                  length: 5,
                }).map(
                  (
                    _,
                    index
                  ) => {
                    const starValue =
                      index + 1;

                    return (
                      <button
                        key={
                          starValue
                        }
                        type="button"
                        role="radio"
                        aria-checked={
                          rating ===
                          starValue
                        }
                        aria-label={`${starValue} star${
                          starValue === 1
                            ? ""
                            : "s"
                        }`}
                        onClick={() =>
                          setRating(
                            starValue
                          )
                        }
                        className="rounded-lg p-1 transition hover:scale-110 focus:outline-none focus:ring-2 focus:ring-[#5A2D2D] focus:ring-offset-2"
                      >
                        <Star
                          size={34}
                          className={
                            index <
                            rating
                              ? "fill-amber-400 text-amber-400"
                              : "text-stone-300"
                          }
                        />
                      </button>
                    );
                  }
                )}
              </div>
            </div>

            <div>
              <label
                htmlFor="review-title"
                className="mb-3 block font-medium text-[#4B2E2E]"
              >
                Review Title
              </label>

              <input
                id="review-title"
                type="text"
                required
                minLength={3}
                maxLength={120}
                value={title}
                onChange={(
                  event
                ) =>
                  setTitle(
                    event.target.value
                  )
                }
                placeholder="Summarise your experience"
                className="w-full rounded-2xl border border-stone-300 px-5 py-4 text-[#4B2E2E] outline-none transition placeholder:text-stone-400 focus:border-[#5A2D2D]"
              />

              <p className="mt-2 text-right text-xs text-[#8B6B5B]">
                {title.length}/120
              </p>
            </div>

            <div>
              <label
                htmlFor="review-body"
                className="mb-3 block font-medium text-[#4B2E2E]"
              >
                Your Review
              </label>

              <textarea
                id="review-body"
                required
                minLength={10}
                maxLength={2000}
                rows={8}
                value={review}
                onChange={(
                  event
                ) =>
                  setReview(
                    event.target.value
                  )
                }
                placeholder="Tell us about the jewellery, packaging, delivery and your overall experience..."
                className="w-full resize-y rounded-2xl border border-stone-300 px-5 py-4 text-[#4B2E2E] outline-none transition placeholder:text-stone-400 focus:border-[#5A2D2D]"
              />

              <p className="mt-2 text-right text-xs text-[#8B6B5B]">
                {review.length}/2000
              </p>
            </div>

            <div className="rounded-2xl border border-[#E8DDD3] bg-[#F8F4EF] p-5">
              <h3 className="font-medium text-[#4B2E2E]">
                Before you submit
              </h3>

              <ul className="mt-3 space-y-2 text-sm leading-7 text-[#7A6464]">
                <li>
                  • Reviews are checked before being published.
                </li>

                <li>
                  • Your review will display a Verified Purchase
                  badge.
                </li>

                <li>
                  • Each product in an order can be reviewed once.
                </li>
              </ul>
            </div>

            <button
              type="submit"
              disabled={
                saving ||
                !selectedProduct
              }
              className="rounded-full bg-[#5A2D2D] px-10 py-4 font-medium text-white transition hover:bg-[#472323] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving
                ? "Submitting..."
                : "Submit Review"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}