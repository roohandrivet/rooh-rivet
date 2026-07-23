"use client";

import type { ReactNode, ComponentType } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ChartColumn,
  Package,
  ShoppingBag,
  Users,
  Star,
  TicketPercent,
  Images,
  FileText,
  Settings,
  Menu,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";

type AdminLayoutProps = {
  children: ReactNode;
};

type NavigationItem = {
  name: string;
  href: string;
  icon: ComponentType<{ className?: string }>;
};

const navigation: NavigationItem[] = [
  {
    name: "Dashboard",
    href: "/admin",
    icon: LayoutDashboard,
  },
  {
    name: "Analytics",
    href: "/admin/analytics",
    icon: ChartColumn,
  },
  {
    name: "Products",
    href: "/admin/products",
    icon: Package,
  },
  {
    name: "Orders",
    href: "/admin/orders",
    icon: ShoppingBag,
  },
  {
    name: "Customers",
    href: "/admin/customers",
    icon: Users,
  },
  {
    name: "Reviews",
    href: "/admin/reviews",
    icon: Star,
  },
  {
    name: "Coupons",
    href: "/admin/coupons",
    icon: TicketPercent,
  },
  {
    name: "Media Library",
    href: "/admin/media",
    icon: Images,
  },
  {
    name: "Content Management",
    href: "/admin/content",
    icon: FileText,
  },
  {
    name: "Settings",
    href: "/admin/settings",
    icon: Settings,
  },
];

function AdminLayout({ children }: AdminLayoutProps) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  const isActive = (href: string): boolean => {
    if (href === "/admin") {
      return pathname === "/admin";
    }

    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <div className="min-h-screen bg-[#F8F4EF] text-[#4B2E2E]">
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-[#E8DDD3] bg-white shadow-xl transition-transform duration-300 lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-20 items-center justify-between border-b border-[#E8DDD3] px-6">
          <div>
            <h1 className="font-serif text-2xl font-bold tracking-wide text-[#4B2E2E]">
              Rooh & Rivet
            </h1>
            <p className="text-xs uppercase tracking-[0.3em] text-[#8B6B5B]">
              Admin
            </p>
          </div>

          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="rounded-lg p-2 text-[#4B2E2E] hover:bg-[#F5EFE8] lg:hidden"
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-2 overflow-y-auto p-4">
          {navigation.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all ${
                  active
                    ? "bg-[#5A2D2D] text-white shadow-lg"
                    : "text-[#4B2E2E] hover:bg-[#F5EFE8]"
                }`}
              >
                <Icon className="h-5 w-5 shrink-0" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      <div className="lg:pl-72">
        <header className="sticky top-0 z-20 flex h-20 items-center justify-between border-b border-[#E8DDD3] bg-[#F8F4EF]/95 px-6 backdrop-blur">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="rounded-lg p-2 text-[#4B2E2E] hover:bg-white lg:hidden"
              aria-label="Open sidebar"
            >
              <Menu className="h-6 w-6" />
            </button>

            <div>
              <h2 className="font-serif text-2xl font-semibold text-[#4B2E2E]">
                Admin Dashboard
              </h2>
              <p className="text-sm text-[#8B6B5B]">
                Manage your Rooh & Rivet store
              </p>
            </div>
          </div>
        </header>

        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}

export default AdminLayout;