import { expect, test, type Locator, type Page, type Response } from '@playwright/test';

export const BOT_CHECK_SKIP_REASON =
  "Blocked by the site's Cloudflare bot check (common for cloud/CI IP addresses). " +
  'Not a product failure: the case runs normally from a regular network.';

/**
 * The demo site is behind Cloudflare. For traffic from cloud and CI IP ranges, Cloudflare can answer
 * a full page load with a "Performing security verification" challenge instead of the page.
 *
 * Tests never try to get past that check. When a page that a test waits for is replaced by the
 * challenge, the case is skipped with a clear reason instead of being reported as a product failure.
 * Everything else still fails normally: only a confirmed challenge leads to a skip.
 */
export class BotCheck {
  private readonly challengedUrls: string[] = [];
  private readonly challengeHeading: Locator;

  constructor(page: Page) {
    this.challengeHeading = page.getByRole('heading', { name: 'Performing security verification' });
    page.on('response', (response) => this.record(response));
  }

  /** Waits for `ready` to be visible; skips the test if a Cloudflare challenge was shown instead. */
  async waitFor(ready: Locator): Promise<void> {
    try {
      await expect(ready).toBeVisible();
    } catch (error) {
      if (this.challengedUrls.length > 0 || (await this.challengeHeading.isVisible())) {
        test.info().annotations.push({
          type: 'blocked',
          description: `Cloudflare challenge instead of ${this.challengedUrls.join(', ') || 'the page'}`,
        });
        test.skip(true, BOT_CHECK_SKIP_REASON);
      }
      throw error;
    }
  }

  private record(response: Response): void {
    // Cloudflare marks challenge responses with this header:
    // https://developers.cloudflare.com/cloudflare-challenges/challenge-types/challenge-pages/detect-response/
    if (response.request().isNavigationRequest() && response.headers()['cf-mitigated'] === 'challenge') {
      this.challengedUrls.push(response.url());
    }
  }
}
