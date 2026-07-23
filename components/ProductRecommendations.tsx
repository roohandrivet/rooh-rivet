// components/ProductRecommendations.tsx

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";

import { supabase } from "@/lib/supabase";


type Product = {
  id: string;
  slug: string;
  name: string;
  price: number;
  image: string | null;
};


type ProductRecommendationsProps = {
  productId: string;
  category: string | null;
};


export default function ProductRecommendations({
  productId,
  category,
}: ProductRecommendationsProps) {

  const [
    products,
    setProducts,
  ] = useState<Product[]>([]);


  const [
    loading,
    setLoading,
  ] = useState(true);



  useEffect(() => {

    async function fetchRecommendations() {

      setLoading(true);


      let query =
        supabase
          .from("products")
          .select(
            "id, slug, name, price, image"
          )
          .eq(
            "active",
            true
          )
          .neq(
            "id",
            productId
          )
          .limit(4);



      if (category) {
        query = query.eq(
          "category",
          category
        );
      }



      const {
        data,
        error,
      } = await query;



      if (
        !error &&
        data
      ) {
        setProducts(
          data as Product[]
        );
      }


      setLoading(false);

    }


    fetchRecommendations();

  }, [
    productId,
    category,
  ]);



  if (
    loading ||
    products.length === 0
  ) {
    return null;
  }



  return (
    <section>

      <div className="mb-8">

        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#8B6B5B]">
          You May Also Like
        </p>


        <h2 className="mt-3 font-serif text-4xl text-[#4B2E2E]">
          Complete Your Collection
        </h2>

      </div>



      <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">

        {products.map(
          (product) => (

            <Link
              key={
                product.id
              }
              href={`/shop/${product.slug}`}
              className="group overflow-hidden rounded-3xl bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
            >

              <div className="overflow-hidden bg-[#F8F4EF]">

                <Image
                  src={
                    product.image ||
                    "/placeholder.jpg"
                  }
                  alt={
                    product.name
                  }
                  width={400}
                  height={400}
                  className="h-72 w-full object-cover transition duration-500 group-hover:scale-105"
                />

              </div>



              <div className="p-5">

                <h3 className="font-serif text-xl text-[#4B2E2E]">
                  {product.name}
                </h3>


                <p className="mt-3 text-lg font-semibold text-[#8B6B5B]">
                  ₹
                  {product.price.toLocaleString(
                    "en-IN"
                  )}
                </p>

              </div>


            </Link>

          )
        )}

      </div>

    </section>
  );
}