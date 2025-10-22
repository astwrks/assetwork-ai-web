import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { connectToDatabase } from '@/lib/db/mongodb';
import PlaygroundReport from '@/lib/db/models/PlaygroundReport';
import Thread from '@/lib/db/models/Thread';
import puppeteer from 'puppeteer';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

// AssetWorks brand colors
const BRAND_COLORS = {
  primaryNavy: '#1B2951',
  deepBlue: '#405D80',
  selectionBlueGray: '#6C7B95',
  heavyText: '#2C3E50',
  lightGray: '#F8F9FA',
  borderGray: '#E9ECEF',
  dangerRed: '#DC3545',
};

// Generate branded HTML template
function generateBrandedHTML(report: any, thread: any): string {
  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Financial Report - AssetWorks</title>
  <style>
    @page {
      margin: 0.75in;
      size: letter;
    }

    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: 'Euclid Circular A', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      font-size: 11pt;
      line-height: 1.6;
      color: ${BRAND_COLORS.heavyText};
      background: white;
    }

    /* Header */
    .pdf-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-bottom: 1.5rem;
      margin-bottom: 2rem;
      border-bottom: 3px solid ${BRAND_COLORS.primaryNavy};
    }

    .logo-section {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .logo-box {
      width: 48px;
      height: 48px;
      background: linear-gradient(135deg, ${BRAND_COLORS.primaryNavy} 0%, ${BRAND_COLORS.deepBlue} 100%);
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .logo-icon {
      width: 28px;
      height: 28px;
      stroke: white;
      stroke-width: 2.5;
      fill: none;
    }

    .company-name {
      font-size: 24pt;
      font-weight: 700;
      color: ${BRAND_COLORS.primaryNavy};
    }

    .report-meta {
      text-align: right;
      font-size: 9pt;
      color: ${BRAND_COLORS.selectionBlueGray};
    }

    .report-meta strong {
      color: ${BRAND_COLORS.primaryNavy};
      font-weight: 600;
    }

    /* Title Section */
    .report-title {
      margin-bottom: 2rem;
    }

    .report-title h1 {
      font-size: 28pt;
      font-weight: 700;
      color: ${BRAND_COLORS.primaryNavy};
      margin-bottom: 0.5rem;
    }

    .report-subtitle {
      font-size: 12pt;
      color: ${BRAND_COLORS.selectionBlueGray};
      font-weight: 500;
    }

    /* Key Insights */
    .insights-section {
      margin-bottom: 2rem;
      padding: 1.25rem;
      background: rgba(27, 41, 81, 0.05);
      border-left: 4px solid ${BRAND_COLORS.primaryNavy};
      border-radius: 6px;
    }

    .insights-title {
      font-size: 14pt;
      font-weight: 600;
      color: ${BRAND_COLORS.primaryNavy};
      margin-bottom: 0.75rem;
    }

    .insight-item {
      margin-bottom: 0.5rem;
      padding-left: 1.5rem;
      position: relative;
    }

    .insight-item::before {
      content: '💡';
      position: absolute;
      left: 0;
      top: 0;
    }

    /* Report Content */
    .report-content {
      margin-bottom: 2rem;
    }

    .report-section {
      margin-bottom: 1.5rem;
      page-break-inside: avoid;
    }

    h2 {
      font-size: 16pt;
      font-weight: 600;
      color: ${BRAND_COLORS.primaryNavy};
      margin-bottom: 0.75rem;
      border-bottom: 2px solid ${BRAND_COLORS.borderGray};
      padding-bottom: 0.5rem;
    }

    h3 {
      font-size: 13pt;
      font-weight: 600;
      color: ${BRAND_COLORS.primaryNavy};
      margin: 1rem 0 0.5rem 0;
    }

    p {
      margin-bottom: 0.75rem;
      text-align: justify;
    }

    /* Tables */
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 1rem 0;
      font-size: 10pt;
    }

    thead {
      background: rgba(27, 41, 81, 0.05);
    }

    th {
      padding: 0.75rem;
      text-align: left;
      font-weight: 600;
      color: ${BRAND_COLORS.primaryNavy};
      border-bottom: 2px solid ${BRAND_COLORS.borderGray};
    }

    td {
      padding: 0.75rem;
      border-bottom: 1px solid ${BRAND_COLORS.borderGray};
    }

    tr:hover {
      background: ${BRAND_COLORS.lightGray};
    }

    /* Metric Cards */
    .metric-card {
      padding: 1.25rem;
      background: linear-gradient(135deg, ${BRAND_COLORS.primaryNavy} 0%, ${BRAND_COLORS.deepBlue} 100%);
      border-radius: 8px;
      color: white;
      margin-bottom: 1rem;
      page-break-inside: avoid;
    }

    .metric-card h3 {
      color: white;
      opacity: 0.9;
      font-size: 11pt;
      margin: 0 0 0.5rem 0;
      border: none;
    }

    .metric-value {
      font-size: 28pt;
      font-weight: 700;
      margin-bottom: 0.25rem;
    }

    .metric-change {
      font-size: 10pt;
      opacity: 0.9;
    }

    /* Footer */
    .pdf-footer {
      margin-top: 3rem;
      padding-top: 1.5rem;
      border-top: 2px solid ${BRAND_COLORS.borderGray};
      font-size: 9pt;
      color: ${BRAND_COLORS.selectionBlueGray};
      text-align: center;
    }

    .footer-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.5rem;
    }

    .footer-branding {
      font-weight: 600;
      color: ${BRAND_COLORS.primaryNavy};
    }

    .confidential-notice {
      background: ${BRAND_COLORS.lightGray};
      padding: 0.75rem;
      border-radius: 4px;
      margin-top: 0.5rem;
      text-align: center;
      font-style: italic;
    }

    /* Data Sources */
    .sources-section {
      margin-top: 2rem;
      padding: 1.25rem;
      background: ${BRAND_COLORS.lightGray};
      border-radius: 6px;
      border-top: 4px solid ${BRAND_COLORS.deepBlue};
      page-break-before: auto;
    }

    .sources-title {
      font-size: 13pt;
      font-weight: 600;
      color: ${BRAND_COLORS.primaryNavy};
      margin-bottom: 0.75rem;
    }

    .sources-list {
      list-style: none;
      padding: 0;
    }

    .sources-list li {
      margin-bottom: 0.5rem;
      padding-left: 1.5rem;
      position: relative;
    }

    .sources-list li::before {
      content: '📊';
      position: absolute;
      left: 0;
    }

    /* Utility Classes */
    .text-center {
      text-align: center;
    }

    .font-bold {
      font-weight: 700;
    }

    .mb-4 {
      margin-bottom: 1rem;
    }
  </style>
