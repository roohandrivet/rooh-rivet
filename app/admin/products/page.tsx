"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import Image from "next/image";
import Link from "next/link";
import {
  AlertCircle,
  Clock3,
  Edit3,
  Loader2,
  Package,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  Trash2,
} from "lucide-react";

import { supabase } from "@/lib/supabase";

type Product = {
  id: string;
  name: string;
  category: string | null;
  price: number | string | null;
  image: string | null;
  stock: number | string | null;
  featured: boolean | null;
  bestseller: boolean | null;
  active: boolean | null;
  reservation_enabled: boolean | null;
  reserved_by: string | null;
  reserved_until: string | null;
  created_at: string | null;
};

type ReservationState =
  | "standard"
  | "available"
  | "reserved"
  | "expired";

function toNumber(
  value: number | string | null
): number {
  const parsed = Number(value);

  return Number.isFinite(parsed)
    ? parsed
    : 0;
}

function formatPrice(
  value: number | string | null
): string {
  return new Intl.NumberFormat(
    "en-IN",
    {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }
  ).format(
    Math.max(
      0,
      toNumber(value)
    )
  );
}

function formatDate(
  value: string | null
): string {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "—";
  }

  return date.toLocaleDateString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  );
}

function formatDateTime(
  value: string | null
): string {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "—";
  }

  return date.toLocaleString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }
  );
}

function getReservationState(
  product: Product,
  currentTime: number
): ReservationState {
  if (
    product.reservation_enabled !==
    true
  ) {
    return "standard";
  }

  if (
    !product.reserved_by ||
    !product.reserved_until
  ) {
    return "available";
  }

  const expiresAt =
    new Date(
      product.reserved_until
    ).getTime();

  if (
    Number.isNaN(expiresAt) ||
    expiresAt <= currentTime
  ) {
    return "expired";
  }

  return "reserved";
}

function getRemainingSeconds(
  reservedUntil: string | null,
  currentTime: number
): number {
  if (!reservedUntil) {
    return 0;
  }

  const expiresAt =
    new Date(
      reservedUntil
    ).getTime();

  if (
    Number.isNaN(expiresAt)
  ) {
    return 0;
  }

  return Math.max(
    0,
    Math.ceil(
      (
        expiresAt -
        currentTime
      ) / 1000
    )
  );
}

function formatCountdown(
  totalSeconds: number
): string {
  const safeSeconds =
    Math.max(
      0,
      Math.floor(
        totalSeconds
      )
    );

  const minutes =
    Math.floor(
      safeSeconds / 60
    );

  const seconds =
    safeSeconds % 60;

  return `${minutes}:${seconds
    .toString()
    .padStart(2, "0")}`;
}

