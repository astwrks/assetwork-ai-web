import mongoose from 'mongoose';
import crypto from 'crypto';

export interface IApiKey {
  _id: string;
  userId: string;
  name: string;
  provider: 'openai' | 'anthropic' | 'google' | 'groq' | 'alpha_vantage' | 'coingecko' | 'polygon' | 'finnhub' | 'coinmarketcap' | 'custom';
  category: 'ai' | 'financial_data' | 'crypto' | 'other';
  connectionStatus?: 'connected' | 'error' | 'unknown';
  lastChecked?: Date;
  encryptedKey: string;
  keyPreview: string; // Last 4 chars for display
  isActive: boolean;
  lastUsed?: Date;
  usageCount: number;
  metadata?: {
    model?: string;
    endpoint?: string;
    rateLimit?: number;
    quotaRemaining?: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const ApiKeySchema = new mongoose.Schema<IApiKey>(
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
    provider: {
      type: String,
      enum: ['openai', 'anthropic', 'google', 'groq', 'alpha_vantage', 'coingecko', 'polygon', 'finnhub', 'coinmarketcap', 'custom'],
      required: true,
      index: true,
    },
    connectionStatus: {
      type: String,
      enum: ['connected', 'error', 'unknown'],
      default: 'unknown',
    },
    lastChecked: Date,
    category: {
      type: String,
      enum: ['ai', 'financial_data', 'crypto', 'other'],
      required: true,
      index: true,
    },
    encryptedKey: {
      type: String,
      required: true,
      select: false, // Don't include by default for security
    },
    keyPreview: {
      type: String,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    lastUsed: Date,
    usageCount: {
      type: Number,
      default: 0,
    },
    metadata: {
      model: String,
      endpoint: String,
      rateLimit: Number,
      quotaRemaining: Number,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for performance
ApiKeySchema.index({ userId: 1, category: 1, isActive: 1 });
ApiKeySchema.index({ userId: 1, provider: 1 });

// Encryption/Decryption methods
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex');
const ALGORITHM = 'aes-256-gcm';

export function encryptApiKey(apiKey: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY, 'hex'), iv);

  let encrypted = cipher.update(apiKey, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag();

  // Return: iv:authTag:encrypted
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

export function decryptApiKey(encryptedData: string): string {
  const [ivHex, authTagHex, encrypted] = encryptedData.split(':');

  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY, 'hex'), iv);

  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

export function getKeyPreview(apiKey: string): string {
  if (apiKey.length <= 4) return '****';
  return `****${apiKey.slice(-4)}`;
}

export default mongoose.models.ApiKey || mongoose.model<IApiKey>('ApiKey', ApiKeySchema);
