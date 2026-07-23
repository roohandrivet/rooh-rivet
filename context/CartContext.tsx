"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { trackAddToCart } from "@/lib/analytics";


export type CartItem = {
  id: string;
  name: string;
  slug: string;
  price: number;
  image?: string;
  quantity: number;
};


type CartContextType = {
  cart: CartItem[];

  addToCart: (
    item: CartItem
  ) => void;

  removeFromCart: (
    id: string
  ) => void;

  updateQuantity: (
    id: string,
    quantity: number
  ) => void;

  increaseQuantity: (
    id: string
  ) => void;

  decreaseQuantity: (
    id: string
  ) => void;

  getQuantity: (
    id: string
  ) => number;

  clearCart: () => void;

  cartCount: number;

  subtotal: number;

  cartTotal: number;
};



const CartContext =
  createContext<
    CartContextType | undefined
  >(undefined);



const STORAGE_KEY =
  "rooh-rivet-cart";



function validateCart(
  items: unknown
): CartItem[] {

  if (!Array.isArray(items)) {
    return [];
  }


  return items
    .filter((item) => {

      if (
        typeof item !== "object" ||
        item === null
      ) {
        return false;
      }


      const cartItem =
        item as Partial<CartItem>;


      return (
        typeof cartItem.id ===
          "string" &&
        typeof cartItem.name ===
          "string"
      );

    })


    .map((item) => {

      const cartItem =
        item as Partial<CartItem>;


      return {

        id:
          cartItem.id!,

        name:
          cartItem.name!,

        slug:
          cartItem.slug ?? "",

        image:
          cartItem.image,

        price:
          Number(
            cartItem.price
          ) || 0,

        quantity:
          Math.max(
            1,
            Number(
              cartItem.quantity
            ) || 1
          ),

      };

    });

}



export function CartProvider({
  children,
}: {
  children: ReactNode;
}) {


  const [
    cart,
    setCart,
  ] = useState<CartItem[]>([]);



  useEffect(() => {

    try {

      const stored =
        localStorage.getItem(
          STORAGE_KEY
        );


      if (!stored) {
        return;
      }


      setCart(
        validateCart(
          JSON.parse(stored)
        )
      );


    } catch {

      localStorage.removeItem(
        STORAGE_KEY
      );

      setCart([]);

    }


  }, []);
  useEffect(() => {

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(cart)
    );

  }, [cart]);




  function addToCart(
    item: CartItem
  ) {

    const quantity =
      Math.max(
        1,
        Number(item.quantity) || 1
      );


    trackAddToCart({
      id: item.id,
      name: item.name,
      price:
        Number(item.price) || 0,
      quantity,
    });



    setCart((current) => {

      const existing =
        current.find(
          (i) =>
            i.id === item.id
        );



      if (existing) {

        return current.map(
          (i) =>
            i.id === item.id
              ? {
                  ...i,
                  quantity:
                    i.quantity +
                    quantity,
                }
              : i
        );

      }



      return [
        ...current,

        {
          ...item,

          price:
            Number(item.price) || 0,

          quantity,
        },

      ];

    });

  }





  function removeFromCart(
    id: string
  ) {

    setCart((current) =>
      current.filter(
        (item) =>
          item.id !== id
      )
    );

  }





  function updateQuantity(
    id: string,
    quantity: number
  ) {

    const qty =
      Math.max(
        1,
        Number(quantity) || 1
      );


    setCart((current) =>
      current.map(
        (item) =>
          item.id === id
            ? {
                ...item,
                quantity: qty,
              }
            : item
      )
    );

  }





  function increaseQuantity(
    id: string
  ) {

    setCart((current) =>
      current.map(
        (item) =>
          item.id === id
            ? {
                ...item,
                quantity:
                  item.quantity + 1,
              }
            : item
      )
    );

  }





  function decreaseQuantity(
    id: string
  ) {

    setCart((current) =>
      current
        .map(
          (item) =>
            item.id === id
              ? {
                  ...item,
                  quantity:
                    item.quantity - 1,
                }
              : item
        )
        .filter(
          (item) =>
            item.quantity > 0
        )
    );

  }
  function getQuantity(
    id: string
  ) {

    const item =
      cart.find(
        (i) =>
          i.id === id
      );


    return item?.quantity ?? 0;

  }





  function clearCart() {

    setCart([]);

  }





  const cartCount =
    useMemo(
      () =>
        cart.reduce(
          (
            total,
            item
          ) =>
            total +
            item.quantity,
          0
        ),
      [cart]
    );





  const subtotal =
    useMemo(
      () =>
        cart.reduce(
          (
            total,
            item
          ) =>
            total +
            item.price *
              item.quantity,
          0
        ),
      [cart]
    );





  const value =
    useMemo(
      () => ({

        cart,

        addToCart,

        removeFromCart,

        updateQuantity,

        increaseQuantity,

        decreaseQuantity,

        getQuantity,

        clearCart,

        cartCount,

        subtotal,

        cartTotal:
          subtotal,

      }),

      [
        cart,
        cartCount,
        subtotal,
      ]

    );





  return (

    <CartContext.Provider
      value={value}
    >

      {children}

    </CartContext.Provider>

  );

}





export function useCart() {

  const context =
    useContext(
      CartContext
    );



  if (!context) {

    throw new Error(
      "useCart must be used within CartProvider"
    );

  }



  return context;

}