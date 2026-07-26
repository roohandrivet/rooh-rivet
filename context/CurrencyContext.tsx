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

import { supabase } from "@/lib/supabase";

export type CurrencyCode =
  | "INR"
  | "USD"
  | "EUR"
  | "GBP"
  | "AUD"
  | "CAD";

type ExchangeRates =
  Record<CurrencyCode, number>;

type ExchangeRatesResponse = {
  success: boolean;
  base?: string;
  rates?: Partial<
    Record<CurrencyCode, number>
  >;
  updatedAt?: string;
  message?: string;
};

type CachedExchangeRates = {
  rates: ExchangeRates;
  updatedAt: string | null;
  cachedAt: string;
};

type CurrencySettingsRow = {
  supported_currencies:
    | string[]
    | null;
  auto_update_exchange_rates:
    | boolean
    | null;
};

type CurrencyContextType = {
  currency: CurrencyCode;
  setCurrency: (
    currency: string
  ) => void;
  exchangeRate: number;
  formatCurrency: (
    amount: number
  ) => string;
  formatPrice: (
    amount: number
  ) => string;
  supportedCurrencies:
    CurrencyCode[];
  ratesLoading: boolean;
  ratesError: string;
  ratesUpdatedAt:
    string | null;
  refreshRates:
    () => Promise<void>;
};

const CurrencyContext =
  createContext<
    CurrencyContextType
      | undefined
  >(undefined);

const CURRENCY_STORAGE_KEY =
  "rooh-rivet-currency";

const RATES_STORAGE_KEY =
  "rooh-rivet-exchange-rates";

const BASE_CURRENCY:
  CurrencyCode = "INR";

const ALL_CURRENCIES:
  CurrencyCode[] = [
  "INR",
  "USD",
  "EUR",
  "GBP",
  "AUD",
  "CAD",
];

const FALLBACK_RATES:
  ExchangeRates = {
  INR: 1,
  USD: 0.012,
  EUR: 0.011,
  GBP: 0.0095,
  AUD: 0.018,
  CAD: 0.016,
};

const CURRENCY_LOCALES:
  Record<
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
  return ALL_CURRENCIES.includes(
    value as CurrencyCode
  );
}

function normaliseSupportedCurrencies(
  value:
    | string[]
    | null
    | undefined
): CurrencyCode[] {
  if (
    !Array.isArray(value)
  ) {
    return [
      ...ALL_CURRENCIES,
    ];
  }

  const uniqueCurrencies =
    Array.from(
      new Set(
        value
          .map(
            (entry) =>
              entry
                .trim()
                .toUpperCase()
          )
          .filter(
            isCurrencyCode
          )
      )
    );

  if (
    uniqueCurrencies.length ===
    0
  ) {
    return [
      BASE_CURRENCY,
    ];
  }

  if (
    !uniqueCurrencies.includes(
      BASE_CURRENCY
    )
  ) {
    return [
      BASE_CURRENCY,
      ...uniqueCurrencies,
    ];
  }

  return uniqueCurrencies;
}

function isValidRate(
  value: unknown
): value is number {
  return (
    typeof value ===
      "number" &&
    Number.isFinite(value) &&
    value > 0
  );
}

