/**
 * Structured Report Generation Service
 * Generates structured JSON reports (placeholder - not fully implemented)
 */

import { ReportGenerationService } from './report-generation.service';

class StructuredReportService {
  /**
   * Generate and save a structured report in JSON format
   * Currently delegates to standard report generation
   */
  async generateAndSaveReport(
    userId: string,
    threadId: string,
    prompt: string,
    options: {
      model?: string;
      maxTokens?: number;
      temperature?: number;
      language?: string;
    }
  ) {
    // For now, use the standard report generation service
    // TODO: Implement proper structured/JSON report generation
    const result = await ReportGenerationService.generateReport(userId, {
      threadId,
      prompt,
      model: options.model || 'claude-3-5-sonnet-20241022',
      maxTokens: options.maxTokens || 4096,
      temperature: options.temperature || 0.7,
      format: 'json',
      stream: false,
    });

    return result;
  }
}

export default new StructuredReportService();
