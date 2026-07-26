"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";
import Link from "next/link";
import {
  AlertCircle,
  AlertTriangle,
  ExternalLink,
  PackageCheck,
  PackageX,
  RefreshCw,
} from "lucide-react";

import { supabase } from "@/lib/supabase";

type Product = {
  id: string;
  name: string;
  stock: number | string | null;
  price: number | string | null;
  active: boolean | null;
};

function toNumber(
  value: number | string | null
): number {
  const parsed = Number(value);

  return Number.isFinite(parsed)
    ? parsed
    : 0;
}

function formatCurrency(
  value: number | string | null
): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(toNumber(value));
}

function getErrorMessage(
  error: unknown
): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "Failed to load inventory alerts.";
}

function getStockLabel(
  stock: number
): string {
  if (stock <= 0) {
    return "Out of stock";
  }

  if (stock === 1) {
    return "1 item remaining";
  }

  return `${stock} items remaining`;
}

function getStockClasses(
  stock: number
): string {
  if (stock <= 0) {
    return "border-red-200 bg-red-50 text-red-700";
  }

  if (stock <= 2) {
    return "border-orange-200 bg-orange-50 text-orange-700";
  }

  return "border-amber-200 bg-amber-50 text-amber-700";
}

export default function AdminLowStock() {
  const [products, setProducts] =
    useState<Product[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState("");

  const loadLowStock = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      try {
        const {
          data,
          error: productsError,
        } = await supabase
          .from("products")
          .select(
            `
              id,
              name,
              stock,
              price,
              active
            `
          )
          .lte("stock", 5)
          .order("stock", {
            ascending: true,
          })
          .order("name", {
            ascending: true,
          })
          .limit(5);

        if (productsError) {
          throw productsError;
        }

        setProducts(
          (data ?? []) as Product[]
        );
      } catch (loadError) {
        console.error(
          "Failed to load low stock products:",
          loadError
        );

        setProducts([]);
        setError(
          getErrorMessage(loadError)
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    []
  );

  useEffect(() => {
    void loadLowStock();
  }, [loadLowStock]);

  return (
    <section className="rounded-3xl border border-[#E8DDD3] bg-white p-6 shadow-sm sm:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-serif text-3xl text-[#5A2D2D]">
            Inventory Alerts
          </h2>

          <p className="mt-2 text-sm text-[#8B6B5B]">
            Products with five or fewer
            items remaining.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() =>
              void loadLowStock(true)
            }
            disabled={refreshing}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-[#DCCEC4] bg-white px-5 py-2.5 text-sm font-semibold text-[#5A2D2D] transition hover:bg-[#F8F4EF] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw
              size={15}
              className={
                refreshing
                  ? "animate-spin"
                  : ""
              }
            />

            {refreshing
              ? "Refreshing..."
              : "Refresh"}
          </button>

          <Link
            href="/admin/products"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-[#5A2D2D] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#472323]"
          >
            Manage Products
            <ExternalLink size={15} />
          </Link>
        </div>
      </div>

      {error ? (
        <div className="mt-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
          <AlertCircle
            size={19}
            className="mt-0.5 shrink-0"
          />

          <div>
            <p className="font-semibold">
              Unable to load inventory
            </p>

            <p className="mt-1">
              {error}
            </p>
          </div>
        </div>
      ) : null}

      <div className="mt-8">
        {loading ? (
          <div className="space-y-4">
            {Array.from({
              length: 3,
            }).map((_, index) => (
              <div
                key={index}
                className="h-24 animate-pulse rounded-2xl bg-[#F8F4EF]"
              />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-green-200 bg-green-50 px-6 py-12 text-center text-green-700">
            <PackageCheck size={34} />

            <p className="mt-4 font-semibold">
              Inventory levels are healthy
            </p>

            <p className="mt-2 text-sm">
              No products currently have
              five or fewer items remaining.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {products.map((product) => {
              const stock = Math.max(
                0,
                toNumber(product.stock)
              );

              return (
                <div
                  key={product.id}
                  className="flex flex-col gap-5 rounded-2xl border border-[#E8DDD3] p-5 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex min-w-0 items-center gap-4">
                    <div
                      className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${
                        stock <= 0
                          ? "bg-red-100"
                          : "bg-[#F6ECE5]"
                      }`}
                    >
                      {stock <= 0 ? (
                        <PackageX
                          size={22}
                          className="text-red-700"
                        />
                      ) : (
                        <AlertTriangle
                          size={22}
                          className="text-[#5A2D2D]"
                        />
                      )}
                    </div>

                    <div className="min-w-0">
                      <Link
                        href={`/admin/products/edit/${product.id}`}
                        className="block truncate font-semibold text-[#5A2D2D] transition hover:underline"
                      >
                        {product.name}
                      </Link>

                      <p className="mt-1 text-sm text-[#8B6B5B]">
                        {formatCurrency(
                          product.price
                        )}
                      </p>

                      {product.active ===
                      false ? (
                        <p className="mt-1 text-xs font-medium text-red-600">
                          Product is inactive
                        </p>
                      ) : null}
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-4 sm:justify-end">
                    <span
                      className={`rounded-full border px-4 py-2 text-xs font-semibold ${getStockClasses(
                        stock
                      )}`}
                    >
                      {getStockLabel(stock)}
                    </span>

                    <Link
                      href={`/admin/products/edit/${product.id}`}
                      className="rounded-xl border border-[#DCCEC4] px-4 py-2 text-sm font-semibold text-[#5A2D2D] transition hover:bg-[#F8F4EF]"
                    >
                      Update
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}