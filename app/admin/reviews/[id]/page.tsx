"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Trash2, CheckCircle } from "lucide-react";

import { supabase } from "@/lib/supabase";


type Review = {
  id: string;
  product_id: string;
  name: string;
  rating: number;
  review: string;
  approved: boolean;
  created_at: string;
};


type Product = {
  id: string;
  name: string;
  slug: string;
};



export default function AdminReviewDetailsPage() {

  const params = useParams();
  const router = useRouter();

  const id =
    params.id as string;


  const [review, setReview] =
    useState<Review | null>(null);

  const [product, setProduct] =
    useState<Product | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);



  useEffect(() => {

    if (id) {
      loadReview();
    }

  }, [id]);



  async function loadReview() {

    setLoading(true);


    const {
      data: reviewData,
      error,
    } =
      await supabase
        .from("reviews")
        .select("*")
        .eq(
          "id",
          id
        )
        .single();



    if (
      error ||
      !reviewData
    ) {

      setLoading(false);

      return;
    }



    setReview(
      reviewData
    );



    const {
      data: productData,
    } =
      await supabase
        .from("products")
        .select(
          "id,name,slug"
        )
        .eq(
          "id",
          reviewData.product_id
        )
        .single();



    if (productData) {

      setProduct(
        productData
      );

    }


    setLoading(false);

  }



  async function toggleApproval() {

    if (!review) {
      return;
    }


    setSaving(true);


    const {
      error,
    } =
      await supabase
        .from("reviews")
        .update({
          approved:
            !review.approved,
        })
        .eq(
          "id",
          review.id
        );



    if (!error) {

      setReview({
        ...review,
        approved:
          !review.approved,
      });

    }


    setSaving(false);

  }



  async function deleteReview() {

    if (
      !review
    ) {
      return;
    }


    const confirmed =
      window.confirm(
        "Delete this review?"
      );


    if (!confirmed) {
      return;
    }



    const {
      error,
    } =
      await supabase
        .from("reviews")
        .delete()
        .eq(
          "id",
          review.id
        );



    if (!error) {

      router.push(
        "/admin/reviews"
      );

    }

  }



  if (loading) {

    return (

      <div className="flex min-h-screen items-center justify-center bg-[#F8F4EF]">

        <p className="text-[#8B6B5B]">
          Loading review...
        </p>

      </div>

    );

  }



  if (!review) {

    return (

      <div className="min-h-screen bg-[#F8F4EF] p-10">

        <h1 className="text-3xl font-serif text-[#4B2E2E]">
          Review not found
        </h1>

        <Link
          href="/admin/reviews"
          className="mt-5 inline-block text-[#5A2D2D]"
        >
          Back to Reviews
        </Link>

      </div>

    );

  }



  return (

    <main className="min-h-screen bg-[#F8F4EF] px-6 py-10">


      <div className="mx-auto max-w-4xl space-y-8">


        <Link
          href="/admin/reviews"
          className="inline-flex items-center gap-2 text-[#5A2D2D]"
        >

          <ArrowLeft size={18} />

          Back to Reviews

        </Link>



        <section className="rounded-3xl bg-white p-8 shadow-xl">


          <h1 className="font-serif text-4xl text-[#4B2E2E]">
            Review Details
          </h1>



          <div className="mt-8 space-y-5">


            <div>

              <p className="text-sm text-[#8B6B5B]">
                Customer
              </p>

              <p className="text-lg font-semibold text-[#4B2E2E]">
                {review.name}
              </p>

            </div>



            <div>

              <p className="text-sm text-[#8B6B5B]">
                Product
              </p>


              {product ? (

                <Link
                  href={`/shop/${product.slug}`}
                  className="text-lg font-semibold text-[#5A2D2D]"
                >
                  {product.name}
                </Link>

              ) : (

                <p>
                  Product unavailable
                </p>

              )}

            </div>



            <div>

              <p className="text-sm text-[#8B6B5B]">
                Rating
              </p>


              <p className="text-2xl text-[#5A2D2D]">
                {"★".repeat(review.rating)}
              </p>

            </div>



            <div>

              <p className="text-sm text-[#8B6B5B]">
                Review
              </p>


              <p className="leading-8 text-stone-700">
                {review.review}
              </p>

            </div>



            <div>

              <p className="text-sm text-[#8B6B5B]">
                Status
              </p>


              <p
                className={
                  review.approved
                    ? "font-semibold text-green-700"
                    : "font-semibold text-orange-600"
                }
              >

                {review.approved
                  ? "Approved"
                  : "Pending Approval"}

              </p>

            </div>


          </div>



          <div className="mt-10 flex flex-col gap-4 sm:flex-row">


            <button
              onClick={toggleApproval}
              disabled={saving}
              className="flex items-center justify-center gap-2 rounded-2xl bg-[#5A2D2D] px-6 py-3 font-semibold text-white disabled:opacity-60"
            >

              <CheckCircle size={18} />

              {review.approved
                ? "Unapprove"
                : "Approve"}

            </button>



            <button
              onClick={deleteReview}
              className="flex items-center justify-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-6 py-3 font-semibold text-red-700"
            >

              <Trash2 size={18} />

              Delete Review

            </button>


          </div>


        </section>


      </div>


    </main>

  );
}