"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { supabase } from "@/lib/supabase";

export type WishlistProduct = {
  id: string;
  slug: string;
  name: string;
  price: number;
  image: string | null;
};

export type WishlistItem = {
  id: string;
  product_id: string;
  customer_email: string;
  created_at: string;
  product: WishlistProduct | null;
};

type WishlistContextType = {
  wishlist: WishlistItem[];
  loading: boolean;
  isWishlisted: (productId: string) => boolean;
  addToWishlist: (productId: string) => Promise<void>;
  removeFromWishlist: (productId: string) => Promise<void>;
  toggleWishlist: (productId: string) => Promise<void>;
  refreshWishlist: () => Promise<void>;
  clearWishlist: () => Promise<void>;
};

const WishlistContext =
  createContext<WishlistContextType | undefined>(
    undefined
  );


export function WishlistProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [wishlist, setWishlist] =
    useState<WishlistItem[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [customerEmail, setCustomerEmail] =
    useState<string | null>(null);


  async function getUserEmail() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const email =
      user?.email ?? null;

    setCustomerEmail(email);

    return email;
  }


  async function refreshWishlist() {
    const email =
      customerEmail ??
      (await getUserEmail());

    if (!email) {
      setWishlist([]);
      setLoading(false);
      return;
    }


    const {
      data,
      error,
    } = await supabase
      .from("wishlist")
      .select(`
        id,
        product_id,
        customer_email,
        created_at,
        product:products(
          id,
          slug,
          name,
          price,
          image
        )
      `)
      .eq(
        "customer_email",
        email
      );


    if (error) {
      console.error(
        "Wishlist load error:",
        error
      );

      setLoading(false);
      return;
    }


    const formatted =
      (data ?? []).map(
        (item: any) => ({
          id: item.id,
          product_id:
            item.product_id,
          customer_email:
            item.customer_email,
          created_at:
            item.created_at,
          product:
            Array.isArray(
              item.product
            )
              ? item.product[0] ?? null
              : item.product,
        })
      );


    setWishlist(formatted);

    setLoading(false);
  }


  useEffect(() => {
    refreshWishlist();
  }, []);


  function isWishlisted(
    productId: string
  ) {
    return wishlist.some(
      (item) =>
        item.product_id === productId
    );
  }


  async function addToWishlist(
    productId: string
  ) {
    const email =
      customerEmail ??
      (await getUserEmail());


    if (!email) {
      console.log(
        "No user logged in"
      );
      return;
    }


    const {
      error,
    } = await supabase
      .from("wishlist")
      .insert({
        product_id:
          productId,
        customer_email:
          email,
      });


    if (error) {
      console.error(
        "Wishlist insert error:",
        error
      );
      return;
    }


    await refreshWishlist();
  }


  async function removeFromWishlist(
    productId: string
  ) {
    const email =
      customerEmail ??
      (await getUserEmail());


    if (!email) {
      return;
    }


    const {
      error,
    } = await supabase
      .from("wishlist")
      .delete()
      .eq(
        "product_id",
        productId
      )
      .eq(
        "customer_email",
        email
      );


    if (error) {
      console.error(
        "Wishlist delete error:",
        error
      );
      return;
    }


    await refreshWishlist();
  }


  async function toggleWishlist(
    productId: string
  ) {
    console.log(
      "Wishlist clicked:",
      productId
    );


    if (
      isWishlisted(productId)
    ) {
      await removeFromWishlist(
        productId
      );
    } else {
      await addToWishlist(
        productId
      );
    }
  }


  async function clearWishlist() {
    const email =
      customerEmail ??
      (await getUserEmail());


    if (!email) {
      return;
    }


    const {
      error,
    } = await supabase
      .from("wishlist")
      .delete()
      .eq(
        "customer_email",
        email
      );


    if (error) {
      console.error(
        "Clear wishlist error:",
        error
      );
      return;
    }


    setWishlist([]);
  }


  const value = useMemo(
    () => ({
      wishlist,
      loading,
      isWishlisted,
      addToWishlist,
      removeFromWishlist,
      toggleWishlist,
      refreshWishlist,
      clearWishlist,
    }),
    [
      wishlist,
      loading,
    ]
  );


  return (
    <WishlistContext.Provider
      value={value}
    >
      {children}
    </WishlistContext.Provider>
  );
}


export function useWishlist() {
  const context =
    useContext(
      WishlistContext
    );

  if (!context) {
    throw new Error(
      "useWishlist must be used inside WishlistProvider"
    );
  }

  return context;
}