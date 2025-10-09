import mongoose, { Document, Model, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  email: string;
  password?: string;
  name: string;
  avatar?: string;
  image?: string;
  bio?: string;
  aiCredits: number;
  credits?: number;
  plan: 'free' | 'pro' | 'enterprise';
  following: mongoose.Types.ObjectId[];
  followers: mongoose.Types.ObjectId[];
  isPublic: boolean;
  theme: 'light' | 'dark' | 'system';
  notificationSettings: {
    email: boolean;
    push: boolean;
    updates: boolean;
  };
  preferences?: {
    theme?: string;
    language?: string;
    timezone?: string;
    notifications?: {
      email?: boolean;
      push?: boolean;
      marketing?: boolean;
    };
  };
  googleId?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface IUserMethods {
  comparePassword(candidatePassword: string): Promise<boolean>;
}

type UserModel = Model<IUser, {}, IUserMethods>;

const userSchema = new Schema<IUser, UserModel, IUserMethods>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      select: false,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    avatar: String,
    image: String,
    bio: {
      type: String,
      maxlength: 500,
    },
    aiCredits: {
      type: Number,
      default: 100,
    },
    credits: {
      type: Number,
      default: 100,
    },
    plan: {
      type: String,
      enum: ['free', 'pro', 'enterprise'],
      default: 'free',
    },
    following: [{
      type: Schema.Types.ObjectId,
      ref: 'User',
    }],
    followers: [{
      type: Schema.Types.ObjectId,
      ref: 'User',
    }],
    isPublic: {
      type: Boolean,
      default: true,
    },
    theme: {
      type: String,
      enum: ['light', 'dark', 'system'],
      default: 'system',
    },
    notificationSettings: {
      email: { type: Boolean, default: true },
      push: { type: Boolean, default: true },
      updates: { type: Boolean, default: true },
    },
    preferences: {
      type: Schema.Types.Mixed,
      default: {
        theme: 'system',
        language: 'en',
        timezone: 'UTC',
        notifications: {
          email: true,
          push: true,
          marketing: false,
        },
      },
    },
    googleId: String,
  },
  {
    timestamps: true,
  }
);

userSchema.pre('save', async function(next) {
  if (!this.isModified('password') || !this.password) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error: any) {
    next(error);
  }
});

userSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.models.User as UserModel || mongoose.model<IUser, UserModel>('User', userSchema);