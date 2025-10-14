import ContextSnapshot, { IContextSnapshot } from '@/lib/db/models/ContextSnapshot';
import Thread from '@/lib/db/models/Thread';
import Message from '@/lib/db/models/Message';
import PlaygroundReport from '@/lib/db/models/PlaygroundReport';
import ReportSection from '@/lib/db/models/ReportSection';
import {
  generateThreadSnapshot,
  generateReportSnapshot,
  generateSlug,
  generateSEOMetadata,
  anonymizeContent,
} from '@/lib/utils/markdown-generator';

/**
 * Context Snapshot Service
 *
 * Orchestrates the lifecycle of context snapshots:
 * - Creating new snapshots
 * - Updating existing snapshots
 * - Managing visibility
 * - Generating downloadable content
 */
export class ContextSnapshotService {
  /**
   * Create or update a snapshot for a thread
   */
  static async createOrUpdateThreadSnapshot(
    threadId: string,
    trigger: string = 'manual_update'
  ): Promise<IContextSnapshot> {
    // Fetch thread data
    const thread = await Thread.findById(threadId);
    if (!thread) {
      throw new Error(`Thread not found: ${threadId}`);
    }

    // Fetch related data
    const messages = await Message.find({ threadId })
      .sort({ createdAt: 1 })
      .limit(500);

    const reports = await PlaygroundReport.find({ threadId })
      .sort({ createdAt: -1 })
      .limit(50);

    // Generate markdown content
    const markdownContent = generateThreadSnapshot(
      {
        _id: thread._id.toString(),
        title: thread.title,
        description: thread.description,
        status: thread.status,
        createdAt: thread.createdAt,
        updatedAt: thread.updatedAt,
        userId: thread.userId,
      },
      messages.map((m) => ({
        _id: m._id.toString(),
        role: m.role,
        content: m.content,
        createdAt: m.createdAt,
        metadata: m.metadata,
      })),
      reports.map((r) => ({
        _id: r._id.toString(),
        title: r.title,
        htmlContent: r.htmlContent,
        createdAt: r.createdAt,
        isInteractiveMode: r.isInteractiveMode,
        metadata: r.metadata,
      }))
    );

    // Generate SEO metadata
    const seoMetadata = generateSEOMetadata(
      thread.title,
      markdownContent,
      'thread'
    );

    // Generate slug
    const slug = generateSlug(thread.title, thread._id.toString());

    // Find existing snapshot or create new
    let snapshot = await ContextSnapshot.findByEntity('thread', threadId);

    if (snapshot) {
      // Update existing snapshot
      snapshot.markdownContent = markdownContent;
      snapshot.seoMetadata = seoMetadata;
      snapshot.lastContentUpdate = new Date();
      snapshot.updateTrigger = trigger;
      snapshot.stats = {
        ...snapshot.stats,
        messageCount: messages.length,
        reportCount: reports.length,
        totalTokens: messages.reduce(
          (sum, m) => {
            const tokens = m.metadata?.tokens;
            const numericTokens = typeof tokens === 'number' ? tokens : 0;
            return sum + numericTokens;
          },
          0
        ),
      };
      snapshot.version += 1;
      await snapshot.save();
    } else {
      // Create new snapshot
      snapshot = new ContextSnapshot({
        entityType: 'thread',
        entityId: threadId,
        slug,
        markdownContent,
        seoMetadata,
        userId: thread.userId,
        visibility: 'private',
        isPublic: false,
        updateTrigger: trigger,
        lastContentUpdate: new Date(),
        stats: {
          wordCount: 0, // Will be calculated by pre-save hook
          characterCount: 0, // Will be calculated by pre-save hook
          messageCount: messages.length,
          reportCount: reports.length,
          totalTokens: messages.reduce(
            (sum, m) => {
              const tokens = m.metadata?.tokens;
              const numericTokens = typeof tokens === 'number' ? tokens : 0;
              return sum + numericTokens;
            },
            0
          ),
        },
      });
      await snapshot.save();
    }

    return snapshot;
  }

