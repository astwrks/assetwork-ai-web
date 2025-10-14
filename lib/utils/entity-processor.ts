import { EntityExtractionService } from '@/lib/services/entity-extraction.service';
import { EntityAggregationService } from '@/lib/services/entity-aggregation.service';

/**
 * Process entities for a report (extract and aggregate)
 * Call this after a report is created or significantly modified
 */
export async function processReportEntities(
  reportId: string,
  htmlContent: string
): Promise<void> {
  try {
    console.log(`Processing entities for report ${reportId}...`);

    // Extract entities from report
    const extractionService = new EntityExtractionService();
    const entities = await extractionService.processEntitiesForReport(
      reportId,
      htmlContent
    );

    if (entities.length === 0) {
      console.log('No entities extracted from report');
      return;
    }

    console.log(`Extracted ${entities.length} entities: ${entities.map(e => e.name).join(', ')}`);

    // Queue aggregation for each entity (in background)
    // Don't await - let this run async
    const aggregationService = new EntityAggregationService();

    // Get unique entity IDs
    const entityIds = new Set<string>();
    for (const entity of entities) {
      // Find entity by slug
      const { prisma } = await import('@/lib/db/prisma');
      const slug = entity.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');

      const dbEntity = await prisma.entities.findUnique({
        where: { slug },
        select: { id: true },
      });

      if (dbEntity) {
        entityIds.add(dbEntity.id);
      }
    }

    // Refresh entity data in background (don't wait)
    entityIds.forEach((entityId) => {
      aggregationService
        .refreshEntity(entityId)
        .catch((err) =>
          console.error(`Failed to refresh entity ${entityId}:`, err)
        );
    });

    console.log(`Queued aggregation for ${entityIds.size} entities`);
  } catch (error) {
    console.error('Failed to process report entities:', error);
    // Don't throw - entity processing shouldn't block report creation
  }
}

/**
 * Extract entities without aggregating (faster, for real-time display)
 */
export async function extractReportEntitiesOnly(
  reportId: string,
  htmlContent: string
): Promise<number> {
  try {
    const extractionService = new EntityExtractionService();
    const entities = await extractionService.processEntitiesForReport(
      reportId,
      htmlContent
    );
    return entities.length;
  } catch (error) {
    console.error('Failed to extract entities:', error);
    return 0;
  }
}
