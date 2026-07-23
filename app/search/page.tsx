import Link from "next/link";
import Image from "next/image";
import { Search } from "lucide-react";

import { supabase } from "@/lib/supabase";


type Product = {
  id: string;
  slug: string;
  name: string;
  price: number;
  image: string | null;
  category: string | null;
};



type PageProps = {
  searchParams: Promise<{
    q?: string;
  }>;
};



export default async function SearchPage({
  searchParams,
}: PageProps) {

  const {
    q,
  } = await searchParams;


  const query =
    q?.trim() || "";



  let products: Product[] = [];



  if (query) {

    const {
      data,
      error,
    } = await supabase
      .from("products")
      .select(
        `
        id,
        slug,
        name,
        price,
        image,
        category
        `
      )
      .eq(
        "active",
        true
      )
      .or(
        `name.ilike.%${query}%,description.ilike.%${query}%,category.ilike.%${query}%`
      )
      .order(
        "created_at",
        {
          ascending: false,
        }
      );


    if (
      !error &&
      data
    ) {

      products =
        data as Product[];

    }

  }



  return (

    <main className="min-h-screen bg-[#F8F4EF]">

      <div className="mx-auto max-w-7xl px-6 py-16">


        <div className="mb-12">

          <div className="flex items-center gap-3 text-[#8B6B5B]">

            <Search size={22} />

            <p className="uppercase tracking-[0.3em] text-sm">
              Search Collection
            </p>

          </div>



          <h1 className="mt-4 font-serif text-5xl text-[#4B2E2E]">

            {query
              ? `Results for "${query}"`
              : "Discover Jewellery"}

          </h1>


          <p className="mt-4 text-[#7A6464]">

            Explore handcrafted pieces created for timeless elegance.

          </p>


        </div>





        {!query && (

          <div className="rounded-3xl bg-white p-12 text-center shadow-sm">

            <h2 className="font-serif text-3xl text-[#4B2E2E]">
              Search our collection
            </h2>


            <p className="mt-3 text-[#7A6464]">
              Find necklaces, rings, earrings and more.
            </p>


          </div>

        )}




        {query && products.length === 0 && (

          <div className="rounded-3xl bg-white p-12 text-center shadow-sm">

            <h2 className="font-serif text-3xl text-[#4B2E2E]">
              No Jewellery Found
            </h2>


            <p className="mt-3 text-[#7A6464]">
              Try searching with another keyword.
            </p>


            <Link
              href="/shop"
              className="mt-6 inline-block rounded-full bg-[#5A2D2D] px-8 py-3 text-white"
            >
              Browse Collection
            </Link>


          </div>

        )}





        {products.length > 0 && (

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
                      width={500}
                      height={500}
                      className="h-72 w-full object-cover transition duration-500 group-hover:scale-105"
                    />


                  </div>




                  <div className="p-6">


                    <p className="text-xs uppercase tracking-widest text-[#8B6B5B]">
                      {product.category || "Jewellery"}
                    </p>



                    <h2 className="mt-2 font-serif text-2xl text-[#4B2E2E]">
                      {product.name}
                    </h2>



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

        )}



      </div>


    </main>

  );
}