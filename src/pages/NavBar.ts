import { expect, type Locator, type Page } from '@playwright/test';

/** Top navigation bar, shared by every page. */
export class NavBar {
  readonly home: Locator;
  readonly categories: Locator;
  readonly contact: Locator;
  readonly signIn: Locator;
  readonly userMenu: Locator;
  readonly signOut: Locator;
  readonly cart: Locator;
  readonly cartQuantity: Locator;

  constructor(private readonly page: Page) {
    this.home = page.getByTestId('nav-home');
    this.categories = page.getByTestId('nav-categories');
    this.contact = page.getByTestId('nav-contact');
    this.signIn = page.getByTestId('nav-sign-in');
    this.userMenu = page.getByTestId('nav-menu');
    this.signOut = page.getByTestId('nav-sign-out');
    this.cart = page.getByTestId('nav-cart');
    this.cartQuantity = page.getByTestId('cart-quantity');
  }

  async verifyLinks(): Promise<void> {
    for (const link of [this.home, this.categories, this.contact]) {
      await expect(link).toBeVisible();
    }
  }

  async goHome(): Promise<void> {
    await this.home.click();
  }

  /** Opens the "Categories" dropdown and clicks the given category. */
  async openCategory(name: string): Promise<void> {
    await this.categories.click();
    const link = this.page.getByTestId(`nav-${name.toLowerCase().replace(/\s+/g, '-')}`);
    await expect(link).toBeVisible();
    await link.click();
  }

  async openSignIn(): Promise<void> {
    await this.signIn.click();
  }

  async openCart(): Promise<void> {
    await this.cart.click();
  }

  async signOutViaMenu(): Promise<void> {
    await this.userMenu.click();
    await expect(this.signOut).toBeVisible();
    await this.signOut.click();
  }

  async verifySignedInAs(fullName: string): Promise<void> {
    await expect(this.userMenu).toHaveText(fullName);
    await expect(this.signIn).toHaveCount(0);
  }

  async verifySignedOut(): Promise<void> {
    await expect(this.signIn).toBeVisible();
    await expect(this.userMenu).toHaveCount(0);
  }

  async verifyCartQuantity(quantity: number): Promise<void> {
    await expect(this.cartQuantity).toHaveText(String(quantity));
  }
}
