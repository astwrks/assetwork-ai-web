import { prisma } from '@/lib/db/prisma';
import { processReportEntities } from './entity-processor';

/**
 * Sync MongoDB PlaygroundReport to Prisma reports table
 * and trigger entity extraction
 */
export async function syncReportToPrisma(mongoReport: {
  _id: string;
  threadId: string;
  htmlContent: string;
  metadata?: {
    generatedBy?: string;
    prompt?: string;
    [key: string]: any;
  };
}): Promise<string | null> {
  try {
    console.log(`Syncing MongoDB report ${mongoReport._id} to Prisma...`);

    const reportId = mongoReport._id.toString();
    const userId = mongoReport.metadata?.generatedBy || 'unknown';

    // Extract title from prompt or use default
    const title = mongoReport.metadata?.prompt
      ? mongoReport.metadata.prompt.substring(0, 200)
      : 'Generated Report';

    // Check if user exists in Prisma, if not create a placeholder
    let prismaUser = await prisma.users.findUnique({
      where: { email: userId },
      select: { id: true },
    });

    if (!prismaUser) {
      // Create placeholder user (this should ideally come from NextAuth)
      console.log(`Creating placeholder user for ${userId}...`);
      prismaUser = await prisma.users.create({
        data: {
          id: `user_${Date.now()}`,
          email: userId,
          name: userId.split('@')[0] || 'User',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });
    }

    // Upsert report in Prisma
    const prismaReport = await prisma.reports.upsert({
      where: { id: reportId },
      update: {
        htmlContent: mongoReport.htmlContent,
        updatedAt: new Date(),
        metadata: mongoReport.metadata || {},
      },
      create: {
        id: reportId,
        userId: prismaUser.id,
        threadId: mongoReport.threadId,
        title,
        htmlContent: mongoReport.htmlContent,
        status: 'PUBLISHED',
        metadata: mongoReport.metadata || {},
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    console.log(`✅ Report synced to Prisma: ${prismaReport.id}`);

    // Trigger entity extraction in background (don't await)
    processReportEntities(prismaReport.id, prismaReport.htmlContent)
      .then(() => {
        console.log(`✅ Entity extraction completed for report ${prismaReport.id}`);
      })
      .catch((error) => {
        console.error(`❌ Entity extraction failed for report ${prismaReport.id}:`, error);
      });

    return prismaReport.id;
  } catch (error) {
    console.error('Failed to sync report to Prisma:', error);
    return null;
  }
}

/**
 * Get Prisma user ID from email (used by entity extraction service)
 */
export async function getPrismaUserIdFromEmail(email: string): Promise<string | null> {
  try {
    const user = await prisma.users.findUnique({
      where: { email },
      select: { id: true },
    });
    return user?.id || null;
  } catch (error) {
    console.error('Failed to get Prisma user ID:', error);
    return null;
  }
}
