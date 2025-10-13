import { connectToDatabase } from '../lib/db/mongodb';
import ApiKey, { encryptApiKey, getKeyPreview } from '../lib/db/models/ApiKey';
import User from '../lib/db/models/User';

// AI Provider Keys Configuration
// Note: Set these via environment variables or update them directly
const AI_KEYS = [
  {
    name: 'OpenAI - $10 Available',
    provider: 'openai',
    apiKey: process.env.OPENAI_API_KEY || '',
    category: 'ai',
    metadata: {
      quotaRemaining: 10,
      model: 'gpt-4',
    },
  },
  {
    name: 'Claude',
    provider: 'anthropic',
    apiKey: process.env.ANTHROPIC_API_KEY || '',
    category: 'ai',
    metadata: {
      model: 'claude-3-sonnet',
    },
  },
  {
    name: 'Grok - $5',
    provider: 'groq',
    apiKey: process.env.GROQ_API_KEY || '',
    category: 'ai',
    metadata: {
      quotaRemaining: 5,
    },
  },
  {
    name: 'Gemini',
    provider: 'google',
    apiKey: process.env.GOOGLE_AI_API_KEY || '',
    category: 'ai',
    metadata: {
      model: 'gemini-pro',
    },
  },
];

async function seedAiKeys() {
  try {
    console.log('🔌 Connecting to database...');
    await connectToDatabase();
    console.log('✅ Connected to database');

    // Find the first user (you can modify this to find a specific user)
    const user = await User.findOne().sort({ createdAt: 1 });

    if (!user) {
      console.error('❌ No users found in database. Please create a user first.');
      console.log('\n💡 Tip: Sign up at http://localhost:3001/auth/signup first');
      process.exit(1);
    }

    console.log(`\n👤 Found user: ${user.email} (ID: ${user._id})`);

    // Delete existing AI keys for this user to avoid duplicates
    const deletedCount = await ApiKey.deleteMany({
      userId: user._id.toString(),
      category: 'ai',
    });

    if (deletedCount.deletedCount > 0) {
      console.log(`🗑️  Removed ${deletedCount.deletedCount} existing AI keys`);
    }

    console.log('\n🔑 Seeding AI provider keys...\n');

    // Add each AI key
    for (const keyData of AI_KEYS) {
      try {
        const encryptedKey = encryptApiKey(keyData.apiKey);
        const keyPreview = getKeyPreview(keyData.apiKey);

        const newKey = await ApiKey.create({
          userId: user._id.toString(),
          name: keyData.name,
          provider: keyData.provider,
          category: keyData.category,
          encryptedKey,
          keyPreview,
          isActive: true,
          usageCount: 0,
          metadata: keyData.metadata,
        });

        console.log(`✅ ${keyData.name}`);
        console.log(`   Provider: ${keyData.provider}`);
        console.log(`   Preview: ${keyPreview}`);
        console.log(`   ID: ${newKey._id}`);
        console.log('');
      } catch (error: any) {
        console.error(`❌ Failed to add ${keyData.name}: ${error.message}`);
      }
    }

    console.log('🎉 AI keys seeded successfully!');
    console.log('\n📍 View them at: http://localhost:3001/settings?tab=ai-models');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding AI keys:', error);
    process.exit(1);
  }
}

// Run the seeder
seedAiKeys();
