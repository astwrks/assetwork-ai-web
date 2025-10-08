import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const reportId = params.id;
    const body = await request.json();
    
    // Generate share link
    const shareId = `share-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const shareUrl = `${baseUrl}/reports/shared/${shareId}`;
    
    const shareSettings = {
      id: shareId,
      reportId,
      title: body.title || 'Shared Report',
      description: body.description,
      isPublic: body.isPublic ?? true,
      password: body.password,
      expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
      allowDownload: body.allowDownload ?? true,
      allowComments: body.allowComments ?? false,
      viewCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // In a real implementation, this would save to a database
    // For now, we'll just return the share link

    return NextResponse.json({
      success: true,
      shareLink: {
        id: shareId,
        url: shareUrl,
        shortUrl: `https://short.ly/${shareId.substr(0, 8)}`,
        qrCode: `data:image/svg+xml;base64,${Buffer.from(`
          <svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
            <rect width="200" height="200" fill="white"/>
            <text x="100" y="100" text-anchor="middle" font-family="monospace" font-size="12">
              QR Code
            </text>
          </svg>
        `).toString('base64')}`,
        settings: shareSettings,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to create share link',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
