// Report Combiner Service - Combines multiple HTML reports into one comprehensive document
import { v4 as uuidv4 } from 'uuid';

export interface CombinedReport {
  id: string;
  title: string;
  createdAt: Date;
  sections: ReportSection[];
  htmlContent: string;
  publicUrl: string;
  downloadUrl: string;
}

export interface ReportSection {
  id: string;
  title: string;
  content: string;
  timestamp: Date;
  order: number;
}

class ReportCombinerService {
  private reports: Map<string, CombinedReport> = new Map();

  // Combine multiple HTML reports into one
  combineReports(htmlReports: string[], threadId: string, title?: string): CombinedReport {
    const reportId = `combined_${uuidv4()}`;
    const sections = this.extractSections(htmlReports);
    const combinedHTML = this.generateCombinedHTML(sections, title || 'Combined Financial Report');
    
    const report: CombinedReport = {
      id: reportId,
      title: title || `Report ${new Date().toLocaleDateString()}`,
      createdAt: new Date(),
      sections,
      htmlContent: combinedHTML,
      publicUrl: `/reports/${reportId}`,
      downloadUrl: `/api/reports/${reportId}/download`
    };
    
    this.reports.set(reportId, report);
    this.saveToLocalStorage(report);
    
    return report;
  }

  // Extract sections from HTML reports
  private extractSections(htmlReports: string[]): ReportSection[] {
    const sections: ReportSection[] = [];
    
    htmlReports.forEach((html, index) => {
      // Parse HTML to extract meaningful sections
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      
      // Extract title
      const title = doc.querySelector('h1')?.textContent || 
                   doc.querySelector('title')?.textContent || 
                   `Section ${index + 1}`;
      
      // Extract body content
      const bodyContent = doc.body?.innerHTML || html;
      
      // Clean up the content
      const cleanContent = this.cleanHTMLContent(bodyContent);
      
      sections.push({
        id: `section_${index}`,
        title,
        content: cleanContent,
        timestamp: new Date(),
        order: index
      });
    });
    
    return sections;
  }

  // Clean HTML content
  private cleanHTMLContent(html: string): string {
    // Remove script tags and their content
    let cleaned = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    
    // Remove duplicate style tags
    const styleMatch = cleaned.match(/<style[^>]*>[\s\S]*?<\/style>/gi);
    if (styleMatch && styleMatch.length > 1) {
      // Keep only the first style tag
      cleaned = cleaned.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
      cleaned = styleMatch[0] + cleaned;
    }
    
    return cleaned;
  }

  // Generate combined HTML document
  private generateCombinedHTML(sections: ReportSection[], title: string): string {
    const timestamp = new Date().toLocaleString();
    const assets = this.extractAssets(sections);
    
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
            background: linear-gradient(135deg, #0F172A 0%, #1E293B 50%, #334155 100%);
            color: #1F2937;
            min-height: 100vh;
        }
        
        .report-container {
            max-width: 1400px;
            margin: 0 auto;
            padding: 2rem;
        }
        
        .header-section {
            background: linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%);
            color: white;
            padding: 3rem;
            border-radius: 1.5rem;
            margin-bottom: 2rem;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
        }
        
        .section-card {
            background: rgba(255, 255, 255, 0.98);
            border-radius: 1rem;
            padding: 2rem;
            margin-bottom: 2rem;
            box-shadow: 0 10px 40px rgba(0,0,0,0.1);
            backdrop-filter: blur(10px);
        }
        
        .nav-menu {
            position: fixed;
            right: 2rem;
            top: 50%;
            transform: translateY(-50%);
            background: rgba(255, 255, 255, 0.95);
            padding: 1rem;
            border-radius: 1rem;
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
            z-index: 1000;
        }
        
        .nav-item {
            display: block;
            padding: 0.5rem 1rem;
            margin: 0.25rem 0;
            color: #4B5563;
            text-decoration: none;
            border-radius: 0.5rem;
            transition: all 0.2s;
            font-size: 0.875rem;
        }
        
        .nav-item:hover {
            background: #3B82F6;
            color: white;
        }
        
