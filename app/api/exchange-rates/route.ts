import { NextResponse } from "next/server";

type CurrencyCode =
  | "INR"
  | "USD"
  | "EUR"
  | "GBP"
  | "AUD"
  | "CAD";

type FrankfurterRate = {
  date: string;
  base: string;
  quote: string;
  rate: number;
};

type ExchangeRates = Record<CurrencyCode, number>;

const BASE_CURRENCY: CurrencyCode = "INR";

const TARGET_CURRENCIES: Exclude<
  CurrencyCode,
  "INR"
>[] = [
  "USD",
  "EUR",
  "GBP",
  "AUD",
  "CAD",
];

const CACHE_SECONDS = 60 * 60 * 6;

const FALLBACK_RATES: ExchangeRates = {
  INR: 1,
  USD: 0.012,
  EUR: 0.011,
  GBP: 0.0095,
  AUD: 0.018,
  CAD: 0.016,
};

export const revalidate = 21600;

function isFrankfurterRate(
  value: unknown
): value is FrankfurterRate {
  if (
    typeof value !== "object" ||
    value === null
  ) {
    return false;
  }

  const record =
    value as Record<string, unknown>;

  return (
    typeof record.date === "string" &&
    typeof record.base === "string" &&
    typeof record.quote === "string" &&
    typeof record.rate === "number" &&
    Number.isFinite(record.rate) &&
    record.rate > 0
  );
}

function createRates(
  rows: FrankfurterRate[]
): ExchangeRates {
  const rates: ExchangeRates = {
    ...FALLBACK_RATES,
    INR: 1,
  };

  for (const row of rows) {
    const quote =
      row.quote.toUpperCase();

    if (
      TARGET_CURRENCIES.includes(
        quote as Exclude<
          CurrencyCode,
          "INR"
        >
      )
    ) {
      rates[
        quote as Exclude<
          CurrencyCode,
          "INR"
        >
      ] = row.rate;
    }
  }

  return rates;
}

export async function GET() {
  try {
    const targetCurrencies =
      TARGET_CURRENCIES.join(",");

    const url =
      new URL(
        "https://api.frankfurter.dev/v2/rates"
      );

    url.searchParams.set(
      "base",
      BASE_CURRENCY
    );

    url.searchParams.set(
      "quotes",
      targetCurrencies
    );

    const response =
      await fetch(
        url.toString(),
        {
          method: "GET",
          headers: {
            Accept:
              "application/json",
          },
          next: {
            revalidate:
              CACHE_SECONDS,
          },
        }
      );

    if (!response.ok) {
      throw new Error(
        `Exchange-rate provider returned ${response.status}.`
      );
    }

    const payload =
      (await response.json()) as unknown;

    if (!Array.isArray(payload)) {
      throw new Error(
        "Exchange-rate provider returned an invalid response."
      );
    }

    const rows =
      payload.filter(
        isFrankfurterRate
      );

    if (
      rows.length === 0
    ) {
      throw new Error(
        "No exchange rates were returned."
      );
    }

    const rates =
      createRates(rows);

    const latestDate =
      rows
        .map(
          (row) => row.date
        )
        .sort()
        .at(-1) ??
      new Date().toISOString();

    return NextResponse.json(
      {
        success: true,
        base:
          BASE_CURRENCY,
        rates,
        updatedAt:
          latestDate,
        source:
          "Frankfurter",
      },
      {
        status: 200,
        headers: {
          "Cache-Control":
            `public, s-maxage=${CACHE_SECONDS}, stale-while-revalidate=${CACHE_SECONDS}`,
        },
      }
    );
  } catch (error) {
    console.error(
      "Exchange-rate route error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        base:
          BASE_CURRENCY,
        rates:
          FALLBACK_RATES,
        updatedAt: null,
        message:
          error instanceof Error
            ? error.message
            : "Unable to load exchange rates.",
      },
      {
        status: 503,
        headers: {
          "Cache-Control":
            "no-store",
        },
      }
    );
  }
}