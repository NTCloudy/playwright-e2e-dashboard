import { expect, type Locator, type Page } from '@playwright/test';

/** Sign-in page (/auth/login). */
export class LoginPage {
  readonly form: Locator;
  readonly email: Locator;
  readonly password: Locator;
  readonly submit: Locator;
  readonly error: Locator;

  constructor(private readonly page: Page) {
    this.form = page.getByTestId('login-form');
    this.email = page.getByTestId('email');
    this.password = page.getByTestId('password');
    this.submit = page.getByTestId('login-submit');
    this.error = page.getByTestId('login-error');
  }

  async verifyLoaded(): Promise<void> {
    await expect(this.page).toHaveURL(/\/auth\/login$/);
    await expect(this.form).toBeVisible();
    await expect(this.email).toBeEditable();
    await expect(this.password).toBeEditable();
    await expect(this.submit).toBeEnabled();
  }

  async login(email: string, password: string): Promise<void> {
    await this.email.fill(email);
    await this.password.fill(password);
    await this.submit.click();
  }
}

/** Customer account overview (/account). */
export class AccountPage {
  readonly title: Locator;

  constructor(private readonly page: Page) {
    this.title = page.getByTestId('page-title');
  }

  async verifyLoaded(): Promise<void> {
    await expect(this.page).toHaveURL(/\/account$/);
    await expect(this.title).toHaveText('My account');
  }
}
