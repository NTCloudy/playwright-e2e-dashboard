import { expect, type Locator, type Page } from '@playwright/test';
import { parseMoney, toast } from '../support/ui';

/**
 * The name heading of eco-friendly products also holds an "ECO" badge
 * (text " Wood Saw  ECO"), so the name is matched exactly with an optional badge.
 */
function nameHeading(name: string): RegExp {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`^\\s*${escaped}\\s*(ECO\\s*)?$`);
}

/** Product detail page (/product/:id). */
export class ProductPage {
  readonly name: Locator;
  readonly unitPrice: Locator;
  readonly quantity: Locator;
  readonly increaseQuantity: Locator;
  readonly decreaseQuantity: Locator;
  readonly addToCartButton: Locator;

  constructor(private readonly page: Page) {
    this.name = page.getByTestId('product-name');
    this.unitPrice = page.getByTestId('unit-price');
    this.quantity = page.getByTestId('quantity');
    this.increaseQuantity = page.getByTestId('increase-quantity');
    this.decreaseQuantity = page.getByTestId('decrease-quantity');
    this.addToCartButton = page.getByTestId('add-to-cart');
  }

  /** Verifies the product name and price. Out-of-stock products have no usable purchase controls. */
  async verifyDetails(expectedName?: string): Promise<void> {
    await expect(this.page).toHaveURL(/\/product\/[0-9A-Za-z]+$/);
    if (expectedName) await expect(this.name).toHaveText(nameHeading(expectedName));
    else await expect(this.name).not.toBeEmpty();
    await expect(this.unitPrice).toHaveText(/^\d+\.\d{2}$/);
  }

  /** Verifies the page skeleton and that the purchase controls are usable. */
  async verifyLoaded(expectedName?: string): Promise<void> {
    await this.verifyDetails(expectedName);
    await expect(this.quantity).toHaveValue('1');
    for (const control of [this.increaseQuantity, this.decreaseQuantity, this.addToCartButton]) {
      await expect(control).toBeEnabled();
    }
  }

  async getUnitPrice(): Promise<number> {
    return parseMoney(await this.unitPrice.innerText());
  }

  async increaseQuantityTo(quantity: number): Promise<void> {
    const current = Number(await this.quantity.inputValue());
    for (let q = current; q < quantity; q++) await this.increaseQuantity.click();
    await expect(this.quantity).toHaveValue(String(quantity));
  }

  async addToCart(): Promise<void> {
    await this.addToCartButton.click();
    await expect(toast(this.page, 'Product added to shopping cart.')).toBeVisible();
  }
}
