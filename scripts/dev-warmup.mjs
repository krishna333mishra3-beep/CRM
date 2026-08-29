import { spawn } from 'child_process';
import http from 'http';

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || 'localhost';
const BASE_URL = `http://${HOST}:${PORT}`;

const ROUTES = [
  '/',
  '/dashboard',
  '/leads',
  '/deals',
  '/reports',
  '/contacts',
  '/settings',
  '/activities',
  '/companies',
  '/pipeline',
  '/tasks',
  '/admins-room',
  '/login',
  '/signup',
];

console.log('\x1b[36m%s\x1b[0m', '🚀 [CRM Dev Server] Starting Next.js with Turbopack...');

// Spawn Next.js dev server
const nextArgs = ['dev'];
if (!process.env.NO_TURBO) {
  nextArgs.push('--turbo');
}
if (process.env.PORT) {
  nextArgs.push('-p', process.env.PORT);
}

const child = spawn('npx', ['next', ...nextArgs], {
  stdio: 'inherit',
  shell: true,
  env: process.env,
});

child.on('error', (err) => {
  console.error('\x1b[31m%s\x1b[0m', `Failed to start Next.js dev server: ${err.message}`);
  process.exit(1);
});

child.on('exit', (code) => {
  process.exit(code || 0);
});

// Function to check if dev server is up
function checkServerReady() {
  return new Promise((resolve) => {
    const req = http.get(BASE_URL, (res) => {
      resolve(true);
    });
    req.on('error', () => {
      resolve(false);
    });
    req.end();
  });
}

// Function to fetch a single route to trigger Next.js route compilation
function warmupRoute(route) {
  return new Promise((resolve) => {
    const startTime = Date.now();
    const req = http.get(`${BASE_URL}${route}`, (res) => {
      // Consume response data to free memory
      res.on('data', () => {});
      res.on('end', () => {
        const elapsed = Date.now() - startTime;
        console.log(`\x1b[32m✔\x1b[0m [Warmup] Pre-compiled \x1b[1m${route}\x1b[0m (${res.statusCode}) in ${elapsed}ms`);
        resolve(true);
      });
    });
    req.on('error', (err) => {
      console.warn(`\x1b[33m⚠\x1b[0m [Warmup] Could not pre-compile ${route}: ${err.message}`);
      resolve(false);
    });
    req.end();
  });
}

// Warmup logic once server is online
async function startWarmup() {
  console.log('\x1b[35m%s\x1b[0m', '⏳ [CRM Dev Server] Waiting for server to become responsive...');
  
  let isReady = false;
  const maxAttempts = 60;
  for (let i = 0; i < maxAttempts; i++) {
    isReady = await checkServerReady();
    if (isReady) break;
    await new Promise((r) => setTimeout(r, 500));
  }

  if (!isReady) {
    console.warn('\x1b[33m%s\x1b[0m', '⚠ [CRM Dev Server] Warmup timed out waiting for server.');
    return;
  }

  console.log('\x1b[36m%s\x1b[0m', `🔥 [CRM Dev Server] Pre-compiling ${ROUTES.length} CRM routes in background...`);
  
  // Fire requests in parallel to precompile all routes
  const promises = ROUTES.map((route) => warmupRoute(route));
  await Promise.allSettled(promises);

  console.log('\x1b[32m%s\x1b[0m', '✨ [CRM Dev Server] All CRM routes successfully pre-compiled and ready for instant navigation!');
}

// Start warmup in background after small delay
setTimeout(startWarmup, 1000);
