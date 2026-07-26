"use client";

import {
  type FormEvent,
  useState,
} from "react";
import Link from "next/link";
import {
  CheckCircle2,
  Loader2,
  Mail,
} from "lucide-react";

type NewsletterResponse = {
  success?: boolean;
  message?: string;
  error?: string;
};

export default function Footer() {
  const [email, setEmail] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  async function handleSubscribe(
    event: FormEvent<HTMLFormElement>
  ): Promise<void> {
    event.preventDefault();

    if (loading) {
      return;
    }

    const normalisedEmail =
      email.trim().toLowerCase();

    if (!normalisedEmail) {
      setError(
        "Enter your email address."
      );
      setSuccess("");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const response =
        await fetch(
          "/api/newsletter",
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              email:
                normalisedEmail,
              source: "footer",
            }),
          }
        );

      const result =
        (await response.json()) as NewsletterResponse;

      if (!response.ok) {
        throw new Error(
          result.error ||
            "Unable to subscribe right now."
        );
      }

      setEmail("");
      setSuccess(
        result.message ||
          "Thank you for subscribing."
      );
    } catch (
      subscribeError: unknown
    ) {
      console.error(
        "Newsletter subscription failed:",
        subscribeError
      );

      setError(
        subscribeError instanceof Error
          ? subscribeError.message
          : "Unable to subscribe right now."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <footer className="mt-20 bg-[#5A2D2D] text-[#F8F4EF]">
      <div className="mx-auto max-w-7xl px-6 py-16">
        <div className="text-center">
          <h2 className="font-serif text-5xl">
            Rooh & Rivet
          </h2>

          <p className="mt-3 text-sm uppercase tracking-[6px] text-[#D8C2B6]">
            Rivet Your Style
          </p>

          <p className="mx-auto mt-8 max-w-2xl leading-8 text-[#E8DDD3]">
            Timeless handcrafted jewellery inspired by elegance,
            craftsmanship, and the stories that deserve to be remembered.
          </p>
        </div>

        <section className="mx-auto mt-12 max-w-3xl rounded-[28px] border border-white/15 bg-white/5 p-6 text-center backdrop-blur sm:p-8">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10">
            <Mail size={24} />
          </div>

          <h3 className="mt-5 font-serif text-3xl">
            Join the Rooh & Rivet Journal
          </h3>

          <p className="mx-auto mt-3 max-w-xl leading-7 text-[#E8DDD3]">
            Receive new collection launches, styling inspiration and private offers.
          </p>

          <form
            onSubmit={
              handleSubscribe
            }
            className="mx-auto mt-7 flex max-w-2xl flex-col gap-3 sm:flex-row"
          >
            <label
              htmlFor="newsletter-email"
              className="sr-only"
            >
              Email address
            </label>

            <input
              id="newsletter-email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(event) => {
                setEmail(
                  event.target.value
                );
                setError("");
                setSuccess("");
              }}
              placeholder="Enter your email address"
              disabled={loading}
              className="min-w-0 flex-1 rounded-full border border-white/20 bg-white px-6 py-4 text-[#4B2E2E] outline-none transition placeholder:text-[#9B8580] focus:border-[#E6CAC0] disabled:cursor-not-allowed disabled:opacity-70"
            />

            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[#F8F4EF] px-7 py-4 font-semibold text-[#5A2D2D] transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <Loader2
                  size={18}
                  className="animate-spin"
                />
              ) : (
                <Mail size={18} />
              )}

              {loading
                ? "Subscribing..."
                : "Subscribe"}
            </button>
          </form>

          {error ? (
            <p className="mt-4 text-sm text-[#FFD6D6]">
              {error}
            </p>
          ) : null}

          {success ? (
            <div className="mt-4 flex items-center justify-center gap-2 text-sm text-[#D8F3DE]">
              <CheckCircle2
                size={17}
              />
              <span>
                {success}
              </span>
            </div>
          ) : null}

          <p className="mt-4 text-xs leading-5 text-[#D8C2B6]">
            By subscribing, you agree to receive Rooh & Rivet updates. You may unsubscribe at any time.
          </p>
        </section>

        <div className="mt-12 flex flex-wrap justify-center gap-8 text-sm uppercase tracking-[3px]">
          <Link
            href="/"
            className="transition hover:text-white"
          >
            Home
          </Link>

          <Link
            href="/shop"
            className="transition hover:text-white"
          >
            Shop
          </Link>

          <Link
            href="/about"
            className="transition hover:text-white"
          >
            About
          </Link>

          <Link
            href="/contact"
            className="transition hover:text-white"
          >
            Contact
          </Link>
        </div>

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

        <div className="my-12 border-t border-[#7A4A4A]" />

        <div className="flex flex-col items-center justify-between gap-4 text-center md:flex-row">
          <p className="text-sm text-[#D8C2B6]">
            ©{" "}
            {new Date().getFullYear()}{" "}
            Rooh & Rivet. All rights reserved.
          </p>

          <div className="flex gap-6 text-sm">
            <Link
              href="/privacy"
              className="transition hover:text-white"
            >
              Privacy Policy
            </Link>

            <Link
              href="/terms"
              className="transition hover:text-white"
            >
              Terms & Conditions
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}