import { CASE_INFO, LANGUAGES, MODULE_NAMES, STRINGS } from './i18n.js';

const REPO_URL = 'https://github.com/NTCloudy/playwright-e2e-dashboard';
const WORKFLOW_URL = `${REPO_URL}/actions/workflows/e2e.yml`;
const DATA_DIR = 'data';
const LANG_KEY = 'e2e-dashboard-lang';
const TREND_SIZE = 30;

const state = {
  lang: pickLanguage(),
  runs: null,
  summaries: new Map(),
  openCell: null, // { runId, caseId, round } while the detail dialog is open
  renderToken: 0,
};

// ---------------------------------------------------------------- i18n

/** ?lang= in the URL wins (shared links), then the saved choice, then the browser language. */
function pickLanguage() {
  const codes = LANGUAGES.map((l) => l.code);
  const fromUrl = new URLSearchParams(location.search).get('lang');
  if (codes.includes(fromUrl)) return fromUrl;
  try {
    const saved = localStorage.getItem(LANG_KEY);
    if (codes.includes(saved)) return saved;
  } catch {
    /* storage can be blocked; fall through */
  }
  const browser = (navigator.languages?.[0] ?? navigator.language ?? '').toLowerCase();
  return browser.startsWith('zh') ? 'zh-TW' : 'en';
}

function setLanguage(code) {
  state.lang = code;
  try {
    localStorage.setItem(LANG_KEY, code);
  } catch {
    /* ignore */
  }
  // Keep the language in the URL so a copied link opens in the same language.
  const url = new URL(location.href);
  url.searchParams.set('lang', code);
  history.replaceState(null, '', url);
  render();
}

function t(key, vars = {}) {
  const value = STRINGS[state.lang]?.[key] ?? STRINGS.en[key] ?? key;
  return typeof value === 'string' ? value.replace(/\{(\w+)\}/g, (_, name) => String(vars[name] ?? '')) : value;
}

const caseTitle = (c) => CASE_INFO[c.id]?.[state.lang]?.title ?? c.title;
const caseChecks = (id) => CASE_INFO[id]?.[state.lang]?.checks ?? CASE_INFO[id]?.en?.checks ?? '';
const moduleName = (m) => MODULE_NAMES[m]?.[state.lang] ?? m;
const triggerName = (trigger) => t(`trigger_${trigger}`);

// ---------------------------------------------------------------- formatting

