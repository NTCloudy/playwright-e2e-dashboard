# Playwright E2E Dashboard

[![E2E tests](https://github.com/NTCloudy/playwright-e2e-dashboard/actions/workflows/e2e.yml/badge.svg)](https://github.com/NTCloudy/playwright-e2e-dashboard/actions/workflows/e2e.yml)

English | [繁體中文](README.zh-TW.md)

End-to-end test automation for a demo e-commerce site, written with **Playwright + TypeScript**.
Each execution runs the whole suite **N times ("rounds")** on GitHub Actions, and every result of
every round is published to a **public, bilingual dashboard**.

**Live dashboard: https://ntcloudy.github.io/playwright-e2e-dashboard/**

![Dashboard](docs/dashboard.png)

## Highlights

- **16 test cases**: search, navigation, account, cart, and a full checkout
- **Page Object Model**; selectors only use the site's `data-test` attributes
- **No retries**: running N rounds measures real stability, and flaky cases are flagged
- **Independent tests**: fresh browser context per test, and a fresh account registered through the API for every round
- **Safe checkout**: "Cash on Delivery" only; no card data is ever entered
- **Honest about bot checks**: if the site's Cloudflare bot check challenges the CI runner, the case is
  skipped with the reason and labeled "Blocked"; tests never try to get past it
- **Results website**: history of the latest 30 runs, a test case × round matrix, failure
  screenshots, and full Playwright HTML reports (steps, video, trace)
- **Bilingual UI** (繁體中文 / English), plain HTML/CSS/JS with zero dependencies

## Test cases

| ID | Module | Case | What it checks |
|---|---|---|---|
| TC01 | Home | Home page loads | Navigation, search, sorting and filters are usable; products with prices are listed |
| TC02 | Home | Return to the home page from a product page | After clicking "Home", the product grid and filters are shown again |
| TC03 | Home | Browse a category | Categories → Hand Tools shows the category title and its products |
| TC04 | Search | Search by keyword | "hammer": the count matches the caption and every name contains the keyword |
| TC05 | Search | Find a specific product | "Claw Hammer" is in the results with a price |
| TC06 | Search | Search with no results | "There are no products found." and an empty grid |
| TC07 | Search | Sort by price (low to high) | Prices are in ascending order |
| TC08 | Search | Product details match the search result | Name and price match the list; quantity and "Add to cart" are usable |
| TC09 | Account | Sign in with a valid account | "My account" is shown and the navigation bar shows the user name |
| TC10 | Account | Sign in with an unknown account is rejected | "Invalid email or password"; the user stays signed out |
| TC11 | Cart | Add a product to the cart | Success message; the cart badge shows 1 |
| TC12 | Cart | Increase quantity in the cart | Quantity 3: line total = unit price × 3; cart total and badge are updated |
| TC13 | Cart | Decrease quantity in the cart | Quantity 3 → 1: totals go back to the unit price |
| TC14 | Cart | Remove products from the cart | Removing one of two products recalculates the total; removing the last empties the cart |
| TC15 | Account | Sign out | Signed in through the API; after signing out, "Sign in" is back and the stored token is cleared |
| TC16 | Checkout | Complete checkout (Cash on Delivery) | Cart → sign in → billing address → payment → order created with an invoice number |

TC10 uses an address that does not exist: repeating wrong passwords for a real account
over many rounds could lock it.

## How it works

```mermaid
flowchart LR
    O["Owner: Run workflow, choose N"] --> A["GitHub Actions: N rounds of Playwright"]
    S["Weekly schedule (Mon 09:00 UTC+8)"] -.-> A
    A -->|HTTPS| T["practicesoftwaretesting.com"]
    A -->|"summary.json, HTML reports, screenshots"| R["results branch (latest 30 runs)"]
    R --> P["GitHub Pages dashboard"]
    V["Anyone"] -->|public link| P
```

1. `scripts/run-rounds.mjs` runs `playwright test` N times; each round writes its own JSON and HTML report.
2. `scripts/aggregate.mjs` merges the rounds into `summary.json` (case × round matrix, pass rates,
   failure screenshots) and writes a Markdown summary to the Actions job page.
3. `scripts/publish.mjs` adds the run to the history on the `results` branch and prunes runs beyond 30.
4. `scripts/build-site.mjs` combines `dashboard/` with the history, and the site is deployed to GitHub Pages.
5. A final "Verdict" job fails the workflow when any test failed, so the badge above stays honest.

## Run it

**On GitHub** (repository owner): Actions → **E2E tests** → **Run workflow** → choose 1–10 rounds.
A 3-round run also starts automatically every Monday at 09:00 Taiwan time.

**Locally** (Node.js 20+):

```bash
npm ci
npx playwright install chromium

npm test                        # one run; HTML report: npm run report
npm run rounds -- 3             # 3 rounds into test-output/run (max 10)
npm run aggregate               # -> test-output/run/summary.json

# Preview the dashboard with the local run
npm run site && npm run serve   # then open http://localhost:8080
```

## Project structure

```text
├── .github/workflows/e2e.yml   # CI: N rounds, publish, deploy, verdict
├── playwright.config.ts        # one worker, no retries, artifacts on failure
├── tests/                      # 16 test cases, one file per module
├── src/
│   ├── pages/                  # Page Objects (Home, Product, Cart, Checkout, Auth, NavBar)
│   ├── api/toolshopApi.ts      # registers a fresh test account per round
│   ├── fixtures.ts             # injects page objects and the test account
│   └── support/                # bot-check handling, API sign-in, price/toast/sort helpers
├── scripts/                    # run-rounds, aggregate, publish, build-site, serve
└── dashboard/                  # static results website (zh-TW / EN)
```

## Notes

- The target is [Practice Software Testing](https://practicesoftwaretesting.com), a public demo
  site built for practicing test automation. Tests run one at a time to be gentle on it.
- The site is behind Cloudflare. From GitHub-hosted runners (cloud IP addresses), Cloudflare can answer
  some full page loads with a "Performing security verification" challenge, for example the page load
  of `/account` right after signing in (TC09). Tests never try to get past it: the case is skipped with
  the reason and shown as **Blocked** on the dashboard. From a regular network it runs normally (`npm test`).
- GitHub pauses scheduled workflows in public repositories after 60 days without activity;
  re-enable it from the Actions tab.
- Forking: enable GitHub Pages with "GitHub Actions" as the source, then run the workflow once.
  The `results` branch is created automatically.

## License

[MIT](LICENSE)
