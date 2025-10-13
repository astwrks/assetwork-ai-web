/**
 * Update Financial API Keys Owner
 * Changes the owner of Alpha Vantage and CoinGecko keys to the correct user
 */

import { connectToDatabase } from '../lib/db/mongodb';
import ApiKey from '../lib/db/models/ApiKey';

async function updateKeysOwner() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await connectToDatabase();
    console.log('✅ Connected to MongoDB\n');

    const oldUserId = 'default-user@assetworks.ai';
    const newUserId = '689735eb7b17ce1be01d0b64'; // Your actual user ID

    console.log('📝 Updating API key ownership...');
    console.log(`   From: ${oldUserId}`);
    console.log(`   To:   ${newUserId}\n`);

    // Update Alpha Vantage
    const alphaResult = await ApiKey.updateOne(
      { userId: oldUserId, provider: 'alpha_vantage' },
      { $set: { userId: newUserId } }
    );
    console.log(`✅ Alpha Vantage: ${alphaResult.modifiedCount} key(s) updated`);

    // Update CoinGecko
    const coinResult = await ApiKey.updateOne(
      { userId: oldUserId, provider: 'coingecko' },
      { $set: { userId: newUserId } }
    );
    console.log(`✅ CoinGecko: ${coinResult.modifiedCount} key(s) updated`);

    // Verify
    console.log('\n📋 Verification:');
    const userKeys = await ApiKey.find({ userId: newUserId });
    console.log(`\nUser ${newUserId} now has ${userKeys.length} API keys:`);
    userKeys.forEach(key => {
      console.log(`  - ${key.name} (${key.provider}) - Status: ${key.connectionStatus || 'unknown'}`);
    });

    console.log('\n✅ Update completed successfully!');
    console.log('🌐 Refresh http://localhost:3001/settings?tab=api-keys to see your keys\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error updating keys:', error);
    process.exit(1);
  }
}

updateKeysOwner();
