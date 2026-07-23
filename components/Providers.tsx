"use client";

import type { ReactNode } from "react";

import { CartProvider } from "@/context/CartContext";
import { WishlistProvider } from "@/context/WishlistContext";
import { CurrencyProvider } from "@/context/CurrencyContext";

export default function Providers({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <CurrencyProvider>
      <CartProvider>
        <WishlistProvider>
          {children}
        </WishlistProvider>
      </CartProvider>
    </CurrencyProvider>
  );
}