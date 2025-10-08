import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export interface PDFExportOptions {
  title: string;
  author?: string;
  subject?: string;
  keywords?: string[];
  orientation?: 'portrait' | 'landscape';
  format?: 'a4' | 'letter' | 'legal';
  margins?: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  header?: {
    text: string;
    fontSize: number;
    color: string;
  };
  footer?: {
    text: string;
    fontSize: number;
    color: string;
  };
  pageNumbers?: boolean;
  watermark?: {
    text: string;
    opacity: number;
    angle: number;
  };
}

export class PDFExporter {
  private doc: jsPDF;
  private options: PDFExportOptions;
  private currentPage = 1;
  private totalPages = 0;

  constructor(options: PDFExportOptions) {
    this.options = {
      orientation: 'portrait',
      format: 'a4',
      margins: { top: 20, right: 20, bottom: 20, left: 20 },
      pageNumbers: true,
      ...options,
    };

    this.doc = new jsPDF({
      orientation: this.options.orientation!,
      unit: 'mm',
      format: this.options.format!,
    });
  }

  async exportFromHTML(htmlContent: string, filename?: string): Promise<void> {
    try {
      // Create a temporary container for the HTML content
      const tempContainer = document.createElement('div');
      tempContainer.innerHTML = htmlContent;
      tempContainer.style.position = 'absolute';
      tempContainer.style.left = '-9999px';
      tempContainer.style.top = '0';
      tempContainer.style.width = '210mm'; // A4 width
      tempContainer.style.fontFamily = 'Arial, sans-serif';
      tempContainer.style.fontSize = '12px';
      tempContainer.style.lineHeight = '1.4';
      tempContainer.style.color = '#333';
      tempContainer.style.backgroundColor = '#fff';
      
      document.body.appendChild(tempContainer);

      // Convert HTML to canvas
      const canvas = await html2canvas(tempContainer, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        width: 794, // A4 width in pixels at 96 DPI
        height: tempContainer.scrollHeight,
      });

      // Remove temporary container
      document.body.removeChild(tempContainer);

      // Calculate dimensions
      const imgWidth = this.doc.internal.pageSize.getWidth() - this.options.margins!.left - this.options.margins!.right;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      // Add image to PDF
      const imgData = canvas.toDataURL('image/png');
      this.doc.addImage(imgData, 'PNG', this.options.margins!.left, this.options.margins!.top, imgWidth, imgHeight);

      // Add header and footer
      this.addHeader();
      this.addFooter();

      // Save the PDF
      const finalFilename = filename || `${this.options.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`;
      this.doc.save(finalFilename);

    } catch (error) {
      console.error('Error exporting PDF:', error);
      throw new Error('Failed to export PDF');
    }
  }

  async exportFromElement(element: HTMLElement, filename?: string): Promise<void> {
    try {
      // Convert element to canvas
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        width: element.scrollWidth,
        height: element.scrollHeight,
      });

      // Calculate dimensions
      const imgWidth = this.doc.internal.pageSize.getWidth() - this.options.margins!.left - this.options.margins!.right;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      // Add image to PDF
      const imgData = canvas.toDataURL('image/png');
      this.doc.addImage(imgData, 'PNG', this.options.margins!.left, this.options.margins!.top, imgWidth, imgHeight);

      // Add header and footer
      this.addHeader();
      this.addFooter();

      // Save the PDF
      const finalFilename = filename || `${this.options.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`;
      this.doc.save(finalFilename);

    } catch (error) {
      console.error('Error exporting PDF:', error);
      throw new Error('Failed to export PDF');
    }
  }

  private addHeader(): void {
    if (this.options.header) {
      this.doc.setFontSize(this.options.header.fontSize);
      this.doc.setTextColor(this.options.header.color);
      this.doc.text(
        this.options.header.text,
        this.doc.internal.pageSize.getWidth() / 2,
        this.options.margins!.top / 2,
        { align: 'center' }
      );
    }
  }

  private addFooter(): void {
    if (this.options.footer) {
      this.doc.setFontSize(this.options.footer.fontSize);
      this.doc.setTextColor(this.options.footer.color);
      this.doc.text(
        this.options.footer.text,
        this.doc.internal.pageSize.getWidth() / 2,
        this.doc.internal.pageSize.getHeight() - this.options.margins!.bottom / 2,
        { align: 'center' }
      );
    }

    if (this.options.pageNumbers) {
      this.doc.setFontSize(10);
      this.doc.setTextColor('#666');
      this.doc.text(
        `Page ${this.currentPage}`,
        this.doc.internal.pageSize.getWidth() - this.options.margins!.right,
        this.doc.internal.pageSize.getHeight() - this.options.margins!.bottom / 2
      );
    }
  }

  addWatermark(): void {
    if (this.options.watermark) {
      this.doc.setGState(new this.doc.GState({ opacity: this.options.watermark.opacity }));
      this.doc.setFontSize(50);
      this.doc.setTextColor('#cccccc');
      this.doc.text(
        this.options.watermark.text,
        this.doc.internal.pageSize.getWidth() / 2,
        this.doc.internal.pageSize.getHeight() / 2,
        { align: 'center', angle: this.options.watermark.angle }
      );
    }
  }

  setMetadata(): void {
    this.doc.setProperties({
      title: this.options.title,
      author: this.options.author || 'AssetWorks AI',
      subject: this.options.subject || 'Financial Report',
      keywords: this.options.keywords?.join(', ') || 'financial, report, analysis',
      creator: 'AssetWorks AI Financial Report Builder',
    });
  }
}

// Utility function for easy PDF export
export async function exportReportToPDF(
  element: HTMLElement,
  options: PDFExportOptions,
  filename?: string
): Promise<void> {
  const exporter = new PDFExporter(options);
  exporter.setMetadata();
  exporter.addWatermark();
  await exporter.exportFromElement(element, filename);
}

// Utility function for HTML content export
export async function exportHTMLToPDF(
  htmlContent: string,
  options: PDFExportOptions,
  filename?: string
): Promise<void> {
  const exporter = new PDFExporter(options);
  exporter.setMetadata();
  exporter.addWatermark();
  await exporter.exportFromHTML(htmlContent, filename);
}
