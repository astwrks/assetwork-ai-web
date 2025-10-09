import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IQuery extends Document {
  userId: mongoose.Types.ObjectId;
  query: string;
  response: string;
  widgetId?: mongoose.Types.ObjectId;
  credits: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  error?: string;
  metadata?: {
    model?: string;
    tokensUsed?: number;
    processingTime?: number;
    dataSource?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

type QueryModel = Model<IQuery>;

const querySchema = new Schema<IQuery, QueryModel>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    query: {
      type: String,
      required: true,
      maxlength: 2000,
    },
    response: {
      type: String,
      required: true,
    },
    widgetId: {
      type: Schema.Types.ObjectId,
      ref: 'Widget',
    },
    credits: {
      type: Number,
      default: 1,
      min: 0,
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed'],
      default: 'pending',
    },
    error: String,
    metadata: {
      model: String,
      tokensUsed: Number,
      processingTime: Number,
      dataSource: String,
    },
  },
  {
    timestamps: true,
  }
);

querySchema.index({ userId: 1, createdAt: -1 });
querySchema.index({ status: 1 });

export default mongoose.models.Query as QueryModel || mongoose.model<IQuery, QueryModel>('Query', querySchema);