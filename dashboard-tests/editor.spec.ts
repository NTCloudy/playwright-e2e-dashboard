import { expect, test } from './fixtures/test';
import { OWNER, OWNER_TOKEN, serializeDescriptions } from './fixtures/github-mock';
import { deployedText } from './fixtures/site';

test.describe('Description editor', () => {
  test('validates placeholders, inserts parameter chips at the cursor and previews with current test data', async ({
    consolePage,
    storage,
  }) => {
    await storage.signIn();
    await consolePage.goto();
    await consolePage.expand('TC04');
    await consolePage.setParam('TC04', 'keyword', 'pliers');

    const editor = await consolePage.openEditor('TC04');
    await expect(editor.heading).toHaveText('✎ 編輯 TC04 的名稱與描述');
    await expect(editor.title('zh-TW')).toHaveValue(deployedText('TC04', 'title', 'zh-TW'));

    const descZh = editor.description('zh-TW');
    const original = await descZh.inputValue();

    // Unknown placeholder disables Save and displays the error.
    await descZh.fill(`${original} {unknownParam}`);
    await expect(editor.fieldError('description', 'zh-TW')).toHaveText('{unknownParam} 不是這條案例的測試資料');
    await expect(editor.saveButton).toBeDisabled();

    // Inserting a placeholder chip places {keyword} at the cursor and updates the live preview.
    await descZh.fill(`${original}（關鍵字：）`);
    await descZh.evaluate((el: HTMLTextAreaElement) => el.setSelectionRange(el.value.length - 1, el.value.length - 1));
    await editor.chip('keyword').click();

    await expect(descZh).toHaveValue(`${original}（關鍵字：{keyword}）`);
    await expect(editor.preview('zh-TW')).toContainText('關鍵字：pliers');
    await expect(editor.saveButton).toBeEnabled();
  });

  test('saves edited titles and descriptions to GitHub with 2-space JSON and noreply author', async ({
    consolePage,
    github,
    storage,
  }) => {
    github.editDescriptions((docs) => {
      docs.TC01.title['zh-TW'] = '首頁正常載入（GitHub 最新）';
    });
    const initialSha = github.descriptionsSha;

    await storage.signIn();
    await consolePage.goto();
    const editor = await consolePage.openEditor('TC04');

    await editor.title('zh-TW').fill('關鍵字搜尋（已編輯）');
    const originalDesc = await editor.description('zh-TW').inputValue();
    await editor.description('zh-TW').fill(`${originalDesc}（{keyword}）`);
    await editor.saveButton.click();

    await expect(editor.form).toBeHidden();
    await expect(consolePage.caseName('TC04')).toHaveText('關鍵字搜尋（已編輯）');
    await expect(consolePage.saveNotice('TC04')).toContainText('已儲存，所有人都看得到新的內容了。');
    await expect(consolePage.saveNotice('TC04').getByRole('link')).toHaveAttribute('href', github.commits[0].htmlUrl);

    const [save] = github.saves();
    expect(save).toMatchObject({
      sha: initialSha,
      branch: 'main',
      message: 'Update the TC04 title and description (from the dashboard)',
      author: {
        name: OWNER.login,
        email: `${OWNER.id}+${OWNER.login}@users.noreply.github.com`,
      },
    });
    const parsed = github.descriptions();
    expect(save.text).toBe(serializeDescriptions(parsed));
    expect(parsed.TC04.title['zh-TW']).toBe('關鍵字搜尋（已編輯）');
    expect(parsed.TC04.description['zh-TW']).toBe(`${originalDesc}（{keyword}）`);
    expect(parsed.TC01.title['zh-TW']).toBe('首頁正常載入（GitHub 最新）');
  });

  test('retries once on a 409 conflict and keeps both edits', async ({ consolePage, github, storage }) => {
    github.editBeforeNextSave((docs) => {
      docs.TC01.title.en = 'Home page loads (edited elsewhere)';
    });

    await storage.signIn();
    await consolePage.goto();
    const editor = await consolePage.openEditor('TC05');
    await editor.title('en').fill('Find a specific product (edited)');
    await editor.saveButton.click();

    await expect(consolePage.saveNotice('TC05')).toContainText('已儲存，所有人都看得到新的內容了。');
    expect(github.saves()).toHaveLength(2);
    expect(github.descriptions().TC05.title.en).toBe('Find a specific product (edited)');
    expect(github.descriptions().TC01.title.en).toBe('Home page loads (edited elsewhere)');
  });

  test('explains a missing Contents permission (403) and closes on Escape', async ({ consolePage, github, storage }) => {
    github.account(OWNER_TOKEN).contents = 'read';

    await storage.signIn();
    await consolePage.goto();
    const editor = await consolePage.openEditor('TC06');
    await editor.title('en').fill('Search with no results (edited)');
    await editor.saveButton.click();

    await expect(editor.error).toContainText('這個 token 不能修改 repo 的檔案：到 GitHub 編輯這個 token，把「Contents」改成「Read and write」後再試一次。');
    await expect(editor.error.getByRole('link')).toHaveAttribute('href', 'https://github.com/settings/personal-access-tokens');

    await editor.title('en').press('Escape');
    await expect(editor.form).toBeHidden();
  });
});
