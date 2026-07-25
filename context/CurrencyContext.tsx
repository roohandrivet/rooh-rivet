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

export type CurrencyCode =
  | "INR"
  | "USD"
  | "EUR"
  | "GBP"
  | "AUD"
  | "CAD";

type ExchangeRates = Record<CurrencyCode, number>;

type ExchangeRatesResponse = {
  success: boolean;
  base?: string;
  rates?: Partial<Record<CurrencyCode, number>>;
  updatedAt?: string;
  message?: string;
};

type CachedExchangeRates = {
  rates: ExchangeRates;
  updatedAt: string | null;
  cachedAt: string;
};

type CurrencyContextType = {
  currency: CurrencyCode;
  setCurrency: (currency: string) => void;
  exchangeRate: number;
  formatCurrency: (amount: number) => string;
  formatPrice: (amount: number) => string;
  supportedCurrencies: CurrencyCode[];
  ratesLoading: boolean;
  ratesError: string;
  ratesUpdatedAt: string | null;
  refreshRates: () => Promise<void>;
};

const CurrencyContext = createContext<
  CurrencyContextType | undefined
>(undefined);

const CURRENCY_STORAGE_KEY =
  "rooh-rivet-currency";

const RATES_STORAGE_KEY =
  "rooh-rivet-exchange-rates";

const BASE_CURRENCY: CurrencyCode =
  "INR";

const SUPPORTED_CURRENCIES: CurrencyCode[] = [
  "INR",
  "USD",
  "EUR",
  "GBP",
  "AUD",
  "CAD",
];

const FALLBACK_RATES: ExchangeRates = {
  INR: 1,
  USD: 0.012,
  EUR: 0.011,
  GBP: 0.0095,
  AUD: 0.018,
  CAD: 0.016,
};

const CURRENCY_LOCALES: Record<
  CurrencyCode,
  string
> = {
  INR: "en-IN",
  USD: "en-US",
  EUR: "en-GB",
  GBP: "en-GB",
  AUD: "en-AU",
  CAD: "en-CA",
};

function isCurrencyCode(
  value: string
): value is CurrencyCode {
  return SUPPORTED_CURRENCIES.includes(
    value as CurrencyCode
  );
}

function isValidRate(
  value: unknown
): value is number {
  return (
    typeof value === "number" &&
    Number.isFinite(value) &&
    value > 0
  );
}

function normaliseRates(
  incomingRates:
    | Partial<Record<CurrencyCode, number>>
    | undefined
): ExchangeRates {
  const normalisedRates: ExchangeRates = {
    ...FALLBACK_RATES,
    INR: 1,
  };

  if (!incomingRates) {
    return normalisedRates;
  }

  SUPPORTED_CURRENCIES.forEach(
    (currencyCode) => {
      if (
        currencyCode === BASE_CURRENCY
      ) {
        normalisedRates[currencyCode] = 1;
        return;
      }

      const incomingRate =
        incomingRates[currencyCode];

      if (
        isValidRate(incomingRate)
      ) {
        normalisedRates[currencyCode] =
          incomingRate;
      }
    }
  );

  return normalisedRates;
}

function readCachedRates():
  | CachedExchangeRates
  | null {
  try {
    const rawValue =
      window.localStorage.getItem(
        RATES_STORAGE_KEY
      );

    if (!rawValue) {
      return null;
    }

    const parsedValue =
      JSON.parse(
        rawValue
      ) as Partial<CachedExchangeRates>;

    if (
      !parsedValue.rates ||
      typeof parsedValue.cachedAt !==
        "string"
    ) {
      return null;
    }

    return {
      rates: normaliseRates(
        parsedValue.rates
      ),
      updatedAt:
        typeof parsedValue.updatedAt ===
        "string"
          ? parsedValue.updatedAt
          : null,
      cachedAt:
        parsedValue.cachedAt,
    };
  } catch (error) {
    console.error(
      "Failed to read cached exchange rates:",
      error
    );

    return null;
  }
}

function saveCachedRates(
  rates: ExchangeRates,
  updatedAt: string | null
): void {
  try {
    const payload: CachedExchangeRates = {
      rates,
      updatedAt,
      cachedAt:
        new Date().toISOString(),
    };

    window.localStorage.setItem(
      RATES_STORAGE_KEY,
      JSON.stringify(payload)
    );
  } catch (error) {
    console.error(
      "Failed to cache exchange rates:",
      error
    );
  }
}

