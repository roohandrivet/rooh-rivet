"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
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
  stock?: number;
  reservationEnabled?: boolean;
  reservedUntil?: string | null;
};

type ReservationResponse = {
  success?: unknown;
  message?: unknown;
  product_id?: unknown;
  reserved_until?: unknown;
};

type CartContextType = {
  cart: CartItem[];

  addToCart: (
    item: CartItem
  ) => Promise<boolean>;

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

  getReservationRemainingSeconds: (
    id: string
  ) => number;

  isReservationExpired: (
    id: string
  ) => boolean;

  clearReservationError: () => void;

  cartCount: number;

  subtotal: number;

  cartTotal: number;

  hydrated: boolean;

  reservationError: string;
};

const CartContext =
  createContext<
    CartContextType | undefined
  >(undefined);

const STORAGE_KEY =
  "rooh-rivet-cart";

function isRecord(
  value: unknown
): value is Record<
  string,
  unknown
> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

function getString(
  value: unknown
): string {
  return typeof value ===
    "string"
    ? value.trim()
    : "";
}

function getNumber(
  value: unknown
): number {
  const parsed =
    Number(value);

  return Number.isFinite(
    parsed
  )
    ? parsed
    : 0;
}

function getPositiveInteger(
  value: unknown,
  fallback = 1
): number {
  const parsed =
    Math.floor(
      getNumber(value)
    );

  return parsed > 0
    ? parsed
    : fallback;
}

function getOptionalStock(
  value: unknown
): number | undefined {
  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {
    return undefined;
  }

  const parsed =
    Number(value);

  if (
    !Number.isFinite(parsed)
  ) {
    return undefined;
  }

  return Math.max(
    0,
    Math.floor(parsed)
  );
}

function getFutureDate(
  value: unknown
): string | null {
  if (
    typeof value !== "string"
  ) {
    return null;
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    ) ||
    date.getTime() <=
      Date.now()
  ) {
    return null;
  }

  return date.toISOString();
}

function getResponseMessage(
  value: unknown,
  fallback: string
): string {
  if (!isRecord(value)) {
    return fallback;
  }

  const message =
    getString(
      value.message
    );

  return message || fallback;
}

function validateCart(
  items: unknown
): CartItem[] {
  if (!Array.isArray(items)) {
    return [];
  }

  const validatedItems:
    CartItem[] = [];

  for (
    const item of items
  ) {
    if (!isRecord(item)) {
      continue;
    }

    const id =
      getString(item.id);

    const name =
      getString(item.name);

    if (
      !id ||
      !name
    ) {
      continue;
    }

    const slug =
      getString(item.slug);

    const image =
      getString(item.image);

    const price =
      Math.max(
        0,
        getNumber(
          item.price
        )
      );

    const stock =
      getOptionalStock(
        item.stock
      );

    if (stock === 0) {
      continue;
    }

    const reservationEnabled =
      item.reservationEnabled ===
      true;

    const reservedUntil =
      reservationEnabled
        ? getFutureDate(
            item.reservedUntil
          )
        : null;

    if (
      reservationEnabled &&
      !reservedUntil
    ) {
      continue;
    }

    const requestedQuantity =
      getPositiveInteger(
        item.quantity
      );

    const quantity =
      reservationEnabled
        ? 1
        : stock === undefined
          ? requestedQuantity
          : Math.min(
              requestedQuantity,
              stock
            );

    const normalizedItem:
      CartItem = {
        id,
        name,
        slug,
        price,
        image:
          image || undefined,
        quantity,
        stock,
        reservationEnabled,
        reservedUntil,
      };

    const existingIndex =
      validatedItems.findIndex(
        (existingItem) =>
          existingItem.id ===
          normalizedItem.id
      );

    if (
      existingIndex === -1
    ) {
      validatedItems.push(
        normalizedItem
      );

      continue;
    }

    const existingItem =
      validatedItems[
        existingIndex
      ];

    if (
      normalizedItem
        .reservationEnabled
    ) {
      validatedItems[
        existingIndex
      ] = normalizedItem;

      continue;
    }

    const combinedQuantity =
      existingItem.quantity +
      normalizedItem.quantity;

    validatedItems[
      existingIndex
    ] = {
      ...normalizedItem,
      quantity:
        normalizedItem.stock ===
        undefined
          ? combinedQuantity
          : Math.min(
              combinedQuantity,
              normalizedItem.stock
            ),
    };
  }

  return validatedItems;
}

