import type { Money } from "./types";

export function formatMoney(m: Money): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: m.currency,
  }).format(m.amount);
}

export function sumMoney(items: Money[]): Money {
  const amount = items.reduce((sum, item) => sum + item.amount, 0);
  return { amount, currency: "USD" };
}
