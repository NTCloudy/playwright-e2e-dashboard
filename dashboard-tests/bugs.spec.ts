import { expect, test } from './fixtures/test';
import { FIXED_NOW } from './fixtures/clock';
import { publishedRun } from './fixtures/results';
import { applicableCases, siteCatalog } from './fixtures/site';

test.describe('Bug detection page and with-bugs runs', () => {
  test('lists known bugs, unlisted findings and out-of-scope categories even before a with-bugs run is published', async ({ bugsPage }) => {
    const knownBugs = siteCatalog().knownBugs;
    await bugsPage.goto();

    await expect(bugsPage.heading).toHaveText('Bug 偵測報告（with-bugs 版本）');
    await expect(bugsPage.emptyState.getByRole('heading')).toHaveText('還沒有 with-bugs 版本的完整執行紀錄');
    await expect(bugsPage.bugTables.first().locator('tbody tr')).toHaveCount(knownBugs?.bugs.length ?? 0);
    await expect(bugsPage.bugRow('#43')).toContainText('TC11');
    await expect(bugsPage.bugRow('search-no-results-message')).toContainText('TC06');
    await expect(bugsPage.scopeItems).toHaveCount(6);
  });

  test('classifies caught bugs, blocked cases and unlisted findings on the Bug page and the with-bugs run page', async ({
    bugsPage,
    runPage,
    siteData,
  }) => {
    const cases = applicableCases('with-bugs').map((c) => ({
      id: c.id,
      statuses: [c.id === 'TC11' || c.id === 'TC12' || c.id === 'TC06' ? ('failed' as const) : ('passed' as const)],
      errors:
        c.id === 'TC11'
          ? ["Error: expect(locator).toBeVisible() failed\nLocator: getByText('Product added to shopping cart.')\nTimeout: 10000ms"]
          : c.id === 'TC12'
            ? ["Error: expect(locator).toBeVisible() failed\nLocator: getByText('Product added to shopping cart.')\nTimeout: 10000ms"]
            : c.id === 'TC06'
              ? ["Error: expect(locator).toBeVisible() failed\nLocator: getByTestId('no-results')"]
              : undefined,
    }));
    const run = publishedRun({
      id: '21000000007',
      runNumber: 7,
      startedAt: FIXED_NOW,
      target: 'with-bugs',
      cases,
    });
    await siteData.publish(run);

    await bugsPage.goto();
    await expect(bugsPage.verdict).toBeVisible();
    await expect(bugsPage.bugRow('#43').locator('.pill-caught')).toHaveText('✓ 已抓到');
    await expect(bugsPage.bugRow('search-no-results-message').locator('.pill-caught')).toHaveText('✓ 已抓到');
    await expect(bugsPage.caseRow('TC11').locator('.pill-caught')).toHaveText('抓到 #43');
    await expect(bugsPage.caseRow('TC12').locator('.pill-blocked')).toHaveText('被 #43 阻擋');

    await runPage.goto(run.entry.id);
    await expect(runPage.heading).toHaveText('執行 #7 手動 with-bugs');
    await expect(runPage.main.locator('.bug-note')).toContainText('抓到 2 個已知問題 · 1 條案例被前置問題阻擋 · 0 條未歸類');
    await expect(runPage.caseRow('TC11').locator('.bug-badge-caught')).toHaveText('抓到 #43');
    await expect(runPage.caseRow('TC12').locator('.bug-badge-blocked')).toHaveText('被 #43 阻擋');

    await runPage.openCell('TC11', 1);
    await expect(runPage.detail.root.locator('.bug-detail')).toContainText('#43');
  });
});
