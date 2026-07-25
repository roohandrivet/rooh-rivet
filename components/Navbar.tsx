"use client";

import {
  useEffect,
  useState,
} from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ChevronRight,
  Mail,
  Menu,
  ShoppingBag,
  User,
  X,
} from "lucide-react";
import { usePathname } from "next/navigation";

import CurrencySelector from "@/components/CurrencySelector";
import Search from "@/components/Search";
import { useCart } from "@/context/CartContext";
import { supabase } from "@/lib/supabase";

type NavigationItem = {
  title: string;
  href: string;
};

const MAIN_NAVIGATION: NavigationItem[] = [
  {
    title: "Home",
    href: "/",
  },
  {
    title: "Shop",
    href: "/shop",
  },
  {
    title: "About Us",
    href: "/about",
  },
  {
    title: "Contact",
    href: "/contact",
  },
];

const COLLECTION_LINKS: NavigationItem[] = [
  {
    title: "Necklaces",
    href: "/shop?category=necklaces",
  },
  {
    title: "Earrings",
    href: "/shop?category=earrings",
  },
  {
    title: "Bracelets",
    href: "/shop?category=bracelets",
  },
  {
    title: "Rings",
    href: "/shop?category=rings",
  },
  {
    title: "Bridal Collection",
    href: "/shop?category=bridal",
  },
];

