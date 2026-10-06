import { defineConfig, devices } from '@playwright/test';

/**
 * Every round writes into its own folder so the aggregator can build a
 * "test case x round" matrix (see scripts/run-rounds.mjs). A plain
 * `npx playwright test` writes to test-output/local.
 */
const roundDir = process.env.ROUND_DIR ?? 'test-output/local';

export default defineConfig({
  testDir: './tests',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  // Test cases are independent, but they run one at a time to be gentle on
  // the shared demo site and to keep per-case durations comparable.
  fullyParallel: false,
  workers: 1,
  // Rounds exist to measure real stability, so failures are never retried.
  retries: 0,
  forbidOnly: !!process.env.CI,
  reporter: [
    [process.env.CI ? 'line' : 'list'],
    ['json', { outputFile: `${roundDir}/results.json` }],
    ['html', { outputFolder: `${roundDir}/report`, open: 'never' }],
  ],
  outputDir: `${roundDir}/artifacts`,
  use: {
    baseURL: process.env.BASE_URL ?? 'https://practicesoftwaretesting.com',
    testIdAttribute: 'data-test',
    locale: 'en-US',
    timezoneId: 'Asia/Taipei',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
