import Link from "next/link";

export default function Footer() {
  return (
    <footer className="mt-20 bg-[#5A2D2D] text-[#F8F4EF]">

      <div className="max-w-7xl mx-auto px-6 py-16">

        {/* Brand */}

        <div className="text-center">

          <h2 className="font-serif text-5xl">
            Rooh & Rivet
          </h2>

          <p className="mt-3 uppercase tracking-[6px] text-sm text-[#D8C2B6]">
            Rivet Your Style
          </p>

          <p className="mx-auto mt-8 max-w-2xl leading-8 text-[#E8DDD3]">
            Timeless handcrafted jewellery inspired by elegance,
            craftsmanship, and the stories that deserve to be remembered.
          </p>

        </div>

        {/* Links */}

        <div className="mt-12 flex flex-wrap justify-center gap-8 text-sm uppercase tracking-[3px]">

          <Link href="/" className="hover:text-white transition">
            Home
          </Link>

          <Link href="/shop" className="hover:text-white transition">
            Shop
          </Link>

          <Link href="/about" className="hover:text-white transition">
            About
          </Link>

          <Link href="/contact" className="hover:text-white transition">
            Contact
          </Link>

        </div>

        {/* WhatsApp */}

        <div className="mt-10 text-center">

          <a
            href="https://wa.me/YOURNUMBER"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block rounded-full border border-[#D8C2B6] px-8 py-3 transition hover:bg-[#6B3737]"
          >
            Chat on WhatsApp
          </a>

        </div>

        {/* Divider */}

        <div className="my-12 border-t border-[#7A4A4A]" />

        {/* Bottom */}

        <div className="flex flex-col items-center justify-between gap-4 text-center md:flex-row">

          <p className="text-sm text-[#D8C2B6]">
            © {new Date().getFullYear()} Rooh & Rivet. All rights reserved.
          </p>

          <div className="flex gap-6 text-sm">

            <Link
              href="/privacy"
              className="hover:text-white transition"
            >
              Privacy Policy
            </Link>

            <Link
              href="/terms"
              className="hover:text-white transition"
            >
              Terms & Conditions
            </Link>

          </div>

        </div>

      </div>

    </footer>
  );
}