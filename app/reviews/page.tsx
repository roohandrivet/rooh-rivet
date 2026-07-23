import { supabase } from "@/lib/supabase";
import { Star } from "lucide-react";


type Review = {
  id: string;
  name: string;
  rating: number;
  review: string;
  created_at: string;
};


export default async function ReviewsPage() {

  const {
    data: reviews,
    error,
  } =
    await supabase
      .from("reviews")
      .select(
        "id,name,rating,review,created_at"
      )
      .eq(
        "approved",
        true
      )
      .order(
        "created_at",
        {
          ascending: false,
        }
      );



  if (error) {

    return (

      <main className="min-h-screen bg-[#F8F4EF] px-6 py-12">

        <div className="mx-auto max-w-5xl rounded-3xl bg-white p-10 shadow-xl">

          <h1 className="font-serif text-4xl text-[#4B2E2E]">
            Customer Reviews
          </h1>

          <p className="mt-5 text-red-600">
            Unable to load reviews.
          </p>

        </div>

      </main>

    );

  }



  const reviewList =
    (reviews ?? []) as Review[];



  return (

    <main className="min-h-screen bg-[#F8F4EF] px-6 py-12">


      <div className="mx-auto max-w-6xl">


        <div className="text-center">

          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#8B6B5B]">
            Rooh &amp; Rivet
          </p>


          <h1 className="mt-4 font-serif text-5xl text-[#4B2E2E]">
            Customer Reviews
          </h1>


          <p className="mt-5 text-[#8B6B5B]">
            Discover what our customers say about their jewellery experience.
          </p>


        </div>



        <div className="mt-12 grid gap-8 md:grid-cols-2">


          {reviewList.length === 0 ? (

            <div className="rounded-3xl bg-white p-10 shadow-xl md:col-span-2">

              <p className="text-center text-[#8B6B5B]">
                No reviews available yet.
              </p>

            </div>

          ) : (


            reviewList.map(
              (item) => (

                <article
                  key={item.id}
                  className="rounded-3xl bg-white p-8 shadow-xl"
                >

                  <div className="flex gap-1">

                    {Array.from({
                      length: item.rating,
                    }).map(
                      (_, index) => (

                        <Star
                          key={index}
                          size={18}
                          fill="currentColor"
                          className="text-[#B8860B]"
                        />

                      )
                    )}

                  </div>



                  <p className="mt-5 leading-8 text-stone-700">
                    "{item.review}"
                  </p>



                  <p className="mt-6 font-semibold text-[#4B2E2E]">
                    {item.name}
                  </p>



                  <p className="mt-2 text-sm text-[#8B6B5B]">
                    {new Date(
                      item.created_at
                    ).toLocaleDateString(
                      "en-IN"
                    )}
                  </p>


                </article>

              )
            )

          )}


        </div>


      </div>


    </main>

  );
}