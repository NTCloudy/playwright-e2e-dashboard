import { expect, test } from './fixtures/test';
import { OWNER_TOKEN } from './fixtures/github-mock';
import { STORAGE_KEYS, type Draft } from './fixtures/storage';
import { applicableCaseCount, catalogCase, deployedText, estimateMinutes, filledDescription, moduleCases, siteCatalog, type Target } from './fixtures/site';

const NEEDS_TOKEN = '按「執行」時會請你設定 GitHub token';
const caseCount = () => siteCatalog().cases.length;
const defaultCaseCount = () => applicableCaseCount('production');
/** The selection part of the run bar, e.g. "2 / 19 條案例 × 1 輪 · 約 3 分鐘 · 網站：production". */
const selectionText = (cases: number, rounds: number, target: Target = 'production') =>
  `${cases} / ${applicableCaseCount(target)} 條案例 × ${rounds} 輪 · 約 ${estimateMinutes(cases, rounds)} 分鐘 · 網站：${target}`;

test.describe('Test console', () => {
  test('lists every catalog case by module with its title, description and test data', async ({ consolePage }) => {
    await consolePage.goto();

    await expect(consolePage.heading).toHaveText('執行測試');
    await expect(consolePage.caseItems).toHaveCount(caseCount());
    await expect(consolePage.moduleNames()).toHaveText(['首頁', '搜尋', '會員', '購物車', '結帳', '聯絡我們']);
    await expect(consolePage.caseName('TC04')).toHaveText(deployedText('TC04', 'title', 'zh-TW'));
    await expect(consolePage.caseBody('TC04')).toBeHidden();

    await consolePage.expand('TC04');
    await expect(consolePage.expandButton('TC04')).toHaveAttribute('aria-expanded', 'true');
    await expect(consolePage.description('TC04')).toHaveText(filledDescription('TC04', 'zh-TW'));
    await expect(consolePage.param('TC04', 'keyword')).toHaveValue('hammer');
    await expect(consolePage.caseBody('TC04')).toContainText('預設：hammer · 要能搜尋到商品的字詞');
    const { file, line } = catalogCase('TC04');
    await expect(consolePage.caseBody('TC04').getByRole('link', { name: '在 GitHub 查看這條案例的程式碼 ↗' })).toHaveAttribute(
      'href',
      `https://github.com/NTCloudy/playwright-e2e-dashboard/blob/main/${file}#L${line}`,
    );

    await consolePage.expand('TC01');
    await expect(consolePage.caseBody('TC01')).toContainText('這條案例沒有可以調整的測試資料。');
  });

  test('shows the latest titles and descriptions from GitHub instead of the deployed ones', async ({ consolePage, github }) => {
    github.editDescriptions((docs) => {
      docs.TC01.title['zh-TW'] = '首頁正常載入（GitHub 最新）';
      docs.TC04.description['zh-TW'] = '搜尋「{keyword}」→ 每筆結果都含「{keyword}」';
    });
    await consolePage.goto();
    await consolePage.expand('TC04');

    await expect(consolePage.caseName('TC01')).toHaveText('首頁正常載入（GitHub 最新）');
    await expect(consolePage.description('TC04')).toHaveText('搜尋「hammer」→ 每筆結果都含「hammer」');
    // Without a token, the public file is read anonymously.
    expect(github.lastCall('getFile')).toMatchObject({ token: null, query: { ref: 'main' } });
  });

  test('reads the latest descriptions anonymously when the token may not read them', async ({ consolePage, github, storage }) => {
    github.account(OWNER_TOKEN).contents = 'none';
    github.editDescriptions((docs) => {
      docs.TC01.title['zh-TW'] = '首頁正常載入（GitHub 最新）';
    });
    await storage.signIn();
    await consolePage.goto();

    await expect(consolePage.caseName('TC01')).toHaveText('首頁正常載入（GitHub 最新）');
    expect(github.calls('getFile').map((call) => call.token)).toEqual([OWNER_TOKEN, null]);
  });

  test('keeps the deployed descriptions when GitHub refuses to answer', async ({ consolePage, github, page }) => {
    github.editDescriptions((docs) => {
      docs.TC01.title['zh-TW'] = '首頁正常載入（GitHub 最新）';
    });
    github.failNext('getFile', 403, 'API rate limit exceeded for 203.0.113.7.');
    const refused = page.waitForResponse((response) => response.url().includes('/contents/config/descriptions.json'));
    await consolePage.goto();
    expect((await refused).status()).toBe(403);

    await expect(consolePage.caseName('TC01')).toHaveText(deployedText('TC01', 'title', 'zh-TW'));
    await expect(consolePage.runButton).toBeEnabled();
  });

  test('summarizes the selection in the run bar and blocks the run without any case', async ({ consolePage }) => {
    await consolePage.goto();

    await expect(consolePage.summary).toHaveText(`${selectionText(defaultCaseCount(), 3)} · ${NEEDS_TOKEN}`);
    await expect(consolePage.runButton).toBeEnabled();

    await consolePage.selectNoneButton.click();
    await expect(consolePage.summary.locator('.ko')).toHaveText('請至少勾選一條測試案例');
    await expect(consolePage.runButton).toBeDisabled();

    await consolePage.caseCheckbox('TC04').check();
    await consolePage.caseCheckbox('TC12').check();
    await consolePage.setRounds(1);
    await expect(consolePage.summary).toHaveText(`${selectionText(2, 1)} · ${NEEDS_TOKEN}`);
    await expect(consolePage.runButton).toBeEnabled();

    await consolePage.selectAllButton.click();
    await expect(consolePage.root.locator('input[data-act="toggle-case"]:checked')).toHaveCount(defaultCaseCount());
  });

  test('disables with-bugs-only cases on production and enables them when switched to with-bugs', async ({ consolePage }) => {
    await consolePage.goto();

    await expect(consolePage.target).toHaveValue('production');
    await expect(consolePage.targetOnlyTag('TC19')).toHaveText('僅 with-bugs');
    await expect(consolePage.caseCheckbox('TC19')).toBeDisabled();
    await expect(consolePage.caseCheckbox('TC19')).not.toBeChecked();
    await expect(consolePage.moduleCount('Contact')).toHaveText('已選 0 / 0');

    await consolePage.setTarget('with-bugs');

    await expect(consolePage.targetNote).toContainText('官方預先埋了 94 個已知問題');
    await expect(consolePage.caseCheckbox('TC19')).toBeEnabled();
    await expect(consolePage.caseCheckbox('TC19')).toBeChecked();
    await expect(consolePage.moduleCount('Contact')).toHaveText('已選 1 / 1');
    await expect(consolePage.summary).toHaveText(`${selectionText(applicableCaseCount('with-bugs'), 3, 'with-bugs')} · ${NEEDS_TOKEN}`);
  });

  test('shows a partly selected module as indeterminate and toggles a whole module at once', async ({ consolePage }) => {
    const search = moduleCases('Search');
    await consolePage.goto();
    await consolePage.selectOnly(['TC04']);

    await expect(consolePage.moduleCheckbox('Search')).toHaveJSProperty('indeterminate', true);
    await expect(consolePage.moduleCheckbox('Search')).not.toBeChecked();
    await expect(consolePage.moduleCount('Search')).toHaveText(`已選 1 / ${search.length}`);
    await expect(consolePage.moduleCheckbox('Home')).toHaveJSProperty('indeterminate', false);
    await expect(consolePage.moduleCount('Home')).toHaveText(`已選 0 / ${moduleCases('Home').length}`);

    await consolePage.moduleCheckbox('Search').click();
    await expect(consolePage.moduleCheckbox('Search')).toBeChecked();
    await expect(consolePage.moduleCheckbox('Search')).toHaveJSProperty('indeterminate', false);
    await expect(consolePage.moduleCount('Search')).toHaveText(`已選 ${search.length} / ${search.length}`);
    await expect(consolePage.summary).toHaveText(`${selectionText(search.length, 3)} · ${NEEDS_TOKEN}`);

    await consolePage.moduleCheckbox('Search').click();
    await expect(consolePage.moduleCount('Search')).toHaveText(`已選 0 / ${search.length}`);
    await expect(consolePage.summary.locator('.ko')).toHaveText('請至少勾選一條測試案例');
  });

  test('updates the description, custom tag and run bar while test data is typed', async ({ consolePage, storage }) => {
    await storage.signIn();
    await consolePage.goto();
    await consolePage.expand('TC04');
    await expect(consolePage.summary).toHaveText(selectionText(defaultCaseCount(), 3));
    await expect(consolePage.customTag('TC04')).toBeHidden();
    await expect(consolePage.resetParamButton('TC04', 'keyword')).toBeHidden();

    await consolePage.setParam('TC04', 'keyword', 'pliers');

    await expect(consolePage.description('TC04')).toHaveText(filledDescription('TC04', 'zh-TW', { keyword: 'pliers' }));
    await expect(consolePage.description('TC04').locator('strong.param-value').first()).toHaveText('pliers');
    await expect(consolePage.customTag('TC04')).toHaveText('自訂');
    await expect(consolePage.customTag('TC04')).toBeVisible();
    await expect(consolePage.resetParamButton('TC04', 'keyword')).toBeVisible();
    await expect(consolePage.summary).toHaveText(`${selectionText(defaultCaseCount(), 3)} · 1 條用了自訂測試資料`);
  });

  test('restores the defaults of one field, one case or every case', async ({ consolePage }) => {
    await consolePage.goto();
    await consolePage.expand('TC04');
    await consolePage.expand('TC12');
    await consolePage.setParam('TC04', 'keyword', 'pliers');
    await consolePage.setParam('TC12', 'product', 'Pliers');
    await consolePage.setParam('TC12', 'quantity', '5');
    await expect(consolePage.summary).toContainText('2 條用了自訂測試資料');

    await consolePage.resetParamButton('TC04', 'keyword').click();
    await expect(consolePage.param('TC04', 'keyword')).toHaveValue('hammer');
    await expect(consolePage.customTag('TC04')).toBeHidden();

    await consolePage.resetCaseButton('TC12').click();
    await expect(consolePage.param('TC12', 'product')).toHaveValue('Claw Hammer');
    await expect(consolePage.param('TC12', 'quantity')).toHaveValue('3');
    await expect(consolePage.customTag('TC12')).toBeHidden();

    await consolePage.setParam('TC04', 'keyword', 'saw');
    await consolePage.setParam('TC12', 'quantity', '4');
    await consolePage.resetAllButton.click();
    await expect(consolePage.param('TC04', 'keyword')).toHaveValue('hammer');
    await expect(consolePage.param('TC12', 'quantity')).toHaveValue('3');
    await expect(consolePage.root.locator('[data-custom-tag]:visible')).toHaveCount(0);
    await expect(consolePage.summary).toHaveText(`${selectionText(defaultCaseCount(), 3)} · ${NEEDS_TOKEN}`);
  });

  test('fixes the letter case of known product names and only warns about unknown ones', async ({ consolePage }) => {
    await consolePage.goto();
    await consolePage.expand('TC05');

    await consolePage.enterParam('TC05', 'product', '  claw   HAMMER ');
    await expect(consolePage.param('TC05', 'product')).toHaveValue('Claw Hammer');
    await expect(consolePage.customTag('TC05')).toBeHidden();
    await expect(consolePage.paramWarning('TC05', 'product')).toBeHidden();

    await consolePage.enterParam('TC05', 'product', 'Hammerx');
    await expect(consolePage.paramWarning('TC05', 'product')).toHaveText('網站上沒有這個名稱的商品，請確認拼字（仍然可以執行）');
    await expect(consolePage.customTag('TC05')).toBeVisible();
    await expect(consolePage.errorTag('TC05')).toBeHidden();
    await expect(consolePage.runButton).toBeEnabled();
  });

  test('remembers the selection, rounds and test data after a reload', async ({ consolePage, storage, page }) => {
    await consolePage.goto();
    await consolePage.selectOnly(['TC04', 'TC05']);
    await consolePage.setRounds(2);
    await consolePage.expand('TC04');
    await consolePage.setParam('TC04', 'keyword', 'pliers');
    await expect
      .poll(() => storage.read<Draft>('local', STORAGE_KEYS.draft))
      .toEqual({ rounds: 2, target: 'production', selected: ['TC04', 'TC05'], values: { TC04: { keyword: 'pliers' } } });

    await page.reload();

    await expect(consolePage.caseCheckbox('TC04')).toBeChecked();
    await expect(consolePage.caseCheckbox('TC05')).toBeChecked();
    await expect(consolePage.root.locator('input[data-act="toggle-case"]:checked')).toHaveCount(2);
    await expect(consolePage.rounds).toHaveValue('2');
    await expect(consolePage.customTag('TC04')).toBeVisible();
    await consolePage.expand('TC04');
    await expect(consolePage.param('TC04', 'keyword')).toHaveValue('pliers');
    await expect(consolePage.summary).toHaveText(`${selectionText(2, 2)} · 1 條用了自訂測試資料 · ${NEEDS_TOKEN}`);
  });

  test('drops remembered choices that are no longer valid', async ({ consolePage, storage }) => {
    await storage.rememberDraft({ rounds: 42, selected: ['TC04', 'TC99'], values: { TC04: { keyword: '<b>hammer</b>' }, TC02: { position: 4 } } });
    await consolePage.goto();

    await expect(consolePage.rounds).toHaveValue('3');
    await expect(consolePage.root.locator('input[data-act="toggle-case"]:checked')).toHaveCount(1);
    await expect(consolePage.caseCheckbox('TC04')).toBeChecked();
    await expect(consolePage.customTag('TC04')).toBeHidden();
    await expect(consolePage.customTag('TC02')).toBeVisible();
    await consolePage.expand('TC02');
    await expect(consolePage.param('TC02', 'position')).toHaveValue('4');
  });
});