const esc = (value) =>
  String(value ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

// 24-hour clock: zh-TW's 12-hour format adds day periods such as "清晨".
const fmtDate = (iso) =>
  new Intl.DateTimeFormat(state.lang, { dateStyle: 'medium', timeStyle: 'short', hourCycle: 'h23' }).format(new Date(iso));

function fmtDuration(ms) {
  const total = Math.max(0, Math.round((ms ?? 0) / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (h) return t('durHM', { h, m });
  if (m) return t('durMS', { m, s });
  return t('durS', { s });
}

const fmtSeconds = (ms) => t('durS', { s: ((ms ?? 0) / 1000).toFixed(1) });

const pct = (v) => (v === null || v === undefined ? '—' : `${(v * 100).toFixed(v === 0 || v === 1 ? 0 : 1)}%`);

const rateClass = (v) => (v === null || v === undefined ? 'na' : v >= 0.95 ? 'good' : v >= 0.8 ? 'warn' : 'bad');

const runLabel = (run) => (run.runNumber ? t('runTitle', { n: run.runNumber }) : t('runLocalTitle'));

const runPath = (runId, rel) => `${DATA_DIR}/runs/${encodeURIComponent(runId)}/${rel}`;

const ICON = { passed: '✓', failed: '✕', skipped: '–', none: '·' };

// ---------------------------------------------------------------- data

async function getJson(path) {
  // GitHub Pages caches for 10 minutes; revalidate so a new run shows up right away.
  const response = await fetch(path, { cache: 'no-cache' });
  if (!response.ok) {
    const error = new Error(`HTTP ${response.status} (${path})`);
    error.status = response.status;
    throw error;
  }
  return response.json();
}

async function loadRuns() {
  state.runs ??= await getJson(`${DATA_DIR}/runs.json`);
  return state.runs;
}

async function loadSummary(id) {
  if (!state.summaries.has(id)) state.summaries.set(id, await getJson(runPath(id, 'summary.json')));
  return state.summaries.get(id);
}

// ---------------------------------------------------------------- chrome (header + footer)

function renderHeader() {
  document.getElementById('header').innerHTML = `
    <div class="container header-inner">
      <a class="brand" href="#/">
        <span class="brand-mark" aria-hidden="true">✓</span>
        <span>${esc(t('appTitle'))}</span>
      </a>
      <div class="header-actions">
        <a class="btn btn-primary" href="${WORKFLOW_URL}" target="_blank" rel="noopener" title="${esc(t('runTestsHint'))}">▶ ${esc(t('runTests'))}</a>
        <a class="btn" href="${REPO_URL}" target="_blank" rel="noopener">${esc(t('sourceCode'))}</a>
        <button type="button" class="btn" id="share-btn">${esc(t('share'))}</button>
        <div class="lang-switch" role="group" aria-label="${esc(t('language'))}">
          ${LANGUAGES.map((l) => `<button type="button" data-lang="${l.code}" aria-pressed="${l.code === state.lang}">${esc(l.label)}</button>`).join('')}
        </div>
      </div>
    </div>`;
}

function renderFooter() {
  document.getElementById('footer').innerHTML = `
    <div class="container">
      <h2>${esc(t('aboutTitle'))}</h2>
      <ul>${t('about').map((line) => `<li>${esc(line)}</li>`).join('')}</ul>
      <p class="muted">${esc(t('keepNote'))} · <a href="${REPO_URL}" target="_blank" rel="noopener">GitHub</a></p>
    </div>`;
}

// ---------------------------------------------------------------- home view

function renderHome(runs) {
  const intro = `
    <section class="hero">
      <h1>${esc(t('appTitle'))}</h1>
      <p class="lead">${esc(t('appSubtitle'))}</p>
    </section>`;

  if (!runs.length) {
    return `${intro}
      <section class="card empty">
        <h2>${esc(t('emptyTitle'))}</h2>
        <p>${esc(t('emptyBody'))}</p>
        <a class="btn btn-primary" href="${WORKFLOW_URL}" target="_blank" rel="noopener">▶ ${esc(t('runTests'))}</a>
      </section>`;
  }

  const latest = runs[0];
  const executed = latest.totals.passed + latest.totals.failed;
  const caseCount = latest.rounds ? Math.round(latest.totals.total / latest.rounds) : '—';
  const trend = runs.slice(0, TREND_SIZE).reverse();

  return `${intro}
    <section class="kpis">
      <a class="card kpi" href="#/run/${encodeURIComponent(latest.id)}">
        <div class="kpi-label">${esc(t('kpiLatest'))}</div>
        <div class="kpi-value rate-text-${rateClass(latest.totals.passRate)}">${pct(latest.totals.passRate)}</div>
        <div class="kpi-sub">${latest.totals.passed} / ${executed} · ${esc(runLabel(latest))}</div>
      </a>
      <div class="card kpi">
        <div class="kpi-label">${esc(t('kpiLastRun'))}</div>
        <div class="kpi-value kpi-value-sm">${esc(fmtDate(latest.startedAt))}</div>
        <div class="kpi-sub">${esc(triggerName(latest.trigger))} · ${esc(t('rounds'))} ${latest.rounds}</div>
      </div>
      <div class="card kpi">
        <div class="kpi-label">${esc(t('kpiRuns'))}</div>
        <div class="kpi-value">${runs.length}</div>
        <div class="kpi-sub">${esc(t('keepNote'))}</div>
      </div>
      <div class="card kpi">
        <div class="kpi-label">${esc(t('kpiCases'))}</div>
        <div class="kpi-value">${caseCount}</div>
        <div class="kpi-sub">Chromium · Playwright</div>
      </div>
    </section>

    <section class="card">
      <div class="section-head">
        <h2>${esc(t('trendTitle'))}</h2>
        <span class="muted">${esc(t('trendHint', { n: trend.length }))}</span>
      </div>
      <div class="trend" role="list">
        ${trend
          .map((run) => {
            const rate = run.totals.passRate ?? 0;
            const label = `${runLabel(run)} · ${pct(run.totals.passRate)} · ${fmtDate(run.startedAt)}`;
            return `<a role="listitem" class="bar bg-${rateClass(run.totals.passRate)}" style="--h:${Math.max(rate * 100, 2)}%"
                       href="#/run/${encodeURIComponent(run.id)}" title="${esc(label)}" aria-label="${esc(label)}"></a>`;
          })
          .join('')}
      </div>
    </section>

    <section class="card">
      <div class="section-head"><h2>${esc(t('historyTitle'))}</h2></div>
      <div class="table-wrap">
        <table class="table runs-table">
          <thead>
            <tr>
              <th>${esc(t('colRun'))}</th>
              <th>${esc(t('colStarted'))}</th>
              <th>${esc(t('colTrigger'))}</th>
              <th class="num">${esc(t('colRounds'))}</th>
              <th>${esc(t('colPassRate'))}</th>
              <th class="num">${esc(t('colResults'))}</th>
              <th class="num">${esc(t('colDuration'))}</th>
            </tr>
          </thead>
          <tbody>
            ${runs.map(renderRunRow).join('')}
          </tbody>
        </table>
      </div>
    </section>`;
}

function renderRunRow(run) {
  const href = `#/run/${encodeURIComponent(run.id)}`;
  const broken = run.brokenRounds ? ` <span class="tag tag-bad" title="${esc(t('roundBroken'))}">⚠ ${run.brokenRounds}</span>` : '';
  return `
    <tr class="clickable" data-href="${href}">
      <td><a href="${href}">${esc(runLabel(run))}</a>${broken}</td>
      <td>${esc(fmtDate(run.startedAt))}</td>
      <td><span class="tag tag-${esc(run.trigger)}">${esc(triggerName(run.trigger))}</span></td>
      <td class="num">${run.rounds}</td>
      <td>
        <div class="rate">
          <div class="rate-bar"><span class="bg-${rateClass(run.totals.passRate)}" style="width:${(run.totals.passRate ?? 0) * 100}%"></span></div>
          <span class="rate-text-${rateClass(run.totals.passRate)}">${pct(run.totals.passRate)}</span>
        </div>
      </td>
      <td class="num"><span class="ok">${run.totals.passed}</span> / <span class="${run.totals.failed ? 'ko' : 'muted'}">${run.totals.failed}</span></td>
      <td class="num">${esc(fmtDuration(run.durationMs))}</td>
    </tr>`;
}

// ---------------------------------------------------------------- run view

/** Groups cases by module; modules are ordered by their first case id. */
function groupByModule(cases) {
  const groups = new Map();
  for (const c of [...cases].sort((a, b) => a.id.localeCompare(b.id))) {
    if (!groups.has(c.module)) groups.set(c.module, []);
    groups.get(c.module).push(c);
  }
  return [...groups.entries()];
}

function renderRun(summary) {
  const rounds = summary.roundSummaries;
  const executed = summary.totals.passed + summary.totals.failed;
  const commitUrl = summary.repoUrl && summary.commit ? `${summary.repoUrl}/commit/${summary.commit}` : null;

  const meta = [
    [t('started'), esc(fmtDate(summary.startedAt))],
    [t('duration'), esc(fmtDuration(summary.durationMs))],
    [t('rounds'), summary.rounds],
    [t('trigger'), esc(triggerName(summary.trigger))],
    [t('browser'), `Chromium · Playwright ${esc(summary.playwrightVersion)}`],
    [t('target'), `<a href="${esc(summary.baseURL)}" target="_blank" rel="noopener">${esc(new URL(summary.baseURL).host)}</a>`],
    commitUrl ? [t('commit'), `<a href="${esc(commitUrl)}" target="_blank" rel="noopener"><code>${esc(summary.commit)}</code></a>`] : null,
    summary.workflowRunUrl ? ['GitHub Actions', `<a href="${esc(summary.workflowRunUrl)}" target="_blank" rel="noopener">${esc(t('workflowLog'))} ↗</a>`] : null,
  ].filter(Boolean);

  const roundCards = rounds
    .map((r) => {
      const total = r.passed + r.failed + r.skipped;
      const broken = total === 0;
      return `
        <div class="card round-card ${broken || r.failed ? 'round-bad' : 'round-good'}">
          <div class="round-title">${esc(t('roundN', { n: r.round }))}</div>
          ${
            broken
              ? `<div class="ko">${esc(t('roundBroken'))}</div>${r.error ? `<details><summary>${esc(t('error'))}</summary><pre class="error">${esc(r.error)}</pre></details>` : ''}`
              : `<div class="round-stats"><span class="ok">${ICON.passed} ${r.passed}</span><span class="${r.failed ? 'ko' : 'muted'}">${ICON.failed} ${r.failed}</span>${r.skipped ? `<span class="muted">${ICON.skipped} ${r.skipped}</span>` : ''}</div>`
          }
          <div class="muted">${esc(fmtDuration(r.durationMs))}</div>
          ${broken ? '' : `<a href="${runPath(summary.id, r.report)}" target="_blank" rel="noopener">${esc(t('report'))} ↗</a>`}
        </div>`;
    })
    .join('');

  const header = `
    <tr>
      <th class="case-col" scope="col">${esc(t('colCase'))}</th>
      ${rounds
        .map((r) => {
          const total = r.passed + r.failed + r.skipped;
          return `<th scope="col" class="round-col"><a href="${runPath(summary.id, r.report)}" target="_blank" rel="noopener" title="${esc(t('report'))}">${esc(t('roundShort', { n: r.round }))}</a><small>${total ? `${r.passed}/${total}` : '—'}</small></th>`;
        })
        .join('')}
      <th scope="col" class="num">${esc(t('colPassRate'))}</th>
    </tr>`;

  const body = groupByModule(summary.cases)
    .map(
      ([module, cases]) => `
        <tr class="module-row"><th colspan="${rounds.length + 2}" scope="colgroup">${esc(moduleName(module))}</th></tr>
        ${cases.map((c) => renderCaseRow(summary, c, rounds)).join('')}`,
    )
    .join('');

  return `
    <a class="back" href="#/">${esc(t('back'))}</a>
    <section class="card run-head">
      <div>
        <h1>${esc(runLabel(summary))} <span class="tag tag-${esc(summary.trigger)}">${esc(triggerName(summary.trigger))}</span></h1>
        <dl class="meta">${meta.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${v}</dd></div>`).join('')}</dl>
      </div>
      <div class="score">
        <div class="score-value rate-text-${rateClass(summary.totals.passRate)}">${pct(summary.totals.passRate)}</div>
        <div class="score-sub">
          <span class="ok">${esc(t('passed'))} ${summary.totals.passed}</span> ·
          <span class="${summary.totals.failed ? 'ko' : 'muted'}">${esc(t('failed'))} ${summary.totals.failed}</span>
          ${summary.totals.skipped ? ` · <span class="muted">${esc(t('skipped'))} ${summary.totals.skipped}</span>` : ''}
        </div>
        <div class="muted">${summary.totals.passed} / ${executed}</div>
      </div>
    </section>

    <section>
      <h2 class="section-title">${esc(t('roundsTitle'))}</h2>
      <div class="rounds">${roundCards}</div>
    </section>

    <section class="card">
      <div class="section-head">
        <h2>${esc(t('matrixTitle'))}</h2>
        <div class="legend">
          <span><span class="cell cell-passed">${ICON.passed}</span> ${esc(t('passed'))}</span>
          <span><span class="cell cell-failed">${ICON.failed}</span> ${esc(t('failed'))}</span>
          <span><span class="cell cell-skipped">${ICON.skipped}</span> ${esc(t('skipped'))}</span>
        </div>
      </div>
      <p class="muted">${esc(t('matrixHint'))}</p>
      <div class="table-wrap">
        <table class="matrix">
          <thead>${header}</thead>
          <tbody>${body}</tbody>
        </table>
      </div>
    </section>`;
}

function renderCaseRow(summary, c, rounds) {
  const statuses = c.results.map((r) => r.status);
  const flaky = statuses.includes('passed') && statuses.includes('failed');
  const blocked = c.results.some((r) => r.blocked);
  const cells = rounds
    .map((round) => {
      const result = c.results.find((r) => r.round === round.round);
      if (!result) return `<td><span class="cell cell-none" title="${esc(t('notRun'))}">${ICON.none}</span></td>`;
      const label = `${c.id} · ${t('roundN', { n: round.round })} · ${t(result.status)}${result.blocked ? ` (${t('blocked')})` : ''}`;
      return `<td><button type="button" class="cell cell-${result.status}" data-case="${esc(c.id)}" data-round="${round.round}" title="${esc(label)}" aria-label="${esc(label)}">${ICON[result.status]}</button></td>`;
    })
    .join('');
  return `
    <tr>
      <th class="case-col" scope="row">
        <span class="case-id">${esc(c.id)}</span>
        <span class="case-title" title="${esc(caseChecks(c.id))}">${esc(caseTitle(c))}</span>
      </th>
      ${cells}
      <td class="num">
        <span class="rate-text-${rateClass(c.passRate)}">${pct(c.passRate)}</span>
        ${flaky ? `<span class="tag tag-warn" title="${esc(t('flakyHint'))}">${esc(t('flaky'))}</span>` : ''}
        ${blocked ? `<span class="tag tag-blocked" title="${esc(t('blockedNote'))}">${esc(t('blocked'))}</span>` : ''}
      </td>
    </tr>`;
}

// ---------------------------------------------------------------- detail dialog

function resultNote(result) {
  if (result.status === 'passed') return t('passedNote');
  if (result.status !== 'skipped') return null;
  if (result.blocked) return t('blockedNote');
  return result.skipReason ? `${t('skippedNote')} ${t('skipReason', { reason: result.skipReason })}` : t('skippedNote');
}

function renderDetail() {
  const dialog = document.getElementById('detail');
  const { runId, caseId, round } = state.openCell;
  const summary = state.summaries.get(runId);
  const c = summary?.cases.find((x) => x.id === caseId);
  const result = c?.results.find((r) => r.round === round);
  if (!result) return;

  const note = resultNote(result);
  dialog.innerHTML = `
    <div class="dialog-inner">
      <header class="dialog-head">
        <div>
          <div class="muted">${esc(c.id)} · ${esc(moduleName(c.module))}</div>
          <h3>${esc(caseTitle(c))}</h3>
          <div>
            ${esc(t('roundN', { n: round }))} ·
            <span class="status status-${result.status}">${ICON[result.status]} ${esc(t(result.status))}</span>
            ${result.blocked ? `<span class="tag tag-blocked">${esc(t('blocked'))}</span>` : ''} ·
            ${esc(fmtSeconds(result.durationMs))}
          </div>
        </div>
        <button type="button" class="btn-close" data-close aria-label="${esc(t('close'))}">✕</button>
      </header>
      ${caseChecks(c.id) ? `<section><h4>${esc(t('verifies'))}</h4><p>${esc(caseChecks(c.id))}</p></section>` : ''}
      ${note ? `<p class="muted">${esc(note)}</p>` : ''}
      ${result.error ? `<section><h4>${esc(t('error'))}</h4><pre class="error">${esc(result.error)}</pre></section>` : ''}
      ${
        result.screenshot
          ? `<section><h4>${esc(t('screenshot'))}</h4>
               <a href="${runPath(runId, result.screenshot)}" target="_blank" rel="noopener">
                 <img class="shot" src="${runPath(runId, result.screenshot)}" alt="${esc(t('screenshot'))}" loading="lazy">
               </a></section>`
          : ''
      }
      <div class="dialog-actions">
        <a class="btn btn-primary" href="${runPath(runId, result.reportLink)}" target="_blank" rel="noopener">${esc(t('openInReport'))} ↗</a>
        <button type="button" class="btn" data-close>${esc(t('close'))}</button>
      </div>
    </div>`;
  if (!dialog.open) dialog.showModal();
}

function closeDetail() {
  state.openCell = null;
  const dialog = document.getElementById('detail');
  if (dialog.open) dialog.close();
}

// ---------------------------------------------------------------- routing + rendering

function currentRoute() {
  const match = /^#\/run\/([^/?]+)$/.exec(location.hash);
  return match ? { view: 'run', id: decodeURIComponent(match[1]) } : { view: 'home' };
}

async function render() {
  const token = ++state.renderToken;
  document.documentElement.lang = state.lang;
  renderHeader();
  renderFooter();

  const app = document.getElementById('app');
  const route = currentRoute();
  const cached = route.view === 'run' ? state.summaries.has(route.id) : state.runs !== null;
  if (!cached) app.innerHTML = `<p class="muted loading">${esc(t('loading'))}</p>`;

  try {
    if (route.view === 'run') {
      const summary = await loadSummary(route.id);
      if (token !== state.renderToken) return;
      app.innerHTML = renderRun(summary);
      document.title = `${runLabel(summary)} · ${t('appTitle')}`;
    } else {
      const runs = await loadRuns();
      if (token !== state.renderToken) return;
      app.innerHTML = renderHome(runs);
      document.title = t('appTitle');
    }
  } catch (error) {
    if (token !== state.renderToken) return;
    const message = route.view === 'run' && error.status === 404 ? t('notFound') : t('loadError', { msg: error.message });
    app.innerHTML = `<a class="back" href="#/">${esc(t('back'))}</a><section class="card empty"><p class="ko">${esc(message)}</p></section>`;
    document.title = t('appTitle');
  }

  if (state.openCell) renderDetail();
}

// ---------------------------------------------------------------- events

document.addEventListener('click', async (event) => {
  const target = event.target instanceof Element ? event.target : null;
  if (!target) return;

  const langButton = target.closest('[data-lang]');
  if (langButton) return setLanguage(langButton.dataset.lang);

  if (target.closest('#share-btn')) {
    const button = target.closest('#share-btn');
    try {
      await navigator.clipboard.writeText(location.href);
      button.textContent = t('copied');
    } catch {
      window.prompt(t('share'), location.href);
    }
    setTimeout(() => (button.textContent = t('share')), 2000);
    return;
  }

  const cell = target.closest('button.cell[data-case]');
  if (cell) {
    const route = currentRoute();
    state.openCell = { runId: route.id, caseId: cell.dataset.case, round: Number(cell.dataset.round) };
    return renderDetail();
  }

  if (target.closest('[data-close]') || target.id === 'detail') return closeDetail(); // button or backdrop

  const row = target.closest('tr[data-href]');
  if (row && !target.closest('a')) location.hash = row.dataset.href;
});

document.getElementById('detail').addEventListener('close', () => (state.openCell = null));

window.addEventListener('hashchange', () => {
  closeDetail();
  render();
  window.scrollTo(0, 0);
});

render();
