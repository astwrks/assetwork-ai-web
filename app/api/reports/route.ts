import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { connectToDatabase } from '@/lib/db/mongodb';
import Report from '@/lib/db/models/Report';

// GET /api/reports - Fetch all reports for user
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const type = searchParams.get('type');
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    await connectToDatabase();

    // Build query
    const query: any = { userId: session.user.id };
    if (type) query.type = type;
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { 'metadata.ticker': { $regex: search, $options: 'i' } },
        { 'metadata.tags': { $in: [new RegExp(search, 'i')] } },
      ];
    }

    // Execute query with pagination
    const skip = (page - 1) * limit;
    const [reports, total] = await Promise.all([
      Report.find(query)
        .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Report.countDocuments(query),
    ]);

    // Get aggregated stats
    const stats = await Report.aggregate([
      { $match: { userId: session.user.id } },
      {
        $group: {
          _id: null,
          totalReports: { $sum: 1 },
          activeReports: {
            $sum: { $cond: [{ $eq: ['$status', 'Active'] }, 1, 0] },
          },
          totalViews: { $sum: '$views' },
          avgPerformance: { $avg: '$performance' },
        },
      },
    ]);

    return NextResponse.json({
      success: true,
      reports: reports.map(report => ({
        id: report._id.toString(),
        name: report.name,
        type: report.type,
        date: report.date,
        status: report.status,
        performance: report.performance,
        value: report.value,
        change: report.change,
        views: report.views,
        shares: report.shares || 0,
        metadata: report.metadata,
        createdAt: report.createdAt,
        updatedAt: report.updatedAt,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      stats: stats[0] || {
        totalReports: 0,
        activeReports: 0,
        totalViews: 0,
        avgPerformance: 0,
      },
    });
  } catch (error) {
    console.error('Failed to fetch reports:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reports' },
      { status: 500 }
    );
  }
}

// POST /api/reports - Create new report
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, type, value, performance, change, data, metadata } = body;

    // Validation
    if (!name || !type || !value) {
      return NextResponse.json(
        { error: 'Missing required fields: name, type, value' },
        { status: 400 }
      );
    }

    if (!['Stock', 'Portfolio', 'Market', 'Analysis'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid type. Must be: Stock, Portfolio, Market, or Analysis' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const report = await Report.create({
      userId: session.user.id,
      name,
      type,
      value,
      performance: performance || 0,
      change: change || 0,
      data: data || {},
      metadata: metadata || {},
      status: 'Active',
    });

    return NextResponse.json({
      success: true,
      report: {
        id: report._id.toString(),
        name: report.name,
        type: report.type,
        value: report.value,
        performance: report.performance,
        change: report.change,
        createdAt: report.createdAt,
      },
    });
  } catch (error) {
    console.error('Failed to create report:', error);
    return NextResponse.json(
      { error: 'Failed to create report' },
      { status: 500 }
    );
  }
}

// DELETE /api/reports - Bulk delete reports
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { ids } = await request.json();

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: 'Invalid request. Provide an array of report IDs' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const result = await Report.deleteMany({
      _id: { $in: ids },
      userId: session.user.id, // Security: ensure user owns the reports
    });

    return NextResponse.json({
      success: true,
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    console.error('Failed to delete reports:', error);
    return NextResponse.json(
      { error: 'Failed to delete reports' },
      { status: 500 }
    );
  }
}