/** Invalid test data: the edits to make, the field that gets the error, the message, and an edit that fixes it. */
const INVALID_DATA: { name: string; caseId: string; edits: [string, string][]; field: string; error: string; fix: [string, string] }[] = [
  {
    name: 'characters that no product name has',
    caseId: 'TC04',
    edits: [['keyword', '<script>']],
    field: 'keyword',
    error: "只能用文字、數字、空白和 . , ' & ( ) / + -",
    fix: ['keyword', 'pliers'],
  },
  { name: 'an empty keyword', caseId: 'TC04', edits: [['keyword', '   ']], field: 'keyword', error: '不能空白', fix: ['keyword', 'saw'] },
  { name: 'a number above the maximum', caseId: 'TC02', edits: [['position', '12']], field: 'position', error: '不能大於 9', fix: ['position', '9'] },
  { name: 'a number below the minimum', caseId: 'TC02', edits: [['position', '0']], field: 'position', error: '不能小於 1', fix: ['position', '1'] },
  { name: 'a decimal number', caseId: 'TC02', edits: [['position', '2.5']], field: 'position', error: '請輸入整數', fix: ['position', '2'] },
  {
    name: 'a new quantity that is not below the starting quantity',
    caseId: 'TC13',
    edits: [['to', '3']],
    field: 'to',
    error: '要小於「原本的數量」',
    fix: ['to', '2'],
  },
  {
    name: 'the same product twice',
    caseId: 'TC14',
    edits: [['second', 'claw hammer']],
    field: 'second',
    error: '不能和「第一個商品」相同',
    fix: ['second', 'Pliers'],
  },
  {
    name: 'two units of a product the site sells only once per cart',
    caseId: 'TC11',
    edits: [
      ['product', 'Thor Hammer'],
      ['quantity', '2'],
    ],
    field: 'product',
    error: '網站限制這個商品一個購物車只能放 1 個：請換一個商品，或把「數量」改成 1',
    fix: ['quantity', '1'],
  },
];

test.describe('Test data validation', () => {
  for (const { name, caseId, edits, field, error, fix } of INVALID_DATA) {
    test(`rejects ${name} and blocks the run until it is fixed`, async ({ consolePage }) => {
      await consolePage.goto();
      await consolePage.expand(caseId);
      for (const [key, value] of edits) await consolePage.setParam(caseId, key, value);

      await expect(consolePage.paramError(caseId, field)).toHaveText(error);
      await expect(consolePage.param(caseId, field)).toHaveAttribute('aria-invalid', 'true');
      await expect(consolePage.errorTag(caseId)).toHaveText('需修正');
      await expect(consolePage.errorTag(caseId)).toBeVisible();
      await expect(consolePage.summary.locator('.ko')).toHaveText('有 1 個欄位需要修正');
      await expect(consolePage.runButton).toBeDisabled();

      await consolePage.setParam(caseId, ...fix);

      await expect(consolePage.paramError(caseId, field)).toBeHidden();
      await expect(consolePage.param(caseId, field)).toHaveAttribute('aria-invalid', 'false');
      await expect(consolePage.errorTag(caseId)).toBeHidden();
      await expect(consolePage.runButton).toBeEnabled();
    });
  }
});
