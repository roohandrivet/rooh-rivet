"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");

  const [loading, setLoading] =
    useState(false);

  const [error, setError] = useState("");

  const [success, setSuccess] =
    useState(false);

  async function handleReset(
    e: FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      const { error } =
        await supabase.auth.resetPasswordForEmail(
          email,
          {
            redirectTo:
              `${window.location.origin}/auth/login`,
          }
        );

      if (error) {
        throw error;
      }

      setSuccess(true);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError(
          "Unable to send reset email."
        );
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#F8F4EF]">
      <div className="mx-auto flex min-h-screen max-w-7xl items-center justify-center px-6 py-16">
        <div className="w-full max-w-lg rounded-3xl bg-white p-10 shadow-xl">
          <Link
            href="/auth/login"
            className="mb-8 inline-flex items-center gap-2 text-[#5A2D2D] transition hover:underline"
          >
            <ArrowLeft size={18} />
            Back to Login
          </Link>

          <div className="mb-10 text-center">
            <h1 className="font-serif text-5xl text-[#4B2E2E]">
              Forgot Password
            </h1>

            <p className="mt-4 text-[#8B6B5B]">
              Enter your registered email
              address and we'll send you a
              password reset link.
            </p>
          </div>

          {error && (
            <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              Password reset email sent.
              Please check your inbox.
            </div>
          )}

          <form
            onSubmit={handleReset}
            className="space-y-6"
          >
                        <div>
              <label className="mb-2 block text-sm font-medium text-[#4B2E2E]">
                Email Address
              </label>

              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) =>
                  setEmail(e.target.value)
                }
                placeholder="Enter your registered email"
                className="w-full rounded-xl border border-stone-300 px-4 py-4 text-[#4B2E2E] outline-none transition focus:border-[#5A2D2D]"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-[#5A2D2D] px-6 py-4 text-lg font-semibold text-white transition hover:bg-[#4B2E2E] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading
                ? "Sending Reset Link..."
                : "Send Reset Link"}
            </button>
            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-stone-200" />
              </div>

              <div className="relative flex justify-center">
                <span className="bg-white px-4 text-sm text-[#8B6B5B]">
                  Remember your password?
                </span>
              </div>
            </div>

            <Link
              href="/auth/login"
              className="block w-full rounded-xl border border-[#5A2D2D] px-6 py-4 text-center text-lg font-semibold text-[#5A2D2D] transition hover:bg-[#5A2D2D] hover:text-white"
            >
              Back to Login
            </Link>

            <Link
              href="/auth/signup"
              className="block text-center text-sm font-medium text-[#5A2D2D] transition hover:underline"
            >
              Don't have an account? Create one
            </Link>
          </form>
        </div>
      </div>
      </main>
  );
}