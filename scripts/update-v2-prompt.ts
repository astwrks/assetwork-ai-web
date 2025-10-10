import { connectToDatabase } from '../lib/db/mongodb';
import PlaygroundSettings from '../lib/db/models/PlaygroundSettings';

async function updateV2Prompt() {
  try {
    console.log('🔌 Connecting to database...');
    await connectToDatabase();

    console.log('📊 Finding settings with v2 prompt...');
    const settings = await PlaygroundSettings.find({
      'systemPrompts.id': 'web-dashboard-v2',
    });

    console.log(`✅ Found ${settings.length} documents with v2 prompt`);

    for (const setting of settings) {
      const v2Index = setting.systemPrompts.findIndex(
        (p) => p.id === 'web-dashboard-v2'
      );

      if (v2Index !== -1) {
        console.log(`🔄 Removing old v2 prompt for ${setting.userId}...`);
        setting.systemPrompts.splice(v2Index, 1);
        await setting.save();
        console.log(`✅ Removed. User can get new prompt on next refresh.`);
      }
    }

    console.log('\n🎉 Update complete!');
    console.log('👉 The new prompt will be added automatically from defaults when user refreshes.');

    process.exit(0);
  } catch (error) {
    console.error('❌ Update failed:', error);
    process.exit(1);
  }
}

updateV2Prompt();
