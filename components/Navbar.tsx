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

type NavbarSettings = {
  store_name: string;
  tagline: string;
  logo_url: string;
  announcement_bar: string;
  shipping_message: string;
  email: string;
};

type NavbarSettingsDatabaseRow = {
  store_name: string | null;
  tagline: string | null;
  logo_url: string | null;
  announcement_bar: string | null;
  shipping_message: string | null;
  email: string | null;
};

const DEFAULT_SETTINGS: NavbarSettings = {
  store_name: "Rooh & Rivet",
  tagline:
    "Timeless Elegance, Crafted for You",
  logo_url: "",
  announcement_bar: "",
  shipping_message:
    "Orders are processed within 1–3 business days.",
  email: "",
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

// Shop collections are derived from active products with available stock.
// No category names are hardcoded here.
type ProductCategoryRow = {
  category: string | null;
};


function mapSettings(
  row:
    | NavbarSettingsDatabaseRow
    | null
): NavbarSettings {
  return {
    store_name:
      row?.store_name?.trim() ||
      DEFAULT_SETTINGS.store_name,
    tagline:
      row?.tagline?.trim() ||
      DEFAULT_SETTINGS.tagline,
    logo_url:
      row?.logo_url?.trim() ||
      DEFAULT_SETTINGS.logo_url,
    announcement_bar:
      row?.announcement_bar?.trim() ||
      DEFAULT_SETTINGS.announcement_bar,
    shipping_message:
      row?.shipping_message?.trim() ||
      DEFAULT_SETTINGS.shipping_message,
    email:
      row?.email?.trim() ||
      DEFAULT_SETTINGS.email,
  };
}

type BrandLogoProps = {
  logoUrl: string;
  storeName: string;
  size: "desktop" | "mobile";
};

function BrandLogo({
  logoUrl,
  storeName,
  size,
}: BrandLogoProps) {
  const dimension =
    size === "desktop"
      ? 54
      : 48;

  if (logoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={logoUrl}
        alt={`${storeName} logo`}
        className={
          size === "desktop"
            ? "h-9 w-9 shrink-0 object-contain min-[380px]:h-10 min-[380px]:w-10 sm:h-[54px] sm:w-[54px]"
            : "h-11 w-11 shrink-0 object-contain sm:h-12 sm:w-12"
        }
      />
    );
  }

  return (
    <Image
      src="/logo-icon.png"
      alt={`${storeName} logo`}
      width={dimension}
      height={dimension}
      priority={
        size === "desktop"
      }
      className={
        size === "desktop"
          ? "h-12 w-12 shrink-0 object-contain sm:h-[54px] sm:w-[54px]"
          : "h-12 w-12 shrink-0 object-contain"
      }
    />
  );
}

