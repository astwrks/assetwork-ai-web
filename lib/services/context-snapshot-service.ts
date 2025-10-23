/**
 * Context Snapshot Service - STUB VERSION
 *
 * This is a temporary stub implementation while the service is being migrated from MongoDB to Prisma.
 * All methods are disabled and will throw errors if called.
 *
 * TODO: Migrate this service to use Prisma instead of MongoDB models
 */

export interface IContextSnapshot {
  entityType: 'thread' | 'report';
  entityId: string;
  slug: string;
  markdownContent: string;
  seoMetadata: any;
  userId: string;
  visibility: 'private' | 'shared' | 'public' | 'organization';
  isPublic: boolean;
  updateTrigger: string;
  lastContentUpdate: Date;
  stats: any;
  version: number;
  sharedWith: string[];
}

export class ContextSnapshotService {
  /**
   * Create or update a snapshot for a thread
   */
  static async createOrUpdateThreadSnapshot(
    threadId: string,
    trigger: string = 'manual_update'
  ): Promise<IContextSnapshot> {
    throw new Error('ContextSnapshotService is disabled - awaiting migration to Prisma');
  }

  /**
   * Create or update a snapshot for a report
   */
  static async createOrUpdateReportSnapshot(
    reportId: string,
    trigger: string = 'manual_update'
  ): Promise<IContextSnapshot> {
    throw new Error('ContextSnapshotService is disabled - awaiting migration to Prisma');
  }

  /**
   * Get snapshot by entity
   */
  static async getSnapshotByEntity(
    entityType: 'thread' | 'report',
    entityId: string
  ): Promise<IContextSnapshot | null> {
    throw new Error('ContextSnapshotService is disabled - awaiting migration to Prisma');
  }

  /**
   * Get snapshot by slug (for public pages)
   */
  static async getSnapshotBySlug(
    slug: string
  ): Promise<IContextSnapshot | null> {
    throw new Error('ContextSnapshotService is disabled - awaiting migration to Prisma');
  }

  /**
   * Make snapshot public
   */
  static async makeSnapshotPublic(
    snapshotId: string,
    userId: string
  ): Promise<IContextSnapshot> {
    throw new Error('ContextSnapshotService is disabled - awaiting migration to Prisma');
  }

  /**
   * Make snapshot private
   */
  static async makeSnapshotPrivate(
    snapshotId: string,
    userId: string
  ): Promise<IContextSnapshot> {
    throw new Error('ContextSnapshotService is disabled - awaiting migration to Prisma');
  }

  /**
   * Get all public snapshots (for AI crawling)
   */
  static async getPublicSnapshots(limit: number = 50): Promise<IContextSnapshot[]> {
    throw new Error('ContextSnapshotService is disabled - awaiting migration to Prisma');
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
    throw new Error('ContextSnapshotService is disabled - awaiting migration to Prisma');
  }

  /**
   * Delete snapshot
   */
  static async deleteSnapshot(
    snapshotId: string,
    userId: string
  ): Promise<void> {
    throw new Error('ContextSnapshotService is disabled - awaiting migration to Prisma');
  }

  /**
   * Generate downloadable markdown file content
   */
  static async getDownloadableMarkdown(
    snapshotId: string,
    userId: string
  ): Promise<{ filename: string; content: string }> {
    throw new Error('ContextSnapshotService is disabled - awaiting migration to Prisma');
  }

  /**
   * Share snapshot with users
   */
  static async shareSnapshot(
    snapshotId: string,
    userId: string,
    shareWithUserIds: string[]
  ): Promise<IContextSnapshot> {
    throw new Error('ContextSnapshotService is disabled - awaiting migration to Prisma');
  }

  /**
   * Unshare snapshot with users
   */
  static async unshareSnapshot(
    snapshotId: string,
    userId: string,
    unshareUserIds: string[]
  ): Promise<IContextSnapshot> {
    throw new Error('ContextSnapshotService is disabled - awaiting migration to Prisma');
  }
}
