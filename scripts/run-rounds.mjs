#!/usr/bin/env node
/**
 * Runs the whole Playwright suite N times ("rounds"). Each round writes its own
 * JSON + HTML report to <RUN_DIR>/rounds/round-<k>/ so that aggregate.mjs can
 * build a "test case x round" matrix.
 *
 * Usage:
 *   ROUNDS=3 node scripts/run-rounds.mjs
 *   node scripts/run-rounds.mjs 3 -- --grep TC04   # extra args go to `playwright test`
 *
 * The exit code is 0 even when tests fail: failures are counted by
 * aggregate.mjs, so results are still published when some tests are red.
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const MAX_ROUNDS = 10;
const separator = process.argv.indexOf('--');
const positional = process.argv.slice(2, separator === -1 ? undefined : separator);
const playwrightArgs = separator === -1 ? [] : process.argv.slice(separator + 1);

const rawRounds = process.env.ROUNDS || positional[0] || '1';
const rounds = Number(rawRounds);
if (!Number.isInteger(rounds) || rounds < 1 || rounds > MAX_ROUNDS) {
  console.error(`ROUNDS must be an integer between 1 and ${MAX_ROUNDS}, got "${rawRounds}".`);
  process.exit(2);
}

const runDir = path.resolve(process.env.RUN_DIR ?? 'test-output/run');
fs.rmSync(runDir, { recursive: true, force: true });
fs.mkdirSync(path.join(runDir, 'rounds'), { recursive: true });

const inGitHubActions = process.env.GITHUB_ACTIONS === 'true';
const npx = process.platform === 'win32' ? 'npx.cmd' : 'npx';
const meta = { rounds, startedAt: new Date().toISOString(), finishedAt: null, roundMeta: [] };

for (let round = 1; round <= rounds; round++) {
  const roundDir = path.join(runDir, 'rounds', `round-${round}`);
  const label = `Round ${round}/${rounds}`;
  console.log(inGitHubActions ? `::group::${label}` : `\n=== ${label} ===`);

  const startedAt = Date.now();
  const result = spawnSync(npx, ['playwright', 'test', ...playwrightArgs], {
    stdio: 'inherit',
    env: { ...process.env, ROUND_DIR: roundDir },
  });
  meta.roundMeta.push({
    round,
    exitCode: result.status,
    startedAt: new Date(startedAt).toISOString(),
    durationMs: Date.now() - startedAt,
  });

  if (inGitHubActions) console.log('::endgroup::');
  console.log(`${label} finished with exit code ${result.status}.`);
}

meta.finishedAt = new Date().toISOString();
fs.writeFileSync(path.join(runDir, 'run-meta.json'), JSON.stringify(meta, null, 2));
console.log(`\nAll ${rounds} round(s) finished. Output: ${runDir}`);
