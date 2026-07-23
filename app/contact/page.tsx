"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

type ContactInfo = {
  phone: string;
  instagram: string;
  email: string;
};

const contactInfo: ContactInfo = {
  phone: "+91 90416 31335",
  instagram: "@rooh.n.rivet",
  email: "Email Coming Soon",
};

export default function ContactPage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Future:
    // Submit to Supabase or API route.

    alert("Thank you for reaching out! We'll get back to you soon.");

    setForm({
      name: "",
      email: "",
      subject: "",
      message: "",
    });
  };

  return (
    <main className="min-h-screen bg-[#F8F4EF] text-[#4B2E2E]">
      {/* Hero */}
      <section className="mx-auto max-w-7xl px-6 pt-20 pb-14 text-center">
        <p className="mb-4 tracking-[0.3em] uppercase text-[#8B6B5B] text-sm">
          Rooh & Rivet
        </p>

        <h1 className="font-serif text-5xl md:text-6xl lg:text-7xl">
          Contact Us
        </h1>

        <p className="mx-auto mt-8 max-w-3xl text-lg leading-8 text-[#7A6464]">
          We'd love to hear from you. Whether you're looking for the perfect
          piece, would like a personalised recommendation, or wish to view our
          jewellery over a video call before purchasing, we're here to make your
          experience effortless and memorable.
        </p>
      </section>

      {/* Contact Cards */}
      <section className="mx-auto max-w-7xl px-6 pb-20">
        <div className="grid gap-8 md:grid-cols-3">
          {/* WhatsApp */}
          <div className="rounded-3xl bg-white p-8 shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl">
            <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-[#F8F4EF] text-2xl">
              💬
            </div>

            <h2 className="font-serif text-3xl text-[#4B2E2E]">WhatsApp</h2>

            <p className="mt-5 leading-8 text-[#7A6464]">
              Contact us directly for:
            </p>

            <ul className="mt-4 space-y-3 text-[#7A6464]">
              <li>• Product enquiries</li>
              <li>• Video call jewellery viewing</li>
              <li>• Purchase assistance</li>
            </ul>

            <a
              href={`https://wa.me/919041631335`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-8 inline-block font-semibold text-[#5A2D2D] hover:underline"
            >
              {contactInfo.phone}
            </a>
          </div>

          {/* Instagram */}
          <div className="rounded-3xl bg-white p-8 shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl">
            <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-[#F8F4EF] text-2xl">
              📷
            </div>

            <h2 className="font-serif text-3xl text-[#4B2E2E]">Instagram</h2>

            <p className="mt-5 leading-8 text-[#7A6464]">
              Explore our latest jewellery collections, behind-the-scenes
              moments, styling inspiration, and connect with us through
              Instagram.
            </p>

            <a
              href="https://instagram.com/rooh.n.rivet"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-8 inline-block font-semibold text-[#5A2D2D] hover:underline"
            >
              {contactInfo.instagram}
            </a>
          </div>

          {/* Email */}
          <div className="rounded-3xl bg-white p-8 shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl">
            <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-[#F8F4EF] text-2xl">
              ✉️
            </div>

            <h2 className="font-serif text-3xl text-[#4B2E2E]">Email</h2>

            <p className="mt-5 leading-8 text-[#7A6464]">
              Our dedicated business email will be available once our official
              domain is live.
            </p>

            <p className="mt-8 font-semibold text-[#5A2D2D]">
              {contactInfo.email}
            </p>
          </div>
        </div>
      </section>

      {/* Contact Form */}
      <section className="mx-auto max-w-4xl px-6 pb-24">
        <div className="rounded-[2rem] bg-white p-8 shadow-xl md:p-12">
          <div className="text-center">
            <p className="uppercase tracking-[0.25em] text-[#8B6B5B] text-sm">
              Get In Touch
            </p>

            <h2 className="mt-3 font-serif text-4xl md:text-5xl">
              Send Us a Message
            </h2>

            <p className="mx-auto mt-5 max-w-2xl text-[#7A6464] leading-8">
              Have a question or need assistance? Fill out the form below and
              we'll get back to you as soon as possible.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="mt-12 space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <label
                  htmlFor="name"
                  className="mb-2 block text-sm font-medium text-[#4B2E2E]"
                >
                  Name
                </label>

                <input
                  id="name"
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) =>
                    setForm({ ...form, name: e.target.value })
                  }
                  className="w-full rounded-xl border border-[#E8DDD3] bg-white px-4 py-3 outline-none transition focus:border-[#5A2D2D]"
                />
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-medium text-[#4B2E2E]"
                >
                  Email
                </label>

                <input
                  id="email"
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) =>
                    setForm({ ...form, email: e.target.value })
                  }
                  className="w-full rounded-xl border border-[#E8DDD3] bg-white px-4 py-3 outline-none transition focus:border-[#5A2D2D]"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="subject"
                className="mb-2 block text-sm font-medium text-[#4B2E2E]"
              >
                Subject
              </label>

              <input
                id="subject"
                type="text"
                required
                value={form.subject}
                onChange={(e) =>
                  setForm({ ...form, subject: e.target.value })
                }
                className="w-full rounded-xl border border-[#E8DDD3] bg-white px-4 py-3 outline-none transition focus:border-[#5A2D2D]"
              />
            </div>

            <div>
              <label
                htmlFor="message"
                className="mb-2 block text-sm font-medium text-[#4B2E2E]"
              >
                Message
              </label>

              <textarea
                id="message"
                required
                rows={6}
                value={form.message}
                onChange={(e) =>
                  setForm({ ...form, message: e.target.value })
                }
                className="w-full rounded-xl border border-[#E8DDD3] bg-white px-4 py-3 outline-none transition focus:border-[#5A2D2D]"
              />
            </div>

            <button
              type="submit"
              className="rounded-full bg-[#5A2D2D] px-8 py-4 font-medium text-white transition hover:bg-[#4B2E2E]"
            >
              Send Message
            </button>
          </form>
        </div>
      </section>

      {/* CTA */}
      <section className="pb-24 px-6">
        <div className="mx-auto max-w-6xl rounded-[2.5rem] bg-white px-8 py-16 text-center shadow-xl">
          <p className="uppercase tracking-[0.3em] text-[#8B6B5B] text-sm">
            Discover Our Collection
          </p>

          <h2 className="mt-4 font-serif text-4xl md:text-5xl">
            Find Your Perfect Piece
          </h2>

          <p className="mx-auto mt-6 max-w-3xl text-lg leading-8 text-[#7A6464]">
            Explore handcrafted jewellery designed to celebrate timeless beauty,
            elegance, and meaningful moments.
          </p>

          <Link
            href="/shop"
            className="mt-10 inline-flex rounded-full bg-[#5A2D2D] px-10 py-4 font-medium text-white transition hover:bg-[#4B2E2E]"
          >
            Browse Collection
          </Link>
        </div>
      </section>
    </main>
  );
}