function normaliseRates(
  incomingRates:
    | Partial<
        Record<
          CurrencyCode,
          number
        >
      >
    | undefined
): ExchangeRates {
  const normalisedRates:
    ExchangeRates = {
    ...FALLBACK_RATES,
    INR: 1,
  };

  if (!incomingRates) {
    return normalisedRates;
  }

  ALL_CURRENCIES.forEach(
    (
      currencyCode
    ) => {
      if (
        currencyCode ===
        BASE_CURRENCY
      ) {
        normalisedRates[
          currencyCode
        ] = 1;

        return;
      }

      const incomingRate =
        incomingRates[
          currencyCode
        ];

      if (
        isValidRate(
          incomingRate
        )
      ) {
        normalisedRates[
          currencyCode
        ] = incomingRate;
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
      ) as Partial<
        CachedExchangeRates
      >;

    if (
      !parsedValue.rates ||
      typeof parsedValue
        .cachedAt !==
        "string"
    ) {
      return null;
    }

    return {
      rates:
        normaliseRates(
          parsedValue.rates
        ),

      updatedAt:
        typeof parsedValue
          .updatedAt ===
        "string"
          ? parsedValue
              .updatedAt
          : null,

      cachedAt:
        parsedValue.cachedAt,
    };
  } catch (
    error: unknown
  ) {
    console.error(
      "Failed to read cached exchange rates:",
      error
    );

    return null;
  }
}

function saveCachedRates(
  rates: ExchangeRates,
  updatedAt:
    string | null
): void {
  try {
    const payload:
      CachedExchangeRates = {
      rates,
      updatedAt,
      cachedAt:
        new Date()
          .toISOString(),
    };

    window.localStorage.setItem(
      RATES_STORAGE_KEY,
      JSON.stringify(
        payload
      )
    );
  } catch (
    error: unknown
  ) {
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
  ] =
    useState<CurrencyCode>(
      BASE_CURRENCY
    );

  const [
    supportedCurrencies,
    setSupportedCurrencies,
  ] =
    useState<
      CurrencyCode[]
    >([
      ...ALL_CURRENCIES,
    ]);

  const [
    rates,
    setRates,
  ] =
    useState<ExchangeRates>(
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
  ] = useState<
    string | null
  >(null);

  const refreshRates =
    useCallback(
      async (): Promise<void> => {
        setRatesLoading(
          true
        );

        setRatesError("");

        try {
          const response =
            await fetch(
              "/api/exchange-rates",
              {
                method:
                  "GET",

                cache:
                  "no-store",

                headers: {
                  Accept:
                    "application/json",
                },
              }
            );

          const result =
            (await response
              .json()) as
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
            result.base
              .toUpperCase() !==
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
            typeof result
              .updatedAt ===
            "string"
              ? result
                  .updatedAt
              : new Date()
                  .toISOString();

          setRates(
            nextRates
          );

          setRatesUpdatedAt(
            updatedAt
          );

          saveCachedRates(
            nextRates,
            updatedAt
          );
        } catch (
          error: unknown
        ) {
          console.error(
            "Failed to refresh exchange rates:",
            error
          );

          setRatesError(
            error instanceof
              Error
              ? error.message
              : "Unable to load live exchange rates."
          );
        } finally {
          setRatesLoading(
            false
          );
        }
      },
      []
    );

  useEffect(() => {
    let active = true;

    async function initialiseCurrency():
      Promise<void> {
      const savedCurrency =
        window.localStorage
          .getItem(
            CURRENCY_STORAGE_KEY
          );

      const cachedRates =
        readCachedRates();

      if (
        cachedRates &&
        active
      ) {
        setRates(
          cachedRates.rates
        );

        setRatesUpdatedAt(
          cachedRates.updatedAt
        );
      }

      let nextSupportedCurrencies =
        [
          ...ALL_CURRENCIES,
        ];

      let autoUpdateExchangeRates =
        true;

      try {
        const {
          data,
          error,
        } = await supabase
          .from(
            "settings"
          )
          .select(
            `
              supported_currencies,
              auto_update_exchange_rates
            `
          )
          .eq(
            "setting_key",
            "store"
          )
          .maybeSingle();

        if (error) {
          throw error;
        }

        const row =
          data as
            | CurrencySettingsRow
            | null;

        if (row) {
          nextSupportedCurrencies =
            normaliseSupportedCurrencies(
              row
                .supported_currencies
            );

          autoUpdateExchangeRates =
            row
              .auto_update_exchange_rates !==
            false;
        }
      } catch (
        error: unknown
      ) {
        console.error(
          "Failed to load currency settings:",
          error
        );
      }

      if (!active) {
        return;
      }

      setSupportedCurrencies(
        nextSupportedCurrencies
      );

      const savedCurrencyCode =
        savedCurrency &&
        isCurrencyCode(
          savedCurrency
        )
          ? savedCurrency
          : null;

      const nextCurrency =
        savedCurrencyCode &&
        nextSupportedCurrencies
          .includes(
            savedCurrencyCode
          )
          ? savedCurrencyCode
          : nextSupportedCurrencies[
              0
            ] ??
            BASE_CURRENCY;

      setCurrencyState(
        nextCurrency
      );

      window.localStorage.setItem(
        CURRENCY_STORAGE_KEY,
        nextCurrency
      );

      setMounted(true);

      if (
        autoUpdateExchangeRates
      ) {
        await refreshRates();

        return;
      }

      setRatesLoading(
        false
      );
    }

    void initialiseCurrency();

    return () => {
      active = false;
    };
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
          ) ||
          !supportedCurrencies
            .includes(
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
      [
        supportedCurrencies,
      ]
    );

  const exchangeRate =
    rates[
      currency
    ] ?? 1;

  const formatCurrency =
    useCallback(
      (
        amount: number
      ): string => {
        const numericAmount =
          Number(
            amount
          );

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
          displayCurrency ===
          "INR"
            ? 0
            : 2;

        return new Intl.NumberFormat(
          CURRENCY_LOCALES[
            displayCurrency
          ],
          {
            style:
              "currency",

            currency:
              displayCurrency,

            minimumFractionDigits:
              0,

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
    useMemo<
      CurrencyContextType
    >(
      () => ({
        currency,
        setCurrency,
        exchangeRate,
        formatCurrency,
        formatPrice,
        supportedCurrencies,
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
        supportedCurrencies,
        ratesLoading,
        ratesError,
        ratesUpdatedAt,
        refreshRates,
      ]
    );

  return (
    <CurrencyContext.Provider
      value={
        value
      }
    >
      {
        children
      }
    </CurrencyContext.Provider>
  );
}

export function useCurrency():
  CurrencyContextType {
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