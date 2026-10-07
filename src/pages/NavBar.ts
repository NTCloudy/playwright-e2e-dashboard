import { expect, type Locator, type Page } from '@playwright/test';

/** "Hand Tools" -> "hand-tools", as used in the category URL and the menu's data-test ids. */
export function categorySlug(name: string): string {
  return name.toLowerCase().replace(/\s+/g, '-');
}

/** Top navigation bar, shared by every page. */
export class NavBar {
  /** The Toolshop logo (top left), a link to the home page. */
  readonly brand: Locator;
  readonly home: Locator;
  readonly categories: Locator;
  readonly contact: Locator;
  /** "Home", "Categories" and "Contact", in that order. */
  readonly links: Locator;
  readonly signIn: Locator;
  readonly userMenu: Locator;
  readonly signOut: Locator;
  readonly cart: Locator;
  readonly cartQuantity: Locator;

  constructor(private readonly page: Page) {
    this.brand = page.locator('a.navbar-brand');
    this.home = page.getByTestId('nav-home');
    this.categories = page.getByTestId('nav-categories');
    this.contact = page.getByTestId('nav-contact');
    this.links = page.getByTestId(/^nav-(home|categories|contact)$/);
    this.signIn = page.getByTestId('nav-sign-in');
    // The with-bugs release names the user menu "nav-user-menu"; production only has "nav-menu".
    this.userMenu = page.getByTestId('nav-menu').or(page.getByTestId('nav-user-menu'));
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
    const link = this.page.getByTestId(`nav-${categorySlug(name)}`);
    await expect(link).toBeVisible();
    await link.click();
  }

  async openSignIn(): Promise<void> {
    await this.signIn.click();
  }

  async openCart(): Promise<void> {
    await this.cart.click();
  }

  /** Signing out reloads the page; this waits until the reloaded page has loaded. */
  async signOutViaMenu(): Promise<void> {
    await this.userMenu.click();
    await expect(this.signOut).toBeVisible();
    await Promise.all([this.page.waitForEvent('load'), this.signOut.click()]);
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