export default function AdminProductsPage() {
  const [
    products,
    setProducts,
  ] = useState<Product[]>([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    refreshing,
    setRefreshing,
  ] = useState(false);

  const [
    clearingExpired,
    setClearingExpired,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  const [
    success,
    setSuccess,
  ] = useState("");

  const [
    search,
    setSearch,
  ] = useState("");

  const [
    deletingId,
    setDeletingId,
  ] = useState<string | null>(
    null
  );

  const [
    currentTime,
    setCurrentTime,
  ] = useState(
    Date.now()
  );

  const clearExpiredReservations =
    useCallback(
      async (
        showMessage: boolean
      ): Promise<boolean> => {
        try {
          setClearingExpired(
            true
          );

          const now =
            new Date().toISOString();

          const {
            error:
              cleanupError,
          } = await supabase
            .from("products")
            .update({
              reserved_by: null,
              reserved_until: null,
            })
            .eq(
              "reservation_enabled",
              true
            )
            .not(
              "reserved_until",
              "is",
              null
            )
            .lt(
              "reserved_until",
              now
            );

          if (cleanupError) {
            throw cleanupError;
          }

          if (showMessage) {
            setSuccess(
              "Expired reservation data cleared."
            );
          }

          return true;
        } catch (
          cleanupError
        ) {
          console.error(
            "Failed to clear expired reservations:",
            cleanupError
          );

          if (showMessage) {
            setError(
              cleanupError instanceof
                Error
                ? cleanupError.message
                : "Failed to clear expired reservations."
            );
          }

          return false;
        } finally {
          setClearingExpired(
            false
          );
        }
      },
      []
    );

  const fetchProducts =
    useCallback(
      async (
        showRefreshState =
          false
      ) => {
        if (showRefreshState) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError("");
        setSuccess("");

        await clearExpiredReservations(
          false
        );

        const {
          data,
          error:
            productsError,
        } = await supabase
          .from("products")
          .select(
            `
              id,
              name,
              category,
              price,
              image,
              stock,
              featured,
              bestseller,
              active,
              reservation_enabled,
              reserved_by,
              reserved_until,
              created_at
            `
          )
          .order(
            "created_at",
            {
              ascending:
                false,
            }
          );

        if (
          productsError
        ) {
          setError(
            productsError.message
          );
          setProducts([]);
        } else {
          setProducts(
            (
              data ??
              []
            ) as Product[]
          );
        }

        setLoading(false);
        setRefreshing(false);
        setCurrentTime(
          Date.now()
        );
      },
      [
        clearExpiredReservations,
      ]
    );

  useEffect(() => {
    void fetchProducts();
  }, [
    fetchProducts,
  ]);

  const hasActiveReservations =
    useMemo(
      () =>
        products.some(
          (product) =>
            getReservationState(
              product,
              currentTime
            ) ===
            "reserved"
        ),
      [
        products,
        currentTime,
      ]
    );

  useEffect(() => {
    if (
      !hasActiveReservations
    ) {
      return;
    }

    const interval =
      window.setInterval(
        () => {
          setCurrentTime(
            Date.now()
          );
        },
        1000
      );

    return () => {
      window.clearInterval(
        interval
      );
    };
  }, [
    hasActiveReservations,
  ]);

  useEffect(() => {
    const expiredProductExists =
      products.some(
        (product) =>
          getReservationState(
            product,
            currentTime
          ) ===
          "expired"
      );

    if (
      !expiredProductExists
    ) {
      return;
    }

    const timeout =
      window.setTimeout(
        () => {
          void fetchProducts(
            true
          );
        },
        1500
      );

    return () => {
      window.clearTimeout(
        timeout
      );
    };
  }, [
    currentTime,
    fetchProducts,
    products,
  ]);

  async function handleManualCleanup() {
    setError("");
    setSuccess("");

    const cleaned =
      await clearExpiredReservations(
        true
      );

    if (cleaned) {
      await fetchProducts(
        true
      );

      setSuccess(
        "Expired reservation data cleared."
      );
    }
  }

  async function handleDelete(
    product: Product
  ) {
    const reservationState =
      getReservationState(
        product,
        Date.now()
      );

    if (
      reservationState ===
      "reserved"
    ) {
      window.alert(
        "This product is currently reserved by a customer. Wait for the reservation to expire or clear the reservation before deleting it."
      );

      return;
    }

    const confirmed =
      window.confirm(
        `Delete "${product.name}"? This action cannot be undone.`
      );

    if (!confirmed) {
      return;
    }

    setDeletingId(
      product.id
    );
    setError("");
    setSuccess("");

    const {
      error:
        deleteError,
    } = await supabase
      .from("products")
      .delete()
      .eq(
        "id",
        product.id
      );

    if (deleteError) {
      setError(
        deleteError.message
      );
    } else {
      setProducts(
        (current) =>
          current.filter(
            (currentProduct) =>
              currentProduct.id !==
              product.id
          )
      );

      setSuccess(
        `${product.name} was deleted.`
      );
    }

    setDeletingId(null);
  }

  const statistics =
    useMemo(() => {
      let oneOfAKind = 0;
      let activelyReserved = 0;
      let outOfStock = 0;

      products.forEach(
        (product) => {
          if (
            product.reservation_enabled ===
            true
          ) {
            oneOfAKind += 1;
          }

          if (
            getReservationState(
              product,
              currentTime
            ) ===
            "reserved"
          ) {
            activelyReserved +=
              1;
          }

          if (
            toNumber(
              product.stock
            ) <= 0 ||
            product.active ===
              false
          ) {
            outOfStock += 1;
          }
        }
      );

      return {
        total:
          products.length,
        oneOfAKind,
        activelyReserved,
        outOfStock,
      };
    }, [
      products,
      currentTime,
    ]);

  const filteredProducts =
    useMemo(() => {
      const term =
        search
          .trim()
          .toLowerCase();

      if (!term) {
        return products;
      }

      return products.filter(
        (product) =>
          product.name
            .toLowerCase()
            .includes(term) ||
          (
            product.category ??
            ""
          )
            .toLowerCase()
            .includes(term) ||
          product.id
            .toLowerCase()
            .includes(term)
      );
    }, [
      products,
      search,
    ]);

  return (
    <main className="min-h-screen bg-[#F8F4EF]">
      <div className="mx-auto max-w-7xl px-5 py-10 sm:px-6">
        <div className="mb-10 flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#8B6B5B]">
              Product Catalogue
            </p>

            <h1 className="mt-3 font-serif text-4xl text-[#4B2E2E] sm:text-5xl">
              Products Dashboard
            </h1>

            <p className="mt-3 max-w-2xl leading-7 text-[#8B6B5B]">
              Manage products, stock and timed reservations for
              one-of-a-kind jewellery.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() =>
                void handleManualCleanup()
              }
              disabled={
                clearingExpired ||
                loading
              }
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#5A2D2D] bg-white px-5 py-3 font-medium text-[#5A2D2D] transition hover:bg-[#F2E9E2] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {clearingExpired ? (
                <Loader2
                  size={18}
                  className="animate-spin"
                />
              ) : (
                <Clock3
                  size={18}
                />
              )}

              Clear Expired
            </button>

            <button
              type="button"
              onClick={() =>
                void fetchProducts(
                  true
                )
              }
              disabled={
                refreshing ||
                loading
              }
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#D8C3B0] bg-white px-5 py-3 font-medium text-[#5A2D2D] transition hover:bg-[#F2E9E2] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw
                size={18}
                className={
                  refreshing
                    ? "animate-spin"
                    : ""
                }
              />

              Refresh
            </button>

            <Link
              href="/admin/products/new"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#5A2D2D] px-6 py-3 font-medium text-white transition hover:bg-[#4B2E2E]"
            >
              <Plus size={18} />
              Add New Product
            </Link>
          </div>
        </div>

        <section className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-[#E8DDD3] bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#8B6B5B]">
                  Total Products
                </p>

                <p className="mt-2 text-3xl font-semibold text-[#4B2E2E]">
                  {statistics.total}
                </p>
              </div>

              <Package className="text-[#5A2D2D]" />
            </div>
          </div>

          <div className="rounded-2xl border border-[#E8DDD3] bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#8B6B5B]">
                  One of a Kind
                </p>

                <p className="mt-2 text-3xl font-semibold text-[#4B2E2E]">
                  {statistics.oneOfAKind}
                </p>
              </div>

              <Sparkles className="text-[#5A2D2D]" />
            </div>
          </div>

          <div className="rounded-2xl border border-[#E8DDD3] bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#8B6B5B]">
                  Reserved Now
                </p>

                <p className="mt-2 text-3xl font-semibold text-[#4B2E2E]">
                  {statistics.activelyReserved}
                </p>
              </div>

              <Clock3 className="text-[#5A2D2D]" />
            </div>
          </div>

          <div className="rounded-2xl border border-[#E8DDD3] bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#8B6B5B]">
                  Unavailable
                </p>

                <p className="mt-2 text-3xl font-semibold text-[#4B2E2E]">
                  {statistics.outOfStock}
                </p>
              </div>

              <AlertCircle className="text-[#5A2D2D]" />
            </div>
          </div>
        </section>

        <section className="mb-8 rounded-2xl border border-[#E8DDD3] bg-white p-5 shadow-sm">
          <div className="relative">
            <Search
              size={19}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#8B6B5B]"
            />

            <input
              type="search"
              placeholder="Search by product name, category or ID..."
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
              className="w-full rounded-xl border border-[#E7DED6] py-3 pl-12 pr-4 text-[#4B2E2E] outline-none transition placeholder:text-[#A79084] focus:border-[#5A2D2D]"
            />
          </div>
        </section>

        {error ? (
          <div className="mb-7 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-5 text-red-700">
            <AlertCircle
              size={20}
              className="mt-0.5 shrink-0"
            />

            <p>{error}</p>
          </div>
        ) : null}

        {success ? (
          <div className="mb-7 flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-emerald-700">
            <ShieldCheck
              size={20}
              className="mt-0.5 shrink-0"
            />

            <p>{success}</p>
          </div>
        ) : null}

        {loading ? (
          <div className="rounded-3xl border border-[#E8DDD3] bg-white p-16 text-center shadow-sm">
            <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-[#D8C6BA] border-t-[#5A2D2D]" />

            <p className="text-[#8B6B5B]">
              Loading products...
            </p>
          </div>
        ) : filteredProducts.length ===
          0 ? (
          <div className="rounded-3xl border border-[#E8DDD3] bg-white p-16 text-center shadow-sm">
            <h2 className="font-serif text-2xl text-[#4B2E2E]">
              No products found
            </h2>

            <p className="mt-3 text-[#8B6B5B]">
              Add your first jewellery product or try another search.
            </p>

            <Link
              href="/admin/products/new"
              className="mt-8 inline-flex items-center gap-2 rounded-xl bg-[#5A2D2D] px-6 py-3 text-white"
            >
              <Plus size={18} />
              Add New Product
            </Link>
          </div>
        ) : (
          <div className="grid gap-6">
            {filteredProducts.map(
              (product) => {
                const reservationState =
                  getReservationState(
                    product,
                    currentTime
                  );

                const remainingSeconds =
                  reservationState ===
                  "reserved"
                    ? getRemainingSeconds(
                        product.reserved_until,
                        currentTime
                      )
                    : 0;

                const stock =
                  Math.max(
                    0,
                    Math.floor(
                      toNumber(
                        product.stock
                      )
                    )
                  );

                return (
                  <article
                    key={product.id}
                    className="rounded-3xl border border-[#E8DDD3] bg-white p-5 shadow-sm transition hover:shadow-lg sm:p-6"
                  >
                    <div className="flex flex-col gap-6 xl:flex-row xl:items-center">
                      <div className="relative h-48 w-full shrink-0 overflow-hidden rounded-2xl bg-[#F5F1EC] sm:h-40 xl:h-36 xl:w-36">
                        {product.image &&
                        product.image.trim() !==
                          "" ? (
                          <Image
                            src={
                              product.image
                            }
                            alt={
                              product.name
                            }
                            fill
                            className="object-cover"
                            sizes="(max-width: 1279px) 100vw, 144px"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-sm text-[#8B6B5B]">
                            No Image
                          </div>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-3">
                          <h2 className="font-serif text-2xl text-[#4B2E2E]">
                            {product.name}
                          </h2>

                          {product.featured ? (
                            <span className="rounded-full bg-[#5A2D2D] px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white">
                              Featured
                            </span>
                          ) : null}

                          {product.bestseller ? (
                            <span className="rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-rose-700">
                              Bestseller
                            </span>
                          ) : null}

                          {product.reservation_enabled ===
                          true ? (
                            <span className="rounded-full bg-[#F4E9E1] px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[#5A2D2D]">
                              One of a Kind
                            </span>
                          ) : null}

                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${
                              product.active !==
                                false &&
                              stock > 0
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-red-100 text-red-700"
                            }`}
                          >
                            {product.active !==
                              false &&
                            stock > 0
                              ? "Active"
                              : "Unavailable"}
                          </span>
                        </div>

                        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                          <div>
                            <p className="text-xs uppercase tracking-wide text-[#8B6B5B]">
                              Category
                            </p>

                            <p className="mt-1 font-medium text-[#4B2E2E]">
                              {product.category ||
                                "—"}
                            </p>
                          </div>

                          <div>
                            <p className="text-xs uppercase tracking-wide text-[#8B6B5B]">
                              Price
                            </p>

                            <p className="mt-1 font-semibold text-[#4B2E2E]">
                              {formatPrice(
                                product.price
                              )}
                            </p>
                          </div>

                          <div>
                            <p className="text-xs uppercase tracking-wide text-[#8B6B5B]">
                              Stock
                            </p>

                            <p className="mt-1 font-medium text-[#4B2E2E]">
                              {stock}{" "}
                              {stock === 1
                                ? "piece"
                                : "pieces"}
                            </p>
                          </div>

                          <div>
                            <p className="text-xs uppercase tracking-wide text-[#8B6B5B]">
                              Created
                            </p>

                            <p className="mt-1 text-[#4B2E2E]">
                              {formatDate(
                                product.created_at
                              )}
                            </p>
                          </div>
                        </div>

                        {reservationState !==
                        "standard" ? (
                          <div
                            className={`mt-5 rounded-2xl border p-4 ${
                              reservationState ===
                              "reserved"
                                ? "border-amber-200 bg-amber-50"
                                : reservationState ===
                                    "expired"
                                  ? "border-red-200 bg-red-50"
                                  : "border-emerald-200 bg-emerald-50"
                            }`}
                          >
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                              <div className="flex items-start gap-3">
                                <Clock3
                                  size={19}
                                  className="mt-0.5 shrink-0"
                                />

                                <div>
                                  <p className="font-semibold text-[#4B2E2E]">
                                    {reservationState ===
                                    "reserved"
                                      ? "Currently reserved"
                                      : reservationState ===
                                          "expired"
                                        ? "Reservation expired"
                                        : "Available to reserve"}
                                  </p>

                                  <p className="mt-1 text-sm leading-6 text-[#7A6464]">
                                    {reservationState ===
                                    "reserved"
                                      ? `Expires ${formatDateTime(
                                          product.reserved_until
                                        )}`
                                      : reservationState ===
                                          "expired"
                                        ? "The expired lock will be cleared automatically."
                                        : "No customer currently holds this piece."}
                                  </p>
                                </div>
                              </div>

                              {reservationState ===
                              "reserved" ? (
                                <span className="rounded-full bg-white px-4 py-2 font-mono text-sm font-semibold text-[#5A2D2D] shadow-sm">
                                  {formatCountdown(
                                    remainingSeconds
                                  )}{" "}
                                  remaining
                                </span>
                              ) : null}
                            </div>
                          </div>
                        ) : null}

                        <p className="mt-4 break-all text-xs text-[#A18C80]">
                          Product ID:{" "}
                          {product.id}
                        </p>
                      </div>

                      <div className="flex flex-col gap-3 sm:flex-row xl:w-40 xl:flex-col">
                        <Link
                          href={`/admin/products/edit/${product.id}`}
                          className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#5A2D2D] px-5 py-3 text-center font-medium text-[#5A2D2D] transition hover:bg-[#5A2D2D] hover:text-white"
                        >
                          <Edit3
                            size={17}
                          />
                          Edit
                        </Link>

                        <button
                          type="button"
                          onClick={() =>
                            void handleDelete(
                              product
                            )
                          }
                          disabled={
                            deletingId ===
                              product.id ||
                            reservationState ===
                              "reserved"
                          }
                          className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-3 font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {deletingId ===
                          product.id ? (
                            <Loader2
                              size={17}
                              className="animate-spin"
                            />
                          ) : (
                            <Trash2
                              size={17}
                            />
                          )}

                          {deletingId ===
                          product.id
                            ? "Deleting..."
                            : "Delete"}
                        </button>
                      </div>
                    </div>
                  </article>
                );
              }
            )}
          </div>
        )}
      </div>
    </main>
  );
}