"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type CurrencyContextType = {
  currency: string;
  setCurrency: (currency: string) => void;
  exchangeRate: number;
  formatCurrency: (amount: number) => string;
  formatPrice: (amount: number) => string;
};

const CurrencyContext = createContext<
  CurrencyContextType | undefined
>(undefined);

const STORAGE_KEY = "rooh-rivet-currency";

const rates: Record<string, number> = {
  INR: 1,
  USD: 0.012,
  EUR: 0.011,
  GBP: 0.0095,
  AUD: 0.018,
  CAD: 0.016,
};

const currencyLocales: Record<string, string> = {
  INR: "en-IN",
  USD: "en-US",
  EUR: "en-DE",
  GBP: "en-GB",
  AUD: "en-AU",
  CAD: "en-CA",
};

export function CurrencyProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [currency, setCurrencyState] =
    useState("INR");

  const [mounted, setMounted] =
    useState(false);

  useEffect(() => {
    const savedCurrency =
      localStorage.getItem(STORAGE_KEY);

    if (
      savedCurrency &&
      rates[savedCurrency]
    ) {
      setCurrencyState(savedCurrency);
    }

    setMounted(true);
  }, []);

  const setCurrency = useCallback(
    (newCurrency: string) => {
      if (!rates[newCurrency]) {
        return;
      }

      setCurrencyState(newCurrency);

      localStorage.setItem(
        STORAGE_KEY,
        newCurrency
      );
    },
    []
  );

  const exchangeRate =
    rates[currency] || 1;

  const formatCurrency = useCallback(
    (amount: number) => {
      const safeAmount =
        Number(amount) || 0;

      if (!mounted) {
        return `₹${safeAmount.toLocaleString(
          "en-IN"
        )}`;
      }

      const convertedAmount =
        safeAmount * exchangeRate;

      const formatted =
        new Intl.NumberFormat(
          currencyLocales[currency] ||
            "en-IN",
          {
            style: "currency",
            currency,
            maximumFractionDigits: 0,
          }
        ).format(convertedAmount);

      return formatted.replace(
        /\u00a0/g,
        " "
      );
    },
    [
      currency,
      exchangeRate,
      mounted,
    ]
  );

  const formatPrice = useCallback(
    (amount: number) =>
      formatCurrency(amount),
    [formatCurrency]
  );

  const value = useMemo(
    () => ({
      currency,
      setCurrency,
      exchangeRate,
      formatCurrency,
      formatPrice,
    }),
    [
      currency,
      setCurrency,
      exchangeRate,
      formatCurrency,
      formatPrice,
    ]
  );

  return (
    <CurrencyContext.Provider
      value={value}
    >
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context =
    useContext(CurrencyContext);

  if (!context) {
    throw new Error(
      "useCurrency must be used inside CurrencyProvider"
    );
  }

  return context;
}