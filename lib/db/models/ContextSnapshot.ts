import mongoose, { Schema, Document, Model } from 'mongoose';

/**
 * Context Snapshot - Living documentation for threads and reports
 *
 * This model stores automatically generated markdown files that serve as:
 * - Human-readable context preservation
 * - AI-crawlable structured content
 * - Exportable documentation for users
 * - SEO-optimized public pages
 */

export interface IContextSnapshot extends Document {
  // Entity Reference
  entityType: 'thread' | 'report';
  entityId: string; // Reference to Thread or Report
  slug: string; // URL-friendly identifier for public pages

  // Content
  markdownContent: string; // Full markdown document
  summary: string; // AI-generated summary (100-200 words)

  // Versioning
  version: number; // Increments on each update
  lastUpdated: Date;
  createdAt: Date;

  // Statistics
  stats: {
    wordCount: number;
    characterCount: number;
    messageCount?: number; // For thread snapshots
    reportCount?: number; // For thread snapshots
    sectionCount?: number; // For report snapshots
    totalTokens?: number; // API usage
  };

  // Visibility & Access Control
  visibility: 'private' | 'shared' | 'public' | 'organization';
  isPublic: boolean; // Quick check for AI crawling
  userId: string; // Owner reference
  sharedWith: string[]; // User IDs with access

  // SEO Metadata
  seoMetadata: {
    title: string;
    description: string;
    keywords: string[];
    ogImage?: string; // Open Graph image URL
  };

  // Update Tracking
  lastContentUpdate: Date; // When entity content last changed
  lastSnapshotGeneration: Date; // When markdown was last regenerated
  updateTrigger: string; // What triggered the last update
}

const ContextSnapshotSchema = new Schema<IContextSnapshot>(
  {
    entityType: {
      type: String,
      enum: ['thread', 'report'],
      required: true,
      index: true,
    },
    entityId: {
      type: String,
      required: true,
      index: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    markdownContent: {
      type: String,
      required: true,
    },
    summary: {
      type: String,
      default: '',
    },
    version: {
      type: Number,
      default: 1,
    },
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
    stats: {
      wordCount: { type: Number, default: 0 },
      characterCount: { type: Number, default: 0 },
      messageCount: { type: Number },
      reportCount: { type: Number },
      sectionCount: { type: Number },
      totalTokens: { type: Number },
    },
    visibility: {
      type: String,
      enum: ['private', 'shared', 'public', 'organization'],
      default: 'private',
      index: true,
    },
    isPublic: {
      type: Boolean,
      default: false,
      index: true,
    },
    userId: {
      type: String,
      required: true,
      index: true,
    },
    sharedWith: {
      type: [String],
      default: [],
    },
    seoMetadata: {
      title: { type: String, required: true },
      description: { type: String, required: true },
      keywords: { type: [String], default: [] },
      ogImage: { type: String },
    },
    lastContentUpdate: {
      type: Date,
      default: Date.now,
    },
    lastSnapshotGeneration: {
      type: Date,
      default: Date.now,
    },
    updateTrigger: {
      type: String,
      default: 'initial_creation',
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for efficient queries
ContextSnapshotSchema.index({ entityType: 1, entityId: 1 }, { unique: true });
ContextSnapshotSchema.index({ userId: 1, isPublic: 1 });
ContextSnapshotSchema.index({ slug: 1, isPublic: 1 });

// Instance methods
ContextSnapshotSchema.methods.incrementVersion = function() {
  this.version += 1;
  this.lastUpdated = new Date();
  return this.save();
};

ContextSnapshotSchema.methods.makePublic = function() {
  this.visibility = 'public';
  this.isPublic = true;
  return this.save();
};

ContextSnapshotSchema.methods.makePrivate = function() {
  this.visibility = 'private';
  this.isPublic = false;
  return this.save();
};

// Static methods
ContextSnapshotSchema.statics.findByEntity = function(
  entityType: 'thread' | 'report',
  entityId: string
) {
  return this.findOne({ entityType, entityId });
};

ContextSnapshotSchema.statics.findPublicSnapshots = function(limit = 50) {
  return this.find({ isPublic: true })
    .sort({ lastUpdated: -1 })
    .limit(limit);
};

ContextSnapshotSchema.statics.findBySlug = function(slug: string) {
  return this.findOne({ slug });
};

// Pre-save hook to calculate stats
ContextSnapshotSchema.pre('save', function(next) {
  if (this.isModified('markdownContent')) {
    this.stats.wordCount = this.markdownContent.split(/\s+/).length;
    this.stats.characterCount = this.markdownContent.length;
    this.lastSnapshotGeneration = new Date();
  }
  next();
});

// Model type with statics
interface IContextSnapshotModel extends Model<IContextSnapshot> {
  findByEntity(
    entityType: 'thread' | 'report',
    entityId: string
  ): Promise<IContextSnapshot | null>;
  findPublicSnapshots(limit?: number): Promise<IContextSnapshot[]>;
  findBySlug(slug: string): Promise<IContextSnapshot | null>;
}

const ContextSnapshot: IContextSnapshotModel =
  (mongoose.models.ContextSnapshot as IContextSnapshotModel) ||
  mongoose.model<IContextSnapshot, IContextSnapshotModel>(
    'ContextSnapshot',
    ContextSnapshotSchema
  );

export default ContextSnapshot;
