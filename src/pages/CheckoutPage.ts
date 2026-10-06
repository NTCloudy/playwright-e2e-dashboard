import { expect, type Locator, type Page } from '@playwright/test';

/**
 * Checkout wizard steps 2-4 (sign in, billing address, payment).
 * Payment always uses "Cash on Delivery": no card data is ever entered.
 */
export class CheckoutPage {
  readonly signInEmail: Locator;
  readonly signInPassword: Locator;
  readonly signInSubmit: Locator;
  readonly proceedAfterSignIn: Locator;
  readonly addressFields: Record<'country' | 'postalCode' | 'houseNumber' | 'street' | 'city' | 'state', Locator>;
  readonly proceedAfterAddress: Locator;
  readonly paymentMethod: Locator;
  readonly finish: Locator;
  readonly paymentSuccess: Locator;
  readonly orderConfirmation: Locator;

  constructor(private readonly page: Page) {
    this.signInEmail = page.getByTestId('email');
    this.signInPassword = page.getByTestId('password');
    this.signInSubmit = page.getByTestId('login-submit');
    this.proceedAfterSignIn = page.getByTestId('proceed-2');
    this.addressFields = {
      country: page.getByTestId('country'),
      postalCode: page.getByTestId('postal_code'),
      houseNumber: page.getByTestId('house_number'),
      street: page.getByTestId('street'),
      city: page.getByTestId('city'),
      state: page.getByTestId('state'),
    };
    this.proceedAfterAddress = page.getByTestId('proceed-3');
    this.paymentMethod = page.getByTestId('payment-method');
    this.finish = page.getByTestId('finish');
    this.paymentSuccess = page.getByTestId('payment-success-message');
    this.orderConfirmation = page.getByText(/Thanks for your order! Your invoice number is INV-\d+/);
  }

  /** Step 2: sign in with the inline form, then continue. */
  async signIn(email: string, password: string): Promise<void> {
    await expect(this.signInEmail).toBeVisible();
    await this.signInEmail.fill(email);
    await this.signInPassword.fill(password);
    await this.signInSubmit.click();
    await expect(this.proceedAfterSignIn).toBeVisible();
    await this.proceedAfterSignIn.click();
  }

  /** Step 3: the address is prefilled from the profile; verify it, then continue. */
  async confirmBillingAddress(): Promise<void> {
    for (const [field, locator] of Object.entries(this.addressFields)) {
      await expect(locator, `billing address field "${field}" should be prefilled`).not.toHaveValue('');
    }
    await expect(this.proceedAfterAddress).toBeEnabled();
    await this.proceedAfterAddress.click();
  }

  /** Step 4: pay with Cash on Delivery and confirm the order. Returns the invoice number. */
  async payCashOnDeliveryAndConfirm(): Promise<string> {
    await expect(this.paymentMethod).toBeVisible();
    await this.paymentMethod.selectOption('cash-on-delivery');
    await expect(this.paymentMethod).toHaveValue('cash-on-delivery');

    await expect(this.finish).toHaveText('Check payment');
    await this.finish.click();
    await expect(this.paymentSuccess).toHaveText('Payment was successful');

    await expect(this.finish).toHaveText('Confirm');
    await this.finish.click();
    await expect(this.orderConfirmation).toBeVisible();
    const text = await this.orderConfirmation.innerText();
    return /INV-\d+/.exec(text)![0];
  }
}
