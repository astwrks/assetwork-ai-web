/**
 * Next.js Instrumentation
 * Runs on server startup before any other code
 */

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Import and activate console override for cleaner logs
    await import('./lib/utils/console-override');

    console.log('🧹 Clean logging mode activated');
  }
}