export default function Navbar() {
  const pathname =
    usePathname();

  const {
    cartCount,
  } = useCart();

  const [
    settings,
    setSettings,
  ] = useState<NavbarSettings>(
    DEFAULT_SETTINGS
  );

  const [
    menuOpen,
    setMenuOpen,
  ] = useState(false);

  const [
    loggedIn,
    setLoggedIn,
  ] = useState(false);

  const [collectionLinks, setCollectionLinks] =
    useState<NavigationItem[]>([]);
  const [collectionsLoading, setCollectionsLoading] =
    useState(false);
  const [shopExpanded, setShopExpanded] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadSettings():
      Promise<void> {
      const {
        data,
        error,
      } = await supabase
        .from("settings")
        .select(
          `
            store_name,
            tagline,
            logo_url,
            announcement_bar,
            shipping_message,
            email
          `
        )
        .eq(
          "setting_key",
          "store"
        )
        .maybeSingle();

      if (
        error
      ) {
        console.error(
          "Navbar settings load failed:",
          error
        );
        return;
      }

      if (
        active
      ) {
        setSettings(
          mapSettings(
            data as
              | NavbarSettingsDatabaseRow
              | null
          )
        );
      }
    }

    void loadSettings();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    async function loadUser():
      Promise<void> {
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

  // Load the current list whenever the menu opens. This means a category
  // appears automatically after an active, in-stock product is added in admin.
  useEffect(() => {
    if (!menuOpen) return;

    let active = true;

    async function loadCollections(): Promise<void> {
      setCollectionsLoading(true);

      const categories = new Map<string, string>();
      const PAGE_SIZE = 1000;
      let offset = 0;

      try {
        while (true) {
          const { data, error } = await supabase
            .from("products")
            .select("category")
            .eq("active", true)
            .gt("stock", 0)
            .range(offset, offset + PAGE_SIZE - 1);

          if (error) throw error;

          const rows = (data ?? []) as ProductCategoryRow[];
          for (const row of rows) {
            const name = row.category?.trim();
            if (name && !categories.has(name.toLowerCase())) {
              categories.set(name.toLowerCase(), name);
            }
          }

          if (rows.length < PAGE_SIZE) break;
          offset += PAGE_SIZE;
        }

        const nextLinks = Array.from(categories.values())
          .sort((a, b) => a.localeCompare(b))
          .map((category) => ({
            title: category,
            href: `/shop?category=${encodeURIComponent(category.toLowerCase())}`,
          }));

        if (active) setCollectionLinks(nextLinks);
      } catch (error) {
        console.error("Navbar collections load failed:", error);
        // Keep previously loaded links if the request fails.
      } finally {
        if (active) setCollectionsLoading(false);
      }
    }

    void loadCollections();
    return () => { active = false; };
  }, [menuOpen]);

  useEffect(() => {
    setMenuOpen(false);
    setShopExpanded(false);
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
    ): void {
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

  const navigationItems:
    NavigationItem[] = [
    ...MAIN_NAVIGATION,
    {
      title: accountLabel,
      href: accountHref,
    },
  ];

  return (
    <>
      <header className="sticky top-0 z-50 bg-[#F8F4EF]/95 shadow-sm backdrop-blur-xl">
        {settings.announcement_bar ? (
          <div className="bg-[#5A2D2D] px-4 py-2.5 text-center text-xs font-medium tracking-wide text-[#F8F4EF] sm:text-sm">
            {
              settings.announcement_bar
            }
          </div>
        ) : null}

        <div className="border-b border-[#E8DDD3]">
          <div className="mx-auto flex h-20 w-full max-w-7xl items-center justify-between gap-2 px-3 min-[380px]:gap-3 min-[380px]:px-4 sm:h-24 sm:px-6 lg:gap-6 lg:px-10">
            <Link
              href="/"
              aria-label={`${settings.store_name} home`}
              className="flex min-w-0 flex-1 items-center gap-1.5 min-[380px]:gap-2 sm:gap-4"
            >
              <BrandLogo
                logoUrl={
                  settings.logo_url
                }
                storeName={
                  settings.store_name
                }
                size="desktop"
              />

              <div className="min-w-0 flex-1">
                <p className="whitespace-nowrap font-serif text-[clamp(1rem,4.5vw,2.15rem)] leading-none text-[#4B2E2E]">
                  {
                    settings.store_name
                  }
                </p>

                {settings.tagline ? (
                  <p className="mt-1 hidden max-w-[280px] truncate text-[clamp(0.42rem,1.45vw,0.6875rem)] uppercase tracking-[0.18em] text-[#8B6B5B] min-[390px]:block sm:mt-2 sm:tracking-[0.32em] xl:tracking-[0.42em]">
                    {
                      settings.tagline
                    }
                  </p>
                ) : null}
              </div>
            </Link>

            <div className="hidden flex-1 justify-center lg:flex">
              <Search />
            </div>

            <div className="flex shrink-0 items-center gap-1 min-[380px]:gap-1.5 sm:gap-3">
              <div className="hidden lg:block">
                <CurrencySelector />
              </div>

              <Link
                href={accountHref}
                aria-label={
                  accountLabel
                }
                title={
                  accountLabel
                }
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#F3ECE5] transition hover:bg-[#E8DDD3] sm:h-11 sm:w-11"
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
                className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#F3ECE5] transition hover:bg-[#E8DDD3] sm:h-11 sm:w-11"
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
                aria-expanded={
                  menuOpen
                }
                aria-controls="mobile-navigation"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#F3ECE5] transition hover:bg-[#E8DDD3] sm:h-11 sm:w-11"
              >
                <Menu
                  size={24}
                  className="text-[#5A2D2D]"
                />
              </button>
            </div>
          </div>
        </div>
      </header>

      <aside
        id="mobile-navigation"
        aria-hidden={
          !menuOpen
        }
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
            aria-label={`${settings.store_name} home`}
            className="flex min-w-0 items-center gap-4"
          >
            <BrandLogo
              logoUrl={
                settings.logo_url
              }
              storeName={
                settings.store_name
              }
              size="mobile"
            />

            <div className="min-w-0">
              <p className="truncate font-serif text-[1.7rem] leading-none text-[#4B2E2E] sm:text-[2rem]">
                {
                  settings.store_name
                }
              </p>

              {settings.tagline ? (
                <p className="mt-2 max-w-[190px] truncate text-[10px] uppercase tracking-[4px] text-[#8B6B5B] sm:text-[11px] sm:tracking-[5px]">
                  {
                    settings.tagline
                  }
                </p>
              ) : null}
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
            {navigationItems.map((item) =>
              item.href === "/shop" ? (
                <div key={item.title}>
                  <button
                    type="button"
                    onClick={() => setShopExpanded((open) => !open)}
                    aria-expanded={shopExpanded}
                    aria-controls="shop-subcategories"
                    className="flex w-full items-center justify-between border-b border-[#F0E8E1] py-5 text-left text-lg text-[#4B2E2E] transition hover:text-[#8B6B5B]"
                  >
                    <span>{item.title}</span>
                    <ChevronRight
                      size={18}
                      className={`transition-transform duration-200 ${shopExpanded ? "rotate-90" : ""}`}
                    />
                  </button>

                  {shopExpanded && (
                    <div
                      id="shop-subcategories"
                      className="space-y-1 border-b border-[#F0E8E1] bg-[#FCFAF7] py-3 pl-5 pr-3"
                    >
                      <Link
                        href="/shop"
                        onClick={() => setMenuOpen(false)}
                        className="block py-2.5 font-medium text-[#5A2D2D] transition hover:text-[#8B6B5B]"
                      >
                        All Jewellery
                      </Link>
                      {collectionLinks.map((category) => (
                        <Link
                          key={category.href}
                          href={category.href}
                          onClick={() => setMenuOpen(false)}
                          className="block py-2.5 text-[#5A2D2D] transition hover:text-[#8B6B5B]"
                        >
                          {category.title}
                        </Link>
                      ))}
                      {collectionsLoading && collectionLinks.length === 0 && (
                        <p className="py-2 text-sm text-[#8B6B5B]" role="status">
                          Loading collections...
                        </p>
                      )}
                      {!collectionsLoading && collectionLinks.length === 0 && (
                        <p className="py-2 text-sm text-[#8B6B5B]">
                          No categories available right now.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  key={item.title}
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center border-b border-[#F0E8E1] py-5 text-lg text-[#4B2E2E] transition hover:text-[#8B6B5B]"
                >
                  {item.title}
                </Link>
              )
            )}
          </nav>

          <div className="mt-10 rounded-[28px] border border-[#E8DDD3] bg-[#F8F4EF] p-7">
            <h3 className="font-serif text-2xl text-[#4B2E2E]">
              {
                settings.tagline ||
                settings.store_name
              }
            </h3>

            {settings.shipping_message ? (
              <p className="mt-4 whitespace-pre-line leading-7 text-[#7A6464]">
                {
                  settings.shipping_message
                }
              </p>
            ) : null}

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

          {settings.email ? (
            <div className="mt-10 pb-8">
              <a
                href={`mailto:${settings.email}`}
                className="flex items-center gap-3 break-all text-[#5A2D2D] transition hover:text-[#8B6B5B]"
              >
                <Mail
                  size={18}
                  className="shrink-0"
                />
                {
                  settings.email
                }
              </a>
            </div>
          ) : null}
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