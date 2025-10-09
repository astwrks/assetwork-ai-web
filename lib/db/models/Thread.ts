import mongoose from 'mongoose';

export interface ISharedUser {
  userId: string;
  permission: 'view' | 'comment' | 'edit';
  sharedAt: Date;
}

export interface IThread {
  _id: string;
  userId: string;
  title: string;
  description?: string;
  status: 'active' | 'archived';
  currentReportId?: string;
  reportVersions: string[];
  sharedWith: ISharedUser[];
  isTemplate: boolean;
  templateName?: string;
  templateDescription?: string;
  createdAt: Date;
  updatedAt: Date;
}

const SharedUserSchema = new mongoose.Schema<ISharedUser>(
  {
    userId: {
      type: String,
      required: true,
    },
    permission: {
      type: String,
      enum: ['view', 'comment', 'edit'],
      default: 'view',
    },
    sharedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const ThreadSchema = new mongoose.Schema<IThread>(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 1000,
    },
    status: {
      type: String,
      enum: ['active', 'archived'],
      default: 'active',
      index: true,
    },
    currentReportId: {
      type: String,
      index: true,
    },
    reportVersions: {
      type: [String],
      default: [],
    },
    sharedWith: {
      type: [SharedUserSchema],
      default: [],
    },
    isTemplate: {
      type: Boolean,
      default: false,
      index: true,
    },
    templateName: {
      type: String,
      trim: true,
      maxlength: 200,
    },
    templateDescription: {
      type: String,
      trim: true,
      maxlength: 1000,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for efficient queries
ThreadSchema.index({ userId: 1, status: 1, createdAt: -1 });
ThreadSchema.index({ userId: 1, isTemplate: 1 });
ThreadSchema.index({ 'sharedWith.userId': 1, status: 1 });

// Virtual for message count (can be populated if needed)
ThreadSchema.virtual('messages', {
  ref: 'Message',
  localField: '_id',
  foreignField: 'threadId',
});

// Ensure virtuals are included in JSON
ThreadSchema.set('toJSON', { virtuals: true });
ThreadSchema.set('toObject', { virtuals: true });

export default mongoose.models.Thread || mongoose.model<IThread>('Thread', ThreadSchema);
