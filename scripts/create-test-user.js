const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// MongoDB connection string
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/assetworks';

// User schema definition
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String },
  name: { type: String, required: true },
  avatar: String,
  bio: String,
  aiCredits: { type: Number, default: 100 },
  plan: { type: String, default: 'free' },
  following: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  isPublic: { type: Boolean, default: true },
  theme: { type: String, default: 'system' },
  notificationSettings: {
    email: { type: Boolean, default: true },
    push: { type: Boolean, default: true },
    updates: { type: Boolean, default: true },
  },
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

async function createTestUser() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Check if test user already exists
    const existingUser = await User.findOne({ email: 'test@assetworks.ai' });
    
    if (existingUser) {
      console.log('Test user already exists:', {
        email: existingUser.email,
        name: existingUser.name,
        id: existingUser._id,
        aiCredits: existingUser.aiCredits,
        plan: existingUser.plan
      });
      
      // Update password to ensure we know it
      const hashedPassword = await bcrypt.hash('Test123456!', 10);
      existingUser.password = hashedPassword;
      existingUser.aiCredits = 1000; // Give plenty of credits
      existingUser.plan = 'pro'; // Upgrade to pro for testing
      await existingUser.save();
      console.log('Updated test user password and upgraded to pro plan');
    } else {
      // Create new test user
      const hashedPassword = await bcrypt.hash('Test123456!', 10);
      
      const testUser = await User.create({
        email: 'test@assetworks.ai',
        password: hashedPassword,
        name: 'Test User',
        bio: 'This is a test account for development',
        aiCredits: 1000,
        plan: 'pro',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=test',
      });

      console.log('Test user created successfully:', {
        email: testUser.email,
        name: testUser.name,
        id: testUser._id,
        aiCredits: testUser.aiCredits,
        plan: testUser.plan
      });
    }

    console.log('\n=================================');
    console.log('Test Account Credentials:');
    console.log('Email: test@assetworks.ai');
    console.log('Password: Test123456!');
    console.log('=================================\n');

  } catch (error) {
    console.error('Error creating test user:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the script
createTestUser();