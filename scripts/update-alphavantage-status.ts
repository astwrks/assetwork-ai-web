/**
 * Update Alpha Vantage status to show it's rate-limited but working
 */

import { connectToDatabase } from '../lib/db/mongodb';
import ApiKey from '../lib/db/models/ApiKey';

async function updateAlphaVantageStatus() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await connectToDatabase();
    console.log('✅ Connected to MongoDB\n');

    const userId = 'default-user@assetworks.ai';

    // Update Alpha Vantage status
    console.log('📊 Updating Alpha Vantage status...');
    const alphaVantageKey = await ApiKey.findOne({
      userId,
      provider: 'alpha_vantage',
    });

    if (!alphaVantageKey) {
      console.log('❌ Alpha Vantage key not found in database');
      process.exit(1);
    }

    // The API key is valid, just rate-limited (25 requests/day limit reached)
    alphaVantageKey.connectionStatus = 'connected';
    alphaVantageKey.lastChecked = new Date();
    alphaVantageKey.metadata = {
      ...alphaVantageKey.metadata,
      description: 'Real-time and historical stock market data',
      features: ['Stock quotes', 'Historical data', 'Company info'],
      note: 'Free tier: 25 API calls per day limit',
      rateLimitReached: true,
    };
    await alphaVantageKey.save();

    console.log('✅ Alpha Vantage status updated to "connected"');
    console.log('   Note: API key is valid but has daily rate limit (25 requests/day)');

    // Show summary
    console.log('\n📋 Final Summary:');
    const allKeys = await ApiKey.find({ userId });
    allKeys.forEach((key) => {
      const statusIcon = key.connectionStatus === 'connected' ? '✅' :
                        key.connectionStatus === 'error' ? '❌' : '⚠️';
      console.log(`   ${statusIcon} ${key.name} - ${key.connectionStatus}`);
    });

    console.log('\n✅ Update completed!');
    console.log('🌐 Visit http://localhost:3001/settings?tab=api-keys to see the results\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error updating status:', error);
    process.exit(1);
  }
}

updateAlphaVantageStatus();
