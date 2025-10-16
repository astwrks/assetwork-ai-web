/**
 * Report Export API Endpoint
 * Handles exporting reports to various formats (PDF, DOCX, Markdown)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { prisma } from '@/lib/db/prisma';
import { ErrorHandler, AppErrors, LoggingService, PerformanceMonitor } from '@/lib/services/error-logging.service';
import puppeteer from 'puppeteer';
import { CacheService } from '@/lib/services/redis.service';

// Validation schema
const ExportSchema = z.object({
  format: z.enum(['pdf', 'docx', 'markdown', 'html']).default('pdf'),
  includeMetadata: z.boolean().default(true),
  includeCharts: z.boolean().default(true),
});

/**
 * POST /api/v2/reports/[reportId]/export
 * Export a report to specified format
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { reportId: string } }
) {
  const operationId = `report-export-${Date.now()}`;
  PerformanceMonitor.start(operationId);

  try {
    // Authentication
    const session = await getServerSession();
    if (!session?.user?.email) {
      throw AppErrors.UNAUTHORIZED;
    }

    // Get user
    const user = await prisma.users.findUnique({
      where: { email: session.user.email },
      select: { id: true, name: true },
    });

    if (!user) {
      throw new AppErrors.NOT_FOUND('User not found');
    }

    const reportId = params.reportId;

    // Parse and validate request
    const body = await request.json().catch(() => ({}));
    const validated = ExportSchema.parse(body);

    // Fetch report with thread info
    const report = await prisma.playground_reports.findFirst({
      where: {
        id: reportId,
        threads: {
          userId: user.id,
        },
      },
      include: {
        threads: {
          select: {
            title: true,
            description: true,
          },
        },
      },
    });

    if (!report) {
      throw new AppErrors.NOT_FOUND('Report not found');
    }

    // Check cache for already generated export
    const cacheKey = `export:${reportId}:${validated.format}`;
    const cached = await CacheService.get(cacheKey);
    if (cached && typeof cached === 'string') {
      // Return cached export
      const buffer = Buffer.from(cached, 'base64');

      const headers: HeadersInit = {
        'Content-Type': getContentType(validated.format),
        'Content-Disposition': `attachment; filename="report-${reportId}.${validated.format}"`,
      };

      return new NextResponse(buffer, {
        status: 200,
        headers,
      });
    }

    let exportBuffer: Buffer;

    switch (validated.format) {
      case 'pdf':
        exportBuffer = await exportToPDF(report, user);
        break;

      case 'markdown':
        exportBuffer = await exportToMarkdown(report, user);
        break;

      case 'html':
        exportBuffer = await exportToHTML(report, user);
        break;

      case 'docx':
        // TODO: Implement DOCX export with a library like docx
        throw new Error('DOCX export not yet implemented');

      default:
        throw new Error('Unsupported export format');
    }

    // Cache the export for 1 hour
    await CacheService.set(cacheKey, exportBuffer.toString('base64'), 3600);

    const duration = PerformanceMonitor.end(operationId, {
      userId: user.id,
      reportId,
      format: validated.format,
      size: exportBuffer.length,
    });

    LoggingService.info('Report exported', {
      userId: user.id,
      reportId,
      format: validated.format,
      size: exportBuffer.length,
      duration,
    });

    // Return the export
    const headers: HeadersInit = {
      'Content-Type': getContentType(validated.format),
      'Content-Disposition': `attachment; filename="report-${reportId}.${validated.format}"`,
      'X-Processing-Time': duration.toString(),
    };

    return new NextResponse(exportBuffer, {
      status: 200,
      headers,
    });
  } catch (error) {
    const duration = PerformanceMonitor.end(operationId);

    LoggingService.error('Report export failed', error as Error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid export parameters',
          details: error.errors,
        },
        { status: 400 }
      );
    }

    if (error instanceof Error && 'statusCode' in error) {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
        },
        { status: (error as any).statusCode }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to export report',
      },
      { status: 500 }
    );
  }
}

/**
 * Export report to PDF using Puppeteer
 */
