import { prisma } from '../db/prisma';
import { calculateCost } from './pricing';

export interface UsageOperation {
  type: 'generation' | 'edit' | 'section_add' | 'suggestion';
  model: string;
  provider: string;
  inputTokens: number;
  outputTokens: number;
}

/**
 * Track AI usage for a report
 */
export async function trackReportUsage(
  reportId: string,
  operation: UsageOperation
): Promise<void> {
  try {
    const { inputTokens, outputTokens, model, provider, type } = operation;

    // Calculate cost
    const { totalCost } = calculateCost(model, inputTokens, outputTokens);
    const totalTokens = inputTokens + outputTokens;

    // Get current report to update usage
    const report = await prisma.playground_reports.findUnique({
      where: { id: reportId },
      select: {
        totalTokens: true,
        totalCost: true,
        operations: true
      }
    });

    if (!report) {
      console.error('Report not found:', reportId);
      return;
    }

    // Create new operation record
    const newOperation = {
      type,
      timestamp: new Date().toISOString(),
      model,
      provider,
      inputTokens,
      outputTokens,
      cost: totalCost,
    };

    // Update with new totals and operations
    await prisma.playground_reports.update({
      where: { id: reportId },
      data: {
        totalTokens: (report.totalTokens || 0) + totalTokens,
        totalCost: (report.totalCost || 0) + totalCost,
        operations: [...((report.operations as any[]) || []), newOperation]
      }
    });
  } catch (error) {
    console.error('Error tracking usage:', error);
    // Don't throw - usage tracking shouldn't break the main flow
  }
}
