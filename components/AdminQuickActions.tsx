import Link from "next/link";
import {
  BarChart3,
  FileText,
  PlusCircle,
  Settings,
  ShoppingBag,
  Tags,
  Users,
  type LucideIcon,
} from "lucide-react";

type QuickAction = {
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
};

const actions: QuickAction[] = [
  {
    title: "Add Product",
    description:
      "Create a new jewellery item",
    href: "/admin/products/new",
    icon: PlusCircle,
  },
  {
    title: "Manage Orders",
    description:
      "View and update customer orders",
    href: "/admin/orders",
    icon: ShoppingBag,
  },
  {
    title: "Analytics",
    description:
      "Review live store performance",
    href: "/admin/analytics",
    icon: BarChart3,
  },
  {
    title: "Customers",
    description:
      "View customer information",
    href: "/admin/customers",
    icon: Users,
  },
  {
    title: "Coupons",
    description:
      "Create and manage discount codes",
    href: "/admin/coupons",
    icon: Tags,
  },
  {
    title: "Website Content",
    description:
      "Edit public store pages",
    href: "/admin/content",
    icon: FileText,
  },
  {
    title: "Settings",
    description:
      "Manage store configuration",
    href: "/admin/settings",
    icon: Settings,
  },
];

export default function AdminQuickActions() {
  return (
    <section className="rounded-3xl border border-[#E8DDD3] bg-white p-6 shadow-sm sm:p-8">
      <div>
        <h2 className="font-serif text-3xl text-[#5A2D2D]">
          Quick Actions
        </h2>

        <p className="mt-2 text-sm text-[#8B6B5B]">
          Access frequently used admin
          tools.
        </p>
      </div>

      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {actions.map((action) => {
          const Icon = action.icon;

          return (
            <Link
              key={action.title}
              href={action.href}
              className="group rounded-2xl border border-[#E8DDD3] p-5 transition duration-200 hover:-translate-y-1 hover:border-[#CDB8AA] hover:bg-[#FCFAF8] hover:shadow-md"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#F6ECE5] transition group-hover:bg-[#5A2D2D]">
                <Icon
                  size={23}
                  className="text-[#5A2D2D] transition group-hover:text-white"
                />
              </div>

              <h3 className="mt-5 font-serif text-xl text-[#5A2D2D]">
                {action.title}
              </h3>

              <p className="mt-2 text-sm leading-6 text-[#8B6B5B]">
                {action.description}
              </p>
            </Link>
          );
        })}
      </div>
    </section>
  );
}