async function exportToPDF(report: any, user: any): Promise<Buffer> {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const page = await browser.newPage();

    // Create HTML content with styling
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>${report.threads.title}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }

            body {
              font-family: 'Inter', sans-serif;
              color: #1a1a1a;
              line-height: 1.6;
              padding: 40px;
            }

            .header {
              border-bottom: 2px solid #3b82f6;
              padding-bottom: 20px;
              margin-bottom: 30px;
            }

            .logo {
              display: flex;
              align-items: center;
              gap: 10px;
              margin-bottom: 20px;
            }

            .logo-icon {
              width: 40px;
              height: 40px;
              background: #3b82f6;
              border-radius: 8px;
              display: flex;
              align-items: center;
              justify-content: center;
              color: white;
              font-weight: bold;
              font-size: 20px;
            }

            .logo-text {
              font-size: 24px;
              font-weight: 700;
              color: #1a1a1a;
            }

            h1 {
              font-size: 32px;
              font-weight: 700;
              margin-bottom: 10px;
              color: #1a1a1a;
            }

            .metadata {
              display: flex;
              gap: 20px;
              color: #666;
              font-size: 14px;
            }

            .content {
              margin-top: 30px;
            }

            h2 {
              font-size: 24px;
              font-weight: 600;
              margin: 30px 0 15px 0;
              color: #2563eb;
            }

            h3 {
              font-size: 18px;
              font-weight: 600;
              margin: 20px 0 10px 0;
              color: #1a1a1a;
            }

            p {
              margin-bottom: 15px;
              line-height: 1.8;
            }

            ul, ol {
              margin-bottom: 15px;
              padding-left: 30px;
            }

            li {
              margin-bottom: 8px;
            }

            table {
              width: 100%;
              border-collapse: collapse;
              margin: 20px 0;
            }

            th, td {
              border: 1px solid #e5e7eb;
              padding: 12px;
              text-align: left;
            }

            th {
              background: #f3f4f6;
              font-weight: 600;
            }

            .footer {
              margin-top: 50px;
              padding-top: 20px;
              border-top: 1px solid #e5e7eb;
              text-align: center;
              color: #666;
              font-size: 12px;
            }

            .badge {
              display: inline-block;
              padding: 4px 8px;
              background: #eff6ff;
              border: 1px solid #3b82f6;
              border-radius: 4px;
              font-size: 12px;
              color: #3b82f6;
              margin-right: 8px;
            }

            @page {
              margin: 1in;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="logo">
              <div class="logo-icon">A</div>
              <div class="logo-text">AssetWorks</div>
            </div>
            <h1>${report.threads.title}</h1>
            ${report.threads.description ? `<p style="color: #666; margin-top: 10px;">${report.threads.description}</p>` : ''}
            <div class="metadata">
              <span>Generated by: ${user.name || user.email}</span>
              <span>Date: ${new Date(report.createdAt).toLocaleDateString()}</span>
              <span>Model: ${report.model || 'Claude 3 Opus'}</span>
              ${report.totalTokens ? `<span>Tokens: ${report.totalTokens.toLocaleString()}</span>` : ''}
            </div>
          </div>

          <div class="content">
            ${report.htmlContent}
          </div>

          <div class="footer">
            <p>© ${new Date().getFullYear()} AssetWorks - AI-Powered Financial Intelligence</p>
            <p>This report was generated using advanced AI technology and should be reviewed for accuracy.</p>
          </div>
        </body>
      </html>
    `;

    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

    // Generate PDF
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      preferCSSPageSize: true,
    });

    return Buffer.from(pdfBuffer);
  } finally {
    await browser.close();
  }
}

/**
 * Export report to Markdown
 */
async function exportToMarkdown(report: any, user: any): Promise<Buffer> {
  // Convert HTML to Markdown (simplified - you might want to use a proper HTML to Markdown converter)
  let markdown = `# ${report.threads.title}\n\n`;

  if (report.threads.description) {
    markdown += `> ${report.threads.description}\n\n`;
  }

  markdown += `---\n\n`;
  markdown += `**Generated by:** ${user.name || user.email}  \n`;
  markdown += `**Date:** ${new Date(report.createdAt).toLocaleDateString()}  \n`;
  markdown += `**Model:** ${report.model || 'Claude 3 Opus'}  \n`;

  if (report.totalTokens) {
    markdown += `**Tokens:** ${report.totalTokens.toLocaleString()}  \n`;
  }

  markdown += `\n---\n\n`;

  // Simple HTML to Markdown conversion (you might want to use a library like turndown)
  let content = report.htmlContent;
  content = content.replace(/<h1[^>]*>(.*?)<\/h1>/g, '# $1\n\n');
  content = content.replace(/<h2[^>]*>(.*?)<\/h2>/g, '## $1\n\n');
  content = content.replace(/<h3[^>]*>(.*?)<\/h3>/g, '### $1\n\n');
  content = content.replace(/<p[^>]*>(.*?)<\/p>/g, '$1\n\n');
  content = content.replace(/<strong[^>]*>(.*?)<\/strong>/g, '**$1**');
  content = content.replace(/<em[^>]*>(.*?)<\/em>/g, '*$1*');
  content = content.replace(/<li[^>]*>(.*?)<\/li>/g, '- $1\n');
  content = content.replace(/<[^>]+>/g, ''); // Remove remaining HTML tags

  markdown += content;

  markdown += `\n\n---\n\n`;
  markdown += `*© ${new Date().getFullYear()} AssetWorks - AI-Powered Financial Intelligence*\n`;

  return Buffer.from(markdown, 'utf-8');
}

/**
 * Export report to HTML
 */
async function exportToHTML(report: any, user: any): Promise<Buffer> {
  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>${report.threads.title} - AssetWorks Report</title>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
      </head>
      <body class="bg-gray-50 py-8">
        <div class="max-w-4xl mx-auto px-4">
          <div class="bg-white rounded-lg shadow-lg p-8">
            <div class="border-b pb-6 mb-6">
              <div class="flex items-center gap-3 mb-4">
                <div class="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">
                  A
                </div>
                <span class="text-2xl font-bold">AssetWorks</span>
              </div>
              <h1 class="text-3xl font-bold mb-2">${report.threads.title}</h1>
              ${report.threads.description ? `<p class="text-gray-600">${report.threads.description}</p>` : ''}
              <div class="flex gap-4 text-sm text-gray-500 mt-4">
                <span>By: ${user.name || user.email}</span>
                <span>${new Date(report.createdAt).toLocaleDateString()}</span>
              </div>
            </div>

            <div class="prose prose-lg max-w-none">
              ${report.htmlContent}
            </div>

            <div class="border-t pt-6 mt-8 text-center text-sm text-gray-500">
              <p>© ${new Date().getFullYear()} AssetWorks - AI-Powered Financial Intelligence</p>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;

  return Buffer.from(htmlContent, 'utf-8');
}

/**
 * Get content type for format
 */
function getContentType(format: string): string {
  switch (format) {
    case 'pdf':
      return 'application/pdf';
    case 'docx':
      return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    case 'markdown':
      return 'text/markdown';
    case 'html':
      return 'text/html';
    default:
      return 'application/octet-stream';
  }
}