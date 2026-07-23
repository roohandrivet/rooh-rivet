"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertTriangle, PackageX } from "lucide-react";

import { supabase } from "@/lib/supabase";

type Product = {
  id: string;
  name: string;
  stock: number;
  price: number;
};

export default function AdminLowStock() {
  const [products, setProducts] =
    useState<Product[]>([]);

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    loadLowStock();
  }, []);

  async function loadLowStock() {
    try {
      setLoading(true);

      const {
        data,
        error,
      } = await supabase
        .from("products")
        .select(
          `
          id,
          name,
          stock,
          price
          `
        )
        .lte("stock", 5)
        .order("stock", {
          ascending: true,
        })
        .limit(5);

      if (error) {
        throw error;
      }

      setProducts(data ?? []);
    } catch (error) {
      console.error(
        "Failed to load low stock products:",
        error
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-10 rounded-3xl border border-[#E8DDD3] bg-white p-8 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-serif text-3xl text-[#5A2D2D]">
            Inventory Alerts
          </h2>

          <p className="mt-2 text-sm text-[#8B6B5B]">
            Products that need attention
          </p>
        </div>

        <Link
          href="/admin/products"
          className="rounded-full bg-[#5A2D2D] px-5 py-2 text-sm text-white transition hover:bg-[#472323]"
        >
          Manage Products
        </Link>
      </div>

      <div className="mt-8">
        {loading ? (
          <p className="text-[#8B6B5B]">
            Loading inventory...
          </p>
        ) : products.length === 0 ? (
          <div className="flex items-center gap-3 rounded-2xl bg-[#F6ECE5] p-5 text-[#5A2D2D]">
            <PackageX size={24} />

            <p>
              All products have healthy stock levels.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {products.map((product) => (
              <div
                key={product.id}
                className="flex items-center justify-between rounded-2xl border border-[#E8DDD3] p-5"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#F6ECE5]">
                    <AlertTriangle
                      size={22}
                      className="text-[#5A2D2D]"
                    />
                  </div>

                  <div>
                    <h3 className="font-medium text-[#5A2D2D]">
                      {product.name}
                    </h3>

                    <p className="text-sm text-[#8B6B5B]">
                      ₹
                      {Number(
                        product.price
                      ).toLocaleString(
                        "en-IN"
                      )}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-sm text-[#8B6B5B]">
                    Stock
                  </p>

                  <p className="font-serif text-2xl text-[#5A2D2D]">
                    {product.stock}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}