import type { MetadataRoute } from "next";

import { supabase } from "@/lib/supabase";


export default async function sitemap(): Promise<MetadataRoute.Sitemap> {

  const baseUrl =
    "https://roohandrivet.com";


  const {
    data: products,
  } = await supabase
    .from("products")
    .select("slug, updated_at")
    .eq(
      "active",
      true
    );


  const productUrls =
    products?.map(
      (product) => ({
        url:
          `${baseUrl}/shop/${product.slug}`,

        lastModified:
          product.updated_at
            ? new Date(product.updated_at)
            : new Date(),

        changeFrequency:
          "weekly" as const,

        priority:
          0.8,
      })
    ) ?? [];



  return [

    {
      url:
        baseUrl,

      lastModified:
        new Date(),

      changeFrequency:
        "daily",

      priority:
        1,
    },


    {
      url:
        `${baseUrl}/shop`,

      lastModified:
        new Date(),

      changeFrequency:
        "daily",

      priority:
        0.9,
    },


    {
      url:
        `${baseUrl}/account`,

      changeFrequency:
        "monthly",

      priority:
        0.3,
    },


    ...productUrls,

  ];
}