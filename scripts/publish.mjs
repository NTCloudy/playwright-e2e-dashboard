#!/usr/bin/env node
/**
 * Copies one finished run into the dashboard data folder and updates the run
 * index (runs.json). Only the newest runs are kept.
 *
 * Usage:
 *   node scripts/publish.mjs --run-dir test-output/run --data-dir site-data --keep 30
 */
import fs from 'node:fs';
import path from 'node:path';

function arg(name, fallback) {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}

const runDir = path.resolve(arg('run-dir', process.env.RUN_DIR ?? 'test-output/run'));
const dataDir = path.resolve(arg('data-dir', 'test-output/site-data'));
const keep = Number(arg('keep', '30'));

const summaryPath = path.join(runDir, 'summary.json');
if (!fs.existsSync(summaryPath)) {
  console.error(`No summary.json in ${runDir}. Run scripts/aggregate.mjs first.`);
  process.exit(1);
}
const summary = JSON.parse(fs.readFileSync(summaryPath, 'utf8'));

const runsDir = path.join(dataDir, 'runs');
const target = path.join(runsDir, summary.id);
fs.rmSync(target, { recursive: true, force: true });
fs.mkdirSync(target, { recursive: true });
fs.copyFileSync(summaryPath, path.join(target, 'summary.json'));
fs.cpSync(path.join(runDir, 'rounds'), path.join(target, 'rounds'), {
  recursive: true,
  filter: (src) => !src.split(path.sep).includes('artifacts'),
});

const indexPath = path.join(dataDir, 'runs.json');
const index = fs.existsSync(indexPath) ? JSON.parse(fs.readFileSync(indexPath, 'utf8')) : [];
const entry = {
  id: summary.id,
  runNumber: summary.runNumber,
  trigger: summary.trigger,
  startedAt: summary.startedAt,
  durationMs: summary.durationMs,
  rounds: summary.rounds,
  commit: summary.commit,
  totals: summary.totals,
  brokenRounds: summary.brokenRounds,
};
const updated = [entry, ...index.filter((r) => r.id !== summary.id)]
  .sort((a, b) => b.startedAt.localeCompare(a.startedAt))
  .slice(0, keep);
fs.writeFileSync(indexPath, JSON.stringify(updated, null, 2));

// Remove run folders that are no longer referenced by the index.
const kept = new Set(updated.map((r) => r.id));
for (const dir of fs.readdirSync(runsDir)) {
  if (!kept.has(dir)) {
    fs.rmSync(path.join(runsDir, dir), { recursive: true, force: true });
    console.log(`Pruned old run ${dir}`);
  }
}
console.log(`Published run ${summary.id} to ${target} (${updated.length} run(s) in index).`);
