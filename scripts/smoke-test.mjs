#!/usr/bin/env node

/**
 * OpportunityKit Production Deployment Smoke-Test Script
 *
 * Checks:
 *  1. Backend /health endpoint & status
 *  2. CORS header validation against live URLs
 *  3. Frontend live accessibility
 *  4. Part 5: Sample Opportunity Parse endpoint
 *  5. Part 6: Sample Comparison Result (3 Match, 1 Mismatch, 2 Missing info)
 *
 * Usage:
 *   npm run smoke -- <frontend-url> <backend-url>
 *   node scripts/smoke-test.mjs https://opportunitykit.vercel.app https://opportunitykit-backend.onrender.com
 */

const positionalArgs = process.argv.slice(2).filter((arg) => !arg.startsWith('--'));

const frontendUrl = (
  positionalArgs[0] ||
  process.env.FRONTEND_URL ||
  'http://localhost:3000'
).trim().replace(/\/+$/, '');

const backendUrl = (
  positionalArgs[1] ||
  process.env.BACKEND_URL ||
  process.env.RENDER_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  'http://localhost:5000'
).trim().replace(/\/+$/, '');

console.log('======================================================================');
console.log('            OPPORTUNITYKIT DEPLOYMENT SMOKE TEST');
console.log('======================================================================');
console.log(`Frontend URL: ${frontendUrl}`);
console.log(`Backend URL:  ${backendUrl}`);
console.log('----------------------------------------------------------------------');

let testsPassed = 0;
let testsFailed = 0;

function pass(testName, details) {
  testsPassed++;
  console.log(`\x1b[32m[PASS]\x1b[0m ${testName}`);
  if (details) console.log(`       \x1b[90m${details}\x1b[0m`);
}

function fail(testName, reason) {
  testsFailed++;
  console.error(`\x1b[31m[FAIL]\x1b[0m ${testName}`);
  if (reason) console.error(`       \x1b[31mError: ${reason}\x1b[0m`);
}

