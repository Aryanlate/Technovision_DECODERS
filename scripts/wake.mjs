#!/usr/bin/env node

/**
 * OpportunityKit Manual Wake-up Script
 * Usage:
 *   npm run wake
 *   npm run wake -- https://your-backend.onrender.com
 *   node scripts/wake.mjs https://your-backend.onrender.com
 */

const rawArg = process.argv.slice(2).find((arg) => !arg.startsWith('-'));
const targetBase =
  rawArg ||
  process.env.BACKEND_URL ||
  process.env.RENDER_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  'http://localhost:5000';

const cleanBaseUrl = targetBase.trim().replace(/\/+$/, '');
const healthUrl = cleanBaseUrl.endsWith('/health')
  ? cleanBaseUrl
  : `${cleanBaseUrl}/health`;

console.log('=======================================================');
console.log('   OpportunityKit Backend Wake-up Tool');
console.log('=======================================================');
console.log(`Target URL:      ${healthUrl}`);
console.log('Note: Free Render web services spin down after 15m of');
console.log('inactivity and take ~50-90 seconds to wake on incoming traffic.');
console.log('Sending wake ping and monitoring startup...');
console.log('-------------------------------------------------------');

const MAX_ATTEMPTS = 30;
const RETRY_DELAY_MS = 3000;
const TIMEOUT_PER_REQUEST_MS = 10000;

const startTime = Date.now();

async function pingBackend(attempt) {
  const reqStart = Date.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_PER_REQUEST_MS);

  try {
    const res = await fetch(healthUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'OpportunityKit-WakeScript/1.0'
      },
      signal: controller.signal
    });
    clearTimeout(timer);

    const latency = Date.now() - reqStart;
    const totalElapsed = ((Date.now() - startTime) / 1000).toFixed(1);

    if (res.ok) {
      let body = {};
      try {
        body = await res.json();
      } catch {
        // Non-JSON response
      }

      console.log('\n=======================================================');
      console.log('✓ BACKEND IS AWAKE AND HEALTHY!');
      console.log('=======================================================');
      console.log(`URL:            ${healthUrl}`);
      console.log(`HTTP Status:    ${res.status} ${res.statusText}`);
      console.log(`Service:        ${body.service || 'OpportunityKit Service'}`);
      console.log(`Demo Mode:      ${body.demoMode !== undefined ? body.demoMode : 'N/A'}`);
      console.log(`Request Time:   ${latency}ms`);
      console.log(`Total Time:     ${totalElapsed}s (attempt ${attempt}/${MAX_ATTEMPTS})`);
      console.log('=======================================================\n');
      process.exit(0);
    } else {
      console.log(
        `[${totalElapsed}s] Attempt ${attempt}/${MAX_ATTEMPTS}: Received HTTP ${res.status} (${res.statusText}). Still booting...`
      );
    }
  } catch (err) {
    clearTimeout(timer);
    const totalElapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    const reason = err.name === 'AbortError' ? 'Request timed out (server spinning up)' : err.message;
    console.log(`[${totalElapsed}s] Attempt ${attempt}/${MAX_ATTEMPTS}: ${reason}. Waiting ${RETRY_DELAY_MS / 1000}s...`);
  }

  if (attempt >= MAX_ATTEMPTS) {
    const totalElapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.error('\n=======================================================');
    console.error(`✗ WAKE-UP TIMED OUT AFTER ${totalElapsed}s (${MAX_ATTEMPTS} attempts)`);
    console.error('=======================================================');
    console.error('Troubleshooting checklist:');
    console.error(' 1. Verify the URL is correct and accessible.');
    console.error(' 2. Check the Render dashboard (https://dashboard.render.com).');
    console.error(' 3. In Render logs, ensure the server booted and bound to 0.0.0.0.');
    console.error(' 4. Ensure environment variables (PORT, ALLOWED_ORIGINS) are set.');
    console.error('=======================================================\n');
    process.exit(1);
  }

  setTimeout(() => pingBackend(attempt + 1), RETRY_DELAY_MS);
}

// Start first ping
pingBackend(1);
