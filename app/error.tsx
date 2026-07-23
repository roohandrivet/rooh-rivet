"use client";

import { useEffect } from "react";


export default function ErrorPage({
  reset,
}: {
  reset: () => void;
}) {


  useEffect(() => {

    console.error(
      "Application error occurred"
    );

  }, []);



  return (

    <main className="flex min-h-screen items-center justify-center bg-[#F8F4EF] px-6">

      <div className="max-w-xl rounded-[40px] bg-white p-10 text-center shadow-xl">


        <h1 className="font-serif text-5xl text-[#4B2E2E]">
          Something went wrong
        </h1>


        <p className="mt-5 leading-7 text-[#8B6B5B]">
          We are unable to load this page right now.
          Please try again or return to Rooh &amp; Rivet.
        </p>


        <button
          onClick={reset}
          className="mt-8 rounded-2xl bg-[#5A2D2D] px-8 py-3 font-semibold text-white transition hover:opacity-90"
        >
          Try Again
        </button>


      </div>

    </main>

  );
}