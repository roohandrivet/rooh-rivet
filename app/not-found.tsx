import Link from "next/link";


export default function NotFound() {

  return (

    <main className="flex min-h-screen items-center justify-center bg-[#F8F4EF] px-6">


      <div className="max-w-xl rounded-[40px] bg-white p-10 text-center shadow-xl">


        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#8B6B5B]">
          Rooh &amp; Rivet
        </p>


        <h1 className="mt-5 font-serif text-6xl text-[#4B2E2E]">
          404
        </h1>


        <h2 className="mt-4 font-serif text-3xl text-[#4B2E2E]">
          Page not found
        </h2>


        <p className="mt-5 leading-7 text-[#8B6B5B]">
          The jewellery piece or page you are looking for
          may have moved or no longer exists.
        </p>


        <Link
          href="/"
          className="mt-8 inline-flex rounded-2xl bg-[#5A2D2D] px-8 py-3 font-semibold text-white transition hover:opacity-90"
        >
          Return Home
        </Link>


      </div>


    </main>

  );
}