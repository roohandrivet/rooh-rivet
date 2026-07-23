
"use client";

import Link from "next/link";
import {
  PlusCircle,
  ShoppingBag,
  Users,
  Settings,
  FileText,
} from "lucide-react";

const actions = [
  {
    title: "Add Product",
    description: "Create a new jewellery item",
    href: "/admin/products/new",
    icon: PlusCircle,
  },
  {
    title: "Manage Orders",
    description: "View and update orders",
    href: "/admin/orders",
    icon: ShoppingBag,
  },
  {
    title: "Customers",
    description: "View customer details",
    href: "/admin/customers",
    icon: Users,
  },
  {
    title: "Website Content",
    description: "Edit store pages",
    href: "/admin/content",
    icon: FileText,
  },
  {
    title: "Settings",
    description: "Manage store settings",
    href: "/admin/settings",
    icon: Settings,
  },
];

export default function AdminQuickActions() {
  return (
    <div className="mt-10 rounded-3xl border border-[#E8DDD3] bg-white p-8 shadow-sm">
      <div>
        <h2 className="font-serif text-3xl text-[#5A2D2D]">
          Quick Actions
        </h2>

        <p className="mt-2 text-sm text-[#8B6B5B]">
          Manage your store quickly
        </p>
      </div>

      <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-5">
        {actions.map((action) => {
          const Icon = action.icon;

          return (
            <Link
              key={action.title}
              href={action.href}
              className="rounded-2xl border border-[#E8DDD3] p-5 transition hover:shadow-md"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#F6ECE5]">
                <Icon
                  size={24}
                  className="text-[#5A2D2D]"
                />
              </div>

              <h3 className="mt-5 font-serif text-xl text-[#5A2D2D]">
                {action.title}
              </h3>

              <p className="mt-2 text-sm text-[#8B6B5B]">
                {action.description}
              </p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}