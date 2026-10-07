#!/usr/bin/env node
/**
 * Checks the test configuration without running a single test (used by CI):
 * - config/cases.json has a valid test data schema, and every test case in the
 *   code has exactly one entry (and the other way round);
 * - config/descriptions.json has a title and a description for every case in
 *   every language, and placeholders only use the case's own test data.
 *
 * Usage: node scripts/check-config.mjs   (npm run check:config)
 */
import { loadCatalog, loadDescriptions } from './lib/catalog.mjs';

try {
  const { cases } = loadCatalog();
  loadDescriptions(cases);
  console.log(`Config OK: ${cases.length} test cases; test data and descriptions match the test code.`);
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
