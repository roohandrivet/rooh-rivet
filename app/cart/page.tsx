"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Minus, Plus, Trash2 } from "lucide-react";

import { supabase } from "@/lib/supabase";
import { useCart } from "@/context/CartContext";
import { useCurrency } from "@/context/CurrencyContext";

export default function CartPage() {
  const router = useRouter();

  const {
    cart,
    removeFromCart,
    increaseQuantity,
    decreaseQuantity,
    clearCart,
  } = useCart();

  const {
    formatPrice,
  } = useCurrency();


  const subtotal = cart.reduce(
    (total, item) =>
      total +
      (Number(item.price) || 0) *
        (Number(item.quantity) || 0),
    0
  );


  async function handleCheckout() {
    const {
      data: {
        user,
      },
    } = await supabase.auth.getUser();


    if (!user) {
      router.push(
        "/login?redirect=/checkout"
      );

      return;
    }


    router.push("/checkout");
  }



  if (cart.length === 0) {
    return (
      <main className="min-h-screen bg-[#F8F4EF] px-6 py-20">
        <div className="mx-auto max-w-4xl text-center">

          <h1 className="font-serif text-5xl text-[#4B2E2E]">
            Your Cart is Empty
          </h1>

          <p className="mt-5 text-[#7A6464]">
            Discover our handcrafted luxury jewellery collection.
          </p>


          <Link
            href="/shop"
            className="mt-10 inline-flex items-center gap-2 rounded-full bg-[#5A2D2D] px-8 py-3 text-white transition hover:bg-[#4B2E2E]"
          >
            <ArrowLeft size={18} />
            Continue Shopping
          </Link>

        </div>
      </main>
    );
  }



  return (
    <main className="min-h-screen bg-[#F8F4EF] px-6 py-16">

      <div className="mx-auto max-w-6xl">


        <div className="mb-10 flex items-center justify-between">

          <h1 className="font-serif text-5xl text-[#4B2E2E]">
            Shopping Cart
          </h1>


          <button
            type="button"
            onClick={clearCart}
            className="text-sm text-[#8B6B5B] hover:text-[#5A2D2D]"
          >
            Clear Cart
          </button>

        </div>



        <div className="grid gap-10 lg:grid-cols-3">


          <div className="space-y-6 lg:col-span-2">


            {cart.map((item) => (

              <div
                key={item.id}
                className="flex gap-6 rounded-3xl bg-white p-6 shadow-sm"
              >

                <div className="relative h-32 w-32 overflow-hidden rounded-2xl bg-[#F8F4EF]">

                  {item.image ? (

                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      className="object-cover"
                    />

                  ) : (

                    <div className="flex h-full items-center justify-center text-sm text-[#8B6B5B]">
                      No Image
                    </div>

                  )}

                </div>



                <div className="flex flex-1 flex-col justify-between">


                  <div>

                    <h2 className="font-serif text-2xl text-[#4B2E2E]">
                      {item.name}
                    </h2>


                    <p className="mt-2 text-[#8B6B5B]">
                      {formatPrice(
                        Number(item.price) || 0
                      )}
                    </p>

                  </div>



                  <div className="flex items-center justify-between">


                    <div className="flex items-center gap-3 rounded-full border border-[#D8C3B0] px-3 py-2">


                      <button
                        type="button"
                        onClick={() =>
                          decreaseQuantity(item.id)
                        }
                        className="text-[#5A2D2D]"
                      >
                        <Minus size={16} />
                      </button>


                      <span className="min-w-6 text-center text-[#4B2E2E]">
                        {Number(item.quantity) || 0}
                      </span>


                      <button
                        type="button"
                        onClick={() =>
                          increaseQuantity(item.id)
                        }
                        className="text-[#5A2D2D]"
                      >
                        <Plus size={16} />
                      </button>


                    </div>



                    <button
                      type="button"
                      onClick={() =>
                        removeFromCart(item.id)
                      }
                      className="text-[#8B6B5B] hover:text-red-600"
                    >
                      <Trash2 size={20} />
                    </button>


                  </div>


                </div>


              </div>

            ))}


          </div>




          <div className="h-fit rounded-3xl bg-white p-8 shadow-sm">


            <h2 className="font-serif text-3xl text-[#4B2E2E]">
              Order Summary
            </h2>



            <div className="mt-8 flex justify-between text-[#7A6464]">

              <span>
                Subtotal
              </span>

              <span>
                {formatPrice(subtotal)}
              </span>

            </div>



            <div className="mt-4 flex justify-between text-[#7A6464]">

              <span>
                Shipping
              </span>

              <span>
                Free
              </span>

            </div>



            <div className="my-6 border-t border-[#E8D8C8]" />



            <div className="flex justify-between text-xl font-semibold text-[#4B2E2E]">

              <span>
                Total
              </span>


              <span>
                {formatPrice(subtotal)}
              </span>

            </div>



            <button
              type="button"
              onClick={handleCheckout}
              className="mt-8 block w-full rounded-full bg-[#5A2D2D] py-4 text-center text-white transition hover:bg-[#4B2E2E]"
            >
              Proceed to Checkout
            </button>


          </div>


        </div>


      </div>


    </main>
  );
}