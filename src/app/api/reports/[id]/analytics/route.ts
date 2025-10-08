import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const reportId = params.id;
    
    // Mock analytics data
    const analytics = {
      reportId,
      viewCount: Math.floor(Math.random() * 1000) + 100,
      uniqueViews: Math.floor(Math.random() * 800) + 80,
      lastViewed: new Date(Date.now() - Math.random() * 86400000), // Random time in last 24 hours
      topCountries: [
        { country: 'United States', views: Math.floor(Math.random() * 400) + 100 },
        { country: 'United Kingdom', views: Math.floor(Math.random() * 200) + 50 },
        { country: 'Canada', views: Math.floor(Math.random() * 150) + 30 },
        { country: 'Germany', views: Math.floor(Math.random() * 100) + 20 },
        { country: 'Australia', views: Math.floor(Math.random() * 80) + 15 },
      ],
      referrers: [
        { source: 'Direct', views: Math.floor(Math.random() * 300) + 50 },
        { source: 'Email', views: Math.floor(Math.random() * 250) + 40 },
        { source: 'Social Media', views: Math.floor(Math.random() * 200) + 30 },
        { source: 'Search', views: Math.floor(Math.random() * 150) + 25 },
        { source: 'Other', views: Math.floor(Math.random() * 100) + 15 },
      ],
      deviceTypes: [
        { type: 'Desktop', views: Math.floor(Math.random() * 600) + 200 },
        { type: 'Mobile', views: Math.floor(Math.random() * 300) + 100 },
        { type: 'Tablet', views: Math.floor(Math.random() * 100) + 50 },
      ],
      timeSeries: Array.from({ length: 30 }, (_, i) => ({
        date: new Date(Date.now() - (29 - i) * 86400000).toISOString().split('T')[0],
        views: Math.floor(Math.random() * 50) + 10,
        uniqueViews: Math.floor(Math.random() * 40) + 8,
      })),
      engagement: {
        averageTimeOnPage: Math.floor(Math.random() * 300) + 120, // seconds
        bounceRate: Math.random() * 0.3 + 0.1, // 10-40%
        pagesPerSession: Math.random() * 2 + 1, // 1-3 pages
      },
      shares: {
        totalShares: Math.floor(Math.random() * 50) + 10,
        socialShares: Math.floor(Math.random() * 30) + 5,
        emailShares: Math.floor(Math.random() * 20) + 3,
        linkShares: Math.floor(Math.random() * 10) + 2,
      },
    };

    return NextResponse.json({
      success: true,
      analytics,
      generatedAt: new Date(),
    });
  } catch (error) {
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch analytics',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
