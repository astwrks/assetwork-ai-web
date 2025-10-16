/**
 * Legacy Reports API - Deprecated
 * This API is no longer used. The financial playground uses the v2 API.
 */

import { NextRequest, NextResponse } from 'next/server';

// GET /api/reports - Deprecated endpoint
export async function GET(request: NextRequest) {
  return NextResponse.json({
    success: true,
    reports: [],
    pagination: {
      page: 1,
      limit: 10,
      total: 0,
      totalPages: 0,
    },
    stats: {
      totalReports: 0,
      activeReports: 0,
      totalViews: 0,
      avgPerformance: 0,
    },
    message: 'This endpoint is deprecated. Please use /api/v2/reports instead.'
  });
}

// POST /api/reports - Deprecated endpoint
export async function POST(request: NextRequest) {
  return NextResponse.json({
    success: false,
    error: 'This endpoint is deprecated. Please use /api/v2/reports instead.'
  }, { status: 410 }); // 410 Gone
}

// DELETE /api/reports - Deprecated endpoint
export async function DELETE(request: NextRequest) {
  return NextResponse.json({
    success: false,
    error: 'This endpoint is deprecated. Please use /api/v2/reports instead.'
  }, { status: 410 });
}
