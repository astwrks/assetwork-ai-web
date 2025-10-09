import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { connectToDatabase } from '@/lib/db/mongodb';
import Report from '@/lib/db/models/Report';
import Widget from '@/lib/db/models/Widget';

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
    const period = searchParams.get('period') || '30'; // days
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(period));

    await connectToDatabase();

    // Fetch all metrics in parallel
    const [
      reportsMetrics,
      widgetsMetrics,
      performanceData,
      viewsTimeline,
      typeDistribution,
    ] = await Promise.all([
      // Reports metrics
      Report.aggregate([
        { $match: { userId: session.user.id } },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            active: { $sum: { $cond: [{ $eq: ['$status', 'Active'] }, 1, 0] } },
            archived: { $sum: { $cond: [{ $eq: ['$status', 'Archived'] }, 1, 0] } },
            totalViews: { $sum: '$views' },
            totalShares: { $sum: '$shares' },
            avgPerformance: { $avg: '$performance' },
            avgChange: { $avg: '$change' },
            positivePerformance: {
              $sum: { $cond: [{ $gt: ['$performance', 0] }, 1, 0] },
            },
          },
        },
      ]),

      // Widgets metrics
      Widget.aggregate([
        { $match: { userId: session.user.id } },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            totalViews: { $sum: '$views' },
            totalLikes: { $sum: { $size: { $ifNull: ['$likes', []] } } },
          },
        },
      ]),

      // Performance data over time
      Report.aggregate([
        {
          $match: {
            userId: session.user.id,
            createdAt: { $gte: startDate },
          },
        },
        {
          $group: {
            _id: {
              $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
            },
            avgPerformance: { $avg: '$performance' },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
        { $limit: 30 },
      ]),

      // Views timeline
      Report.aggregate([
        {
          $match: {
            userId: session.user.id,
            createdAt: { $gte: startDate },
          },
        },
        {
          $group: {
            _id: {
              $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
            },
            views: { $sum: '$views' },
          },
        },
        { $sort: { _id: 1 } },
        { $limit: 30 },
      ]),

      // Type distribution
      Report.aggregate([
        { $match: { userId: session.user.id } },
        {
          $group: {
            _id: '$type',
            count: { $sum: 1 },
            avgPerformance: { $avg: '$performance' },
            totalViews: { $sum: '$views' },
          },
        },
      ]),
    ]);

    // Calculate growth metrics (compare with previous period)
    const previousPeriodStart = new Date(startDate);
    previousPeriodStart.setDate(previousPeriodStart.getDate() - parseInt(period));

    const [currentPeriodReports, previousPeriodReports] = await Promise.all([
      Report.countDocuments({
        userId: session.user.id,
        createdAt: { $gte: startDate },
      }),
      Report.countDocuments({
        userId: session.user.id,
        createdAt: { $gte: previousPeriodStart, $lt: startDate },
      }),
    ]);

    const reportsGrowth = previousPeriodReports > 0
      ? ((currentPeriodReports - previousPeriodReports) / previousPeriodReports) * 100
      : 0;

    // Get top performing reports
    const topReports = await Report.find({ userId: session.user.id })
      .sort({ performance: -1 })
      .limit(5)
      .select('name type performance value change')
      .lean();

    // Calculate win rate
    const totalReportsWithPerf = reportsMetrics[0]?.total || 0;
    const positiveReports = reportsMetrics[0]?.positivePerformance || 0;
    const winRate = totalReportsWithPerf > 0
      ? (positiveReports / totalReportsWithPerf) * 100
      : 0;

    return NextResponse.json({
      success: true,
      metrics: {
        reports: {
          total: reportsMetrics[0]?.total || 0,
          active: reportsMetrics[0]?.active || 0,
          archived: reportsMetrics[0]?.archived || 0,
          totalViews: reportsMetrics[0]?.totalViews || 0,
          totalShares: reportsMetrics[0]?.totalShares || 0,
          avgPerformance: Math.round((reportsMetrics[0]?.avgPerformance || 0) * 100) / 100,
          avgChange: Math.round((reportsMetrics[0]?.avgChange || 0) * 100) / 100,
          growth: Math.round(reportsGrowth * 100) / 100,
          winRate: Math.round(winRate * 100) / 100,
        },
        widgets: {
          total: widgetsMetrics[0]?.total || 0,
          totalViews: widgetsMetrics[0]?.totalViews || 0,
          totalLikes: widgetsMetrics[0]?.totalLikes || 0,
        },
        charts: {
          performanceOverTime: performanceData.map(item => ({
            date: item._id,
            performance: Math.round(item.avgPerformance * 100) / 100,
            count: item.count,
          })),
          viewsTimeline: viewsTimeline.map(item => ({
            date: item._id,
            views: item.views,
          })),
          typeDistribution: typeDistribution.map(item => ({
            type: item._id,
            count: item.count,
            avgPerformance: Math.round(item.avgPerformance * 100) / 100,
            totalViews: item.totalViews,
          })),
        },
        topReports: topReports.map(report => ({
          id: report._id.toString(),
          name: report.name,
          type: report.type,
          performance: report.performance,
          value: report.value,
          change: report.change,
        })),
      },
    });
  } catch (error) {
    console.error('Failed to fetch analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}