export function CurrencyProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [
    currency,
    setCurrencyState,
  ] = useState<CurrencyCode>(
    BASE_CURRENCY
  );

  const [
    rates,
    setRates,
  ] = useState<ExchangeRates>(
    FALLBACK_RATES
  );

  const [
    mounted,
    setMounted,
  ] = useState(false);

  const [
    ratesLoading,
    setRatesLoading,
  ] = useState(true);

  const [
    ratesError,
    setRatesError,
  ] = useState("");

  const [
    ratesUpdatedAt,
    setRatesUpdatedAt,
  ] = useState<string | null>(
    null
  );

  const refreshRates =
    useCallback(
      async (): Promise<void> => {
        setRatesLoading(true);
        setRatesError("");

        try {
          const response =
            await fetch(
              "/api/exchange-rates",
              {
                method: "GET",
                cache: "no-store",
                headers: {
                  Accept:
                    "application/json",
                },
              }
            );

          const result =
            (await response.json()) as
              ExchangeRatesResponse;

          if (
            !response.ok ||
            !result.success ||
            !result.rates
          ) {
            throw new Error(
              result.message ??
                "Unable to load live exchange rates."
            );
          }

          if (
            result.base &&
            result.base.toUpperCase() !==
              BASE_CURRENCY
          ) {
            throw new Error(
              "Exchange-rate response must use INR as its base currency."
            );
          }

          const nextRates =
            normaliseRates(
              result.rates
            );

          const updatedAt =
            typeof result.updatedAt ===
            "string"
              ? result.updatedAt
              : new Date().toISOString();

          setRates(nextRates);
          setRatesUpdatedAt(
            updatedAt
          );

          saveCachedRates(
            nextRates,
            updatedAt
          );
        } catch (error) {
          console.error(
            "Failed to refresh exchange rates:",
            error
          );

          setRatesError(
            error instanceof Error
              ? error.message
              : "Unable to load live exchange rates."
          );
        } finally {
          setRatesLoading(false);
        }
      },
      []
    );

  useEffect(() => {
    const savedCurrency =
      window.localStorage.getItem(
        CURRENCY_STORAGE_KEY
      );

    if (
      savedCurrency &&
      isCurrencyCode(
        savedCurrency
      )
    ) {
      setCurrencyState(
        savedCurrency
      );
    }

    const cachedRates =
      readCachedRates();

    if (cachedRates) {
      setRates(
        cachedRates.rates
      );
      setRatesUpdatedAt(
        cachedRates.updatedAt
      );
    }

    setMounted(true);

    void refreshRates();
  }, [
    refreshRates,
  ]);

  const setCurrency =
    useCallback(
      (
        newCurrency: string
      ): void => {
        const normalisedCurrency =
          newCurrency
            .trim()
            .toUpperCase();

        if (
          !isCurrencyCode(
            normalisedCurrency
          )
        ) {
          return;
        }

        setCurrencyState(
          normalisedCurrency
        );

        window.localStorage.setItem(
          CURRENCY_STORAGE_KEY,
          normalisedCurrency
        );
      },
      []
    );

  const exchangeRate =
    rates[currency] ?? 1;

  const formatCurrency =
    useCallback(
      (
        amount: number
      ): string => {
        const numericAmount =
          Number(amount);

        const safeAmount =
          Number.isFinite(
            numericAmount
          )
            ? numericAmount
            : 0;

        const displayCurrency =
          mounted
            ? currency
            : BASE_CURRENCY;

        const displayRate =
          mounted
            ? exchangeRate
            : 1;

        const convertedAmount =
          safeAmount *
          displayRate;

        const maximumFractionDigits =
          displayCurrency === "INR"
            ? 0
            : 2;

        return new Intl.NumberFormat(
          CURRENCY_LOCALES[
            displayCurrency
          ],
          {
            style: "currency",
            currency:
              displayCurrency,
            minimumFractionDigits: 0,
            maximumFractionDigits,
          }
        )
          .format(
            convertedAmount
          )
          .replace(
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

  const formatPrice =
    useCallback(
      (
        amount: number
      ): string =>
        formatCurrency(
          amount
        ),
      [
        formatCurrency,
      ]
    );

  const value =
    useMemo<CurrencyContextType>(
      () => ({
        currency,
        setCurrency,
        exchangeRate,
        formatCurrency,
        formatPrice,
        supportedCurrencies:
          SUPPORTED_CURRENCIES,
        ratesLoading,
        ratesError,
        ratesUpdatedAt,
        refreshRates,
      }),
      [
        currency,
        setCurrency,
        exchangeRate,
        formatCurrency,
        formatPrice,
        ratesLoading,
        ratesError,
        ratesUpdatedAt,
        refreshRates,
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

export function useCurrency(): CurrencyContextType {
  const context =
    useContext(
      CurrencyContext
    );

  if (!context) {
    throw new Error(
      "useCurrency must be used inside CurrencyProvider"
    );
  }

  return context;
}