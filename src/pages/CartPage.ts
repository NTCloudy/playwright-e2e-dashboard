import { expect, type Locator, type Page } from '@playwright/test';
import { expectMoney, parseMoney, toast } from '../support/ui';

/** Shopping cart, i.e. step 1 of the checkout wizard (/checkout). */
export class CartPage {
  readonly rows: Locator;
  readonly cartTotal: Locator;
  readonly emptyMessage: Locator;
  readonly proceedToCheckout: Locator;

  constructor(private readonly page: Page) {
    this.rows = page.locator('tr').filter({ has: page.getByTestId('product-title') });
    this.cartTotal = page.getByTestId('cart-total');
    this.emptyMessage = page.getByText('The cart is empty. Nothing to display.');
    this.proceedToCheckout = page.getByTestId('proceed-1');
  }

  /** Row whose title matches exactly; the title has a trailing &nbsp; that text matching trims. */
  row(productName: string): Locator {
    return this.rows.filter({ has: this.page.getByTestId('product-title').getByText(productName, { exact: true }) });
  }

  quantityInput(productName: string): Locator {
    return this.row(productName).getByTestId('product-quantity');
  }

  async verifyLoaded(): Promise<void> {
    await expect(this.page).toHaveURL(/\/checkout$/);
    await expect(this.proceedToCheckout.or(this.emptyMessage)).toBeVisible();
  }

  async unitPrice(productName: string): Promise<number> {
    return parseMoney(await this.row(productName).getByTestId('product-price').innerText());
  }

  /** Verifies quantity, line total (unit x qty) and cart total for a single-item cart. */
  async verifyLine(productName: string, quantity: number, unitPrice: number): Promise<void> {
    await expect(this.row(productName)).toHaveCount(1);
    await expect(this.quantityInput(productName)).toHaveValue(String(quantity));
    expect(await this.unitPrice(productName), 'unit price in cart').toBeCloseTo(unitPrice, 2);
    await expectMoney(this.row(productName).getByTestId('line-price'), unitPrice * quantity, 'line total');
    await expectMoney(this.cartTotal, unitPrice * quantity, 'cart total');
  }

  /** Types a new quantity; the app saves it when the field loses focus. */
  async setQuantity(productName: string, quantity: number): Promise<void> {
    await this.typeQuantity(productName, quantity);
    await expect(toast(this.page, 'Product quantity updated.')).toBeVisible();
  }

  /** Like setQuantity, but without waiting for a toast: the caller checks the outcome (see quantityAndTotal). */
  async typeQuantity(productName: string, quantity: number): Promise<void> {
    const input = this.quantityInput(productName);
    await input.fill(String(quantity));
    await input.press('Tab');
  }

  /** The quantity in the row and the cart total (two decimals), read together so one poll can compare both. */
  async quantityAndTotal(productName: string): Promise<{ quantity: number; total: string }> {
    return {
      quantity: Number(await this.quantityInput(productName).inputValue()),
      total: parseMoney(await this.cartTotal.innerText()).toFixed(2),
    };
  }

  async remove(productName: string): Promise<void> {
    // The delete button has no data-test attribute; it is the red "x" in the row.
    await this.row(productName).locator('.btn-danger').click();
    await expect(toast(this.page, 'Product deleted.')).toBeVisible();
  }

  async proceed(): Promise<void> {
    await expect(this.proceedToCheckout).toBeEnabled();
    await this.proceedToCheckout.click();
  }
}