  /**
   * Create or update a snapshot for a report
   */
  static async createOrUpdateReportSnapshot(
    reportId: string,
    trigger: string = 'manual_update'
  ): Promise<IContextSnapshot> {
    // Fetch report data
    const report = await PlaygroundReport.findById(reportId);
    if (!report) {
      throw new Error(`Report not found: ${reportId}`);
    }

    // Fetch thread for context
    let threadTitle: string | undefined;
    if (report.threadId) {
      const thread = await Thread.findById(report.threadId);
      threadTitle = thread?.title;
    }

    // Fetch sections
    const sections = await ReportSection.find({ reportId })
      .sort({ order: 1 })
      .limit(100);

    // Generate markdown content
    const markdownContent = generateReportSnapshot(
      {
        _id: report._id.toString(),
        title: report.title,
        htmlContent: report.htmlContent,
        createdAt: report.createdAt,
        isInteractiveMode: report.isInteractiveMode,
        metadata: report.metadata,
      },
      sections.map((s) => ({
        _id: s._id.toString(),
        title: s.title,
        htmlContent: s.htmlContent,
        order: s.order,
        type: s.type,
        createdAt: s.createdAt,
      })),
      threadTitle
    );

    // Generate SEO metadata
    const seoMetadata = generateSEOMetadata(
      report.title || 'Financial Report',
      markdownContent,
      'report'
    );

    // Generate slug
    const slug = generateSlug(
      report.title || 'report',
      report._id.toString()
    );

    // Find existing snapshot or create new
    let snapshot = await ContextSnapshot.findByEntity('report', reportId);

    if (snapshot) {
      // Update existing snapshot
      snapshot.markdownContent = markdownContent;
      snapshot.seoMetadata = seoMetadata;
      snapshot.lastContentUpdate = new Date();
      snapshot.updateTrigger = trigger;
      snapshot.stats = {
        ...snapshot.stats,
        sectionCount: sections.length,
        totalTokens: typeof report.metadata?.tokens === 'number' ? report.metadata.tokens : 0,
      };
      snapshot.version += 1;
      await snapshot.save();
    } else {
      // Create new snapshot
      snapshot = new ContextSnapshot({
        entityType: 'report',
        entityId: reportId,
        slug,
        markdownContent,
        seoMetadata,
        userId: report.userId,
        visibility: 'private',
        isPublic: false,
        updateTrigger: trigger,
        lastContentUpdate: new Date(),
        stats: {
          wordCount: 0, // Will be calculated by pre-save hook
          characterCount: 0, // Will be calculated by pre-save hook
          sectionCount: sections.length,
          totalTokens: typeof report.metadata?.tokens === 'number' ? report.metadata.tokens : 0,
        },
      });
      await snapshot.save();
    }

    return snapshot;
  }

  /**
   * Get snapshot by entity
   */
  static async getSnapshotByEntity(
    entityType: 'thread' | 'report',
    entityId: string
  ): Promise<IContextSnapshot | null> {
    return ContextSnapshot.findByEntity(entityType, entityId);
  }

  /**
   * Get snapshot by slug (for public pages)
   */
  static async getSnapshotBySlug(
    slug: string
  ): Promise<IContextSnapshot | null> {
    return ContextSnapshot.findBySlug(slug);
  }

  /**
   * Make snapshot public
   */
  static async makeSnapshotPublic(
    snapshotId: string,
    userId: string
  ): Promise<IContextSnapshot> {
    const snapshot = await ContextSnapshot.findById(snapshotId);
    if (!snapshot) {
      throw new Error(`Snapshot not found: ${snapshotId}`);
    }

    // Verify ownership
    if (snapshot.userId !== userId) {
      throw new Error('Unauthorized: You do not own this snapshot');
    }

    // Anonymize content before making public
    snapshot.markdownContent = anonymizeContent(
      snapshot.markdownContent,
      userId
    );

    await snapshot.makePublic();
    return snapshot;
  }

