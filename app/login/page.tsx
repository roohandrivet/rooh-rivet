"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import {
  getCurrentSession,
  isAdmin,
  signIn,
} from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  useEffect(() => {
    checkSession();
  }, []);

  async function checkSession() {
    const session =
      await getCurrentSession();

    if (!session?.user) {
      return;
    }

    if (isAdmin(session.user.email)) {
      router.replace("/admin");
      return;
    }

    router.replace("/account");
  }

  async function handleSubmit(
    e: FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {
      const {
        data,
        error: signInError,
      } = await signIn(
        email.trim(),
        password
      );

      if (signInError) {
        throw signInError;
      }

      if (!data.user) {
        throw new Error(
          "Unable to sign in."
        );
      }

      if (isAdmin(data.user.email)) {
        router.replace("/admin");
      } else {
        router.replace("/account");
      }
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError(
          "Something went wrong."
        );
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F8F4EF] px-6">
      <div className="w-full max-w-md rounded-3xl border border-[#E8DDD3] bg-white p-10 shadow-2xl">
        <div className="text-center">
          <h1 className="font-serif text-5xl text-[#5A2D2D]">
            Rooh & Rivet
          </h1>

          <p className="mt-3 text-sm uppercase tracking-[6px] text-[#A67C6B]">
            Admin Portal
          </p>

          <p className="mt-6 text-[#7A6464]">
            Sign in to continue.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="mt-10 space-y-6"
        >
                    <div>
            <label className="mb-2 block font-medium text-[#5A2D2D]">
              Email
            </label>

            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) =>
                setEmail(e.target.value)
              }
              placeholder="you@example.com"
              className="w-full rounded-xl border border-[#E8DDD3] px-5 py-4 outline-none transition focus:border-[#5A2D2D]"
            />
          </div>

          <div>
            <label className="mb-2 block font-medium text-[#5A2D2D]">
              Password
            </label>

            <input
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) =>
                setPassword(e.target.value)
              }
              placeholder="••••••••"
              className="w-full rounded-xl border border-[#E8DDD3] px-5 py-4 outline-none transition focus:border-[#5A2D2D]"
            />
          </div>

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-[#5A2D2D] py-4 text-lg font-medium text-white transition hover:bg-[#472323] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading
              ? "Signing In..."
              : "Sign In"}
          </button>
        </form>

        <div className="mt-8 text-center">
          <Link
            href="/"
            className="text-sm text-[#8B6B5B] transition hover:text-[#5A2D2D]"
          >
            ← Back to Website
          </Link>
        </div>
      </div>
    </main>
  );
}