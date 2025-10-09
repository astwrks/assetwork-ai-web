import mongoose from 'mongoose';

export interface IReport {
  _id: string;
  userId: string;
  name: string;
  type: 'Stock' | 'Portfolio' | 'Market' | 'Analysis';
  date: Date;
  status: 'Active' | 'Archived';
  performance: number;
  value: string;
  change: number;
  views: number;
  shares: number;
  data: any;
  metadata?: {
    ticker?: string;
    symbols?: string[];
    sector?: string;
    industry?: string;
    tags?: string[];
  };
  createdAt: Date;
  updatedAt: Date;
}

const ReportSchema = new mongoose.Schema<IReport>(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ['Stock', 'Portfolio', 'Market', 'Analysis'],
      required: true,
      index: true,
    },
    date: {
      type: Date,
      default: Date.now,
      index: true,
    },
    status: {
      type: String,
      enum: ['Active', 'Archived'],
      default: 'Active',
      index: true,
    },
    performance: {
      type: Number,
      required: true,
      default: 0,
    },
    value: {
      type: String,
      required: true,
    },
    change: {
      type: Number,
      required: true,
      default: 0,
    },
    views: {
      type: Number,
      default: 0,
    },
    shares: {
      type: Number,
      default: 0,
    },
    data: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    metadata: {
      ticker: String,
      symbols: [String],
      sector: String,
      industry: String,
      tags: [String],
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
ReportSchema.index({ userId: 1, createdAt: -1 });
ReportSchema.index({ userId: 1, type: 1 });
ReportSchema.index({ userId: 1, status: 1 });

export default mongoose.models.Report || mongoose.model<IReport>('Report', ReportSchema);
