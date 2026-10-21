#!/usr/bin/env node

/**
 * OpportunityKit Offline Demo Verification Script (PS-03 Benchmark)
 *
 * Runs all 4 sample opportunities through:
 *  1. Deterministic Rule Parser (parseOpportunity)
 *  2. Rule-Based Engine (evaluateProfileAgainstOpportunity)
 *  3. Rule-Based Scam / Legitimacy Checker (checkScam)
 *
 * Verifies that the primary benchmark opportunity results in:
 *  - Exactly 3 Match
 *  - Exactly 1 Mismatch
 *  - Exactly 2 Missing info
 *
 * GUARANTEE: Works 100% offline with zero external network or internet calls.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const sharedDistPath = path.resolve(rootDir, 'shared', 'dist', 'index.js');

// Auto-compile shared package if dist missing
if (!fs.existsSync(sharedDistPath)) {
  console.log('[demo-check] Building @opportunity-kit/shared...');
  execSync('npm run build:shared', { cwd: rootDir, stdio: 'inherit' });
}

const {
  SAMPLE_OPPORTUNITIES,
  parseOpportunity,
  evaluateProfileAgainstOpportunity,
  checkScam
} = await import(`file://${sharedDistPath}`);

console.log('======================================================================');
console.log('       OPPORTUNITYKIT OFFLINE DEMO CHECK SUITE (PS-03)');
console.log('======================================================================');
console.log(`Testing 4 sample opportunities with NO internet connection...\n`);

if (!Array.isArray(SAMPLE_OPPORTUNITIES) || SAMPLE_OPPORTUNITIES.length < 4) {
  console.error(`\x1b[31m[FAIL]\x1b[0m Expected 4 sample opportunities, found ${SAMPLE_OPPORTUNITIES?.length || 0}`);
  process.exit(1);
}

let mainBenchmarkPassed = false;
let allPassed = true;

for (let i = 0; i < SAMPLE_OPPORTUNITIES.length; i++) {
  const sample = SAMPLE_OPPORTUNITIES[i];
  console.log(`[Sample ${i + 1}/4] ${sample.title} (${sample.category || 'General'})`);

  // 1. Run Parser
  const parseStart = performance.now();
  const requirements = parseOpportunity(sample.text);
  const parseTime = (performance.now() - parseStart).toFixed(2);

  if (!Array.isArray(requirements) || requirements.length === 0) {
    console.error(`  \x1b[31m[FAIL]\x1b[0m Parser returned 0 requirements for: ${sample.title}`);
    allPassed = false;
    continue;
  }
  console.log(`  ✓ Parser extracted ${requirements.length} requirements (${parseTime} ms)`);

  // 2. Run Rule Engine
  const evalStart = performance.now();
  const evalResult = evaluateProfileAgainstOpportunity(
    requirements,
    sample.profile,
    sample.title,
    sample.text
  );
  const evalTime = (performance.now() - evalStart).toFixed(2);
  const counts = evalResult.summary || evalResult.counts;

  console.log(
    `  ✓ Engine evaluated: ${counts.matches} Match, ${counts.mismatches} Mismatch, ${counts.missingInfo} Missing info (${evalTime} ms)`
  );

  // 3. Run Scam Checker
  const scamStart = performance.now();
  const scamReport = checkScam(sample.text);
  const scamTime = (performance.now() - scamStart).toFixed(2);

  if (!scamReport || !scamReport.level) {
    console.error(`  \x1b[31m[FAIL]\x1b[0m Scam checker returned invalid report for: ${sample.title}`);
    allPassed = false;
    continue;
  }
  console.log(
    `  ✓ Scam checker level: ${scamReport.level} (Score: ${scamReport.score}/100, Clean: ${scamReport.isClean}) (${scamTime} ms)`
  );

  // 4. Verify Main Sample Criterion: exactly 3 Match, 1 Mismatch, 2 Missing info
  const isMainBenchmark =
    i === 0 ||
    sample.title.toLowerCase().includes('benchmark') ||
    sample.title.toLowerCase().includes('summer engineering intern');

  if (isMainBenchmark && !mainBenchmarkPassed) {
    const matchesOk = counts.matches === 3;
    const mismatchesOk = counts.mismatches === 1;
    const missingOk = counts.missingInfo === 2;

    if (matchesOk && mismatchesOk && missingOk) {
      console.log(
        `  \x1b[32m[PASS]\x1b[0m Main Benchmark verified: exactly 3 Match, 1 Mismatch, 2 Missing info.`
      );
      mainBenchmarkPassed = true;
    } else {
      console.error(
        `  \x1b[31m[FAIL]\x1b[0m Main Benchmark counts mismatch! Expected: 3 Match, 1 Mismatch, 2 Missing info. Received: ${counts.matches} Match, ${counts.mismatches} Mismatch, ${counts.missingInfo} Missing info.`
      );
      allPassed = false;
    }
  }

  console.log('');
}

console.log('----------------------------------------------------------------------');
if (allPassed && mainBenchmarkPassed) {
  console.log('\x1b[32m[ALL DEMO CHECKS PASSED]\x1b[0m');
  console.log('• All 4 sample opportunities successfully parsed, evaluated, and scam-checked.');
  console.log('• Main sample confirmed: exactly 3 Match, 1 Mismatch, 2 Missing info.');
  console.log('• Offline guarantee: executed with 0 internet and 0 external dependencies.');
  process.exit(0);
} else {
  console.error('\x1b[31m[DEMO CHECK FAILED]\x1b[0m One or more verification criteria were not met.');
  process.exit(1);
}