export default function Navbar() {
  const pathname = usePathname();

  const {
    cartCount,
  } = useCart();

  const [
    menuOpen,
    setMenuOpen,
  ] = useState(false);

  const [
    loggedIn,
    setLoggedIn,
  ] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadUser() {
      const {
        data: {
          user,
        },
        error,
      } =
        await supabase.auth.getUser();

      if (!active) {
        return;
      }

      if (error) {
        console.error(
          "Navbar authentication check failed:",
          error
        );

        setLoggedIn(false);
        return;
      }

      setLoggedIn(
        Boolean(user)
      );
    }

    void loadUser();

    const {
      data: {
        subscription,
      },
    } =
      supabase.auth.onAuthStateChange(
        (
          _event,
          session
        ) => {
          setLoggedIn(
            Boolean(
              session?.user
            )
          );
        }
      );

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!menuOpen) {
      return;
    }

    const previousOverflow =
      document.body.style.overflow;

    document.body.style.overflow =
      "hidden";

    function handleKeyDown(
      event: KeyboardEvent
    ) {
      if (
        event.key ===
        "Escape"
      ) {
        setMenuOpen(false);
      }
    }

    window.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () => {
      document.body.style.overflow =
        previousOverflow;

      window.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };
  }, [menuOpen]);

  const accountHref =
    loggedIn
      ? "/account"
      : "/auth/login";

  const accountLabel =
    loggedIn
      ? "My Account"
      : "Login";

  const navigationItems: NavigationItem[] = [
    ...MAIN_NAVIGATION,
    {
      title: accountLabel,
      href: accountHref,
    },
  ];

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-[#E8DDD3] bg-[#F8F4EF]/95 shadow-sm backdrop-blur-xl">
        <div className="mx-auto flex h-24 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:gap-6 lg:px-10">
          <Link
            href="/"
            aria-label="Rooh and Rivet home"
            className="flex shrink-0 items-center gap-3 sm:gap-4"
          >
            <Image
              src="/logo-icon.png"
              alt="Rooh & Rivet"
              width={54}
              height={54}
              priority
              className="h-12 w-12 object-contain sm:h-[54px] sm:w-[54px]"
            />

            <div className="hidden sm:block">
              <h1 className="font-serif text-[2.15rem] leading-none text-[#4B2E2E]">
                Rooh &amp; Rivet
              </h1>

              <p className="mt-2 text-[11px] uppercase tracking-[7px] text-[#8B6B5B]">
                Rivet Your Style
              </p>
            </div>
          </Link>

          <div className="hidden flex-1 justify-center lg:flex">
            <Search />
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden lg:block">
              <CurrencySelector />
            </div>

            <Link
              href={accountHref}
              aria-label={accountLabel}
              title={accountLabel}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-[#F3ECE5] transition hover:bg-[#E8DDD3]"
            >
              <User
                size={22}
                className="text-[#5A2D2D]"
              />
            </Link>

            <Link
              href="/cart"
              aria-label={`Cart with ${cartCount} ${
                cartCount === 1
                  ? "item"
                  : "items"
              }`}
              title="Cart"
              className="relative flex h-11 w-11 items-center justify-center rounded-full bg-[#F3ECE5] transition hover:bg-[#E8DDD3]"
            >
              <ShoppingBag
                size={22}
                className="text-[#5A2D2D]"
              />

              {cartCount > 0 ? (
                <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#5A2D2D] px-1 text-[11px] font-semibold text-white">
                  {cartCount > 99
                    ? "99+"
                    : cartCount}
                </span>
              ) : null}
            </Link>

            <button
              type="button"
              onClick={() =>
                setMenuOpen(true)
              }
              aria-label="Open navigation menu"
              aria-expanded={menuOpen}
              aria-controls="mobile-navigation"
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
        id="mobile-navigation"
        aria-hidden={!menuOpen}
        className={`fixed right-0 top-0 z-[70] h-screen w-[380px] max-w-[92vw] transform bg-white shadow-2xl transition-transform duration-500 ease-in-out ${
          menuOpen
            ? "translate-x-0"
            : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-[#E8DDD3] px-6 py-6 sm:px-8 sm:py-7">
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
              <h2 className="font-serif text-[1.7rem] leading-none text-[#4B2E2E] sm:text-[2rem]">
                Rooh &amp; Rivet
              </h2>

              <p className="mt-2 text-[10px] uppercase tracking-[5px] text-[#8B6B5B] sm:text-[11px] sm:tracking-[7px]">
                Rivet Your Style
              </p>
            </div>
          </Link>

          <button
            type="button"
            onClick={() =>
              setMenuOpen(false)
            }
            aria-label="Close navigation menu"
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#F3ECE5] transition hover:bg-[#E8DDD3]"
          >
            <X
              size={28}
              className="text-[#5A2D2D]"
            />
          </button>
        </div>

        <div className="h-[calc(100vh-104px)] overflow-y-auto px-6 py-8 sm:px-8">
          <div className="mb-8 lg:hidden">
            <Search />
          </div>

          <div className="mb-8 rounded-2xl border border-[#E8DDD3] bg-[#F8F4EF] p-5">
            <p className="mb-3 text-xs uppercase tracking-[5px] text-[#8B6B5B]">
              Display Currency
            </p>

            <CurrencySelector />
          </div>

          <nav
            aria-label="Main navigation"
            className="space-y-1"
          >
            {navigationItems.map(
              (item) => (
                <Link
                  key={item.title}
                  href={item.href}
                  onClick={() =>
                    setMenuOpen(false)
                  }
                  className="flex items-center justify-between border-b border-[#F0E8E1] py-5 text-lg text-[#4B2E2E] transition hover:text-[#8B6B5B]"
                >
                  <span>
                    {item.title}
                  </span>

                  <ChevronRight
                    size={18}
                  />
                </Link>
              )
            )}
          </nav>

          <hr className="my-8 border-[#E8DDD3]" />

          <p className="mb-5 text-xs uppercase tracking-[6px] text-[#8B6B5B]">
            Shop Collections
          </p>

          <nav
            aria-label="Shop collections"
            className="space-y-4"
          >
            {COLLECTION_LINKS.map(
              (item) => (
                <Link
                  key={item.title}
                  href={item.href}
                  onClick={() =>
                    setMenuOpen(false)
                  }
                  className="block text-[#5A2D2D] transition hover:text-[#8B6B5B]"
                >
                  {item.title}
                </Link>
              )
            )}
          </nav>

          <div className="mt-10 rounded-[28px] border border-[#E8DDD3] bg-[#F8F4EF] p-7">
            <h3 className="font-serif text-2xl text-[#4B2E2E]">
              Crafted for Every Story
            </h3>

            <p className="mt-4 leading-7 text-[#7A6464]">
              Every Rooh &amp; Rivet piece is handcrafted to
              celebrate timeless elegance and everyday luxury.
            </p>

            <Link
              href="/shop"
              onClick={() =>
                setMenuOpen(false)
              }
              className="mt-6 inline-block rounded-full bg-[#5A2D2D] px-6 py-3 text-white transition hover:bg-[#442020]"
            >
              Explore Collection
            </Link>
          </div>

          <div className="mt-10 pb-8">
            <a
              href="mailto:hello@roohrivet.com"
              className="flex items-center gap-3 text-[#5A2D2D] transition hover:text-[#8B6B5B]"
            >
              <Mail size={18} />
              hello@roohrivet.com
            </a>
          </div>
        </div>
      </aside>

      {menuOpen ? (
        <button
          type="button"
          aria-label="Close navigation menu"
          onClick={() =>
            setMenuOpen(false)
          }
          className="fixed inset-0 z-[60] cursor-default bg-black/40 backdrop-blur-sm"
        />
      ) : null}
    </>
  );
}