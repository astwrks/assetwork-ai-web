#!/usr/bin/env node
// Simple mock server for testing AssetWorks API endpoints
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 8080;

// Middleware
app.use(cors());
app.use(express.json());

// Mock data storage
const otps = new Map(); // email -> otp
const users = new Map(); // email -> user data

// Generate random 6-digit OTP
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Mock API endpoints
app.post('/api/auth/otp/send', (req, res) => {
  const { identifier } = req.body;
  
  if (!identifier) {
    return res.status(400).json({
      success: false,
      message: 'Email identifier is required'
    });
  }

  const otp = generateOTP();
  otps.set(identifier, otp);
  
  console.log(`📧 OTP for ${identifier}: ${otp}`);
  
  res.json({
    success: true,
    message: 'OTP sent successfully to your email',
    data: { identifier }
  });
});

app.post('/api/auth/otp/verify', (req, res) => {
  const { identifier, otp } = req.body;
  
  if (!identifier || !otp) {
    return res.status(400).json({
      success: false,
      message: 'Email and OTP are required'
    });
  }

  const storedOtp = otps.get(identifier);
  
  if (!storedOtp || storedOtp !== otp) {
    return res.status(400).json({
      success: false,
      message: 'Invalid OTP. Please check your email and try again.'
    });
  }

  // Clear OTP after successful verification
  otps.delete(identifier);
  
  // Create mock user
  const user = {
    id: 'user_' + Date.now(),
    email: identifier,
    name: identifier.split('@')[0],
    verified: true
  };
  
  users.set(identifier, user);
  
  // Mock JWT token
  const token = 'mock_jwt_token_' + Date.now();
  
  console.log(`✅ User ${identifier} verified successfully`);
  
  res.json({
    success: true,
    message: 'Login successful!',
    data: { user, token }
  });
});

// Mock Google OAuth
app.post('/api/auth/google', (req, res) => {
  const { access_token } = req.body;
  
  if (!access_token) {
    return res.status(400).json({
      success: false,
      message: 'Google access token is required'
    });
  }

  const user = {
    id: 'google_user_' + Date.now(),
    email: 'user@gmail.com',
    name: 'Google User',
    provider: 'google'
  };
  
  const token = 'mock_google_jwt_' + Date.now();
  
  res.json({
    success: true,
    message: 'Google login successful!',
    data: { user, token }
  });
});

// Mock Apple OAuth  
app.post('/api/auth/apple', (req, res) => {
  const { access_token } = req.body;
  
  if (!access_token) {
    return res.status(400).json({
      success: false,
      message: 'Apple access token is required'
    });
  }

  const user = {
    id: 'apple_user_' + Date.now(),
    email: 'user@icloud.com', 
    name: 'Apple User',
    provider: 'apple'
  };
  
  const token = 'mock_apple_jwt_' + Date.now();
  
  res.json({
    success: true,
    message: 'Apple login successful!',
    data: { user, token }
  });
});

// Mock user profile
app.get('/api/user/profile', (req, res) => {
  res.json({
    success: true,
    data: {
      id: 'mock_user_123',
      email: 'test@example.com',
      name: 'Test User',
      avatar: null
    }
  });
});

// Mock logout
app.post('/api/user/signout', (req, res) => {
  res.json({
    success: true,
    message: 'Logged out successfully'
  });
});

// Mock widgets
app.get('/api/widgets', (req, res) => {
  res.json({
    success: true,
    data: [
      {
        id: '1',
        title: 'Sample Widget',
        description: 'This is a sample widget',
        created_at: new Date().toISOString()
      }
    ]
  });
});

// Mock notifications
app.get('/api/notifications', (req, res) => {
  res.json({
    success: true,
    data: [
      {
        id: '1',
        title: 'Welcome!',
        message: 'Welcome to AssetWorks',
        read: false,
        created_at: new Date().toISOString()
      }
    ]
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Mock AssetWorks API Server' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Mock AssetWorks API Server running on http://localhost:${PORT}`);
  console.log(`📋 Available endpoints:`);
  console.log(`   POST /api/auth/otp/send - Send OTP to email`);
  console.log(`   POST /api/auth/otp/verify - Verify OTP`);
  console.log(`   POST /api/auth/google - Google OAuth`);
  console.log(`   POST /api/auth/apple - Apple OAuth`);
  console.log(`   GET  /api/user/profile - Get user profile`);
  console.log(`   GET  /health - Health check`);
  console.log(`\n💡 When testing email OTP, check this console for the OTP code!`);
});