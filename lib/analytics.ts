// lib/analytics.ts

type AnalyticsEvent = {
    name: string;
    properties?: Record<string, string | number | boolean | null>;
  };
  
  
  const isProduction =
    process.env.NODE_ENV === "production";
  
  
  
  export function trackEvent({
    name,
    properties = {},
  }: AnalyticsEvent) {
  
    if (!isProduction) {
      console.log(
        "[Analytics Event]",
        name,
        properties
      );
  
      return;
    }
  
  
    if (
      typeof window === "undefined"
    ) {
      return;
    }
  
  
  
    const gtag =
      (
        window as typeof window & {
          gtag?: (
            ...args: unknown[]
          ) => void;
        }
      ).gtag;
  
  
  
    if (gtag) {
  
      gtag(
        "event",
        name,
        properties
      );
  
    }
  
  }
  
  
  
  
  export function trackProductView(
    product: {
      id: string;
      name: string;
      price: number;
    }
  ) {
  
    trackEvent({
      name: "view_product",
  
      properties: {
        product_id: product.id,
        product_name: product.name,
        price: product.price,
      },
    });
  
  }
  
  
  
  
  export function trackAddToCart(
    product: {
      id: string;
      name: string;
      price: number;
      quantity: number;
    }
  ) {
  
    trackEvent({
      name: "add_to_cart",
  
      properties: {
        product_id: product.id,
        product_name: product.name,
        price: product.price,
        quantity: product.quantity,
      },
    });
  
  }
  
  
  
  
  export function trackPurchase(
    order: {
      id: string;
      total: number;
    }
  ) {
  
    trackEvent({
      name: "purchase",
  
      properties: {
        order_id: order.id,
        total: order.total,
      },
    });
  
  }