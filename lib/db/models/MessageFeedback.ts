import mongoose, { Document, Schema } from 'mongoose';

export interface IMessageFeedback extends Document {
  messageId: string;
  userEmail: string;
  feedback: 'up' | 'down';
  createdAt: Date;
  updatedAt: Date;
}

const MessageFeedbackSchema = new Schema<IMessageFeedback>(
  {
    messageId: {
      type: String,
      required: true,
      index: true,
    },
    userEmail: {
      type: String,
      required: true,
      index: true,
    },
    feedback: {
      type: String,
      enum: ['up', 'down'],
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to ensure one feedback per user per message
MessageFeedbackSchema.index({ messageId: 1, userEmail: 1 }, { unique: true });

const MessageFeedback =
  mongoose.models.MessageFeedback ||
  mongoose.model<IMessageFeedback>('MessageFeedback', MessageFeedbackSchema);

export default MessageFeedback;
