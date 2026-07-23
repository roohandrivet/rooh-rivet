"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Package,
  User,
  LogOut,
  ShoppingBag,
  Heart,
} from "lucide-react";

import { supabase } from "@/lib/supabase";

type UserProfile = {
  id: string;
  full_name?: string;
  email?: string;
};

export default function AccountPage() {
  const router = useRouter();

  const [loading, setLoading] =
    useState(true);

  const [profile, setProfile] =
    useState<UserProfile | null>(null);

  useEffect(() => {
    checkUser();
  }, []);

  async function checkUser() {
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
        (user.user_metadata
          ?.full_name as string) || "",
      email: user.email,
    });

    setLoading(false);
  }

  async function handleLogout() {
    await supabase.auth.signOut();

    router.push("/");
    router.refresh();
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F8F4EF]">
        <p className="text-lg text-[#8B6B5B]">
          Loading your account...
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F8F4EF] py-16">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-12">
          <h1 className="font-serif text-5xl text-[#4B2E2E]">
            My Account
          </h1>

          <p className="mt-3 text-[#8B6B5B]">
            Welcome back,
            <span className="font-semibold text-[#4B2E2E]">
              {" "}
              {profile?.full_name || "Customer"}
            </span>
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2">

          <Link
            href="/account/orders"
            className="group rounded-3xl bg-white p-8 shadow transition hover:-translate-y-1 hover:shadow-xl"
          >
            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#F8F4EF] transition group-hover:bg-[#5A2D2D]">
              <Package className="h-8 w-8 text-[#5A2D2D] transition group-hover:text-white" />
            </div>

            <h2 className="font-serif text-3xl text-[#4B2E2E]">
              My Orders
            </h2>

            <p className="mt-3 text-[#8B6B5B]">
              View your previous orders and track
              their current status.
            </p>
          </Link>


          <Link
            href="/wishlist"
            className="group rounded-3xl bg-white p-8 shadow transition hover:-translate-y-1 hover:shadow-xl"
          >
            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#F8F4EF] transition group-hover:bg-[#5A2D2D]">
              <Heart className="h-8 w-8 text-[#5A2D2D] transition group-hover:text-white" />
            </div>

            <h2 className="font-serif text-3xl text-[#4B2E2E]">
              My Wishlist
            </h2>

            <p className="mt-3 text-[#8B6B5B]">
              View your saved jewellery pieces
              and continue your collection.
            </p>
          </Link>


          <Link
            href="/account/profile"
            className="group rounded-3xl bg-white p-8 shadow transition hover:-translate-y-1 hover:shadow-xl"
          >
            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#F8F4EF] transition group-hover:bg-[#5A2D2D]">
              <User className="h-8 w-8 text-[#5A2D2D] transition group-hover:text-white" />
            </div>

            <h2 className="font-serif text-3xl text-[#4B2E2E]">
              My Profile
            </h2>

            <p className="mt-3 text-[#8B6B5B]">
              Update your personal details,
              shipping address and contact
              information.
            </p>
          </Link>


          <Link
            href="/shop"
            className="group rounded-3xl bg-white p-8 shadow transition hover:-translate-y-1 hover:shadow-xl"
          >
            <div className="mb-6 flex h-16 w-16 to-center rounded-2xl bg-[#F8F4EF] transition group-hover:bg-[#5A2D2D]">
              <ShoppingBag className="h-8 w-8 text-[#5A2D2D] transition group-hover:text-white" />
            </div>

            <h2 className="font-serif text-3xl text-[#4B2E2E]">
              Continue Shopping
            </h2>

            <p className="mt-3 text-[#8B6B5B]">
              Discover our latest handcrafted
              jewellery collection.
            </p>
          </Link>


          <button
            type="button"
            onClick={handleLogout}
            className="group rounded-3xl bg-white p-8 text-left shadow transition hover:-translate-y-1 hover:shadow-xl"
          >
            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 transition group-hover:bg-red-600">
              <LogOut className="h-8 w-8 text-red-600 transition group-hover:text-white" />
            </div>

            <h2 className="font-serif text-3xl text-[#4B2E2E]">
              Logout
            </h2>

            <p className="mt-3 text-[#8B6B5B]">
              Securely sign out of your Rooh &
              Rivet account.
            </p>
          </button>

        </div>


        <div className="mt-12 rounded-3xl bg-white p-8 shadow">
          <h2 className="font-serif text-3xl text-[#4B2E2E]">
            Account Information
          </h2>

          <div className="mt-8 grid gap-6 md:grid-cols-2">

            <div>
              <p className="text-sm uppercase tracking-wide text-[#8B6B5B]">
                Full Name
              </p>

              <p className="mt-2 text-lg font-medium text-[#4B2E2E]">
                {profile?.full_name || "-"}
              </p>
            </div>


            <div>
              <p className="text-sm uppercase tracking-wide text-[#8B6B5B]">
                Email Address
              </p>

              <p className="mt-2 text-lg font-medium text-[#4B2E2E]">
                {profile?.email}
              </p>
            </div>

          </div>
        </div>

      </div>
    </main>
  );
}