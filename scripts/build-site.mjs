#!/usr/bin/env node
/**
 * Assembles the static results website:
 *   <out>/            <- dashboard/ (HTML, CSS, JS)
 *   <out>/data/       <- runs.json + runs/<id>/ (summaries, HTML reports, screenshots)
 *
 * Usage:
 *   node scripts/build-site.mjs --data-dir test-output/site-data --out _site
 */
import fs from 'node:fs';
import path from 'node:path';

function arg(name, fallback) {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}

const dashboardDir = path.resolve('dashboard');
const dataDir = path.resolve(arg('data-dir', 'test-output/site-data'));
const outDir = path.resolve(arg('out', '_site'));

fs.rmSync(outDir, { recursive: true, force: true });
fs.cpSync(dashboardDir, outDir, { recursive: true });

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
console.log(`Site built in ${outDir} with ${runs.length} run(s).`);
