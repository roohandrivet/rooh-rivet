export type CurrencyCode =
  | "INR"
  | "USD"
  | "EUR"
  | "GBP"
  | "AUD"
  | "CAD";

export type ExchangeRates = Record<
  CurrencyCode,
  number
>;

export const SUPPORTED_CURRENCIES: readonly CurrencyCode[] = [
  "INR",
  "USD",
  "EUR",
  "GBP",
  "AUD",
  "CAD",
];

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

export function isCurrencyCode(
  value: string
): value is CurrencyCode {
  return SUPPORTED_CURRENCIES.includes(
    value as CurrencyCode
  );
}

function toSafeAmount(
  amount: number
): number {
  const numericAmount =
    Number(amount);

  return Number.isFinite(
    numericAmount
  )
    ? numericAmount
    : 0;
}

function toSafeExchangeRate(
  exchangeRate: number
): number {
  const numericRate =
    Number(exchangeRate);

  return (
    Number.isFinite(
      numericRate
    ) &&
    numericRate > 0
  )
    ? numericRate
    : 1;
}

export function convertCurrency(
  amount: number,
  exchangeRate: number
): number {
  const convertedAmount =
    toSafeAmount(amount) *
    toSafeExchangeRate(
      exchangeRate
    );

  return Number(
    convertedAmount.toFixed(2)
  );
}

export function formatCurrency(
  amount: number,
  currency: CurrencyCode,
  exchangeRate: number
): string {
  const convertedAmount =
    convertCurrency(
      amount,
      exchangeRate
    );

  const maximumFractionDigits =
    currency === "INR"
      ? 0
      : 2;

  return new Intl.NumberFormat(
    CURRENCY_LOCALES[currency],
    {
      style: "currency",
      currency,
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
}