import { expect, type Locator, type Page } from '@playwright/test';

/** Parses prices such as "$1,234.56" or "11.48" into a number. */
export function parseMoney(text: string): number {
  const value = Number(text.replace(/[^0-9.]/g, ''));
  if (!text.trim() || Number.isNaN(value)) {
    throw new Error(`Cannot parse a price from "${text}"`);
  }
  return value;
}

/** Waits until the price shown by `locator` equals `expected` (to the cent). */
export async function expectMoney(locator: Locator, expected: number, label: string): Promise<void> {
  await expect
    .poll(async () => parseMoney(await locator.innerText()), { message: `${label} should be ${expected.toFixed(2)}` })
    .toBeCloseTo(expected, 2);
}

/** Toast notification (ngx-toastr) with the exact message text. */
export function toast(page: Page, message: string): Locator {
  return page.locator('#toast-container').getByText(message, { exact: true }).first();
}

const nameCollator = new Intl.Collator('en', { sensitivity: 'base' });

/** True when the values are in order. Names are compared case-insensitively, like the site sorts them. */
export function isSorted(values: readonly number[] | readonly string[], direction: 'asc' | 'desc'): boolean {
  const compare = (a: number | string, b: number | string): number =>
    typeof a === 'number' && typeof b === 'number' ? a - b : nameCollator.compare(String(a), String(b));
  return values.every((v, i) => i === 0 || (direction === 'asc' ? compare(values[i - 1], v) <= 0 : compare(values[i - 1], v) >= 0));
}