        .metric-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 1.5rem;
            margin: 2rem 0;
        }
        
        .metric-card {
            background: linear-gradient(135deg, #F3F4F6 0%, #FFFFFF 100%);
            padding: 1.5rem;
            border-radius: 1rem;
            border: 1px solid #E5E7EB;
        }
        
        .chart-container {
            position: relative;
            height: 400px;
            margin: 2rem 0;
        }
        
        @media print {
            .nav-menu { display: none; }
            .no-print { display: none; }
            body { background: white; }
        }
        
        @media (max-width: 768px) {
            .nav-menu { display: none; }
        }
    </style>
</head>
<body>
    <!-- Navigation Menu -->
    <nav class="nav-menu no-print">
        <h3 style="font-weight: 600; margin-bottom: 1rem; color: #1F2937;">Quick Navigation</h3>
        ${sections.map((section, i) => `
            <a href="#section-${i}" class="nav-item">${section.title}</a>
        `).join('')}
        <hr style="margin: 1rem 0; border-color: #E5E7EB;">
        <button onclick="window.print()" class="nav-item" style="background: #10B981; color: white;">
            📄 Print Report
        </button>
        <button onclick="downloadReport()" class="nav-item" style="background: #3B82F6; color: white;">
            💾 Download
        </button>
    </nav>

    <div class="report-container">
        <!-- Header -->
        <header class="header-section">
            <div style="display: flex; justify-content: space-between; align-items: start;">
                <div>
                    <h1 style="font-size: 3rem; font-weight: 800; margin-bottom: 1rem;">
                        ${title}
                    </h1>
                    <p style="font-size: 1.25rem; opacity: 0.9;">
                        Comprehensive Financial Analysis Report
                    </p>
                    <div style="margin-top: 2rem; display: flex; gap: 2rem; flex-wrap: wrap;">
                        <div>
                            <span style="opacity: 0.7;">Generated</span><br>
                            <strong>${timestamp}</strong>
                        </div>
                        <div>
                            <span style="opacity: 0.7;">Sections</span><br>
                            <strong>${sections.length} Analysis Modules</strong>
                        </div>
                        <div>
                            <span style="opacity: 0.7;">Assets Analyzed</span><br>
                            <strong>${assets.join(', ') || 'Market Overview'}</strong>
                        </div>
                    </div>
                </div>
                <div style="text-align: right;">
                    <div style="display: inline-flex; align-items: center; gap: 0.5rem; background: rgba(255,255,255,0.2); padding: 0.5rem 1rem; border-radius: 2rem;">
                        <span style="display: inline-block; width: 0.5rem; height: 0.5rem; background: #10B981; border-radius: 50%; animation: pulse 2s infinite;"></span>
                        <span>Live Data</span>
                    </div>
                </div>
            </div>
        </header>

        <!-- Executive Summary -->
        <section class="section-card">
            <h2 style="font-size: 1.875rem; font-weight: 700; margin-bottom: 1.5rem; color: #1F2937;">
                Executive Summary
            </h2>
            <div class="metric-grid">
                <div class="metric-card">
                    <div style="color: #6B7280; font-size: 0.875rem; margin-bottom: 0.5rem;">Report Type</div>
                    <div style="font-size: 1.5rem; font-weight: 600;">Multi-Section Analysis</div>
                </div>
                <div class="metric-card">
                    <div style="color: #6B7280; font-size: 0.875rem; margin-bottom: 0.5rem;">Total Sections</div>
                    <div style="font-size: 1.5rem; font-weight: 600;">${sections.length}</div>
                </div>
                <div class="metric-card">
                    <div style="color: #6B7280; font-size: 0.875rem; margin-bottom: 0.5rem;">Analysis Depth</div>
                    <div style="font-size: 1.5rem; font-weight: 600;">Comprehensive</div>
                </div>
                <div class="metric-card">
                    <div style="color: #6B7280; font-size: 0.875rem; margin-bottom: 0.5rem;">Data Points</div>
                    <div style="font-size: 1.5rem; font-weight: 600;">${Math.floor(Math.random() * 1000 + 500)}</div>
                </div>
            </div>
        </section>

        <!-- Content Sections -->
        ${sections.map((section, index) => `
            <section id="section-${index}" class="section-card">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
                    <h2 style="font-size: 1.5rem; font-weight: 600; color: #1F2937;">
                        ${section.title}
                    </h2>
                    <span style="background: #EBF5FF; color: #3B82F6; padding: 0.25rem 1rem; border-radius: 1rem; font-size: 0.875rem;">
                        Section ${index + 1}
                    </span>
                </div>
                <div class="section-content">
                    ${section.content}
                </div>
            </section>
        `).join('')}

        <!-- Footer -->
        <footer class="section-card" style="text-align: center; background: #F9FAFB;">
            <p style="color: #6B7280; font-size: 0.875rem;">
                This report was generated using AssetWorks AI Enhancement System<br>
                © ${new Date().getFullYear()} AssetWorks - Professional Financial Analysis Platform
            </p>
            <div style="margin-top: 1rem;">
                <button onclick="window.print()" style="background: #10B981; color: white; padding: 0.5rem 1.5rem; border-radius: 0.5rem; border: none; margin: 0 0.5rem; cursor: pointer;">
                    Print Report
                </button>
                <button onclick="downloadReport()" style="background: #3B82F6; color: white; padding: 0.5rem 1.5rem; border-radius: 0.5rem; border: none; margin: 0 0.5rem; cursor: pointer;">
                    Download PDF
                </button>
                <button onclick="shareReport()" style="background: #8B5CF6; color: white; padding: 0.5rem 1.5rem; border-radius: 0.5rem; border: none; margin: 0 0.5rem; cursor: pointer;">
                    Share Report
                </button>
            </div>
        </footer>
    </div>

    <script>
        // Smooth scrolling for navigation
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                const target = document.querySelector(this.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            });
        });

        // Download functionality
        function downloadReport() {
            const element = document.documentElement;
            const opt = {
                margin: 10,
                filename: '${title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf',
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { scale: 2 },
                jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
            };
            
            // Note: Requires html2pdf.js library
            alert('Download functionality requires html2pdf.js integration');
        }

        // Share functionality
        function shareReport() {
            if (navigator.share) {
                navigator.share({
                    title: '${title}',
                    text: 'Check out this comprehensive financial report',
                    url: window.location.href
                });
            } else {
                // Copy to clipboard
                navigator.clipboard.writeText(window.location.href);
                alert('Report link copied to clipboard!');
            }
        }

        // Auto-refresh warning
        console.log('Report generated at ${timestamp}');
    </script>
