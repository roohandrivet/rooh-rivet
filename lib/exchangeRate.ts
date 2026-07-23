import { unstable_cache } from "next/cache";

type ExchangeRatesResponse = {
  base: string;
  rates: Record<string, number>;
};

const FALLBACK_RATES: Record<string, number> = {
  INR: 1,
  USD: 0.012,
  EUR: 0.011,
  GBP: 0.0095,
  AED: 0.044,
};

async function fetchExchangeRates(): Promise<Record<string, number>> {
  const apiKey = process.env.EXCHANGE_RATE_API_KEY;

  if (!apiKey) {
    return FALLBACK_RATES;
  }

  try {
    const response = await fetch(
      `https://v6.exchangerate-api.com/v6/${apiKey}/latest/INR`,
      {
        next: {
          revalidate: 3600,
        },
      }
    );

    if (!response.ok) {
      return FALLBACK_RATES;
    }

    const data =
      (await response.json()) as ExchangeRatesResponse;

    return {
      INR: 1,
      ...data.rates,
    };
  } catch {
    return FALLBACK_RATES;
  }
}

export const getExchangeRates = unstable_cache(
  async () => fetchExchangeRates(),
  ["exchange-rates"],
  {
    revalidate: 3600,
  }
);

export async function getExchangeRate(
  currency: string
): Promise<number> {
  const rates = await getExchangeRates();

  return rates[currency] ?? 1;
}

export async function convertCurrency(
  amount: number,
  targetCurrency: string
): Promise<number> {
  const rate = await getExchangeRate(targetCurrency);

  return Number((amount * rate).toFixed(2));
}