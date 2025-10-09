import mongoose from 'mongoose';

export interface IMessage {
  _id: string;
  threadId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  reportId?: string; // If this message generated/modified a report
  metadata?: {
    model?: string; // AI model used (e.g., "gpt-4", "claude-3")
    provider?: string; // AI provider (e.g., "openai", "anthropic")
    tokens?: {
      prompt: number;
      completion: number;
      total: number;
    };
    cost?: number;
    duration?: number; // Response time in ms
    error?: string;
    sectionId?: string; // If editing a specific section
    action?: 'create' | 'modify' | 'delete'; // Type of action performed
  };
  createdAt: Date;
  updatedAt: Date;
}

const MessageSchema = new mongoose.Schema<IMessage>(
  {
    threadId: {
      type: String,
      required: true,
      index: true,
    },
    role: {
      type: String,
      enum: ['user', 'assistant', 'system'],
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    reportId: {
      type: String,
      index: true,
    },
    metadata: {
      model: String,
      provider: String,
      tokens: {
        prompt: Number,
        completion: Number,
        total: Number,
      },
      cost: Number,
      duration: Number,
      error: String,
      sectionId: String,
      action: {
        type: String,
        enum: ['create', 'modify', 'delete'],
      },
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient queries
MessageSchema.index({ threadId: 1, createdAt: 1 }); // Get messages in chronological order
MessageSchema.index({ threadId: 1, role: 1 }); // Filter by role
MessageSchema.index({ reportId: 1 }); // Find messages that generated specific reports

export default mongoose.models.Message || mongoose.model<IMessage>('Message', MessageSchema);