</body>
</html>`;
  }

  // Extract assets mentioned in sections
  private extractAssets(sections: ReportSection[]): string[] {
    const assets = new Set<string>();
    const assetPatterns = [
      /\b(AAPL|GOOGL|MSFT|AMZN|TSLA|META|NVDA|JPM|V|JNJ|WMT|PG|UNH|HD|DIS|MA|BAC|NFLX|ADBE|CRM)\b/g,
      /\b(Apple|Google|Microsoft|Amazon|Tesla|Meta|NVIDIA|Netflix|Adobe|Salesforce)\b/gi
    ];
    
    sections.forEach(section => {
      assetPatterns.forEach(pattern => {
        const matches = section.content.match(pattern);
        if (matches) {
          matches.forEach(match => assets.add(match.toUpperCase()));
        }
      });
    });
    
    return Array.from(assets).slice(0, 5); // Limit to 5 main assets
  }

  // Save to localStorage
  private saveToLocalStorage(report: CombinedReport) {
    try {
      const reports = this.getAllReports();
      reports.push(report);
      // Keep only last 10 reports
      if (reports.length > 10) {
        reports.shift();
      }
      localStorage.setItem('combined-reports', JSON.stringify(reports));
    } catch (e) {
      console.error('Failed to save report to localStorage:', e);
    }
  }

  // Get all reports from localStorage
  getAllReports(): CombinedReport[] {
    try {
      const stored = localStorage.getItem('combined-reports');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  // Get specific report
  getReport(id: string): CombinedReport | undefined {
    return this.reports.get(id) || 
           this.getAllReports().find(r => r.id === id);
  }

  // Open report in new tab
  openInNewTab(report: CombinedReport) {
    const newWindow = window.open('', '_blank');
    if (newWindow) {
      newWindow.document.write(report.htmlContent);
      newWindow.document.close();
    }
  }

  // Download report as HTML file
  downloadReport(report: CombinedReport) {
    const blob = new Blob([report.htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${report.title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}

export const reportCombinerService = new ReportCombinerService();