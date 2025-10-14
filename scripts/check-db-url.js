#!/usr/bin/env node
/**
 * Check and fix DATABASE_URL encoding
 */

require('dotenv').config();

const dbUrl = process.env.DATABASE_URL;
const directUrl = process.env.DIRECT_URL;

if (!dbUrl) {
  console.error('❌ DATABASE_URL not found in .env');
  process.exit(1);
}

console.log('🔍 Checking DATABASE_URL encoding...\n');

// Parse the URL
try {
  const url = new URL(dbUrl);

  console.log('✅ URL Structure:');
  console.log(`   Protocol: ${url.protocol}`);
  console.log(`   Username: ${url.username}`);
  console.log(`   Password: ${url.password ? '[REDACTED - ' + url.password.length + ' chars]' : 'MISSING'}`);
  console.log(`   Host: ${url.hostname}`);
  console.log(`   Port: ${url.port || 'default (5432)'}`);
  console.log(`   Database: ${url.pathname.substring(1)}`);
  console.log(`   SSL Mode: ${url.searchParams.get('sslmode') || 'not specified'}`);

  // Check if password needs encoding
  if (url.password) {
    const encoded = encodeURIComponent(url.password);
    if (encoded !== url.password) {
      console.log('\n⚠️  Password contains special characters that should be URL-encoded!');
      console.log(`   Original length: ${url.password.length}`);
      console.log(`   Encoded length: ${encoded.length}`);

      // Construct properly encoded URLs
      const fixedDbUrl = `postgresql://${url.username}:${encoded}@${url.host}${url.pathname}${url.search}`;

      console.log('\n📝 Use these CORRECTED URLs in Netlify:\n');
      console.log('DATABASE_URL=');
      console.log(fixedDbUrl);

      if (directUrl) {
        const directUrlObj = new URL(directUrl);
        const directEncoded = encodeURIComponent(directUrlObj.password);
        const fixedDirectUrl = `postgresql://${directUrlObj.username}:${directEncoded}@${directUrlObj.host}${directUrlObj.pathname}${directUrlObj.search}`;
        console.log('\nDIRECT_URL=');
        console.log(fixedDirectUrl);
      }
    } else {
      console.log('\n✅ Password is already properly encoded (or has no special characters)');
      console.log('\n📝 Use these URLs in Netlify (without quotes):\n');
      console.log('DATABASE_URL=');
      console.log(dbUrl);
      if (directUrl) {
        console.log('\nDIRECT_URL=');
        console.log(directUrl);
      }
    }
  }

  console.log('\n⚠️  IMPORTANT: When setting in Netlify:');
  console.log('   1. Remove the quotes from the URL');
  console.log('   2. Copy the ENTIRE URL including postgresql://');
  console.log('   3. Do NOT add extra quotes in Netlify UI');

} catch (error) {
  console.error('❌ Invalid URL format:', error.message);
  console.error('\nCurrent DATABASE_URL value (first 50 chars):');
  console.error(dbUrl.substring(0, 50) + '...');
  process.exit(1);
}