async function releaseReservation(
  productId: string
): Promise<void> {
  try {
    await fetch(
      "/api/reservations",
      {
        method: "DELETE",
        headers: {
          "Content-Type":
            "application/json",
        },
        body: JSON.stringify({
          product_id:
            productId,
        }),
      }
    );
  } catch (
    releaseError
  ) {
    console.error(
      "Failed to release reservation:",
      releaseError
    );
  }
}

export function CartProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [
    cart,
    setCart,
  ] =
    useState<CartItem[]>([]);

  const cartRef =
    useRef<CartItem[]>([]);

  const [
    hydrated,
    setHydrated,
  ] = useState(false);

  const [
    reservationClock,
    setReservationClock,
  ] = useState(
    Date.now()
  );

  const [
    reservationError,
    setReservationError,
  ] = useState("");

  const reservationRequests =
    useRef<
      Set<string>
    >(new Set());

  const commitCart =
    useCallback(
      (
        updater:
          | CartItem[]
          | ((
              current:
                CartItem[]
            ) => CartItem[])
      ) => {
        setCart(
          (current) => {
            const nextCart =
              typeof updater ===
              "function"
                ? updater(
                    current
                  )
                : updater;

            cartRef.current =
              nextCart;

            return nextCart;
          }
        );
      },
      []
    );

  useEffect(() => {
    try {
      const stored =
        window.localStorage.getItem(
          STORAGE_KEY
        );

      if (!stored) {
        cartRef.current = [];
        setCart([]);
        return;
      }

      const validatedCart =
        validateCart(
          JSON.parse(
            stored
          ) as unknown
        );

      cartRef.current =
        validatedCart;

      setCart(
        validatedCart
      );
    } catch (
      storageError
    ) {
      console.error(
        "Failed to load cart:",
        storageError
      );

      window.localStorage.removeItem(
        STORAGE_KEY
      );

      cartRef.current = [];
      setCart([]);
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(
          cart
        )
      );
    } catch (
      storageError
    ) {
      console.error(
        "Failed to save cart:",
        storageError
      );
    }
  }, [
    cart,
    hydrated,
  ]);

  const hasReservedItems =
    useMemo(
      () =>
        cart.some(
          (item) =>
            item.reservationEnabled ===
              true &&
            Boolean(
              item.reservedUntil
            )
        ),
      [cart]
    );

  useEffect(() => {
    if (!hasReservedItems) {
      return;
    }

    const interval =
      window.setInterval(
        () => {
          setReservationClock(
            Date.now()
          );
        },
        1000
      );

    return () => {
      window.clearInterval(
        interval
      );
    };
  }, [
    hasReservedItems,
  ]);

  useEffect(() => {
    if (
      !hydrated ||
      !hasReservedItems
    ) {
      return;
    }

    const expiredItems =
      cartRef.current.filter(
        (item) => {
          if (
            item.reservationEnabled !==
              true ||
            !item.reservedUntil
          ) {
            return false;
          }

          const expiresAt =
            new Date(
              item.reservedUntil
            ).getTime();

          return (
            Number.isNaN(
              expiresAt
            ) ||
            expiresAt <=
              reservationClock
          );
        }
      );

    if (
      expiredItems.length ===
      0
    ) {
      return;
    }

    const expiredIds =
      new Set(
        expiredItems.map(
          (item) =>
            item.id
        )
      );

    commitCart(
      (current) =>
        current.filter(
          (item) =>
            !expiredIds.has(
              item.id
            )
        )
    );

    void Promise.allSettled(
      expiredItems.map(
        (item) =>
          releaseReservation(
            item.id
          )
      )
    );

    setReservationError(
      expiredItems.length ===
      1
        ? "Your reservation expired and the piece was removed from your cart."
        : "Some reservations expired and were removed from your cart."
    );
  }, [
    commitCart,
    hasReservedItems,
    hydrated,
    reservationClock,
  ]);

  const clearReservationError =
    useCallback(() => {
      setReservationError("");
    }, []);

  const addToCart =
    useCallback(
      async (
        item: CartItem
      ): Promise<boolean> => {
        setReservationError("");

        const id =
          item.id.trim();

        const name =
          item.name.trim();

        const slug =
          item.slug.trim();

        const price =
          Number(item.price);

        const quantity =
          getPositiveInteger(
            item.quantity
          );

        const stock =
          getOptionalStock(
            item.stock
          );

        if (
          !id ||
          !name ||
          !Number.isFinite(
            price
          ) ||
          price < 0
        ) {
          setReservationError(
            "This product could not be added to your cart."
          );

          return false;
        }

        if (stock === 0) {
          setReservationError(
            "This piece is currently unavailable."
          );

          return false;
        }

        const reservationEnabled =
          item.reservationEnabled ===
          true;

        if (
          reservationEnabled
        ) {
          const existingItem =
            cartRef.current.find(
              (currentItem) =>
                currentItem.id ===
                id
            );

          if (
            existingItem
              ?.reservationEnabled &&
            existingItem.reservedUntil &&
            new Date(
              existingItem.reservedUntil
            ).getTime() >
              Date.now()
          ) {
            setReservationError(
              "This piece is already reserved in your cart."
            );

            return false;
          }

          if (
            reservationRequests
              .current
              .has(id)
          ) {
            return false;
          }

          reservationRequests
            .current
            .add(id);

          try {
            const response =
              await fetch(
                "/api/reservations",
                {
                  method: "POST",
                  headers: {
                    "Content-Type":
                      "application/json",
                  },
                  body:
                    JSON.stringify({
                      product_id:
                        id,
                    }),
                }
              );

            const responseData =
              (await response
                .json()
                .catch(
                  () => null
                )) as unknown;

            if (
              !response.ok ||
              !isRecord(
                responseData
              ) ||
              responseData.success !==
                true
            ) {
              setReservationError(
                getResponseMessage(
                  responseData,
                  "This piece could not be reserved."
                )
              );

              return false;
            }

            const reservedUntil =
              getFutureDate(
                responseData
                  .reserved_until
              );

            if (
              !reservedUntil
            ) {
              setReservationError(
                "The reservation expiry time was invalid."
              );

              return false;
            }

            const reservedItem:
              CartItem = {
                id,
                name,
                slug,
                price,
                image:
                  item.image?.trim() ||
                  undefined,
                quantity: 1,
                stock:
                  stock ??
                  1,
                reservationEnabled:
                  true,
                reservedUntil,
              };

            commitCart(
              (current) => {
                const existingIndex =
                  current.findIndex(
                    (
                      currentItem
                    ) =>
                      currentItem.id ===
                      id
                  );

                if (
                  existingIndex ===
                  -1
                ) {
                  return [
                    ...current,
                    reservedItem,
                  ];
                }

                return current.map(
                  (
                    currentItem,
                    index
                  ) =>
                    index ===
                    existingIndex
                      ? reservedItem
                      : currentItem
                );
              }
            );

            trackAddToCart({
              id,
              name,
              price,
              quantity: 1,
            });

            setReservationClock(
              Date.now()
            );

            return true;
          } catch (
            reservationRequestError
          ) {
            console.error(
              "Failed to reserve product:",
              reservationRequestError
            );

            setReservationError(
              "Unable to reserve this piece. Please try again."
            );

            return false;
          } finally {
            reservationRequests
              .current
              .delete(id);
          }
        }

        const existingItem =
          cartRef.current.find(
            (currentItem) =>
              currentItem.id ===
              id
          );

        if (
          existingItem
            ?.reservationEnabled
        ) {
          setReservationError(
            "This one-of-a-kind piece is already reserved in your cart."
          );

          return false;
        }

        const existingQuantity =
          existingItem
            ?.quantity ??
          0;

        const maximumStock =
          stock ??
          existingItem?.stock;

        const nextQuantity =
          existingQuantity +
          quantity;

        if (
          maximumStock !==
            undefined &&
          nextQuantity >
            maximumStock
        ) {
          setReservationError(
            `Only ${maximumStock} available.`
          );

          return false;
        }

        commitCart(
          (current) => {
            const existing =
              current.find(
                (currentItem) =>
                  currentItem.id ===
                  id
              );

            if (existing) {
              return current.map(
                (currentItem) =>
                  currentItem.id ===
                  id
                    ? {
                        ...currentItem,
                        name,
                        slug,
                        price,
                        image:
                          item.image?.trim() ||
                          currentItem.image,
                        stock:
                          stock ??
                          currentItem.stock,
                        quantity:
                          currentItem.quantity +
                          quantity,
                      }
                    : currentItem
              );
            }

            return [
              ...current,
              {
                id,
                name,
                slug,
                price,
                image:
                  item.image?.trim() ||
                  undefined,
                quantity,
                stock,
                reservationEnabled:
                  false,
                reservedUntil:
                  null,
              },
            ];
          }
        );

        trackAddToCart({
          id,
          name,
          price,
          quantity,
        });

        return true;
      },
      [
        commitCart,
      ]
    );

  const removeFromCart =
    useCallback(
      (
        id: string
      ) => {
        setReservationError("");

        const item =
          cartRef.current.find(
            (currentItem) =>
              currentItem.id ===
              id
          );

        commitCart(
          (current) =>
            current.filter(
              (currentItem) =>
                currentItem.id !==
                id
            )
        );

        if (
          item
            ?.reservationEnabled
        ) {
          void releaseReservation(
            item.id
          );
        }
      },
      [
        commitCart,
      ]
    );

  const updateQuantity =
    useCallback(
      (
        id: string,
        quantity: number
      ) => {
        setReservationError("");

        const item =
          cartRef.current.find(
            (currentItem) =>
              currentItem.id ===
              id
          );

        if (!item) {
          return;
        }

        if (
          item.reservationEnabled
        ) {
          if (
            quantity <= 0
          ) {
            removeFromCart(id);
            return;
          }

          if (
            quantity !== 1
          ) {
            setReservationError(
              "Reserved one-of-a-kind pieces are limited to one."
            );
          }

          return;
        }

        const requestedQuantity =
          getPositiveInteger(
            quantity
          );

        const finalQuantity =
          item.stock ===
          undefined
            ? requestedQuantity
            : Math.min(
                requestedQuantity,
                item.stock
              );

        if (
          item.stock !==
            undefined &&
          requestedQuantity >
            item.stock
        ) {
          setReservationError(
            `Only ${item.stock} available.`
          );
        }

        commitCart(
          (current) =>
            current.map(
              (currentItem) =>
                currentItem.id ===
                id
                  ? {
                      ...currentItem,
                      quantity:
                        finalQuantity,
                    }
                  : currentItem
            )
        );
      },
      [
        commitCart,
        removeFromCart,
      ]
    );

  const increaseQuantity =
    useCallback(
      (
        id: string
      ) => {
        setReservationError("");

        const item =
          cartRef.current.find(
            (currentItem) =>
              currentItem.id ===
              id
          );

        if (!item) {
          return;
        }

        if (
          item.reservationEnabled
        ) {
          setReservationError(
            "Reserved one-of-a-kind pieces are limited to one."
          );

          return;
        }

        if (
          item.stock !==
            undefined &&
          item.quantity >=
            item.stock
        ) {
          setReservationError(
            `Only ${item.stock} available.`
          );

          return;
        }

        commitCart(
          (current) =>
            current.map(
              (currentItem) =>
                currentItem.id ===
                id
                  ? {
                      ...currentItem,
                      quantity:
                        currentItem.quantity +
                        1,
                    }
                  : currentItem
            )
        );
      },
      [
        commitCart,
      ]
    );

  const decreaseQuantity =
    useCallback(
      (
        id: string
      ) => {
        setReservationError("");

        const item =
          cartRef.current.find(
            (currentItem) =>
              currentItem.id ===
              id
          );

        if (!item) {
          return;
        }

        if (
          item.reservationEnabled ||
          item.quantity <= 1
        ) {
          removeFromCart(id);
          return;
        }

        commitCart(
          (current) =>
            current.map(
              (currentItem) =>
                currentItem.id ===
                id
                  ? {
                      ...currentItem,
                      quantity:
                        currentItem.quantity -
                        1,
                    }
                  : currentItem
            )
        );
      },
      [
        commitCart,
        removeFromCart,
      ]
    );

  const getQuantity =
    useCallback(
      (
        id: string
      ): number => {
        const item =
          cartRef.current.find(
            (currentItem) =>
              currentItem.id ===
              id
          );

        return (
          item?.quantity ??
          0
        );
      },
      []
    );

  const clearCart =
    useCallback(() => {
      const reservedItems =
        cartRef.current.filter(
          (item) =>
            item.reservationEnabled ===
            true
        );

      commitCart([]);
      setReservationError("");

      if (
        reservedItems.length >
        0
      ) {
        void Promise.allSettled(
          reservedItems.map(
            (item) =>
              releaseReservation(
                item.id
              )
          )
        );
      }
    }, [
      commitCart,
    ]);

  const getReservationRemainingSeconds =
    useCallback(
      (
        id: string
      ): number => {
        const item =
          cart.find(
            (currentItem) =>
              currentItem.id ===
              id
          );

        if (
          !item ||
          item.reservationEnabled !==
            true ||
          !item.reservedUntil
        ) {
          return 0;
        }

        const expiresAt =
          new Date(
            item.reservedUntil
          ).getTime();

        if (
          Number.isNaN(
            expiresAt
          )
        ) {
          return 0;
        }

        return Math.max(
          0,
          Math.ceil(
            (
              expiresAt -
              reservationClock
            ) / 1000
          )
        );
      },
      [
        cart,
        reservationClock,
      ]
    );

  const isReservationExpired =
    useCallback(
      (
        id: string
      ): boolean => {
        const item =
          cart.find(
            (currentItem) =>
              currentItem.id ===
              id
          );

        if (
          !item ||
          item.reservationEnabled !==
            true
        ) {
          return false;
        }

        if (
          !item.reservedUntil
        ) {
          return true;
        }

        const expiresAt =
          new Date(
            item.reservedUntil
          ).getTime();

        return (
          Number.isNaN(
            expiresAt
          ) ||
          expiresAt <=
            reservationClock
        );
      },
      [
        cart,
        reservationClock,
      ]
    );

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
    useMemo<
      CartContextType
    >(
      () => ({
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        increaseQuantity,
        decreaseQuantity,
        getQuantity,
        clearCart,
        getReservationRemainingSeconds,
        isReservationExpired,
        clearReservationError,
        cartCount,
        subtotal,
        cartTotal:
          subtotal,
        hydrated,
        reservationError,
      }),
      [
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        increaseQuantity,
        decreaseQuantity,
        getQuantity,
        clearCart,
        getReservationRemainingSeconds,
        isReservationExpired,
        clearReservationError,
        cartCount,
        subtotal,
        hydrated,
        reservationError,
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

export function useCart(): CartContextType {
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