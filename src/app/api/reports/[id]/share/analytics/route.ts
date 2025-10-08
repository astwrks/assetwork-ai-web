import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const reportId = params.id;
    
    // Mock share analytics data
    const shareAnalytics = {
      reportId,
      totalShares: Math.floor(Math.random() * 20) + 5,
      activeShares: Math.floor(Math.random() * 15) + 3,
      expiredShares: Math.floor(Math.random() * 5) + 1,
      passwordProtectedShares: Math.floor(Math.random() * 8) + 2,
      publicShares: Math.floor(Math.random() * 12) + 3,
      totalViews: Math.floor(Math.random() * 2000) + 500,
      uniqueViews: Math.floor(Math.random() * 1500) + 400,
      averageViewsPerShare: Math.floor(Math.random() * 100) + 20,
      topSharedCountries: [
        { country: 'United States', shares: Math.floor(Math.random() * 10) + 3 },
        { country: 'United Kingdom', shares: Math.floor(Math.random() * 5) + 2 },
        { country: 'Canada', shares: Math.floor(Math.random() * 4) + 1 },
        { country: 'Germany', shares: Math.floor(Math.random() * 3) + 1 },
        { country: 'Australia', shares: Math.floor(Math.random() * 2) + 1 },
      ],
      shareTypes: [
        { type: 'Public', count: Math.floor(Math.random() * 12) + 3 },
        { type: 'Password Protected', count: Math.floor(Math.random() * 8) + 2 },
        { type: 'Expired', count: Math.floor(Math.random() * 5) + 1 },
      ],
      recentShares: Array.from({ length: 10 }, (_, i) => ({
        id: `share-${i + 1}`,
        title: `Share ${i + 1}`,
        createdAt: new Date(Date.now() - Math.random() * 7 * 86400000), // Last 7 days
        viewCount: Math.floor(Math.random() * 100) + 10,
        isActive: Math.random() > 0.2,
        isPasswordProtected: Math.random() > 0.5,
        expiresAt: Math.random() > 0.3 ? new Date(Date.now() + Math.random() * 30 * 86400000) : null,
      })),
      timeSeries: Array.from({ length: 30 }, (_, i) => ({
        date: new Date(Date.now() - (29 - i) * 86400000).toISOString().split('T')[0],
        shares: Math.floor(Math.random() * 5) + 1,
        views: Math.floor(Math.random() * 100) + 20,
        uniqueViews: Math.floor(Math.random() * 80) + 15,
      })),
      performance: {
        mostViewedShare: {
          id: 'share-1',
          title: 'Q4 2024 Financial Analysis',
          viewCount: Math.floor(Math.random() * 500) + 100,
        },
        leastViewedShare: {
          id: 'share-2',
          title: 'Internal Review',
          viewCount: Math.floor(Math.random() * 10) + 1,
        },
        averageViewTime: Math.floor(Math.random() * 300) + 120, // seconds
        bounceRate: Math.random() * 0.3 + 0.1, // 10-40%
      },
    };

    return NextResponse.json({
      success: true,
      shareAnalytics,
      generatedAt: new Date(),
    });
  } catch (error) {
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch share analytics',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}