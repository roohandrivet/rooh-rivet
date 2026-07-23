import Image from "next/image";

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-[#F8F4EF]">

      {/* Hero */}

      <section className="max-w-7xl mx-auto px-8 py-24">

        <div className="grid lg:grid-cols-2 gap-20 items-center">

          <div>

            <p className="uppercase tracking-[8px] text-[#8B6B5B] text-sm">
              Our Story
            </p>

            <h1 className="mt-6 text-6xl font-serif text-[#4B2E2E]">
              Jewellery Crafted
              <br />
              With Meaning
            </h1>

            <p className="mt-10 text-lg leading-9 text-[#7A6464]">

              At Rooh & Rivet, every piece is thoughtfully handcrafted to
              celebrate timeless elegance, individuality and life's most
              meaningful moments.

              Inspired by heritage craftsmanship and modern sophistication,
              our jewellery is designed to become part of your story.

            </p>

          </div>

          <div>

            <Image
              src="/about.jpg"
              alt="Rooh & Rivet"
              width={800}
              height={900}
              className="rounded-[40px] shadow-2xl object-cover w-full"
            />

          </div>

        </div>

      </section>
      {/* ================= CRAFTSMANSHIP ================= */}

      <section className="bg-white py-24">

        <div className="max-w-7xl mx-auto px-8">

          <div className="text-center">

            <p className="uppercase tracking-[8px] text-[#8B6B5B] text-sm">
              Our Philosophy
            </p>

            <h2 className="mt-6 text-5xl font-serif text-[#4B2E2E]">
              Where Tradition Meets Modern Luxury
            </h2>

            <p className="max-w-3xl mx-auto mt-8 text-lg leading-9 text-[#7A6464]">
              Every Rooh & Rivet creation reflects our passion for timeless
              design. We combine skilled craftsmanship with carefully selected
              materials to create jewellery that feels elegant today and
              treasured for years to come.
            </p>

          </div>

          <div className="grid md:grid-cols-3 gap-10 mt-20">

            {/* Card 1 */}

            <div className="bg-[#F8F4EF] rounded-[32px] p-10 shadow-lg hover:shadow-2xl transition">

              <div className="text-5xl">
                💎
              </div>

              <h3 className="mt-8 text-3xl font-serif text-[#4B2E2E]">
                Premium Materials
              </h3>

              <p className="mt-5 leading-8 text-[#7A6464]">
                Every piece is crafted using carefully selected materials to
                ensure lasting beauty, comfort and exceptional quality.
              </p>

            </div>

            {/* Card 2 */}

            <div className="bg-[#F8F4EF] rounded-[32px] p-10 shadow-lg hover:shadow-2xl transition">

              <div className="text-5xl">
                ✨
              </div>

              <h3 className="mt-8 text-3xl font-serif text-[#4B2E2E]">
                Handcrafted Excellence
              </h3>

              <p className="mt-5 leading-8 text-[#7A6464]">
                Each jewellery piece is finished by skilled artisans who pay
                attention to every detail, creating designs you'll cherish.
              </p>

            </div>

            {/* Card 3 */}

            <div className="bg-[#F8F4EF] rounded-[32px] p-10 shadow-lg hover:shadow-2xl transition">

              <div className="text-5xl">
                ❤️
              </div>

              <h3 className="mt-8 text-3xl font-serif text-[#4B2E2E]">
                Designed for Every Moment
              </h3>

              <p className="mt-5 leading-8 text-[#7A6464]">
                Whether it's a wedding, celebration or everyday elegance,
                Rooh & Rivet jewellery is made to become part of your story.
              </p>

            </div>

          </div>

        </div>

      </section>
      {/* ================= OUR VALUES ================= */}

      <section className="py-24">

        <div className="max-w-7xl mx-auto px-8">

          <div className="text-center">

            <p className="uppercase tracking-[8px] text-[#8B6B5B] text-sm">
              Our Values
            </p>

            <h2 className="mt-6 text-5xl font-serif text-[#4B2E2E]">
              Why Choose Rooh & Rivet
            </h2>

          </div>

          <div className="grid md:grid-cols-2 gap-12 mt-20">

            <div className="bg-white rounded-[32px] shadow-lg p-10">

              <h3 className="text-3xl font-serif text-[#4B2E2E]">
                Timeless Design
              </h3>

              <p className="mt-6 text-[#7A6464] leading-8">
                We create jewellery that goes beyond trends. Every collection is
                thoughtfully designed to remain elegant and meaningful for years
                to come.
              </p>

            </div>

            <div className="bg-white rounded-[32px] shadow-lg p-10">

              <h3 className="text-3xl font-serif text-[#4B2E2E]">
                Crafted With Care
              </h3>

              <p className="mt-6 text-[#7A6464] leading-8">
                Every detail matters. From craftsmanship to packaging, we ensure
                each order reflects the quality and care our customers deserve.
              </p>

            </div>

            <div className="bg-white rounded-[32px] shadow-lg p-10">

              <h3 className="text-3xl font-serif text-[#4B2E2E]">
                Luxury Experience
              </h3>

              <p className="mt-6 text-[#7A6464] leading-8">
                Shopping with Rooh & Rivet is designed to feel effortless,
                elegant and memorable—from your first visit to the moment your
                jewellery arrives.
              </p>

            </div>

            <div className="bg-white rounded-[32px] shadow-lg p-10">

              <h3 className="text-3xl font-serif text-[#4B2E2E]">
                Customer First
              </h3>

              <p className="mt-6 text-[#7A6464] leading-8">
                Your satisfaction is at the heart of everything we do. We're
                committed to exceptional service before, during and after every
                purchase.
              </p>

            </div>

          </div>

        </div>

      </section>

      {/* ================= CALL TO ACTION ================= */}

      <section className="bg-[#4B2E2E] py-24">

        <div className="max-w-4xl mx-auto text-center px-8">

          <h2 className="text-5xl font-serif text-white">
            Discover Your Next Timeless Piece
          </h2>

          <p className="mt-8 text-[#E8DCD4] leading-8 text-lg">
            Explore our carefully curated collection of handcrafted jewellery
            designed to celebrate every milestone, every memory and every
            special occasion.
          </p>

          <a
            href="/shop"
            className="inline-block mt-12 bg-white text-[#4B2E2E] px-10 py-5 rounded-full font-medium hover:bg-[#F8F4EF] transition"
          >
            Explore Collection
          </a>

        </div>

      </section>

    </main>
  );
}