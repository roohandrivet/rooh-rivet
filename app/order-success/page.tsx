import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Package,
  Sparkles,
  User,
} from "lucide-react";

import { supabase } from "@/lib/supabase";

export default async function OrderSuccessPage() {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const customerName =
    user?.user_metadata?.full_name ??
    user?.email?.split("@")[0] ??
    "Valued Customer";

  return (
    <main className="min-h-screen bg-[#F8F4EF] flex items-center justify-center px-8 py-20">
      <div className="w-full max-w-4xl rounded-[40px] bg-white p-12 text-center shadow-2xl">
        <div className="flex justify-center">
          <div className="flex h-28 w-28 items-center justify-center rounded-full bg-green-100">
            <CheckCircle2
              size={70}
              className="text-green-600"
            />
          </div>
        </div>

        <p className="mt-10 text-sm uppercase tracking-[8px] text-[#8B6B5B]">
          Thank You
        </p>

        <h1 className="mt-6 font-serif text-6xl text-[#4B2E2E]">
          Order Confirmed
        </h1>

        <p className="mt-5 text-xl text-[#4B2E2E]">
          {customerName},
          your order has been received.
        </p>

        <p className="mt-8 text-lg leading-8 text-[#7A6464]">
          Thank you for choosing
          Rooh & Rivet.
          Your handcrafted jewellery
          is now being prepared by our
          artisans with exceptional
          care and attention.
        </p>

        <div className="mt-12 rounded-3xl bg-[#F8F4EF] p-8">
          <p className="text-sm uppercase tracking-[4px] text-[#8B6B5B]">
            What's Next?
          </p>

          <h2 className="mt-4 font-serif text-3xl text-[#4B2E2E]">
            We'll begin preparing
            your order immediately.
          </h2>

          <p className="mt-5 leading-8 text-[#7A6464]">
            A confirmation email will
            be sent shortly. You'll
            also receive shipping and
            delivery updates as your
            order progresses.
          </p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          <div className="rounded-3xl bg-[#F8F4EF] p-6">
            <Package className="mx-auto text-[#5A2D2D]" />

            <h3 className="mt-4 font-serif text-2xl text-[#4B2E2E]">
              Order Processing
            </h3>

            <p className="mt-3 text-[#7A6464]">
              Our artisans are now
              preparing your jewellery.
            </p>
          </div>

          <div className="rounded-3xl bg-[#F8F4EF] p-6">
            <Sparkles className="mx-auto text-[#5A2D2D]" />

            <h3 className="mt-4 font-serif text-2xl text-[#4B2E2E]">
              Luxury Packaging
            </h3>

            <p className="mt-3 text-[#7A6464]">
              Signature premium gift
              packaging included with
              every order.
            </p>
          </div>

          <div className="rounded-3xl bg-[#F8F4EF] p-6">
            <User className="mx-auto text-[#5A2D2D]" />

            <h3 className="mt-4 font-serif text-2xl text-[#4B2E2E]">
              Account
            </h3>

            <p className="mt-3 text-[#7A6464]">
              Track your order anytime
              from your account.
            </p>
          </div>
        </div>
                <div className="mt-14">
          <h3 className="font-serif text-3xl text-[#4B2E2E]">
            Our Promise
          </h3>

          <p className="mt-6 leading-8 text-[#7A6464]">
            Every Rooh & Rivet piece is
            handcrafted by skilled artisans,
            carefully quality checked, and
            beautifully packaged before it
            reaches you. We believe luxury
            should feel personal from the
            moment you place your order until
            the day it arrives.
          </p>
        </div>

        <div className="mt-14 flex flex-col justify-center gap-5 md:flex-row">
          <Link
            href="/account/orders"
            className="flex items-center justify-center gap-3 rounded-full bg-[#5A2D2D] px-10 py-5 text-white transition hover:bg-[#472323]"
          >
            View My Orders
            <ArrowRight size={20} />
          </Link>

          <Link
            href="/shop"
            className="rounded-full border border-[#5A2D2D] px-10 py-5 text-[#5A2D2D] transition hover:bg-[#5A2D2D] hover:text-white"
          >
            Continue Shopping
          </Link>

          <Link
            href="/contact"
            className="rounded-full border border-[#E8DDD3] px-10 py-5 text-[#5A2D2D] transition hover:bg-[#F8F4EF]"
          >
            Contact Support
          </Link>
        </div>

        <div className="mt-14 rounded-3xl border border-[#E8DDD3] bg-[#FCFAF8] p-8">
          <h3 className="font-serif text-2xl text-[#4B2E2E]">
            Email Updates
          </h3>

          <p className="mt-4 leading-8 text-[#7A6464]">
            You will soon receive:
          </p>

          <ul className="mt-6 space-y-3 text-left text-[#5A2D2D]">
            <li>✓ Order confirmation email</li>
            <li>✓ Shipping confirmation</li>
            <li>✓ Tracking information</li>
            <li>✓ Delivery confirmation</li>
          </ul>
        </div>
                <div className="mt-14 rounded-3xl bg-[#F8F4EF] p-8">
          <h3 className="font-serif text-2xl text-[#4B2E2E]">
            Estimated Timeline
          </h3>

          <div className="mt-8 space-y-6 text-left">
            <div className="flex items-start gap-5">
              <div className="mt-1 h-4 w-4 rounded-full bg-[#5A2D2D]" />

              <div>
                <h4 className="font-semibold text-[#4B2E2E]">
                  Order Confirmed
                </h4>

                <p className="mt-1 text-[#7A6464]">
                  Your order has been
                  successfully received.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-5">
              <div className="mt-1 h-4 w-4 rounded-full bg-[#5A2D2D]" />

              <div>
                <h4 className="font-semibold text-[#4B2E2E]">
                  packaging
                </h4>

                <p className="mt-1 text-[#7A6464]">
                Your jewellery is carefully packaged with attention to detail before dispatch.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-5">
              <div className="mt-1 h-4 w-4 rounded-full bg-[#5A2D2D]" />

              <div>
                <h4 className="font-semibold text-[#4B2E2E]">
                  Shipped
                </h4>

                <p className="mt-1 text-[#7A6464]">
                  You'll receive a shipping
                  confirmation email together
                  with tracking details.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-5">
              <div className="mt-1 h-4 w-4 rounded-full bg-[#5A2D2D]" />

              <div>
                <h4 className="font-semibold text-[#4B2E2E]">
                  Delivered
                </h4>

                <p className="mt-1 text-[#7A6464]">
                  Enjoy your Rooh & Rivet
                  jewellery and thank you for
                  supporting handcrafted luxury.
                </p>
              </div>
            </div>
          </div>
        </div>

        <p className="mt-12 text-sm leading-7 text-[#8B6B5B]">
          Need help with your order? Our team is
          always happy to assist you. Simply
          contact us through your account or our
          support page.
        </p>
      </div>
    </main>
      );
}