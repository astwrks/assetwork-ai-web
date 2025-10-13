import mongoose from 'mongoose';

export interface ITemplateSection {
  type: 'chart' | 'table' | 'text' | 'metric' | 'insight' | 'image';
  title: string;
  description?: string;
  defaultConfig?: any;
  required: boolean;
  order: number;
}

export interface ITemplate {
  _id: string;
  userId: string;
  name: string;
  description?: string;
  category?: string;
  tags?: string[];
  structure: ITemplateSection[];
  basePrompt?: string; // Default prompt to generate reports from this template
  isPublic: boolean; // Whether this template is shared with all users
  usageCount: number; // Track popularity
  sourceThreadId?: string; // If created from an existing thread
  previewImageUrl?: string;
  isPremium: boolean; // Whether this template requires premium subscription
  tier: 'free' | 'pro' | 'enterprise'; // Template tier
  rating: number; // Average rating (0-5)
  ratingCount: number; // Number of ratings
  icon?: string; // Icon identifier (lucide icon name)
  createdAt: Date;
  updatedAt: Date;
}

const TemplateSectionSchema = new mongoose.Schema<ITemplateSection>(
  {
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
    description: {
      type: String,
      trim: true,
    },
    defaultConfig: mongoose.Schema.Types.Mixed,
    required: {
      type: Boolean,
      default: false,
    },
    order: {
      type: Number,
      required: true,
    },
  },
  { _id: false }
);

const TemplateSchema = new mongoose.Schema<ITemplate>(
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
      maxlength: 200,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 1000,
    },
    category: {
      type: String,
      trim: true,
      index: true,
    },
    tags: {
      type: [String],
      default: [],
      index: true,
    },
    structure: {
      type: [TemplateSectionSchema],
      required: true,
    },
    basePrompt: {
      type: String,
      trim: true,
    },
    isPublic: {
      type: Boolean,
      default: false,
      index: true,
    },
    usageCount: {
      type: Number,
      default: 0,
    },
    sourceThreadId: {
      type: String,
      index: true,
    },
    previewImageUrl: String,
    isPremium: {
      type: Boolean,
      default: false,
      index: true,
    },
    tier: {
      type: String,
      enum: ['free', 'pro', 'enterprise'],
      default: 'free',
      index: true,
    },
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    ratingCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    icon: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for efficient queries
TemplateSchema.index({ userId: 1, createdAt: -1 }); // User's templates
TemplateSchema.index({ isPublic: 1, usageCount: -1 }); // Popular public templates
TemplateSchema.index({ isPublic: 1, category: 1 }); // Browse by category
TemplateSchema.index({ tags: 1, isPublic: 1 }); // Search by tags
TemplateSchema.index({ isPublic: 1, tier: 1, rating: -1 }); // Browse by tier and rating
TemplateSchema.index({ isPremium: 1, isPublic: 1 }); // Filter premium templates

// Text index for search functionality
TemplateSchema.index({ name: 'text', description: 'text', tags: 'text' });

export default mongoose.models.Template || mongoose.model<ITemplate>('Template', TemplateSchema);
