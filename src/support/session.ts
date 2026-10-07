import { expect, type Page } from '@playwright/test';
import { API_URL, type TestUser } from '../api/toolshopApi';
import { currentTarget, type Target } from './target';

/** Where the Toolshop web app keeps the sign-in token. */
const TOKEN_KEY = 'auth-token';
/** Production keeps the token in localStorage; the with-bugs release keeps it in sessionStorage. */
const TOKEN_STORAGE: Record<Target, 'localStorage' | 'sessionStorage'> = {
  production: 'localStorage',
  'with-bugs': 'sessionStorage',
};

/** Browser-side sign-in state of the Toolshop web app. */
export class Session {
  private readonly storage = TOKEN_STORAGE[currentTarget()];

  constructor(private readonly page: Page) {}

  /**
   * Signs in without the sign-in form, for cases where signing in is only a precondition
   * (TC09 covers the form). The token from the REST API is stored where the web app looks for it
   * before the next page load. It is seeded once per tab, so a sign-out (which reloads the page)
   * really ends the session.
   */
  async signInViaApi(user: TestUser): Promise<void> {
    const response = await this.page.request.post(`${API_URL}/users/login`, {
      data: { email: user.email, password: user.password },
    });
    expect(response.status(), 'POST /users/login').toBe(200);
    const { access_token: token } = (await response.json()) as { access_token: string };

    await this.page.addInitScript(
      ({ key, token, storage }) => {
        if (window !== window.top || sessionStorage.getItem('e2e-session-seeded')) return;
        window[storage].setItem(key, token);
        sessionStorage.setItem('e2e-session-seeded', 'true');
      },
      { key: TOKEN_KEY, token, storage: this.storage },
    );
  }

  /** The token the web app currently keeps, or null when signed out. */
  async storedToken(): Promise<string | null> {
    return this.page.evaluate(({ key, storage }) => window[storage].getItem(key), { key: TOKEN_KEY, storage: this.storage });
  }
}
