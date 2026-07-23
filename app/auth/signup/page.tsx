"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function CustomerSignupPage() {
  const router = useRouter();

  const [fullName, setFullName] = useState("");

  const [email, setEmail] = useState("");

  const [password, setPassword] =
    useState("");

  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [showPassword, setShowPassword] =
    useState(false);

  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] = useState("");

  async function handleSignup(
    e: FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const { error } =
        await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
            },
          },
        });

      if (error) {
        throw error;
      }

      router.push("/auth/login");
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Unable to create account.");
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
              Create Account
            </h1>

            <p className="mt-4 text-[#8B6B5B]">
              Join Rooh & Rivet to save your
              favourite jewellery, track orders
              and enjoy a personalised shopping
              experience.
            </p>
          </div>

          {error && (
            <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <form
            onSubmit={handleSignup}
            className="space-y-6"
          >
                        <div>
              <label className="mb-2 block text-sm font-medium text-[#4B2E2E]">
                Full Name
              </label>

              <input
                type="text"
                required
                value={fullName}
                onChange={(e) =>
                  setFullName(e.target.value)
                }
                placeholder="Enter your full name"
                className="w-full rounded-xl border border-stone-300 px-4 py-4 text-[#4B2E2E] outline-none transition focus:border-[#5A2D2D]"
              />
            </div>

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
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  required
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) =>
                    setPassword(e.target.value)
                  }
                  placeholder="Create a password"
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

            <div>
              <label className="mb-2 block text-sm font-medium text-[#4B2E2E]">
                Confirm Password
              </label>

              <div className="relative">
                <input
                  type={
                    showConfirmPassword
                      ? "text"
                      : "password"
                  }
                  required
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) =>
                    setConfirmPassword(
                      e.target.value
                    )
                  }
                  placeholder="Confirm your password"
                  className="w-full rounded-xl border border-stone-300 px-4 py-4 pr-14 text-[#4B2E2E] outline-none transition focus:border-[#5A2D2D]"
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowConfirmPassword(
                      !showConfirmPassword
                    )
                  }
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-500 transition hover:text-[#5A2D2D]"
                >
                  {showConfirmPassword ? (
                    <EyeOff size={20} />
                  ) : (
                    <Eye size={20} />
                  )}
                </button>
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-[#5A2D2D] px-6 py-4 text-lg font-semibold text-white transition hover:bg-[#4B2E2E] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading
                ? "Creating Account..."
                : "Create Account"}
            </button>

            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-stone-200" />
              </div>

              <div className="relative flex justify-center">
                <span className="bg-white px-4 text-sm text-[#8B6B5B]">
                  Already have an account?
                </span>
              </div>
            </div>

            <Link
              href="/auth/login"
              className="block w-full rounded-xl border border-[#5A2D2D] px-6 py-4 text-center text-lg font-semibold text-[#5A2D2D] transition hover:bg-[#5A2D2D] hover:text-white"
            >
              Sign In
            </Link>

            <p className="text-center text-sm leading-7 text-[#8B6B5B]">
              By creating an account, you agree to our
              Terms & Conditions and Privacy Policy.
            </p>
          </form>
        </div>
      </div>
      </main>
  );
}