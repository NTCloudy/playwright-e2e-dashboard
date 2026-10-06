// UI strings for the results dashboard. Add a language by adding it to
// LANGUAGES and STRINGS (and to CASE_INFO / MODULE_NAMES); the toggle picks it
// up automatically and falls back to English for anything missing.

export const LANGUAGES = [
  { code: 'zh-TW', label: '中文' },
  { code: 'en', label: 'EN' },
];

export const STRINGS = {
  'zh-TW': {
    appTitle: 'E2E 自動化測試儀表板',
    appSubtitle:
      '用 Playwright 對示範電商網站 Practice Software Testing（Toolshop）執行端對端測試。每次可以選擇跑幾輪，每一輪、每條測試案例的結果都公開在這裡。',
    runTests: '執行測試',
    runTestsHint: '在 GitHub Actions 選擇輪數後執行（僅限 repo 擁有者）',
    sourceCode: '原始碼',
    share: '複製分享連結',
    copied: '已複製連結！',
    language: '語言',
    loading: '載入中…',
    loadError: '無法載入測試資料：{msg}',

    kpiLatest: '最近一次通過率',
    kpiRuns: '執行次數',
    kpiLastRun: '最近一次執行',
    kpiCases: '測試案例',
    trendTitle: '通過率趨勢',
    trendHint: '最近 {n} 次執行；點長條可查看該次結果',
    historyTitle: '執行紀錄',
    colRun: '執行',
    colStarted: '開始時間',
    colTrigger: '觸發方式',
    colRounds: '輪數',
    colPassRate: '通過率',
    colResults: '通過／失敗',
    colDuration: '耗時',
    emptyTitle: '還沒有執行紀錄',
    emptyBody: '到 GitHub Actions 選擇輪數並執行後，結果會顯示在這裡。',

    trigger_manual: '手動',
    trigger_scheduled: '每週排程',
    trigger_local: '本機',

    back: '← 回到執行紀錄',
    runTitle: '執行 #{n}',
    runLocalTitle: '本機執行',
    started: '開始時間',
    duration: '耗時',
    rounds: '輪數',
    trigger: '觸發方式',
    browser: '瀏覽器',
    target: '測試網站',
    commit: 'Commit',
    workflowLog: 'GitHub Actions 執行紀錄',
    passed: '通過',
    failed: '失敗',
    skipped: '略過',
    notRun: '未執行',
    roundsTitle: '各輪結果',
    roundN: '第 {n} 輪',
    roundShort: '第{n}輪',
    report: 'Playwright 報告',
    roundBroken: '這一輪沒有產生測試結果',
    matrixTitle: '測試案例 × 輪次',
    matrixHint: '點格子查看細節；失敗的格子會顯示錯誤訊息、截圖和 Playwright 報告連結。',
    colCase: '測試案例',
    flaky: '不穩定',
    flakyHint: '同一次執行中有通過也有失敗',
    notFound: '找不到這次執行（可能已超過保留的 30 次）。',

    status: '狀態',
    verifies: '測試內容',
    error: '錯誤訊息',
    screenshot: '失敗當下的截圖',
    openInReport: '在 Playwright 報告查看步驟、影片與 trace',
    close: '關閉',
    passedNote: '這一輪的所有步驟都通過。',
    skippedNote: '這一輪略過了這個案例。',

    aboutTitle: '關於這個專案',
    about: [
      '測試目標：Practice Software Testing（Toolshop），專門給自動化測試練習的示範網站。',
      '技術：Playwright + TypeScript（Page Object 架構）、GitHub Actions、GitHub Pages。',
      '每一輪都用全新的瀏覽器環境跑完 16 條測試案例；失敗不重試，呈現真實的穩定度。',
      '每一輪都透過 API 註冊一個全新的測試帳號，不會用到真實個資。',
      '結帳案例只使用「貨到付款」，不會輸入任何信用卡資料。',
      '擁有者可以在 GitHub Actions 選擇 1～10 輪手動執行；另外每週一 09:00（台灣時間）自動執行一次。',
    ],
    keepNote: '保留最近 30 次執行紀錄。',

    durS: '{s} 秒',
    durMS: '{m} 分 {s} 秒',
    durHM: '{h} 小時 {m} 分',
  },

  en: {
    appTitle: 'E2E Test Automation Dashboard',
    appSubtitle:
      'End-to-end tests for the Practice Software Testing (Toolshop) demo store, written with Playwright. Each execution runs the suite N times, and every result of every round is published here.',
    runTests: 'Run tests',
    runTestsHint: 'Choose the number of rounds in GitHub Actions (repository owner only)',
    sourceCode: 'Source code',
    share: 'Copy share link',
    copied: 'Link copied!',
    language: 'Language',
    loading: 'Loading…',
    loadError: 'Could not load test data: {msg}',

    kpiLatest: 'Latest pass rate',
    kpiRuns: 'Runs',
    kpiLastRun: 'Last run',
    kpiCases: 'Test cases',
    trendTitle: 'Pass rate trend',
    trendHint: 'Last {n} runs; click a bar to open that run',
    historyTitle: 'Run history',
    colRun: 'Run',
    colStarted: 'Started',
    colTrigger: 'Trigger',
    colRounds: 'Rounds',
    colPassRate: 'Pass rate',
    colResults: 'Passed / failed',
    colDuration: 'Duration',
    emptyTitle: 'No runs yet',
    emptyBody: 'Results appear here after a run is started from GitHub Actions.',

    trigger_manual: 'Manual',
    trigger_scheduled: 'Weekly schedule',
    trigger_local: 'Local',

    back: '← Back to run history',
    runTitle: 'Run #{n}',
    runLocalTitle: 'Local run',
    started: 'Started',
    duration: 'Duration',
    rounds: 'Rounds',
    trigger: 'Trigger',
    browser: 'Browser',
    target: 'Target site',
    commit: 'Commit',
    workflowLog: 'GitHub Actions log',
    passed: 'Passed',
    failed: 'Failed',
    skipped: 'Skipped',
    notRun: 'Not run',
    roundsTitle: 'Rounds',
    roundN: 'Round {n}',
    roundShort: 'R{n}',
    report: 'Playwright report',
    roundBroken: 'This round produced no test results',
    matrixTitle: 'Test cases × rounds',
    matrixHint: 'Click a cell for details. Failed cells show the error, a screenshot and a link to the Playwright report.',
    colCase: 'Test case',
    flaky: 'Flaky',
    flakyHint: 'Both passed and failed within this run',
    notFound: 'Run not found (only the latest 30 runs are kept).',

    status: 'Status',
    verifies: 'What it checks',
    error: 'Error',
    screenshot: 'Screenshot at the moment of failure',
    openInReport: 'Open in the Playwright report (steps, video, trace)',
    close: 'Close',
    passedNote: 'Every step passed in this round.',
    skippedNote: 'This case was skipped in this round.',

    aboutTitle: 'About this project',
    about: [
      'Target: Practice Software Testing (Toolshop), a demo store built for test automation practice.',
      'Stack: Playwright + TypeScript (Page Object Model), GitHub Actions, GitHub Pages.',
      'Every round runs all 16 test cases in fresh browser contexts with no retries, so the numbers show real stability.',
      'Each round registers a brand-new test account through the API; no real personal data is used.',
      'The checkout case only uses "Cash on Delivery"; no credit card data is ever entered.',
      'The owner starts runs from GitHub Actions (1–10 rounds); a scheduled run also happens every Monday 09:00 Taiwan time.',
    ],
    keepNote: 'The latest 30 runs are kept.',

    durS: '{s}s',
    durMS: '{m}m {s}s',
    durHM: '{h}h {m}m',
  },
};