  /**
   * Make snapshot private
   */
  static async makeSnapshotPrivate(
    snapshotId: string,
    userId: string
  ): Promise<IContextSnapshot> {
    const snapshot = await ContextSnapshot.findById(snapshotId);
    if (!snapshot) {
      throw new Error(`Snapshot not found: ${snapshotId}`);
    }

    // Verify ownership
    if (snapshot.userId !== userId) {
      throw new Error('Unauthorized: You do not own this snapshot');
    }

    await snapshot.makePrivate();
    return snapshot;
  }

  /**
   * Get all public snapshots (for AI crawling)
   */
  static async getPublicSnapshots(limit: number = 50): Promise<IContextSnapshot[]> {
    return ContextSnapshot.findPublicSnapshots(limit);
  }

  /**
   * Get user's snapshots
   */
  static async getUserSnapshots(
    userId: string,
    options?: {
      entityType?: 'thread' | 'report';
      visibility?: 'private' | 'shared' | 'public' | 'organization';
      limit?: number;
    }
  ): Promise<IContextSnapshot[]> {
    const query: any = { userId };

    if (options?.entityType) {
      query.entityType = options.entityType;
    }

    if (options?.visibility) {
      query.visibility = options.visibility;
    }

    return ContextSnapshot.find(query)
      .sort({ lastUpdated: -1 })
      .limit(options?.limit || 50);
  }

  /**
   * Delete snapshot
   */
  static async deleteSnapshot(
    snapshotId: string,
    userId: string
  ): Promise<void> {
    const snapshot = await ContextSnapshot.findById(snapshotId);
    if (!snapshot) {
      throw new Error(`Snapshot not found: ${snapshotId}`);
    }

    // Verify ownership
    if (snapshot.userId !== userId) {
      throw new Error('Unauthorized: You do not own this snapshot');
    }

    await ContextSnapshot.findByIdAndDelete(snapshotId);
  }

  /**
   * Generate downloadable markdown file content
   */
  static async getDownloadableMarkdown(
    snapshotId: string,
    userId: string
  ): Promise<{ filename: string; content: string }> {
    const snapshot = await ContextSnapshot.findById(snapshotId);
    if (!snapshot) {
      throw new Error(`Snapshot not found: ${snapshotId}`);
    }

    // Check access permissions
    const hasAccess =
      snapshot.userId === userId ||
      snapshot.sharedWith.includes(userId) ||
      snapshot.isPublic;

    if (!hasAccess) {
      throw new Error('Unauthorized: You do not have access to this snapshot');
    }

    const filename = `${snapshot.slug}.md`;
    const content = snapshot.markdownContent;

    return { filename, content };
  }

  /**
   * Share snapshot with users
   */
  static async shareSnapshot(
    snapshotId: string,
    userId: string,
    shareWithUserIds: string[]
  ): Promise<IContextSnapshot> {
    const snapshot = await ContextSnapshot.findById(snapshotId);
    if (!snapshot) {
      throw new Error(`Snapshot not found: ${snapshotId}`);
    }

    // Verify ownership
    if (snapshot.userId !== userId) {
      throw new Error('Unauthorized: You do not own this snapshot');
    }

    // Add users to sharedWith array (avoid duplicates)
    const newSharedWith = [
      ...new Set([...snapshot.sharedWith, ...shareWithUserIds]),
    ];

    snapshot.sharedWith = newSharedWith;
    snapshot.visibility = 'shared';
    await snapshot.save();

    return snapshot;
  }

  /**
   * Unshare snapshot with users
   */
  static async unshareSnapshot(
    snapshotId: string,
    userId: string,
    unshareUserIds: string[]
  ): Promise<IContextSnapshot> {
    const snapshot = await ContextSnapshot.findById(snapshotId);
    if (!snapshot) {
      throw new Error(`Snapshot not found: ${snapshotId}`);
    }

    // Verify ownership
    if (snapshot.userId !== userId) {
      throw new Error('Unauthorized: You do not own this snapshot');
    }

    // Remove users from sharedWith array
    snapshot.sharedWith = snapshot.sharedWith.filter(
      (id) => !unshareUserIds.includes(id)
    );

    // Update visibility if no longer shared
    if (snapshot.sharedWith.length === 0) {
      snapshot.visibility = 'private';
    }

    await snapshot.save();

    return snapshot;
  }
}
