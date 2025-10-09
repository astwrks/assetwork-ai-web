import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IWidget extends Document {
  userId: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  query: string;
  type: 'chart' | 'dashboard' | 'report' | 'table' | 'metric' | 'custom';
  subType?: string;
  data: any;
  chartConfig?: {
    chartType?: 'line' | 'bar' | 'pie' | 'area' | 'candlestick' | 'scatter';
    colors?: string[];
    showLegend?: boolean;
    showGrid?: boolean;
    animated?: boolean;
  };
  settings: {
    width?: number;
    height?: number;
    refreshInterval?: number;
    theme?: 'light' | 'dark' | 'auto';
  };
  isPublic: boolean;
  likes: mongoose.Types.ObjectId[];
  views: number;
  tags: string[];
  version: number;
  parentWidget?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

type WidgetModel = Model<IWidget>;

const widgetSchema = new Schema<IWidget, WidgetModel>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
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
      maxlength: 1000,
    },
    query: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ['chart', 'dashboard', 'report', 'table', 'metric', 'custom'],
      required: true,
    },
    subType: String,
    data: {
      type: Schema.Types.Mixed,
      required: true,
    },
    chartConfig: {
      chartType: {
        type: String,
        enum: ['line', 'bar', 'pie', 'area', 'candlestick', 'scatter'],
      },
      colors: [String],
      showLegend: { type: Boolean, default: true },
      showGrid: { type: Boolean, default: true },
      animated: { type: Boolean, default: true },
    },
    settings: {
      width: Number,
      height: Number,
      refreshInterval: Number,
      theme: {
        type: String,
        enum: ['light', 'dark', 'auto'],
        default: 'auto',
      },
    },
    isPublic: {
      type: Boolean,
      default: false,
      index: true,
    },
    likes: [{
      type: Schema.Types.ObjectId,
      ref: 'User',
    }],
    views: {
      type: Number,
      default: 0,
    },
    tags: [{
      type: String,
      lowercase: true,
      trim: true,
    }],
    version: {
      type: Number,
      default: 1,
    },
    parentWidget: {
      type: Schema.Types.ObjectId,
      ref: 'Widget',
    },
  },
  {
    timestamps: true,
  }
);

widgetSchema.index({ userId: 1, createdAt: -1 });
widgetSchema.index({ isPublic: 1, createdAt: -1 });
widgetSchema.index({ tags: 1 });
widgetSchema.index({ title: 'text', description: 'text' });

export default mongoose.models.Widget as WidgetModel || mongoose.model<IWidget, WidgetModel>('Widget', widgetSchema);