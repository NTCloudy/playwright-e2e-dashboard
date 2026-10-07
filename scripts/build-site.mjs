#!/usr/bin/env node
/**
 * Assembles the static results website:
 *   <out>/                 <- dashboard/ (HTML, CSS, JS)
 *   <out>/case-params.js   <- shared/case-params.mjs (same test data rules as CI)
 *   <out>/descriptions.js  <- shared/descriptions.mjs (same title/description rules as this script)
 *   <out>/catalog.json     <- test cases: test data schema, code location, titles and descriptions
 *   <out>/data/            <- runs.json + runs/<id>/ (summaries, HTML reports, screenshots)
 *
 * The dashboard also reads the latest config/descriptions.json from GitHub at
 * runtime, so an edit made in the test console shows up without a rebuild.
 *
 * Usage:
 *   node scripts/build-site.mjs --data-dir test-output/site-data --out _site
 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { checkDescriptions, describeDocError } from '../shared/descriptions.mjs';
import { loadCatalog, ROOT } from './lib/catalog.mjs';

function arg(name, fallback) {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}

const dashboardDir = path.join(ROOT, 'dashboard');
const dataDir = path.resolve(arg('data-dir', 'test-output/site-data'));
const outDir = path.resolve(arg('out', '_site'));
const descriptionsPath = path.join(ROOT, 'config', 'descriptions.json');

// Check everything before touching the output folder.
const { config, cases } = loadCatalog();
const descriptions = JSON.parse(fs.readFileSync(descriptionsPath, 'utf8'));
const docCheck = checkDescriptions(
  descriptions,
  cases.map((c) => c.id),
  (id) => Object.keys(cases.find((c) => c.id === id)?.params ?? {}),
);
for (const warning of docCheck.warnings) console.warn(`Warning: config/descriptions.json: ${describeDocError(warning)}`);
if (docCheck.errors.length) {
  console.error(`config/descriptions.json has problems:\n- ${docCheck.errors.map(describeDocError).join('\n- ')}`);
  process.exit(1);
}

fs.rmSync(outDir, { recursive: true, force: true });
fs.cpSync(dashboardDir, outDir, { recursive: true });
// Served as .js so every static host uses a JavaScript MIME type.
fs.copyFileSync(path.join(ROOT, 'shared', 'case-params.mjs'), path.join(outDir, 'case-params.js'));
fs.copyFileSync(path.join(ROOT, 'shared', 'descriptions.mjs'), path.join(outDir, 'descriptions.js'));

// Source links in the console point at the commit the site was built from.
let commit = process.env.GITHUB_SHA ?? null;
try {
  commit ??= execFileSync('git', ['rev-parse', 'HEAD'], { cwd: ROOT, encoding: 'utf8' }).trim();
} catch {
  /* not a git checkout */
}
fs.writeFileSync(
  path.join(outDir, 'catalog.json'),
  JSON.stringify({ commit, builtAt: new Date().toISOString(), lists: config.lists ?? {}, cases, descriptions }, null, 2),
);

const outData = path.join(outDir, 'data');
if (fs.existsSync(dataDir)) {
  fs.cpSync(dataDir, outData, { recursive: true });
} else {
  console.warn(`No data folder at ${dataDir}; the site will show an empty history.`);
  fs.mkdirSync(outData, { recursive: true });
}
if (!fs.existsSync(path.join(outData, 'runs.json'))) {
  fs.writeFileSync(path.join(outData, 'runs.json'), '[]\n');
}

const runs = JSON.parse(fs.readFileSync(path.join(outData, 'runs.json'), 'utf8'));
console.log(`Site built in ${outDir} with ${runs.length} run(s) and ${cases.length} test case(s).`);
