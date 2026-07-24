import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { resend, EMAIL_FROM } from "@/lib/resend";
import OrderConfirmation from "@/emails/OrderConfirmation";

type OrderItem = {
  id: string;
  slug: string;
  name: string;
  quantity: number;
  price: number;
  image: string;
};

type CheckoutRequest = {
  user_id: string;
  customer_name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  payment_method: string;
  total: number;
  items: OrderItem[];
};

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const body: CheckoutRequest =
      await request.json();

    if (
      !body.user_id ||
      !body.customer_name ||
      !body.email ||
      !body.address ||
      !body.city ||
      !body.state ||
      !body.postal_code ||
      !body.country ||
      !body.payment_method ||
      body.items.length === 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Missing required checkout information.",
        },
        {
          status: 400,
        }
      );
    }

    for (const item of body.items) {
      const {
        data: product,
        error,
      } = await supabase
        .from("products")
        .select("id, stock, active")
        .eq("id", item.id)
        .single();

      if (error || !product) {
        return NextResponse.json(
          {
            success: false,
            message:
              `${item.name} no longer exists.`,
          },
          {
            status: 404,
          }
        );
      }

      if (!product.active) {
        return NextResponse.json(
          {
            success: false,
            message:
              `${item.name} is currently unavailable.`,
          },
          {
            status: 400,
          }
        );
      }

      if (
        product.stock < item.quantity
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              `${item.name} only has ${product.stock} remaining.`,
          },
          {
            status: 400,
          }
        );
      }
    }

    const {
      data: order,
      error: orderError,
    } = await supabase
      .from("orders")
      .insert({
        user_id: body.user_id,

        customer_name:
          body.customer_name,

        email:
          body.email,

        phone:
          body.phone,

        address:
          body.address,

        city:
          body.city,

        state:
          body.state,

        postal_code:
          body.postal_code,

        country:
          body.country,

        payment_method:
          body.payment_method,

        total:
          body.total,

        status:
          "Pending",

        payment_status:
          "Pending",

        items:
          body.items,
      })
      .select()
      .single();

    if (
      orderError ||
      !order
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            orderError?.message ??
            "Failed to create order.",
        },
        {
          status: 500,
        }
      );
    }

    for (const item of body.items) {
      const {
        data: product,
      } = await supabase
        .from("products")
        .select("stock")
        .eq("id", item.id)
        .single();

      if (!product) continue;

      const currentStock =
        Number(product.stock) || 0;

      const newStock =
        Math.max(
          0,
          currentStock - item.quantity
        );

      await supabase
        .from("products")
        .update({
          stock: newStock,
          ...(newStock === 0
            ? { active: false }
            : {}),
        })
        .eq(
          "id",
          item.id
        );
    }

    try {
      await resend.emails.send({
        from:
          EMAIL_FROM,

        to:
          body.email,

        subject:
          `Your Rooh & Rivet Order #${order.id} is Confirmed`,

        react:
          OrderConfirmation({
            customerName:
              body.customer_name,

            orderId:
              String(order.id),

            total:
              body.total,
          }),
      });
    } catch (emailError) {
      console.error(
        "Email Error:",
        emailError
      );
    }

    return NextResponse.json(
      {
        success: true,
        order,
      },
      {
        status: 201,
      }
    );

  } catch (error) {
    console.error(
      "Checkout Error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "An unexpected server error occurred.",
      },
      {
        status: 500,
      }
    );
  }
}