export const MODULE_NAMES = {
  Home: { 'zh-TW': '首頁', en: 'Home' },
  Search: { 'zh-TW': '搜尋', en: 'Search' },
  Account: { 'zh-TW': '會員', en: 'Account' },
  Cart: { 'zh-TW': '購物車', en: 'Cart' },
  Checkout: { 'zh-TW': '結帳', en: 'Checkout' },
};

/**
 * Localized title and "what it checks" per test case. When `title` is
 * missing, the title from the test code (summary.json) is used, so English
 * titles never drift from the code.
 */
export const CASE_INFO = {
  TC01: {
    'zh-TW': { title: '首頁正常載入', checks: '開啟首頁 → 導覽列、搜尋、排序、篩選都可以用，商品列表有商品名稱和價格' },
    en: { checks: 'Open the home page → navigation, search, sorting and filters are usable; products with prices are listed' },
  },
  TC02: {
    'zh-TW': { title: '從商品頁返回首頁', checks: '首頁 → 商品頁 → 點導覽列「Home」→ 商品列表與篩選區重新出現' },
    en: { checks: 'Home → product page → click "Home" → the product grid and filters are shown again' },
  },
  TC03: {
    'zh-TW': { title: '瀏覽分類頁', checks: 'Categories → Hand Tools → 標題為「Category: Hand Tools」並列出商品' },
    en: { checks: 'Categories → Hand Tools → the title is "Category: Hand Tools" and products are listed' },
  },
  TC04: {
    'zh-TW': { title: '關鍵字搜尋', checks: '搜尋「hammer」→ 顯示搜尋字詞；筆數與網站顯示一致；每筆名稱都含 hammer' },
    en: { checks: 'Search "hammer" → the term is shown; the count matches the caption; every name contains "hammer"' },
  },
  TC05: {
    'zh-TW': { title: '指定商品可以找到', checks: '搜尋「Claw Hammer」→ 結果中有這個商品，而且有價格' },
    en: { checks: 'Search "Claw Hammer" → the product is listed with a price' },
  },
  TC06: {
    'zh-TW': { title: '搜尋查無結果', checks: '搜尋不存在的商品 → 顯示「There are no products found.」，列表為空' },
    en: { checks: 'Search for a product that does not exist → "There are no products found." and an empty grid' },
  },
  TC07: {
    'zh-TW': { title: '價格由低到高排序', checks: '排序選「Price (Low - High)」→ 價格由低到高排列' },
    en: { checks: 'Sort by "Price (Low - High)" → prices are in ascending order' },
  },
  TC08: {
    'zh-TW': { title: '商品詳情與搜尋結果一致', checks: '從搜尋結果點「Thor Hammer」→ 商品頁名稱、價格與列表一致；數量與加入購物車可以用' },
    en: { checks: 'Open "Thor Hammer" from the results → name and price match; quantity and "Add to cart" are usable' },
  },
  TC09: {
    'zh-TW': { title: '登入成功', checks: '用本輪自動註冊的測試帳號登入 → 進入 My account，導覽列顯示使用者名稱' },
    en: { checks: 'Sign in with the account registered for this round → "My account" and the user name in the navigation bar' },
  },
  TC10: {
    'zh-TW': { title: '不存在的帳號無法登入', checks: '用不存在的帳號登入 → 顯示「Invalid email or password」，維持未登入' },
    en: { checks: 'Sign in with an unknown account → "Invalid email or password"; still signed out' },
  },
  TC11: {
    'zh-TW': { title: '加入購物車', checks: '商品頁點「Add to cart」→ 出現成功提示，購物車圖示數量為 1' },
    en: { checks: 'Click "Add to cart" on a product page → success message; the cart badge shows 1' },
  },
  TC12: {
    'zh-TW': { title: '購物車增加數量', checks: '購物車數量改成 3 → 小計 = 單價 × 3，總計與購物車圖示同步更新' },
    en: { checks: 'Change the quantity to 3 → line total = unit price × 3; cart total and badge are updated' },
  },
  TC13: {
    'zh-TW': { title: '購物車減少數量', checks: '購物車數量從 3 改回 1 → 小計、總計回到單價，購物車圖示為 1' },
    en: { checks: 'Change the quantity from 3 to 1 → line and cart totals equal the unit price; the badge shows 1' },
  },
  TC14: {
    'zh-TW': { title: '從購物車刪除商品', checks: '購物車有兩項商品：刪除一項 → 總計重算；再刪除另一項 → 購物車清空' },
    en: { checks: 'Two products in the cart: remove one → the total is recalculated; remove the other → the cart is empty' },
  },
  TC15: {
    'zh-TW': { title: '登出', checks: '登入後從使用者選單登出 → 回到未登入狀態，也無法再進入帳戶頁' },
    en: { checks: 'Sign out from the user menu → signed out, and the account page is no longer accessible' },
  },
  TC16: {
    'zh-TW': { title: '完整結帳（貨到付款）', checks: '購物車 → 登入 → 帳單地址 → 貨到付款 → 顯示訂單編號（不使用信用卡）' },
    en: { checks: 'Cart → sign in → billing address → Cash on Delivery → an invoice number is shown (no card data)' },
  },
};
