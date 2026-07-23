"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { supabase } from "@/lib/supabase";

type Profile = {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
};

export default function ProfilePage() {
  const router = useRouter();

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [success, setSuccess] =
    useState("");

  const [error, setError] =
    useState("");

  const [profile, setProfile] =
    useState<Profile>({
      id: "",
      full_name: "",
      email: "",
      phone: "",
      address: "",
      city: "",
      state: "",
      postal_code: "",
      country: "",
    });

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.replace("/auth/login");
      return;
    }

    setProfile({
      id: user.id,
      full_name:
        user.user_metadata?.full_name ?? "",
      email: user.email ?? "",
      phone:
        user.user_metadata?.phone ?? "",
      address:
        user.user_metadata?.address ?? "",
      city:
        user.user_metadata?.city ?? "",
      state:
        user.user_metadata?.state ?? "",
      postal_code:
        user.user_metadata?.postal_code ?? "",
      country:
        user.user_metadata?.country ?? "",
    });

    setLoading(false);
  }

  async function handleSave(
    e: FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    setSaving(true);
    setSuccess("");
    setError("");

    const { error } =
      await supabase.auth.updateUser({
        data: {
          full_name: profile.full_name,
          phone: profile.phone,
          address: profile.address,
          city: profile.city,
          state: profile.state,
          postal_code:
            profile.postal_code,
          country: profile.country,
        },
      });

    if (error) {
      setError(error.message);
    } else {
      setSuccess(
        "Profile updated successfully."
      );
    }

    setSaving(false);
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F8F4EF]">
        <p className="text-lg text-[#8B6B5B]">
          Loading profile...
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F8F4EF] py-16">
      <div className="mx-auto max-w-4xl px-6">
        <Link
          href="/account"
          className="mb-10 inline-flex items-center gap-2 text-[#5A2D2D] hover:underline"
        >
          <ArrowLeft size={18} />
          Back to My Account
        </Link>

        <h1 className="font-serif text-5xl text-[#4B2E2E]">
          My Profile
        </h1>

        <p className="mt-3 text-[#8B6B5B]">
          Update your personal and shipping
          information.
        </p>

        <form
          onSubmit={handleSave}
          className="mt-12 rounded-3xl bg-white p-10 shadow-xl"
        >
                      {error && (
            <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {success}
            </div>
          )}

          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-[#4B2E2E]">
                Full Name
              </label>

              <input
                type="text"
                value={profile.full_name}
                onChange={(e) =>
                  setProfile({
                    ...profile,
                    full_name: e.target.value,
                  })
                }
                className="w-full rounded-xl border border-stone-300 px-4 py-4 outline-none transition focus:border-[#5A2D2D]"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-[#4B2E2E]">
                Email Address
              </label>

              <input
                type="email"
                value={profile.email}
                disabled
                className="w-full cursor-not-allowed rounded-xl border border-stone-300 bg-stone-100 px-4 py-4 text-stone-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-[#4B2E2E]">
                Phone Number
              </label>

              <input
                type="text"
                value={profile.phone}
                onChange={(e) =>
                  setProfile({
                    ...profile,
                    phone: e.target.value,
                  })
                }
                className="w-full rounded-xl border border-stone-300 px-4 py-4 outline-none transition focus:border-[#5A2D2D]"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-[#4B2E2E]">
                Country
              </label>

              <input
                type="text"
                value={profile.country}
                onChange={(e) =>
                  setProfile({
                    ...profile,
                    country: e.target.value,
                  })
                }
                className="w-full rounded-xl border border-stone-300 px-4 py-4 outline-none transition focus:border-[#5A2D2D]"
              />
            </div>

            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-medium text-[#4B2E2E]">
                Address
              </label>

              <input
                type="text"
                value={profile.address}
                onChange={(e) =>
                  setProfile({
                    ...profile,
                    address: e.target.value,
                  })
                }
                className="w-full rounded-xl border border-stone-300 px-4 py-4 outline-none transition focus:border-[#5A2D2D]"
              />
            </div>
                        <div>
              <label className="mb-2 block text-sm font-medium text-[#4B2E2E]">
                City
              </label>

              <input
                type="text"
                value={profile.city}
                onChange={(e) =>
                  setProfile({
                    ...profile,
                    city: e.target.value,
                  })
                }
                className="w-full rounded-xl border border-stone-300 px-4 py-4 outline-none transition focus:border-[#5A2D2D]"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-[#4B2E2E]">
                State
              </label>

              <input
                type="text"
                value={profile.state}
                onChange={(e) =>
                  setProfile({
                    ...profile,
                    state: e.target.value,
                  })
                }
                className="w-full rounded-xl border border-stone-300 px-4 py-4 outline-none transition focus:border-[#5A2D2D]"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-[#4B2E2E]">
                Postal Code
              </label>

              <input
                type="text"
                value={profile.postal_code}
                onChange={(e) =>
                  setProfile({
                    ...profile,
                    postal_code: e.target.value,
                  })
                }
                className="w-full rounded-xl border border-stone-300 px-4 py-4 outline-none transition focus:border-[#5A2D2D]"
              />
            </div>
          </div>

          <div className="mt-10 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-[#5A2D2D] px-8 py-4 text-lg font-semibold text-white transition hover:bg-[#4B2E2E] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving
                ? "Saving..."
                : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
      </main>
  );
}