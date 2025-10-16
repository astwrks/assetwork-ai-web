import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';

const prisma = new PrismaClient();

const DEFAULT_SETTINGS = {
  providers: [
    {
      id: 'anthropic',
      name: 'Anthropic',
      enabled: true,
      models: [
        {
          id: 'claude-3-5-sonnet-20241022',
          name: 'Claude 3.5 Sonnet',
          displayName: 'Claude 3.5 Sonnet',
          enabled: true,
          maxTokens: 8192,
          temperature: 0.7,
        },
      ],
    },
  ],
  systemPrompts: [
    {
      id: 'web-report',
      name: 'Web Report Mode',
      description: 'Generate comprehensive HTML financial reports',
    },
  ],
  activeSystemPromptId: 'web-report',
};

async function fixPlaygroundSettings() {
  try {
    console.log('🔧 Fixing playground settings for all users...');

    // Get all users with playground_settings
    const allSettings = await prisma.playground_settings.findMany();

    console.log(`Found ${allSettings.length} settings records`);

    for (const setting of allSettings) {
      const settingsData = setting.settings as any;

      // Check if providers array exists and is valid
      if (!settingsData?.providers || !Array.isArray(settingsData.providers) || settingsData.providers.length === 0) {
        console.log(`Fixing settings for user: ${setting.userId}`);

        await prisma.playground_settings.update({
          where: { id: setting.id },
          data: {
            settings: {
              ...settingsData,
              ...DEFAULT_SETTINGS,
            },
            updatedAt: new Date(),
          },
        });

        console.log(`✅ Fixed settings for user: ${setting.userId}`);
      } else {
        console.log(`✓ Settings OK for user: ${setting.userId}`);
      }
    }

    console.log('✅ All settings fixed!');
  } catch (error) {
    console.error('Error fixing settings:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixPlaygroundSettings();
