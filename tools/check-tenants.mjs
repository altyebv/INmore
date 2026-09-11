#!/usr/bin/env node
/**
 * Check every tenant config.
 *
 *   npm run tenants:check            # all of tenants/*.json
 *   npm run tenants:check foo.json   # just one
 *
 * Exists so a config can be checked without running the app. Onboarding a
 * client is writing one of these, and the loop of "edit JSON, restart the dev
 * server, read a stack trace" is the loop this replaces. It is also the check
 * to put in CI: a tenant config is the one input that decides whether a
 * client's studio works at all, and it is edited by hand.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  formatValidationResult,
  validateTenantConfig,
} from '../packages/config-schema/src/index.js';

const root = fileURLToPath(new URL('..', import.meta.url));
const dir = path.join(root, 'tenants');

const named = process.argv.slice(2);
const files = named.length
  ? named.map((f) => (path.isAbsolute(f) ? f : path.join(dir, f)))
  : fs
      .readdirSync(dir)
      .filter((f) => f.endsWith('.json'))
      .map((f) => path.join(dir, f));

if (!files.length) {
  console.error('No tenant configs found in tenants/.');
  process.exit(1);
}

let failed = 0;

for (const file of files) {
  const label = path.relative(root, file).replace(/\\/g, '/');

  let config;
  try {
    config = JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (error) {
    console.error(`${label}: not valid JSON — ${error.message}`);
    failed += 1;
    continue;
  }

  const result = validateTenantConfig(config);
  console.log(formatValidationResult(result, label));
  if (!result.valid) failed += 1;
  if (files.length > 1) console.log('');
}

if (failed) {
  console.error(`${failed} of ${files.length} config(s) have errors.`);
  process.exit(1);
}
