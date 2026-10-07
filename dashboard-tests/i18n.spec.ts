import { expect, test } from './fixtures/test';
import { RUNS } from './fixtures/results';
import { STORAGE_KEYS } from './fixtures/storage';
import { deployedText, filledDescription } from './fixtures/site';

test.describe('Language switch and routing', () => {
  test('switches between Traditional Chinese and English while keeping the console draft', async ({
    consolePage,
    home,
    runPage,
    page,
  }) => {
    await consolePage.goto({ caseId: 'TC04' });
    await expect(consolePage.caseBody('TC04')).toBeVisible();
    await consolePage.selectOnly(['TC04', 'TC12']);
    await consolePage.setRounds(2);
    await consolePage.setParam('TC04', 'keyword', 'pliers');

    await consolePage.switchLanguage('en');

    await expect(page).toHaveURL(/\?lang=en#\/console\/TC04$/);
    await expect(consolePage.languageButton('en')).toHaveAttribute('aria-pressed', 'true');
    await expect(consolePage.heading).toHaveText('Run tests');
    await expect(consolePage.caseName('TC04')).toHaveText(deployedText('TC04', 'title', 'en'));
    await expect(consolePage.description('TC04')).toHaveText(filledDescription('TC04', 'en', { keyword: 'pliers' }));
    await expect(consolePage.caseCheckbox('TC12')).toBeChecked();
    await expect(consolePage.rounds).toHaveValue('2');
    await expect(consolePage.param('TC04', 'keyword')).toHaveValue('pliers');
    await expect.poll(() => page.evaluate((key) => localStorage.getItem(key), STORAGE_KEYS.language)).toBe('en');

    await home.open('/');
    await expect(home.heading).toHaveText('E2E Test Automation Dashboard');
    await expect(home.kpi('Latest pass rate')).toContainText('100%');

    await runPage.open(`/run/${RUNS.mixed}`);
    await expect(runPage.heading).toHaveText('Run #3 Manual production');
    await expect(runPage.scoreDetails).toHaveText('Passed 8 · Failed 1 · Skipped 3');

    await runPage.switchLanguage('zh-TW');
    await expect(runPage.heading).toHaveText('執行 #3 手動 production');
  });
});
