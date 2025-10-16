import mongoose, { Schema, Document, Model } from 'mongoose';

export interface SectionVersion {
  version: number;
  htmlContent: string;
  prompt?: string;
  editedBy: string;
  editedAt: Date;
}

export interface ReportSectionDocument extends Document {
  reportId: string;
  type: 'metric' | 'chart' | 'table' | 'text' | 'insight' | 'custom';
  title: string;
  htmlContent: string;
  order: number;
  version: number;

  // Version history
  editHistory: SectionVersion[];

  // Metadata
  metadata: {
    originallyGeneratedBy: string;
    lastModifiedBy: string;
    model?: string;
    originalPrompt?: string;
    createdAt: Date;
    updatedAt: Date;
  };

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

const SectionVersionSchema = new Schema<SectionVersion>(
  {
    version: { type: Number, required: true },
    htmlContent: { type: String, required: true },
    prompt: { type: String },
    editedBy: { type: String, required: true },
    editedAt: { type: Date, required: true, default: Date.now },
  },
  { _id: false }
);

const ReportSectionSchema = new Schema<ReportSectionDocument>(
  {
    reportId: { type: String, required: true, index: false }, // Disable auto-indexing
    type: {
      type: String,
      enum: ['metric', 'chart', 'table', 'text', 'insight', 'custom'],
      required: true,
    },
    title: { type: String, required: true },
    htmlContent: { type: String, required: true },
    order: { type: Number, required: true, default: 0 },
    version: { type: Number, required: true, default: 1 },

    editHistory: {
      type: [SectionVersionSchema],
      default: [],
    },

    metadata: {
      type: {
        originallyGeneratedBy: { type: String, required: true },
        lastModifiedBy: { type: String, required: true },
        model: { type: String },
        originalPrompt: { type: String },
        createdAt: { type: Date, default: Date.now },
        updatedAt: { type: Date, default: Date.now },
      },
      required: true,
    },
  },
  {
    timestamps: true,
    autoIndex: true, // Keep compound indexes but prevent duplicate single-field indexes
  }
);

// Compound indexes for efficient queries (these include reportId, so no need for single-field index)
ReportSectionSchema.index({ reportId: 1, order: 1 });
ReportSectionSchema.index({ reportId: 1, type: 1 });

// Method to save a new version
ReportSectionSchema.methods.saveVersion = function(
  newHtmlContent: string,
  editedBy: string,
  prompt?: string
) {
  // Add current content to history
  this.editHistory.push({
    version: this.version,
    htmlContent: this.htmlContent,
    prompt: prompt,
    editedBy: this.metadata.lastModifiedBy,
    editedAt: this.updatedAt,
  });

  // Update to new version
  this.version += 1;
  this.htmlContent = newHtmlContent;
  this.metadata.lastModifiedBy = editedBy;
  this.metadata.updatedAt = new Date();

  return this.save();
};

// Method to restore a previous version
ReportSectionSchema.methods.restoreVersion = function(
  versionNumber: number,
  restoredBy: string
) {
  const versionToRestore = this.editHistory.find(
    (v: SectionVersion) => v.version === versionNumber
  );

  if (!versionToRestore) {
    throw new Error(`Version ${versionNumber} not found`);
  }

  // Save current as history before restoring
  this.editHistory.push({
    version: this.version,
    htmlContent: this.htmlContent,
    prompt: `Restored from version ${versionNumber}`,
    editedBy: this.metadata.lastModifiedBy,
    editedAt: this.updatedAt,
  });

  // Restore the version
  this.version += 1;
  this.htmlContent = versionToRestore.htmlContent;
  this.metadata.lastModifiedBy = restoredBy;
  this.metadata.updatedAt = new Date();

  return this.save();
};

const ReportSection: Model<ReportSectionDocument> =
  mongoose.models.ReportSection ||
  mongoose.model<ReportSectionDocument>('ReportSection', ReportSectionSchema);

export default ReportSection;
