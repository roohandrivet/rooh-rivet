"use client";

import {
  ChevronDown,
  Loader2,
  RefreshCw,
} from "lucide-react";

import {
  useCurrency,
  type CurrencyCode,
} from "@/context/CurrencyContext";

type CurrencyOption = {
  code: CurrencyCode;
  label: string;
};

const CURRENCY_OPTIONS: CurrencyOption[] = [
  {
    code: "INR",
    label: "₹ INR",
  },
  {
    code: "USD",
    label: "$ USD",
  },
  {
    code: "EUR",
    label: "€ EUR",
  },
  {
    code: "GBP",
    label: "£ GBP",
  },
  {
    code: "AUD",
    label: "A$ AUD",
  },
  {
    code: "CAD",
    label: "C$ CAD",
  },
];

function formatUpdatedAt(
  value: string | null
): string | null {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function isCurrencyCode(
  value: string
): value is CurrencyCode {
  return CURRENCY_OPTIONS.some(
    (option) => option.code === value
  );
}

export default function CurrencySelector() {
  const {
    currency,
    setCurrency,
    supportedCurrencies,
    ratesLoading,
    ratesError,
    ratesUpdatedAt,
    refreshRates,
  } = useCurrency();

  const updatedLabel = formatUpdatedAt(
    ratesUpdatedAt
  );

  function handleCurrencyChange(
    value: string
  ) {
    if (!isCurrencyCode(value)) {
      return;
    }

    setCurrency(value);
  }

  return (
    <div className="flex items-center gap-2">
      <div className="relative min-w-[118px]">
        <label
          htmlFor="currency-selector"
          className="sr-only"
        >
          Select display currency
        </label>

        <select
          id="currency-selector"
          value={currency}
          onChange={(event) =>
            handleCurrencyChange(
              event.target.value
            )
          }
          title={
            updatedLabel
              ? `Exchange rates updated ${updatedLabel}`
              : "Select display currency"
          }
          aria-label="Select display currency"
          className="w-full cursor-pointer appearance-none rounded-full border border-[#D8C3B0] bg-[#F8F4EF] py-2.5 pl-4 pr-10 text-sm font-semibold text-[#5A2D2D] outline-none transition hover:border-[#8B6B5B] focus:border-[#5A2D2D] focus:ring-2 focus:ring-[#5A2D2D]/10"
        >
          {CURRENCY_OPTIONS.map(
            (option) => (
              <option
                key={option.code}
                value={option.code}
              >
                {option.label}
              </option>
            )
          )}
        </select>

        <ChevronDown
          size={15}
          aria-hidden="true"
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#8B6B5B]"
        />
      </div>

      {ratesLoading ? (
        <span
          title="Updating exchange rates"
          aria-label="Updating exchange rates"
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[#8B6B5B]"
        >
          <Loader2
            size={16}
            className="animate-spin"
          />
        </span>
      ) : ratesError ? (
        <button
          type="button"
          onClick={() => {
            void refreshRates();
          }}
          title={`${ratesError} Click to retry.`}
          aria-label="Retry loading exchange rates"
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-amber-300 bg-amber-50 text-amber-700 transition hover:bg-amber-100"
        >
          <RefreshCw size={16} />
        </button>
      ) : supportedCurrencies.length ===
        0 ? (
        <button
          type="button"
          onClick={() => {
            void refreshRates();
          }}
          title="Refresh exchange rates"
          aria-label="Refresh exchange rates"
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#D8C3B0] bg-[#F8F4EF] text-[#8B6B5B] transition hover:border-[#8B6B5B] hover:text-[#5A2D2D]"
        >
          <RefreshCw size={16} />
        </button>
      ) : null}
    </div>
  );
}