async function runSmokeTests() {
  const overallStart = Date.now();

  // -------------------------------------------------------------------------
  // TEST 1: Backend /health endpoint
  // -------------------------------------------------------------------------
  try {
    const healthUrl = `${backendUrl}/health`;
    const start = Date.now();
    const res = await fetch(healthUrl, {
      method: 'GET',
      headers: { Accept: 'application/json' }
    });
    const latency = Date.now() - start;

    if (!res.ok) {
      fail('Backend /health Status', `HTTP ${res.status} ${res.statusText}`);
    } else {
      const data = await res.json();
      if (data.status === 'ok') {
        pass(
          'Backend /health Check',
          `HTTP 200 OK (${latency}ms) - Service: "${data.service}", DemoMode: ${data.demoMode}`
        );
      } else {
        fail('Backend /health Check', `Expected status "ok", got "${data.status}"`);
      }
    }
  } catch (err) {
    fail('Backend /health Check', err.message);
  }

  // -------------------------------------------------------------------------
  // TEST 2: CORS Header Check
  // -------------------------------------------------------------------------
  try {
    const start = Date.now();
    const res = await fetch(`${backendUrl}/health`, {
      method: 'GET',
      headers: {
        Origin: frontendUrl,
        Accept: 'application/json'
      }
    });
    const latency = Date.now() - start;

    const allowOrigin = res.headers.get('access-control-allow-origin');
    if (!allowOrigin) {
      fail(
        'Backend CORS Headers',
        `No "access-control-allow-origin" header returned for Origin: ${frontendUrl}`
      );
    } else if (allowOrigin === '*' || allowOrigin === frontendUrl) {
      pass(
        'Backend CORS Header Validation',
        `Access-Control-Allow-Origin: "${allowOrigin}" matches frontend URL (${latency}ms)`
      );
    } else {
      fail(
        'Backend CORS Header Validation',
        `Access-Control-Allow-Origin was "${allowOrigin}", expected "${frontendUrl}" or "*"`
      );
    }
  } catch (err) {
    fail('Backend CORS Header Validation', err.message);
  }

  // -------------------------------------------------------------------------
  // TEST 3: Frontend Availability
  // -------------------------------------------------------------------------
  try {
    const start = Date.now();
    const res = await fetch(frontendUrl, {
      method: 'GET',
      headers: { Accept: 'text/html' }
    });
    const latency = Date.now() - start;

    if (res.ok) {
      pass('Frontend Availability', `HTTP 200 OK (${latency}ms) at ${frontendUrl}`);
    } else {
      fail('Frontend Availability', `HTTP ${res.status} ${res.statusText}`);
    }
  } catch (err) {
    fail('Frontend Availability', err.message);
  }

  // -------------------------------------------------------------------------
  // TEST 4: Part 5 - Sample Opportunity Parse
  // -------------------------------------------------------------------------
  const sampleOpportunityText =
    '2nd or 3rd-year B.Tech/B.E. student. CGPA 7.5 or above. Skills: HTML, CSS, JavaScript. Resume required. Portfolio or GitHub link required. Available for 8 weeks.';
  const sampleOpportunityTitle = 'Summer Engineering Intern (Benchmark PS-03)';

  try {
    const start = Date.now();
    const res = await fetch(`${backendUrl}/api/parse-opportunity`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Origin: frontendUrl
      },
      body: JSON.stringify({
        opportunityText: sampleOpportunityText,
        opportunityTitle: sampleOpportunityTitle
      })
    });
    const latency = Date.now() - start;

    if (!res.ok) {
      fail('Part 5: Sample Opportunity Parse', `HTTP ${res.status} ${res.statusText}`);
    } else {
      const data = await res.json();
      if (!Array.isArray(data.requirements)) {
        fail('Part 5: Sample Opportunity Parse', 'Expected requirements array in response');
      } else if (data.requirements.length !== 6) {
        fail(
          'Part 5: Sample Opportunity Parse',
          `Expected 6 benchmark requirements, got ${data.requirements.length}`
        );
      } else {
        pass(
          'Part 5: Sample Opportunity Parse',
          `Parsed 6/6 requirements correctly in ${latency}ms: [${data.requirements.map((r) => r.title).join(', ')}]`
        );
      }
    }
  } catch (err) {
    fail('Part 5: Sample Opportunity Parse', err.message);
  }

  // -------------------------------------------------------------------------
  // TEST 5: Part 6 - Sample Evaluation Benchmark Comparison
  // Expected: 3 Match, 1 Mismatch, 2 Missing info, "Not ready to apply yet"
  // -------------------------------------------------------------------------
  const sampleStudentProfile = {
    id: 'student-benchmark-01',
    name: 'Alex Sharma',
    degree: 'B.Tech CSE',
    yearOfStudy: 2,
    cgpa: 8.2,
    skills: ['HTML', 'CSS', 'Python'],
    hasResume: true,
    resumeUrl: 'https://storage.example.com/resumes/alex-sharma.pdf',
    githubUrl: '',
    portfolioUrl: '',
    availabilityWeeks: null,
    projects: [
      {
        title: 'Personal Portfolio Site',
        description: 'Static website built using HTML and modern CSS styling.',
        techStack: ['HTML', 'CSS']
      },
      {
        title: 'Data Analysis Scripts',
        description: 'Automated data scraping and analysis toolkit in Python.',
        techStack: ['Python']
      }
    ]
  };

  try {
    const start = Date.now();
    const res = await fetch(`${backendUrl}/api/evaluate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Origin: frontendUrl
      },
      body: JSON.stringify({
        opportunityText: sampleOpportunityText,
        opportunityTitle: sampleOpportunityTitle,
        profile: sampleStudentProfile
      })
    });
    const latency = Date.now() - start;

    if (!res.ok) {
      fail('Part 6: Sample Evaluation Result', `HTTP ${res.status} ${res.statusText}`);
    } else {
      const data = await res.json();
      const { summary, checklist } = data;

      if (!summary || !Array.isArray(checklist)) {
        fail('Part 6: Sample Evaluation Result', 'Invalid response format (missing summary or checklist)');
      } else {
        const matchesCount = summary.matches;
        const mismatchesCount = summary.mismatches;
        const missingInfoCount = summary.missingInfo;
        const verdict = summary.overallVerdict;

        const isCountsCorrect =
          matchesCount === 3 && mismatchesCount === 1 && missingInfoCount === 2;
        const isVerdictCorrect = verdict === 'Not ready to apply yet';

        // Check specific statuses
        const yearItem = checklist.find((c) => c.requirementId === 'req-year');
        const cgpaItem = checklist.find((c) => c.requirementId === 'req-cgpa');
        const skillsItem = checklist.find((c) => c.requirementId === 'req-skills');
        const resumeItem = checklist.find((c) => c.requirementId === 'req-resume');
        const linkItem = checklist.find((c) => c.requirementId === 'req-portfolio-github');
        const availItem = checklist.find((c) => c.requirementId === 'req-availability');

        const isStatusesCorrect =
          yearItem?.status === 'Match' &&
          cgpaItem?.status === 'Match' &&
          skillsItem?.status === 'Mismatch' &&
          resumeItem?.status === 'Match' &&
          linkItem?.status === 'Missing info' &&
          availItem?.status === 'Missing info';

        if (isCountsCorrect && isVerdictCorrect && isStatusesCorrect) {
          pass(
            'Part 6: Benchmark Comparison Engine',
            `Verified 3 Match, 1 Mismatch, 2 Missing info | Verdict: "${verdict}" (${latency}ms)`
          );
        } else {
          fail(
            'Part 6: Benchmark Comparison Engine',
            `Summary mismatch: Got Matches=${matchesCount} (exp 3), Mismatches=${mismatchesCount} (exp 1), Missing=${missingInfoCount} (exp 2), Verdict="${verdict}"`
          );
        }
      }
    }
  } catch (err) {
    fail('Part 6: Sample Evaluation Result', err.message);
  }

  // -------------------------------------------------------------------------
  // FINAL SUMMARY
  // -------------------------------------------------------------------------
  const totalDuration = ((Date.now() - overallStart) / 1000).toFixed(2);
  console.log('----------------------------------------------------------------------');
  console.log(`SMOKE TEST RESULTS: ${testsPassed} passed, ${testsFailed} failed in ${totalDuration}s`);

  if (testsFailed > 0) {
    console.error('\x1b[31m✗ SOME SMOKE TESTS FAILED. Please review the errors above.\x1b[0m');
    process.exit(1);
  } else {
    console.log('\x1b[32m✓ ALL SMOKE TESTS PASSED! Deployment is verified and operational.\x1b[0m');
    console.log('======================================================================\n');
    process.exit(0);
  }
}

runSmokeTests();
