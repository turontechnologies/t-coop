"use client";

import { createContext, useContext, type ReactNode } from "react";

const CurrencyContext = createContext<string>("NGN");

interface CurrencyProviderProps {
  /** The co-operative's currency to apply to everything rendered underneath. */
  currency: string;
  children: ReactNode;
}

/**
 * Makes "the active co-op's currency" available to every descendant via
 * `useCurrency()`, so pages/tables/modals don't need it threaded through
 * props at every level — they just call `formatMoney(amount, useCurrency())`.
 * Nest a narrower `<CurrencyProvider>` around a specific co-op's subtree
 * (e.g. `/co-operatives/[id]/**`) to override an outer default.
 */
export function CurrencyProvider({
  currency,
  children,
}: CurrencyProviderProps) {
  return (
    <CurrencyContext.Provider value={currency}>
      {children}
    </CurrencyContext.Provider>
  );
}

/** The current co-op's currency code — "NGN" if no provider is in scope. */
export function useCurrency(): string {
  return useContext(CurrencyContext);
}
