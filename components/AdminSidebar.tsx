"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Settings,
} from "lucide-react";

const links = [
  {
    name: "Dashboard",
    href: "/admin",
    icon: LayoutDashboard,
  },
  {
    name: "Products",
    href: "/admin/products",
    icon: Package,
  },
  {
    name: "Orders",
    href: "/admin/orders",
    icon: ShoppingCart,
  },
  {
    name: "Customers",
    href: "/admin/customers",
    icon: Users,
  },
  {
    name: "Settings",
    href: "/admin/settings",
    icon: Settings,
  },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-72 min-h-screen bg-[#5A2D2D] text-white">

      <div className="border-b border-white/10 p-8">

        <h1 className="font-serif text-3xl">
          Rooh & Rivet
        </h1>

        <p className="mt-2 text-sm text-[#D8C2B6] uppercase tracking-[4px]">
          Admin Panel
        </p>

      </div>

      <nav className="p-5 space-y-2">

        {links.map((item) => {
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-4 rounded-xl px-4 py-3 transition ${
                pathname === item.href
                  ? "bg-white text-[#5A2D2D]"
                  : "hover:bg-[#6B3737]"
              }`}
            >
              <Icon size={20} />

              <span>{item.name}</span>

            </Link>
          );
        })}

      </nav>

    </aside>
  );
}