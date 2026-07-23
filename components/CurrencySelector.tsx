"use client";

import { useCurrency } from "@/context/CurrencyContext";

const currencies = [
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

export default function CurrencySelector() {
  const {
    currency,
    setCurrency,
  } = useCurrency();

  return (
    <div className="relative">
      <select
        value={currency}
        onChange={(event) =>
          setCurrency(event.target.value)
        }
        className="
          appearance-none
          bg-[#F8F4EF]
          border
          border-[#D8C3B0]
          text-[#5A2D2D]
          text-sm
          font-medium
          rounded-full
          px-4
          py-2
          pr-8
          cursor-pointer
          outline-none
          hover:border-[#8B6B5B]
          transition-colors
        "
      >
        {currencies.map((item) => (
          <option
            key={item.code}
            value={item.code}
          >
            {item.label}
          </option>
        ))}
      </select>

      <span
        className="
          pointer-events-none
          absolute
          right-3
          top-1/2
          -translate-y-1/2
          text-[#8B6B5B]
          text-xs
        "
      >
        ▾
      </span>
    </div>
  );
}