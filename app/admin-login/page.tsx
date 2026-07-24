"use client";

import {
  type FormEvent,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Eye,
  EyeOff,
  LockKeyhole,
} from "lucide-react";

import { supabase } from "@/lib/supabase";

type AdminRecord = {
  id: string;
  role: string;
  active: boolean;
};

export default function AdminLoginPage() {
  const router = useRouter();

  const [email, setEmail] =
    useState("");
  const [password, setPassword] =
    useState("");
  const [showPassword, setShowPassword] =
    useState(false);
  const [loading, setLoading] =
    useState(false);
  const [error, setError] =
    useState("");

  async function handleLogin(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setLoading(true);
    setError("");

    try {
      const {
        data: signInData,
        error: signInError,
      } =
        await supabase.auth.signInWithPassword(
          {
            email: email
              .trim()
              .toLowerCase(),
            password,
          }
        );

      if (signInError) {
        throw signInError;
      }

      const {
        data: admin,
        error: adminError,
      } = await supabase
        .from("admins")
        .select("id, role, active")
        .eq(
          "user_id",
          signInData.user.id
        )
        .maybeSingle<AdminRecord>();

      if (adminError) {
        await supabase.auth.signOut();

        throw new Error(
          "Unable to verify admin access."
        );
      }

      if (!admin || !admin.active) {
        await supabase.auth.signOut();

        throw new Error(
          "This account does not have active admin access."
        );
      }

      router.replace("/admin");
      router.refresh();
    } catch (loginError) {
      if (loginError instanceof Error) {
        setError(loginError.message);
      } else {
        setError(
          "Unable to sign in to the admin portal."
        );
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F8F4EF] px-4 py-12">
      <div className="w-full max-w-md">
        <div className="rounded-[32px] border border-[#E8DDD4] bg-white p-8 shadow-[0_24px_70px_rgba(75,46,46,0.10)] sm:p-10">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-[#5A2D2D] text-white">
              <LockKeyhole size={24} />
            </div>

            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.28em] text-[#9A7765]">
              Rooh &amp; Rivet
            </p>

            <h1 className="font-serif text-3xl text-[#4B2E2E]">
              Admin Portal
            </h1>

            <p className="mt-3 text-sm leading-6 text-[#7A6464]">
              Sign in using an authorised
              administrator account.
            </p>
          </div>

          {error ? (
            <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-700">
              {error}
            </div>
          ) : null}

          <form
            onSubmit={handleLogin}
            className="space-y-5"
          >
            <div>
              <label
                htmlFor="admin-email"
                className="mb-2 block text-sm font-medium text-[#4B2E2E]"
              >
                Admin email
              </label>

              <input
                id="admin-email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(event) =>
                  setEmail(
                    event.target.value
                  )
                }
                placeholder="admin@example.com"
                className="w-full rounded-2xl border border-[#DED0C5] bg-[#FCFAF8] px-4 py-3.5 text-[#4B2E2E] outline-none transition placeholder:text-[#AE9B90] focus:border-[#5A2D2D] focus:ring-2 focus:ring-[#5A2D2D]/10"
              />
            </div>

            <div>
              <label
                htmlFor="admin-password"
                className="mb-2 block text-sm font-medium text-[#4B2E2E]"
              >
                Password
              </label>

              <div className="relative">
                <input
                  id="admin-password"
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) =>
                    setPassword(
                      event.target.value
                    )
                  }
                  placeholder="Enter your password"
                  className="w-full rounded-2xl border border-[#DED0C5] bg-[#FCFAF8] px-4 py-3.5 pr-12 text-[#4B2E2E] outline-none transition placeholder:text-[#AE9B90] focus:border-[#5A2D2D] focus:ring-2 focus:ring-[#5A2D2D]/10"
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowPassword(
                      (current) => !current
                    )
                  }
                  aria-label={
                    showPassword
                      ? "Hide password"
                      : "Show password"
                  }
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#8B6B5B] transition hover:text-[#4B2E2E]"
                >
                  {showPassword ? (
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
              className="w-full rounded-2xl bg-[#5A2D2D] px-5 py-3.5 text-sm font-semibold uppercase tracking-[0.15em] text-white transition hover:bg-[#4B2525] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading
                ? "Verifying access..."
                : "Enter admin portal"}
            </button>
          </form>

          <div className="mt-7 border-t border-[#EEE5DE] pt-6 text-center">
            <Link
              href="/"
              className="text-sm font-medium text-[#8B6B5B] transition hover:text-[#4B2E2E]"
            >
              Return to storefront
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}