import { expect, type Locator, type Page, type Response } from '@playwright/test';

/** Address returned by the site's postcode lookup (GET /postcode-lookup). */
interface PostcodeLookup {
  street: string;
  city: string;
  state: string;
}

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
  readonly postcodeLookupLoading: Locator;
  readonly postcodeLookupError: Locator;
  readonly proceedAfterAddress: Locator;
  readonly paymentMethod: Locator;
  readonly finish: Locator;
  readonly paymentSuccess: Locator;
  readonly orderConfirmation: Locator;
  private postcodeLookup?: PostcodeLookup;
  private orderResponse?: { status: number; body: string };

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
    this.postcodeLookupLoading = page.getByTestId('postcode-lookup-loading');
    this.postcodeLookupError = page.getByTestId('postcode-lookup-error');
    this.proceedAfterAddress = page.getByTestId('proceed-3');
    this.paymentMethod = page.getByTestId('payment-method');
    this.finish = page.getByTestId('finish');
    this.paymentSuccess = page.getByTestId('payment-success-message');
    this.orderConfirmation = page.getByText(/Thanks for your order! Your invoice number is INV-\d+/);
    page.on('response', (response) => void this.record(response));
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

  /**
   * Step 3: the address is prefilled from the profile, then the postcode lookup (debounced by the
   * app) replaces street, city and state. The order is validated against that same lookup, so
   * continuing before it has finished makes the order fail (HTTP 422). Wait for it, then continue.
   */
  async confirmBillingAddress(): Promise<void> {
    await expect.poll(() => this.postcodeLookup, { message: 'the postcode lookup should complete' }).toBeDefined();
    await expect(this.postcodeLookupLoading).toBeHidden();
    await expect(this.postcodeLookupError).toBeHidden();
    await expect(this.addressFields.city).toHaveValue(this.postcodeLookup!.city);
    await expect(this.addressFields.state).toHaveValue(this.postcodeLookup!.state);
    for (const [field, locator] of Object.entries(this.addressFields)) {
      await expect(locator, `billing address field "${field}" should be filled in`).not.toHaveValue('');
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
    // Report the API's answer if the order is rejected, instead of only "confirmation not shown".
    await expect.poll(() => this.orderResponse, { message: 'the order should be submitted (POST /invoices)' }).toBeDefined();
    const order = this.orderResponse!;
    expect(order.status, `POST /invoices answered: ${order.body.slice(0, 300)}`).toBe(201);
    await expect(this.orderConfirmation).toBeVisible();
    const text = await this.orderConfirmation.innerText();
    return /INV-\d+/.exec(text)![0];
  }

  private async record(response: Response): Promise<void> {
    try {
      const method = response.request().method();
      const { pathname } = new URL(response.url());
      if (method === 'GET' && pathname === '/postcode-lookup' && response.ok()) {
        this.postcodeLookup = (await response.json()) as PostcodeLookup;
      } else if (method === 'POST' && pathname === '/invoices') {
        this.orderResponse = { status: response.status(), body: await response.text() };
      }
    } catch {
      // The page can close before a body is read; the assertions above report what is missing.
    }
  }
}
