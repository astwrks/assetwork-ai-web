/**
 * Test Financial Data API Connections
 * Tests Alpha Vantage and CoinGecko API connections
 */

import { connectToDatabase } from '../lib/db/mongodb';
import ApiKey, { decryptApiKey } from '../lib/db/models/ApiKey';
import { alphaVantageService } from '../lib/services/financial-data/alpha-vantage.service';
import { coinGeckoService } from '../lib/services/financial-data/coingecko.service';

async function testFinancialConnections() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await connectToDatabase();
    console.log('✅ Connected to MongoDB\n');

    const userId = 'default-user@assetworks.ai';

    // Test Alpha Vantage
    console.log('📊 Testing Alpha Vantage Connection...');
    const alphaVantageKey = await ApiKey.findOne({
      userId,
      provider: 'alpha_vantage',
    }).select('+encryptedKey');

    if (!alphaVantageKey) {
      console.log('❌ Alpha Vantage key not found in database');
    } else {
      try {
        const decryptedKey = decryptApiKey(alphaVantageKey.encryptedKey);
        console.log(`   Using key: ...${decryptedKey.slice(-4)}`);

        // Create a test service instance
        const AlphaVantageService = alphaVantageService.constructor as any;
        const testService = new AlphaVantageService(decryptedKey);

        console.log('   Testing with AAPL stock quote...');
        const testResult = await testService.getStockQuote('AAPL');

        if (testResult.success && testResult.data) {
          console.log('   ✅ Alpha Vantage connection successful!');
          console.log(`   📈 AAPL: $${testResult.data.price} (${testResult.data.changePercent > 0 ? '+' : ''}${testResult.data.changePercent}%)`);

          // Update database
          alphaVantageKey.connectionStatus = 'connected';
          alphaVantageKey.lastChecked = new Date();
          await alphaVantageKey.save();
          console.log('   💾 Database updated with connection status\n');
        } else {
          console.log(`   ❌ Alpha Vantage connection failed: ${testResult.error}`);
          alphaVantageKey.connectionStatus = 'error';
          alphaVantageKey.lastChecked = new Date();
          await alphaVantageKey.save();
        }
      } catch (error: any) {
        console.log(`   ❌ Alpha Vantage test error: ${error.message}\n`);
        alphaVantageKey.connectionStatus = 'error';
        alphaVantageKey.lastChecked = new Date();
        await alphaVantageKey.save();
      }
    }

    // Test CoinGecko
    console.log('🪙 Testing CoinGecko Connection...');
    const coinGeckoKey = await ApiKey.findOne({
      userId,
      provider: 'coingecko',
    }).select('+encryptedKey');

    if (!coinGeckoKey) {
      console.log('❌ CoinGecko key not found in database');
    } else {
      try {
        const decryptedKey = decryptApiKey(coinGeckoKey.encryptedKey);
        console.log(`   Using key: ...${decryptedKey.slice(-4)}`);

        // Create a test service instance
        const CoinGeckoService = coinGeckoService.constructor as any;
        const testService = new CoinGeckoService(decryptedKey);

        console.log('   Testing with Bitcoin data...');
        const testResult = await testService.getCryptoQuote('bitcoin');

        if (testResult.success && testResult.data) {
          console.log('   ✅ CoinGecko connection successful!');
          console.log(`   ₿ Bitcoin: $${testResult.data.price.toLocaleString()} (${testResult.data.priceChangePercent24h > 0 ? '+' : ''}${testResult.data.priceChangePercent24h.toFixed(2)}%)`);

          // Update database
          coinGeckoKey.connectionStatus = 'connected';
          coinGeckoKey.lastChecked = new Date();
          await coinGeckoKey.save();
          console.log('   💾 Database updated with connection status\n');
        } else {
          console.log(`   ❌ CoinGecko connection failed: ${testResult.error}`);
          coinGeckoKey.connectionStatus = 'error';
          coinGeckoKey.lastChecked = new Date();
          await coinGeckoKey.save();
        }
      } catch (error: any) {
        console.log(`   ❌ CoinGecko test error: ${error.message}\n`);
        coinGeckoKey.connectionStatus = 'error';
        coinGeckoKey.lastChecked = new Date();
        await coinGeckoKey.save();
      }
    }

    // Summary
    console.log('📋 Final Summary:');
    const allKeys = await ApiKey.find({ userId });
    const connected = allKeys.filter(k => k.connectionStatus === 'connected').length;
    const errors = allKeys.filter(k => k.connectionStatus === 'error').length;
    const unknown = allKeys.filter(k => k.connectionStatus === 'unknown').length;

    console.log(`   Total API keys: ${allKeys.length}`);
    console.log(`   ✅ Connected: ${connected}`);
    console.log(`   ❌ Errors: ${errors}`);
    console.log(`   ⚠️  Unknown: ${unknown}\n`);

    allKeys.forEach((key) => {
      const statusIcon = key.connectionStatus === 'connected' ? '✅' :
                        key.connectionStatus === 'error' ? '❌' : '⚠️';
      console.log(`   ${statusIcon} ${key.name} - ${key.connectionStatus}`);
    });

    console.log('\n✅ Connection tests completed!');
    console.log('🌐 Visit http://localhost:3001/settings?tab=api-keys to see the results\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error testing connections:', error);
    process.exit(1);
  }
}

testFinancialConnections();
