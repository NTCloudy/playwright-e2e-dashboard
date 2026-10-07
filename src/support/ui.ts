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

/**
 * The `src` of every image inside `scope` that is not really shown: hidden with CSS, still loading,
 * or broken (loaded without an image, i.e. no intrinsic width). Poll it, as images may still be loading.
 */
export async function imagesNotShown(scope: Locator): Promise<string[]> {
  return scope
    .locator('img')
    .evaluateAll((images) =>
      (images as HTMLImageElement[])
        .filter((image) => !image.checkVisibility() || !image.complete || image.naturalWidth === 0)
        .map((image) => image.getAttribute('src') ?? '(no src)'),
    );
}

/**
 * The text of every element that `locator` matches, white space collapsed and trimmed, e.g. ["Home", "Contact"].
 * Poll it to compare a list of labels: toHaveText also ignores white space, but its diff would list every
 * label whose raw text has extra spaces, not only the wrong ones.
 */
export async function labelsOf(locator: Locator): Promise<string[]> {
  return (await locator.allTextContents()).map((text) => text.replace(/\s+/g, ' ').trim());
}

const nameCollator = new Intl.Collator('en', { sensitivity: 'base' });

/** True when the values are in order. Names are compared case-insensitively, like the site sorts them. */
export function isSorted(values: readonly number[] | readonly string[], direction: 'asc' | 'desc'): boolean {
  const compare = (a: number | string, b: number | string): number =>
    typeof a === 'number' && typeof b === 'number' ? a - b : nameCollator.compare(String(a), String(b));
  return values.every((v, i) => i === 0 || (direction === 'asc' ? compare(values[i - 1], v) <= 0 : compare(values[i - 1], v) >= 0));
}
