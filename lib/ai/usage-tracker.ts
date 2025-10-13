import PlaygroundReport from '../db/models/PlaygroundReport';
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

    // Update report with atomic operations
    await PlaygroundReport.findByIdAndUpdate(
      reportId,
      {
        $inc: {
          'usage.totalTokens': totalTokens,
          'usage.totalCost': totalCost,
        },
        $push: {
          'usage.operations': {
            type,
            timestamp: new Date(),
            model,
            provider,
            inputTokens,
            outputTokens,
            cost: totalCost,
          },
        },
      },
      { upsert: false }
    );
  } catch (error) {
    console.error('Error tracking usage:', error);
    // Don't throw - usage tracking shouldn't break the main flow
  }
}
