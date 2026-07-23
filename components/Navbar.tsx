"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Menu,
  ShoppingBag,
  X,
  ChevronRight,
  Mail,
  User,
} from "lucide-react";

import { supabase } from "@/lib/supabase";
import { useCart } from "@/context/CartContext";
import CurrencySelector from "@/components/CurrencySelector";
import Search from "@/components/Search";

export default function Navbar() {
  const { cart } = useCart();

  const [menuOpen, setMenuOpen] =
    useState(false);

  const [loggedIn, setLoggedIn] =
    useState(false);


  useEffect(() => {
    checkUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      checkUser();
    });

    return () =>
      subscription.unsubscribe();
  }, []);


  async function checkUser() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    setLoggedIn(!!user);
  }


  return (
    <>
      <header className="sticky top-0 z-50 border-b border-[#E8DDD3] bg-[#F8F4EF]/95 backdrop-blur-xl shadow-sm">

        <div className="mx-auto flex h-24 max-w-7xl items-center justify-between gap-6 px-6 lg:px-10">


          <Link
            href="/"
            className="flex items-center gap-4 shrink-0"
          >
            <Image
              src="/logo-icon.png"
              alt="Rooh & Rivet"
              width={54}
              height={54}
              priority
              className="object-contain"
            />


            <div>
              <h1 className="font-serif text-[2.15rem] leading-none text-[#4B2E2E]">
                Rooh & Rivet
              </h1>

              <p className="mt-2 uppercase tracking-[7px] text-[11px] text-[#8B6B5B]">
                Rivet Your Style
              </p>
            </div>

          </Link>



          <div className="hidden flex-1 justify-center lg:flex">
            <Search />
          </div>



          <div className="flex items-center gap-3">


            <div className="hidden lg:block">
              <CurrencySelector />
            </div>


            <Link
              href={
                loggedIn
                  ? "/account"
                  : "/auth/login"
              }
              className="flex h-11 w-11 items-center justify-center rounded-full bg-[#F3ECE5] transition hover:bg-[#E8DDD3]"
            >
              <User
                size={22}
                className="text-[#5A2D2D]"
              />
            </Link>



            <Link
              href="/cart"
              className="relative flex h-11 w-11 items-center justify-center rounded-full bg-[#F3ECE5] transition hover:bg-[#E8DDD3]"
            >
              <ShoppingBag
                size={22}
                className="text-[#5A2D2D]"
              />


              {cart.length > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#5A2D2D] text-[11px] text-white">
                  {cart.length}
                </span>
              )}

            </Link>



            <button
              onClick={() =>
                setMenuOpen(true)
              }
              className="flex h-11 w-11 items-center justify-center rounded-full bg-[#F3ECE5] transition hover:bg-[#E8DDD3]"
            >
              <Menu
                size={24}
                className="text-[#5A2D2D]"
              />
            </button>


          </div>


        </div>

      </header>
      <aside
        className={`fixed right-0 top-0 z-[60] h-screen w-[380px] max-w-[92vw] transform bg-white shadow-2xl transition-transform duration-500 ease-in-out ${
          menuOpen
            ? "translate-x-0"
            : "translate-x-full"
        }`}
      >

        <div className="flex items-center justify-between border-b border-[#E8DDD3] px-8 py-7">

          <Link
            href="/"
            onClick={() =>
              setMenuOpen(false)
            }
            className="flex items-center gap-4"
          >
            <Image
              src="/logo-icon.png"
              alt="Rooh & Rivet"
              width={48}
              height={48}
              className="object-contain"
            />


            <div>
              <h2 className="font-serif text-[2rem] leading-none text-[#4B2E2E]">
                Rooh & Rivet
              </h2>

              <p className="mt-2 uppercase tracking-[7px] text-[11px] text-[#8B6B5B]">
                Rivet Your Style
              </p>
            </div>

          </Link>



          <button
            onClick={() =>
              setMenuOpen(false)
            }
            className="flex h-12 w-12 items-center justify-center rounded-full bg-[#F3ECE5]"
          >
            <X
              size={28}
              className="text-[#5A2D2D]"
            />
          </button>

        </div>



        <div className="h-[calc(100vh-104px)] overflow-y-auto px-8 py-8">


          <div className="mb-8 lg:hidden">
            <Search />
          </div>



          <div className="mb-8">

            <p className="mb-3 uppercase tracking-[5px] text-xs text-[#8B6B5B]">
              Currency
            </p>


            <CurrencySelector />

          </div>



          <div className="space-y-1">

            {[
              ["Home", "/"],
              ["Shop", "/shop"],
              ["About Us", "/about"],
              ["Contact", "/contact"],
              [
                loggedIn
                  ? "My Account"
                  : "Login",
                loggedIn
                  ? "/account"
                  : "/auth/login",
              ],
            ].map(
              ([title, href]) => (
                <Link
                  key={title}
                  href={href}
                  onClick={() =>
                    setMenuOpen(false)
                  }
                  className="flex items-center justify-between py-5 text-lg text-[#4B2E2E]"
                >

                  <span>
                    {title}
                  </span>

                  <ChevronRight
                    size={18}
                  />

                </Link>
              )
            )}

          </div>



          <hr className="my-8 border-[#E8DDD3]" />



          <p className="mb-5 uppercase tracking-[6px] text-xs text-[#8B6B5B]">
            Shop Collections
          </p>



          <div className="space-y-4">

            {[
              [
                "Necklaces",
                "/shop?category=necklaces",
              ],
              [
                "Earrings",
                "/shop?category=earrings",
              ],
              [
                "Bracelets",
                "/shop?category=bracelets",
              ],
              [
                "Rings",
                "/shop?category=rings",
              ],
              [
                "Bridal Collection",
                "/shop?category=bridal",
              ],
            ].map(
              ([title, href]) => (
                <Link
                  key={title}
                  href={href}
                  onClick={() =>
                    setMenuOpen(false)
                  }
                  className="block text-[#5A2D2D]"
                >
                  {title}
                </Link>
              )
            )}

          </div>
                    <div className="mt-10 rounded-[28px] border border-[#E8DDD3] bg-[#F8F4EF] p-7">

            <h3 className="font-serif text-2xl text-[#4B2E2E]">
              Crafted for Every Story
            </h3>


            <p className="mt-4 leading-7 text-[#7A6464]">
              Every Rooh & Rivet piece is handcrafted to celebrate timeless elegance and everyday luxury.
            </p>


            <Link
              href="/shop"
              onClick={() =>
                setMenuOpen(false)
              }
              className="mt-6 inline-block rounded-full bg-[#5A2D2D] px-6 py-3 text-white"
            >
              Explore Collection
            </Link>

          </div>




          <div className="mt-10">

            <a
              href="mailto:hello@roohrivet.com"
              className="flex items-center gap-3 text-[#5A2D2D]"
            >
              <Mail size={18} />

              hello@roohrivet.com

            </a>

          </div>



        </div>


      </aside>




      {menuOpen && (
        <div
          onClick={() =>
            setMenuOpen(false)
          }
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
        />
      )}


    </>
  );
}