</head>
<body>
  <!-- Header -->
  <div class="pdf-header">
    <div class="logo-section">
      <div class="logo-box">
        <svg class="logo-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
          <polyline points="17 6 23 6 23 12"></polyline>
        </svg>
      </div>
      <span class="company-name">AssetWorks</span>
    </div>
    <div class="report-meta">
      <div><strong>Generated:</strong> ${currentDate}</div>
      <div><strong>Thread:</strong> ${thread.title}</div>
      <div><strong>Report ID:</strong> ${report._id.toString().substring(0, 8)}</div>
    </div>
  </div>

  <!-- Title -->
  <div class="report-title">
    <h1>Financial Analysis Report</h1>
    <div class="report-subtitle">${thread.title}</div>
  </div>

  <!-- Key Insights -->
  ${report.insights && report.insights.length > 0 ? `
  <div class="insights-section">
    <div class="insights-title">🔑 Key Insights</div>
    ${report.insights.map((insight: any) => `
      <div class="insight-item">${insight.text}</div>
    `).join('')}
  </div>
  ` : ''}

  <!-- Report Content -->
  <div class="report-content">
    ${report.htmlContent}
  </div>

  <!-- Footer -->
  <div class="pdf-footer">
    <div class="footer-content">
      <div class="footer-branding">© ${new Date().getFullYear()} AssetWorks - Financial Intelligence Platform</div>
      <div>Generated with AI-powered analysis</div>
    </div>
    <div class="confidential-notice">
      This report contains proprietary information and is intended solely for the use of the individual or entity to whom it is addressed.
    </div>
  </div>
</body>
</html>
  `;
}

// POST /api/playground/reports/:reportId/export-pdf - Export report as branded PDF
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ reportId: string }> }
) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return new Response('Unauthorized', { status: 401 });
    }

    await connectToDatabase();

    const { reportId } = await params;

    // Fetch report
    const report = await PlaygroundReport.findById(reportId).lean();
    if (!report) {
      return new Response('Report not found', { status: 404 });
    }

    // Fetch thread for access control and metadata
    const thread = await Thread.findById(report.threadId).lean();
    if (!thread) {
      return new Response('Thread not found', { status: 404 });
    }

    // Check access permissions
    const isOwner = thread.userId === session.user.email;
    const hasAccess = thread.sharedWith.some(
      (share: any) => share.userId === session.user.email
    );

    if (!isOwner && !hasAccess) {
      return new Response('Access denied', { status: 403 });
    }

    // Generate HTML with branding
    const html = generateBrandedHTML(report, thread);

    // Launch Puppeteer
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();
    await page.setContent(html, {
      waitUntil: 'networkidle0',
    });

    // Generate PDF
    const pdfBuffer = await page.pdf({
      format: 'Letter',
      printBackground: true,
      margin: {
        top: '0.75in',
        right: '0.75in',
        bottom: '0.75in',
        left: '0.75in',
      },
    });

    await browser.close();

    // Generate filename
    const filename = `AssetWorks_Report_${thread.title.replace(/[^a-z0-9]/gi, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;

    // Return PDF
    return new Response(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': pdfBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error('Error generating PDF:', error);
    return new Response('Failed to generate PDF', { status: 500 });
  }
}
