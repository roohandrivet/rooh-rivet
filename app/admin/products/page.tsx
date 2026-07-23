"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

type Product = {
  id: string | number;
  name: string;
  category: string | null;
  price: number | string;
  image: string | null;
  featured: boolean | null;
  created_at: string | null;
};

export default function AdminProductsPage() {
  const [products, setProducts] =
    useState<Product[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [deletingId, setDeletingId] =
    useState<string | number | null>(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  async function fetchProducts() {
    setLoading(true);
    setError("");

    const { data, error } =
      await supabase
        .from("products")
        .select("*")
        .order("created_at", {
          ascending: false,
        });

    if (error) {
      setError(error.message);
      setProducts([]);
    } else {
      setProducts(
        (data as Product[]) || []
      );
    }

    setLoading(false);
  }

  async function handleDelete(
    id: string | number
  ) {
    const confirmed =
      window.confirm(
        "Are you sure you want to delete this product?"
      );

    if (!confirmed) return;

    setDeletingId(id);

    const { error } =
      await supabase
        .from("products")
        .delete()
        .eq("id", id);

    if (error) {
      alert(error.message);
    } else {
      setProducts((prev) =>
        prev.filter(
          (product) =>
            product.id !== id
        )
      );
    }

    setDeletingId(null);
  }

  const filteredProducts =
    useMemo(() => {
      const term =
        search.toLowerCase();

      return products.filter(
        (product) =>
          product.name
            ?.toLowerCase()
            .includes(term) ||
          (product.category ?? "")
            .toLowerCase()
            .includes(term)
      );
    }, [products, search]);

  return (
    <main className="min-h-screen bg-[#F8F4EF]">
      <div className="mx-auto max-w-7xl px-6 py-10">
        <div className="mb-10 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="font-serif text-4xl text-[#4B2E2E]">
              Products Dashboard
            </h1>

            <p className="mt-2 text-[#8B6B5B]">
              Manage your luxury jewellery collection.
            </p>
          </div>

          <Link
            href="/admin/products/new"
            className="inline-flex items-center justify-center rounded-xl bg-[#5A2D2D] px-6 py-3 font-medium text-white transition hover:bg-[#4B2E2E]"
          >
            + Add New Product
          </Link>
        </div>

        <div className="mb-8 rounded-2xl bg-white p-5 shadow-md">
          <input
            type="text"
            placeholder="Search by product name or category..."
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
            className="w-full rounded-xl border border-[#E7DED6] px-4 py-3 outline-none transition focus:border-[#5A2D2D]"
          />
        </div>

        {loading ? (
          <div className="rounded-3xl bg-white p-16 text-center shadow-md">
            <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-[#D8C6BA] border-t-[#5A2D2D]" />

            <p className="text-[#8B6B5B]">
              Loading products...
            </p>
          </div>
        ) : error ? (
          <div className="rounded-3xl border border-red-200 bg-white p-10 text-center shadow-md">
            <h2 className="mb-2 text-xl font-semibold text-red-700">
              Failed to load products
            </h2>

            <p className="text-red-600">
              {error}
            </p>

            <button
              onClick={fetchProducts}
              className="mt-6 rounded-xl bg-[#5A2D2D] px-6 py-3 text-white"
            >
              Try Again
            </button>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="rounded-3xl bg-white p-16 text-center shadow-md">
            <h2 className="font-serif text-2xl text-[#4B2E2E]">
              No products found
            </h2>

            <p className="mt-3 text-[#8B6B5B]">
              Add your first jewellery product or try another search.
            </p>

            <Link
              href="/admin/products/new"
              className="mt-8 inline-flex rounded-xl bg-[#5A2D2D] px-6 py-3 text-white"
            >
              Add New Product
            </Link>
          </div>
        ) : (
          <div className="grid gap-6">
            {filteredProducts.map(
              (product) => (
                <div
                  key={product.id}
                  className="rounded-3xl bg-white p-6 shadow-md transition hover:shadow-xl"
                >
                  <div className="flex flex-col gap-6 lg:flex-row lg:items-center">
                  <div className="relative h-36 w-36 overflow-hidden rounded-2xl bg-[#F5F1EC]">
                      <Image
                        src={
                          product.image &&
                          product.image.trim() !== ""
                            ? product.image
                            : "/placeholder.jpg"
                        }
                        alt={product.name}
                        fill
                        className="object-cover"
                        sizes="144px"
                      />
                    </div>

                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-3">
                        <h2 className="font-serif text-2xl text-[#4B2E2E]">
                          {product.name}
                        </h2>

                        {product.featured && (
                          <span className="rounded-full bg-[#5A2D2D] px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white">
                            Featured
                          </span>
                        )}
                      </div>

                      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <div>
                          <p className="text-xs uppercase tracking-wide text-[#8B6B5B]">
                            Category
                          </p>

                          <p className="mt-1 font-medium text-[#4B2E2E]">
                            {product.category || "—"}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs uppercase tracking-wide text-[#8B6B5B]">
                            Price
                          </p>

                          <p className="mt-1 font-semibold text-[#4B2E2E]">
                            ₹{product.price}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs uppercase tracking-wide text-[#8B6B5B]">
                            Created
                          </p>

                          <p className="mt-1 text-[#4B2E2E]">
                            {product.created_at
                              ? new Date(
                                  product.created_at
                                ).toLocaleDateString()
                              : "—"}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs uppercase tracking-wide text-[#8B6B5B]">
                            Product ID
                          </p>

                          <p className="mt-1 break-all text-[#4B2E2E]">
                            {product.id}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
                      <Link
                        href={`/admin/products/edit/${product.id}`}
                        className="rounded-xl border border-[#5A2D2D] px-6 py-3 text-center font-medium text-[#5A2D2D] transition hover:bg-[#5A2D2D] hover:text-white"
                      >
                        Edit
                      </Link>

                      <button
                        onClick={() =>
                          handleDelete(product.id)
                        }
                        disabled={
                          deletingId === product.id
                        }
                        className="rounded-xl bg-red-600 px-6 py-3 font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {deletingId === product.id
                          ? "Deleting..."
                          : "Delete"}
                      </button>
                    </div>
                  </div>
                </div>
              )
            )}
          </div>
        )}
      </div>
    </main>
  );
}