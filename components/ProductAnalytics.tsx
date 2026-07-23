"use client";

import { useEffect } from "react";

import { trackProductView } from "@/lib/analytics";


type ProductAnalyticsProps = {
  id: string;
  name: string;
  price: number;
};


export default function ProductAnalytics({
  id,
  name,
  price,
}: ProductAnalyticsProps) {

  useEffect(() => {

    trackProductView({
      id,
      name,
      price,
    });

  }, [
    id,
    name,
    price,
  ]);


  return null;
}