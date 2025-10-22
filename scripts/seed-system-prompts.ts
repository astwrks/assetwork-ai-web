import { PrismaClient } from '@prisma/client';
import { PLAYGROUND_SYSTEM_PROMPT } from '../lib/ai/playground-prompt';
import { NO_QUESTIONS_INSTANT_PROMPT } from '../lib/ai/no-questions-prompt';
import { RESEARCH_REPORT_SYSTEM_PROMPT } from '../lib/ai/research-report-prompt';
import { REALTIME_RESEARCH_PROMPT } from '../lib/ai/realtime-research-prompt';
import { nanoid } from 'nanoid';

const prisma = new PrismaClient();

async function seedSystemPrompts() {
  console.log('🌱 Seeding system prompts...');

  try {
    // Delete existing prompts
    const deleted = await prisma.system_prompts.deleteMany({});
    console.log(`  ✓ Cleared ${deleted.count} existing prompts`);

    // Create prompts individually
    const prompt1 = await prisma.system_prompts.create({
      data: {
        id: nanoid(),
        name: 'Financial Report Assistant',
        description: 'Comprehensive HTML financial reports with 15+ sections, charts, and detailed analysis. Generates 2000+ line reports.',
        content: PLAYGROUND_SYSTEM_PROMPT,
        icon: 'Bot',
        isDefault: true,
        isActive: true,
        category: 'financial-analysis',
        metadata: {},
        updatedAt: new Date(),
      },
    });
    console.log(`  ✓ Created: ${prompt1.name} (${prompt1.content.length} chars)`);

    const prompt2 = await prisma.system_prompts.create({
      data: {
        id: nanoid(),
        name: 'Direct Report Generator',
        description: 'Generates reports immediately without asking questions. Perfect for quick analysis.',
        content: NO_QUESTIONS_INSTANT_PROMPT,
        icon: 'Search',
        isDefault: false,
        isActive: true,
        category: 'quick-analysis',
        metadata: {},
        updatedAt: new Date(),
      },
    });
    console.log(`  ✓ Created: ${prompt2.name} (${prompt2.content.length} chars)`);

    const prompt3 = await prisma.system_prompts.create({
      data: {
        id: nanoid(),
        name: 'Research Report Mode',
        description: 'Deep research reports with extensive market analysis and competitive landscape.',
        content: RESEARCH_REPORT_SYSTEM_PROMPT,
        icon: 'Database',
        isDefault: false,
        isActive: true,
        category: 'research',
        metadata: {},
        updatedAt: new Date(),
      },
    });
    console.log(`  ✓ Created: ${prompt3.name} (${prompt3.content.length} chars)`);

    const prompt4 = await prisma.system_prompts.create({
      data: {
        id: nanoid(),
        name: 'Real-time Research',
        description: 'Live market data integration and real-time analysis with current news.',
        content: REALTIME_RESEARCH_PROMPT,
        icon: 'Shield',
        isDefault: false,
        isActive: true,
        category: 'realtime',
        metadata: {},
        updatedAt: new Date(),
      },
    });
    console.log(`  ✓ Created: ${prompt4.name} (${prompt4.content.length} chars)`);

    console.log(`\n✅ Successfully seeded 4 system prompts!`);
  } catch (error) {
    console.error('❌ Error seeding system prompts:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seedSystemPrompts();
