import mongoose from 'mongoose';

export interface IReportSection {
  id: string;
  type: 'chart' | 'table' | 'text' | 'metric' | 'insight' | 'image';
  title: string;
  htmlContent: string;
  dataSource?: string;
  chartConfig?: {
    type?: 'line' | 'bar' | 'pie' | 'area' | 'scatter';
    data?: any;
    options?: any;
  };
  order: number;
}

export interface IInsight {
  id: string;
  text: string;
  severity: 'info' | 'warning' | 'critical' | 'success';
  category?: string;
}

export interface IPlaygroundReport {
  _id: string;
  threadId: string;
  version: number;
  parentReportId?: string; // For version control - which report this was derived from
  htmlContent: string; // Full HTML content
  sections: IReportSection[];
  insights: IInsight[];
  metadata?: {
    generatedBy?: string; // User ID
    model?: string; // AI model used
    provider?: string; // AI provider
    prompt?: string; // Original prompt that generated this report
    dataSources?: string[]; // List of data sources used
    generationTime?: number; // Time taken to generate (ms)
  };
  pdfUrl?: string; // URL to exported PDF
  isPublished: boolean;
  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ReportSectionSchema = new mongoose.Schema<IReportSection>(
  {
    id: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ['chart', 'table', 'text', 'metric', 'insight', 'image'],
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    htmlContent: {
      type: String,
      required: true,
    },
    dataSource: String,
    chartConfig: {
      type: {
        type: String,
        enum: ['line', 'bar', 'pie', 'area', 'scatter'],
      },
      data: mongoose.Schema.Types.Mixed,
      options: mongoose.Schema.Types.Mixed,
    },
    order: {
      type: Number,
      required: true,
    },
  },
  { _id: false }
);

const InsightSchema = new mongoose.Schema<IInsight>(
  {
    id: {
      type: String,
      required: true,
    },
    text: {
      type: String,
      required: true,
    },
    severity: {
      type: String,
      enum: ['info', 'warning', 'critical', 'success'],
      default: 'info',
    },
    category: String,
  },
  { _id: false }
);

const PlaygroundReportSchema = new mongoose.Schema<IPlaygroundReport>(
  {
    threadId: {
      type: String,
      required: true,
      index: true,
    },
    version: {
      type: Number,
      required: true,
      default: 1,
    },
    parentReportId: {
      type: String,
      index: true,
    },
    htmlContent: {
      type: String,
      required: true,
    },
    sections: {
      type: [ReportSectionSchema],
      default: [],
    },
    insights: {
      type: [InsightSchema],
      default: [],
    },
    metadata: {
      generatedBy: String,
      model: String,
      provider: String,
      prompt: String,
      dataSources: [String],
      generationTime: Number,
    },
    pdfUrl: String,
    isPublished: {
      type: Boolean,
      default: false,
    },
    publishedAt: Date,
  },
  {
    timestamps: true,
  }
);

// Compound indexes for efficient queries
PlaygroundReportSchema.index({ threadId: 1, version: -1 }); // Get latest version first
PlaygroundReportSchema.index({ threadId: 1, createdAt: -1 }); // Chronological order
PlaygroundReportSchema.index({ parentReportId: 1 }); // Version tree traversal

// Pre-save hook to auto-increment version
PlaygroundReportSchema.pre('save', async function (next) {
  if (this.isNew && !this.version) {
    const lastReport = await mongoose.models.PlaygroundReport.findOne({ threadId: this.threadId })
      .sort({ version: -1 })
      .limit(1);
    this.version = lastReport ? lastReport.version + 1 : 1;
  }
  next();
});

export default mongoose.models.PlaygroundReport ||
  mongoose.model<IPlaygroundReport>('PlaygroundReport', PlaygroundReportSchema);
