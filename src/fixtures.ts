import { test as base, expect } from '@playwright/test';
import { API_URL, registerTestUser, type TestUser } from './api/toolshopApi';
import { AccountPage, LoginPage } from './pages/AuthPages';
import { CartPage } from './pages/CartPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { HomePage } from './pages/HomePage';
import { NavBar } from './pages/NavBar';
import { BotCheck } from './support/botCheck';
import { Session } from './support/session';

type PageFixtures = {
  home: HomePage;
  nav: NavBar;
  loginPage: LoginPage;
  accountPage: AccountPage;
  cartPage: CartPage;
  checkoutPage: CheckoutPage;
  /** Sign-in state in the browser (API sign-in for preconditions, stored token). */
  session: Session;
  /** Skips the case instead of failing it when Cloudflare challenges a page load. */
  botCheck: BotCheck;
  /** Test account for the current round; the source is recorded as an annotation. */
  user: TestUser;
};

type WorkerFixtures = {
  registeredUser: TestUser;
};

export const test = base.extend<PageFixtures, WorkerFixtures>({
  // One fresh account per worker. Each round is a separate process with one worker.
  registeredUser: [
    async ({ playwright }, use) => {
      const api = await playwright.request.newContext({ baseURL: API_URL });
      const user = await registerTestUser(api).finally(() => api.dispose());
      await use(user);
    },
    { scope: 'worker' },
  ],

  user: async ({ registeredUser }, use, testInfo) => {
    testInfo.annotations.push({
      type: 'test account',
      description:
        registeredUser.source === 'registered'
          ? `Fresh account registered via API for this round (${registeredUser.email})`
          : `Fallback to public demo account: ${registeredUser.note}`,
    });
    await use(registeredUser);
  },

  home: async ({ page }, use) => use(new HomePage(page)),
  nav: async ({ page }, use) => use(new NavBar(page)),
  loginPage: async ({ page }, use) => use(new LoginPage(page)),
  accountPage: async ({ page }, use) => use(new AccountPage(page)),
  cartPage: async ({ page }, use) => use(new CartPage(page)),
  checkoutPage: async ({ page }, use) => use(new CheckoutPage(page)),
  session: async ({ page }, use) => use(new Session(page)),
  botCheck: async ({ page }, use) => use(new BotCheck(page)),
});

export { expect };
