"use client";

import Link from "next/link";
import {
  Home,
  Info,
  Phone,
  ChevronRight,
} from "lucide-react";

type ContentSection = {
  title: string;
  description: string;
  href: string;
  icon: React.ElementType;
  color: string;
};

const sections: ContentSection[] = [
  {
    title: "Home Page",
    description: "Manage homepage banners, hero section and featured content.",
    href: "/admin/content/home",
    icon: Home,
    color: "bg-blue-50 text-blue-600",
  },
  {
    title: "About Page",
    description: "Edit the About Us page content and company information.",
    href: "/admin/content/about",
    icon: Info,
    color: "bg-emerald-50 text-emerald-600",
  },
  {
    title: "Contact Page",
    description: "Update contact information, business hours and social links.",
    href: "/admin/content/contact",
    icon: Phone,
    color: "bg-amber-50 text-amber-600",
  },
];

export default function AdminContentPage() {
  return (
    <div className="min-h-screen bg-[#F8F4EF] p-6 md:p-10">
      <div className="mx-auto max-w-7xl">
        <div className="mb-10">
          <h1 className="text-4xl font-serif text-[#4B2E2E]">
            Content Management
          </h1>

          <p className="mt-2 text-[#7A6464]">
            Manage the content displayed throughout your Rooh & Rivet website.
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {sections.map((section) => {
            const Icon = section.icon;

            return (
              <Link
                key={section.href}
                href={section.href}
                className="group rounded-3xl border border-[#E9DED3] bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-[#5A2D2D] hover:shadow-lg"
              >
                <div
                  className={`mb-6 flex h-14 w-14 items-center justify-center rounded-2xl ${section.color}`}
                >
                  <Icon className="h-7 w-7" />
                </div>

                <h2 className="text-2xl font-serif text-[#4B2E2E]">
                  {section.title}
                </h2>

                <p className="mt-3 leading-7 text-[#7A6464]">
                  {section.description}
                </p>

                <div className="mt-8 flex items-center justify-between">
                  <span className="font-medium text-[#5A2D2D]">
                    Manage Content
                  </span>

                  <ChevronRight className="h-5 w-5 text-[#5A2D2D] transition-transform duration-300 group-hover:translate-x-1" />
                </div>
              </Link>
            );
          })}
        </div>
        <div className="mt-10 rounded-3xl border border-[#E9DED3] bg-white p-8 shadow-sm">
          <h2 className="text-2xl font-serif text-[#4B2E2E]">
            Available Content Sections
          </h2>

          <p className="mt-2 text-[#7A6464]">
            Use the cards above to edit the main pages of your website. Any
            changes you publish here will be reflected on the customer-facing
            website after saving.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {sections.map((section) => (
              <div
                key={`${section.href}-summary`}
                className="rounded-2xl bg-[#F8F4EF] p-5"
              >
                <h3 className="font-semibold text-[#4B2E2E]">
                  {section.title}
                </h3>

                <p className="mt-2 text-sm leading-6 text-[#7A6464]">
                  {section.description}
                </p>
              </div>
            ))}
          </div>
        </div>
        </div>
    </div>
  );
}