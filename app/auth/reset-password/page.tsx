"use client";

import {
  type FormEvent,
  useState,
} from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  Loader2,
  Mail,
} from "lucide-react";

import { supabase } from "@/lib/supabase";

function getErrorMessage(
  error: unknown
): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "Unable to send the password reset email.";
}

export default function ForgotPasswordPage() {
  const [email, setEmail] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState(false);

  async function handleReset(
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
        "Enter your registered email address."
      );
      return;
    }

    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      const redirectTo =
        `${window.location.origin}/auth/reset-password`;

      const {
        error: resetError,
      } =
        await supabase.auth.resetPasswordForEmail(
          normalisedEmail,
          {
            redirectTo,
          }
        );

      if (resetError) {
        throw resetError;
      }

      setEmail(
        normalisedEmail
      );
      setSuccess(true);
    } catch (
      resetError: unknown
    ) {
      console.error(
        "Unable to send password reset email:",
        resetError
      );

      setError(
        getErrorMessage(
          resetError
        )
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#F8F4EF]">
      <div className="mx-auto flex min-h-screen max-w-7xl items-center justify-center px-6 py-16">
        <section className="w-full max-w-lg rounded-[32px] border border-[#E8DED2] bg-white p-8 shadow-xl sm:p-10">
          <Link
            href="/auth/login"
            className="mb-8 inline-flex items-center gap-2 text-[#5A2D2D] transition hover:underline"
          >
            <ArrowLeft size={18} />
            Back to Login
          </Link>

          <div className="mb-10 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#F5E7E0]">
              <Mail
                size={28}
                className="text-[#5A2D2D]"
              />
            </div>

            <h1 className="mt-6 font-serif text-5xl text-[#4B2E2E]">
              Forgot Password
            </h1>

            <p className="mt-4 leading-7 text-[#8B6B5B]">
              Enter your registered email address and we will send you a secure link to create a new password.
            </p>
          </div>

          {error ? (
            <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-700">
              {error}
            </div>
          ) : null}

          {success ? (
            <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-emerald-800">
              <div className="flex items-start gap-3">
                <CheckCircle2
                  size={20}
                  className="mt-0.5 shrink-0"
                />

                <div>
                  <p className="font-semibold">
                    Check your email
                  </p>

                  <p className="mt-1 text-sm leading-6">
                    A password reset link has been sent to{" "}
                    <span className="font-semibold">
                      {email}
                    </span>
                    . Check your spam folder if it does not arrive shortly.
                  </p>
                </div>
              </div>
            </div>
          ) : null}

          <form
            onSubmit={handleReset}
            className="space-y-6"
          >
            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-medium text-[#4B2E2E]"
              >
                Email Address
              </label>

              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(event) => {
                  setEmail(
                    event.target.value
                  );
                  setError("");
                  setSuccess(false);
                }}
                placeholder="Enter your registered email"
                disabled={loading}
                className="w-full rounded-xl border border-stone-300 px-4 py-4 text-[#4B2E2E] outline-none transition placeholder:text-stone-400 focus:border-[#5A2D2D] disabled:cursor-not-allowed disabled:bg-stone-50"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#5A2D2D] px-6 py-4 text-lg font-semibold text-white transition hover:bg-[#432121] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <Loader2
                  size={20}
                  className="animate-spin"
                />
              ) : (
                <Mail size={20} />
              )}

              {loading
                ? "Sending Reset Link..."
                : success
                  ? "Send Another Link"
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
              Don&apos;t have an account? Create one
            </Link>
          </form>
        </section>
      </div>
    </main>
  );
}