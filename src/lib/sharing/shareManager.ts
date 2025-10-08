'use client';

export interface ShareSettings {
  id: string;
  reportId: string;
  title: string;
  description?: string;
  isPublic: boolean;
  password?: string;
  expiresAt?: Date;
  allowDownload: boolean;
  allowComments: boolean;
  viewCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ShareLink {
  id: string;
  url: string;
  shortUrl: string;
  qrCode: string;
  settings: ShareSettings;
}

class ShareManager {
  private shares: Map<string, ShareSettings> = new Map();

  public async createShareLink(
    reportId: string,
    settings: Partial<ShareSettings> = {}
  ): Promise<ShareLink> {
    const shareId = this.generateShareId();
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    
    const shareSettings: ShareSettings = {
      id: shareId,
      reportId,
      title: settings.title || 'Shared Report',
      description: settings.description,
      isPublic: settings.isPublic ?? true,
      password: settings.password,
      expiresAt: settings.expiresAt,
      allowDownload: settings.allowDownload ?? true,
      allowComments: settings.allowComments ?? false,
      viewCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.shares.set(shareId, shareSettings);

    const url = `${baseUrl}/reports/shared/${shareId}`;
    const shortUrl = await this.generateShortUrl(url);
    const qrCode = await this.generateQRCode(url);

    return {
      id: shareId,
      url,
      shortUrl,
      qrCode,
      settings: shareSettings,
    };
  }

  public async getShareSettings(shareId: string): Promise<ShareSettings | null> {
    return this.shares.get(shareId) || null;
  }

  public async updateShareSettings(
    shareId: string,
    updates: Partial<ShareSettings>
  ): Promise<ShareSettings | null> {
    const existing = this.shares.get(shareId);
    if (!existing) return null;

    const updated = {
      ...existing,
      ...updates,
      updatedAt: new Date(),
    };

    this.shares.set(shareId, updated);
    return updated;
  }

  public async deleteShareLink(shareId: string): Promise<boolean> {
    return this.shares.delete(shareId);
  }

  public async incrementViewCount(shareId: string): Promise<void> {
    const share = this.shares.get(shareId);
    if (share) {
      share.viewCount++;
      share.updatedAt = new Date();
      this.shares.set(shareId, share);
    }
  }

  public async getShareAnalytics(shareId: string): Promise<{
    viewCount: number;
    uniqueViews: number;
    lastViewed: Date | null;
    topCountries: Array<{ country: string; views: number }>;
    referrers: Array<{ source: string; views: number }>;
  }> {
    const share = this.shares.get(shareId);
    if (!share) {
      throw new Error('Share not found');
    }

    // Mock analytics data
    return {
      viewCount: share.viewCount,
      uniqueViews: Math.floor(share.viewCount * 0.7),
      lastViewed: share.updatedAt,
      topCountries: [
        { country: 'United States', views: Math.floor(share.viewCount * 0.4) },
        { country: 'United Kingdom', views: Math.floor(share.viewCount * 0.2) },
        { country: 'Canada', views: Math.floor(share.viewCount * 0.15) },
        { country: 'Germany', views: Math.floor(share.viewCount * 0.1) },
        { country: 'Australia', views: Math.floor(share.viewCount * 0.15) },
      ],
      referrers: [
        { source: 'Direct', views: Math.floor(share.viewCount * 0.3) },
        { source: 'Email', views: Math.floor(share.viewCount * 0.25) },
        { source: 'Social Media', views: Math.floor(share.viewCount * 0.2) },
        { source: 'Search', views: Math.floor(share.viewCount * 0.15) },
        { source: 'Other', views: Math.floor(share.viewCount * 0.1) },
      ],
    };
  }

  public async validateShareAccess(
    shareId: string,
    password?: string
  ): Promise<{ valid: boolean; reason?: string }> {
    const share = this.shares.get(shareId);
    if (!share) {
      return { valid: false, reason: 'Share link not found' };
    }

    if (share.expiresAt && share.expiresAt < new Date()) {
      return { valid: false, reason: 'Share link has expired' };
    }

    if (share.password && share.password !== password) {
      return { valid: false, reason: 'Invalid password' };
    }

    return { valid: true };
  }

  private generateShareId(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 12; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  private async generateShortUrl(url: string): Promise<string> {
    // In a real implementation, this would use a URL shortening service
    // For now, we'll just return a mock short URL
    const shortId = Math.random().toString(36).substring(2, 8);
    return `https://short.ly/${shortId}`;
  }

  private async generateQRCode(url: string): Promise<string> {
    // In a real implementation, this would generate an actual QR code
    // For now, we'll return a data URL for a mock QR code
    return `data:image/svg+xml;base64,${btoa(`
      <svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
        <rect width="200" height="200" fill="white"/>
        <text x="100" y="100" text-anchor="middle" font-family="monospace" font-size="12">
          QR Code
        </text>
      </svg>
    `)}`;
  }

  public async getShareHistory(): Promise<ShareLink[]> {
    const history: ShareLink[] = [];
    
    for (const [shareId, settings] of this.shares) {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      const url = `${baseUrl}/reports/shared/${shareId}`;
      
      history.push({
        id: shareId,
        url,
        shortUrl: await this.generateShortUrl(url),
        qrCode: await this.generateQRCode(url),
        settings,
      });
    }
    
    return history.sort((a, b) => b.settings.createdAt.getTime() - a.settings.createdAt.getTime());
  }
}

// Singleton instance
export const shareManager = new ShareManager();
export default shareManager;
