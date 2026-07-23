// components/ProductSchema.tsx

import Script from "next/script";

type ProductSchemaProps = {
  name: string;
  description: string | null;
  image: string | null;
  price: number;
  slug: string;
  category: string | null;
  stock: number | null;
};


export default function ProductSchema({
  name,
  description,
  image,
  price,
  slug,
  category,
  stock,
}: ProductSchemaProps) {

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    "https://roohrivet.com";


  const productUrl =
    `${siteUrl}/shop/${slug}`;


  const schema = {
    "@context": "https://schema.org",
    "@type": "Product",

    name,

    description:
      description ||
      "Luxury handcrafted jewellery by Rooh & Rivet.",


    image: image
      ? [
          image.startsWith("http")
            ? image
            : `${siteUrl}${image}`,
        ]
      : [],


    brand: {
      "@type": "Brand",
      name: "Rooh & Rivet",
    },


    category:
      category ||
      "Luxury Jewellery",


    sku: slug,


    offers: {
      "@type": "Offer",

      url: productUrl,

      priceCurrency: "INR",

      price: Number(price).toFixed(2),

      availability:
        stock && stock > 0
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",

      itemCondition:
        "https://schema.org/NewCondition",
    },


    seller: {
      "@type": "Organization",
      name: "Rooh & Rivet",
      url: siteUrl,
    },
  };


  return (
    <Script
      id={`product-schema-${slug}`}
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(schema),
      }}
    />
  );
}