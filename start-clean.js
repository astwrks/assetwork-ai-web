#!/usr/bin/env node

/**
 * Clean Development Server Launcher
 * Starts Next.js with aggressive log filtering
 */

const { spawn } = require('child_process');
const readline = require('readline');

// Patterns to completely hide
const HIDE_PATTERNS = [
  /API_RATE_LIMIT/,
  /Rate limit exceeded/,
  /WebSocket token generation failed/,
  /notifications\.count/,
  /public\.notifications/,
  /TURBOPACK/,
  /prisma\.notifications/,
  /error: WebSocket/,
  /error: Dashboard/,
  /AppError: Rate limit/,
  /at instantiateModule/,
  /at getOrInstantiateModule/,
  /at esmImport/,
  /at TracingChannel/,
  /node:internal/,
  /node_modules/,
  /\.next\/server/,
  /at async/,
  /at Module\._compile/,
  /BashOutput\(Reading shell output/,
  /^\s*at\s+/,  // Stack trace lines
  /^\s*{\s*$/,   // Opening braces
  /^\s*}\s*$/,   // Closing braces
];

// Patterns to show in condensed form
const CONDENSE_PATTERNS = [
  { pattern: /GET\s+\/api\/auth\/session\s+200/, replace: '✓ Auth' },
  { pattern: /GET\s+\/financial-playground\s+200/, replace: '✓ Page' },
  { pattern: /GET\s+\/dashboard\s+200/, replace: '✓ Dashboard' },
  { pattern: /POST\s+\/api\/auth\/callback\/credentials\s+200/, replace: '✓ Login' },
];

console.clear();
console.log('🚀 AssetWorks Clean Dev Server');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('📍 http://localhost:3001');
console.log('🧹 Verbose logging suppressed');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

// Start Next.js dev server
const next = spawn('npm', ['run', 'dev'], {
  env: {
    ...process.env,
    NODE_ENV: 'development',
    LOG_LEVEL: 'error',
    NEXT_TELEMETRY_DISABLED: '1',
  },
  shell: true,
});

// Process stdout
const rlOut = readline.createInterface({
  input: next.stdout,
  crlfDelay: Infinity
});

rlOut.on('line', (line) => {
  // Skip lines that match hide patterns
  if (HIDE_PATTERNS.some(pattern => pattern.test(line))) {
    return;
  }

  // Check for condensable patterns
  for (const { pattern, replace } of CONDENSE_PATTERNS) {
    if (pattern.test(line)) {
      console.log(replace);
      return;
    }
  }

  // Show important lines
  if (line.includes('✓') || line.includes('ready') || line.includes('compiled')) {
    console.log(line);
  } else if (line.includes('⚠') || line.includes('warn')) {
    console.log('⚠️ ', line.substring(0, 80)); // Truncate warnings
  } else if (line.includes('✗') || line.includes('error')) {
    // For errors, show only the first part
    if (!line.includes('at ') && !line.includes('node_modules')) {
      console.log('❌', line.substring(0, 100));
    }
  }
});

// Process stderr (but filter it too)
const rlErr = readline.createInterface({
  input: next.stderr,
  crlfDelay: Infinity
});

rlErr.on('line', (line) => {
  // Skip verbose error output
  if (HIDE_PATTERNS.some(pattern => pattern.test(line))) {
    return;
  }

  // Show only first line of errors
  if (line && !line.includes('at ') && !line.includes('node_modules')) {
    console.error('❌', line.substring(0, 100));
  }
});

// Handle exit
next.on('close', (code) => {
  console.log(`\n🛑 Server stopped with code ${code}`);
  process.exit(code);
});

// Handle Ctrl+C
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down...');
  next.kill('SIGINT');
  process.exit(0);
});