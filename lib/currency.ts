export type CurrencyCode =
  | "INR"
  | "USD"
  | "GBP"
  | "EUR"
  | "AED";

export const exchangeRates: Record<
  CurrencyCode,
  number
> = {
  INR: 1,
  USD: 0.012,
  GBP: 0.0095,
  EUR: 0.011,
  AED: 0.044,
};

export function convertCurrency(
  amount: number,
  currency: CurrencyCode
) {
  return amount * exchangeRates[currency];
}

export function formatCurrency(
  amount: number,
  currency: CurrencyCode
) {
  const convertedAmount =
    convertCurrency(
      amount,
      currency
    );

  return new Intl.NumberFormat(
    "en",
    {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }
  ).format(convertedAmount);
}