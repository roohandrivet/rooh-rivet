"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function CustomerLoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] =
    useState(false);

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");

  async function handleLogin(
    e: FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    setLoading(true);
    setError("");

    try {
      const { error } =
        await supabase.auth.signInWithPassword({
          email,
          password,
        });

      if (error) {
        throw error;
      }

      router.push("/account");
      router.refresh();
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Unable to sign in.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#F8F4EF]">
      <div className="mx-auto flex min-h-screen max-w-7xl items-center justify-center px-6 py-16">
        <div className="w-full max-w-lg rounded-3xl bg-white p-10 shadow-xl">
          <div className="mb-10 text-center">
            <h1 className="font-serif text-5xl text-[#4B2E2E]">
              Welcome Back
            </h1>

            <p className="mt-4 text-[#8B6B5B]">
              Sign in to your Rooh & Rivet account to
              view your orders, wishlist and account
              details.
            </p>
          </div>

          {error && (
            <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <form
            onSubmit={handleLogin}
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
                placeholder="Enter your email"
                className="w-full rounded-xl border border-stone-300 px-4 py-4 text-[#4B2E2E] outline-none transition focus:border-[#5A2D2D]"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-[#4B2E2E]">
                Password
              </label>

              <div className="relative">
                <input
                  required
                  autoComplete="current-password"
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  value={password}
                  onChange={(e) =>
                    setPassword(e.target.value)
                  }
                  placeholder="Enter your password"
                  className="w-full rounded-xl border border-stone-300 px-4 py-4 pr-14 text-[#4B2E2E] outline-none transition focus:border-[#5A2D2D]"
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowPassword(
                      !showPassword
                    )
                  }
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-500 transition hover:text-[#5A2D2D]"
                >
                  {showPassword ? (
                    <EyeOff size={20} />
                  ) : (
                    <Eye size={20} />
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm text-[#8B6B5B]">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-stone-300"
                />

                Remember Me
              </label>

              <Link
                href="/auth/forgot-password"
                className="text-sm font-medium text-[#5A2D2D] transition hover:underline"
              >
                Forgot Password?
              </Link>
            </div>
                        <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-[#5A2D2D] px-6 py-4 text-lg font-semibold text-white transition hover:bg-[#4B2E2E] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading
                ? "Signing In..."
                : "Sign In"}
            </button>

            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-stone-200" />
              </div>

              <div className="relative flex justify-center">
                <span className="bg-white px-4 text-sm text-[#8B6B5B]">
                  New to Rooh & Rivet?
                </span>
              </div>
            </div>

            <Link
              href="/auth/signup"
              className="block w-full rounded-xl border border-[#5A2D2D] px-6 py-4 text-center text-lg font-semibold text-[#5A2D2D] transition hover:bg-[#5A2D2D] hover:text-white"
            >
              Create Account
            </Link>

            <p className="text-center text-sm leading-7 text-[#8B6B5B]">
              By signing in, you agree to our
              Terms & Conditions and Privacy Policy.
            </p>
          </form>
        </div>
      </div>
      </main>
  );
}