/**
 * The sites the suite can run against ("targets").
 *
 * - production: the regular Toolshop demo store. Every test is expected to pass.
 * - with-bugs:  Toolshop's official release with intentionally injected bugs.
 *               Failures there are expected; shared/bug-detection.mjs matches
 *               them to config/known-bugs.json ("bugs caught").
 *
 * Shared by the CI scripts (run-rounds, aggregate, publish, verdict) and the
 * dashboard (build-site.mjs copies this file to the site as targets.js). No
 * dependencies; runs both in Node.js and in the browser.
 */

export const DEFAULT_TARGET = 'production';

/** `baseURL` is the web site (BASE_URL, playwright.config.ts); `apiURL` its API (API_URL, src/api/toolshopApi.ts). */
export const TARGETS = {
  production: {
    baseURL: 'https://practicesoftwaretesting.com',
    apiURL: 'https://api.practicesoftwaretesting.com',
    injectedBugs: false,
  },
  'with-bugs': {
    baseURL: 'https://with-bugs.practicesoftwaretesting.com',
    apiURL: 'https://api-with-bugs.practicesoftwaretesting.com',
    // Failures are judged against config/known-bugs.json instead of "any failure = red".
    injectedBugs: true,
  },
};

/** Target names, default first. */
export const TARGET_NAMES = Object.keys(TARGETS);

export const isTarget = (name) => typeof name === 'string' && Object.hasOwn(TARGETS, name);

/**
 * Resolves a target name such as the TARGET environment variable; empty means
 * the default. Returns `{ name, baseURL, apiURL, injectedBugs }`, or `{ error }`
 * for an unknown name.
 */
export function resolveTarget(input) {
  const name = String(input ?? '').trim() || DEFAULT_TARGET;
  if (!isTarget(name)) return { error: `unknown target "${name.slice(0, 40)}" (expected one of: ${TARGET_NAMES.join(', ')})` };
  return { name, ...TARGETS[name] };
}

/** Target of a run summary or a runs.json entry. Runs recorded before targets existed ran on production. */
export const targetOf = (run) => (isTarget(run?.target) ? run.target : DEFAULT_TARGET);

/**
 * Whether a runs.json entry covered every case that applies to its target
 * (`selection: "all"`). Older entries have no `selection`: they are full runs
 * when they ran as many cases as the catalog had, or predate case selection.
 */
export function isFullRun(run) {
  if (run?.selection !== undefined) return run.selection === 'all';
  return run?.caseCount === undefined || run.caseCount === run.catalogSize;
}

/**
 * The newest full run on `target` in a runs.json list, or null. Runs that
 * produced no results at all (every round broke) are passed over: they would
 * show nothing. publish.mjs never prunes this run, and the dashboard's Bug
 * page uses it as its reference.
 */
export function latestFullRun(runs, target) {
  const full = (runs ?? []).filter((run) => targetOf(run) === target && isFullRun(run) && (run.totals?.total ?? 1) > 0);
  return full.sort((a, b) => String(b.startedAt).localeCompare(String(a.startedAt)))[0] ?? null;
}
