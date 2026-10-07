import { test as base, expect } from '@playwright/test';
import { API_URL, registerTestUser, type TestUser } from './api/toolshopApi';
import { AccountPage, LoginPage } from './pages/AuthPages';
import { CartPage } from './pages/CartPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { HomePage } from './pages/HomePage';
import { NavBar } from './pages/NavBar';
import { ProductPage } from './pages/ProductPage';
import { BotCheck } from './support/botCheck';
import { Session } from './support/session';
import { TestData } from './support/testData';

type PageFixtures = {
  home: HomePage;
  nav: NavBar;
  productPage: ProductPage;
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
  /** Test data of the current case (config/cases.json + per-run overrides), recorded as an annotation. */
  data: TestData;
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
      if (user.source === 'demo') {
        // Last resort: anyone can change or lock the shared demo account, so make its use visible in the log too.
        console.warn(`[test account] Registration failed, using the public demo account ${user.email}: ${user.note}`);
      }
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
          : `Fallback to public demo account (last resort): ${registeredUser.note}`,
    });
    await use(registeredUser);
  },

  data: async ({}, use, testInfo) => {
    const data = TestData.forTest(testInfo.title);
    testInfo.annotations.push({ type: 'test data', description: data.describe() });
    await use(data);
  },

  home: async ({ page }, use) => use(new HomePage(page)),
  nav: async ({ page }, use) => use(new NavBar(page)),
  productPage: async ({ page }, use) => use(new ProductPage(page)),
  loginPage: async ({ page }, use) => use(new LoginPage(page)),
  accountPage: async ({ page }, use) => use(new AccountPage(page)),
  cartPage: async ({ page }, use) => use(new CartPage(page)),
  checkoutPage: async ({ page }, use) => use(new CheckoutPage(page)),
  session: async ({ page }, use) => use(new Session(page)),
  botCheck: async ({ page }, use) => use(new BotCheck(page)),
});

export { expect };

/**
 * Soft assertions that can poll: `await softExpect.poll(() => value, { message }).toEqual(expected)` records
 * a failure and lets the test go on, like expect.soft (whose `.poll` the Playwright lint rules reject).
 */
export const softExpect = expect.configure({ soft: true });
