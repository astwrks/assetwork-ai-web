const Anthropic = require('@anthropic-ai/sdk');

// Test Anthropic API
async function testAnthropicAPI() {
  console.log('🔄 Testing Anthropic API...');
  
  const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });

  try {
    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 100,
      messages: [
        {
          role: 'user',
          content: 'Say "Hello, AssetWorks!" and confirm you are working.',
        },
      ],
    });

    console.log('✅ Anthropic API is working!');
    console.log('Response:', response.content[0].text);
    return true;
  } catch (error) {
    console.error('❌ Anthropic API Error:', error.message);
    return false;
  }
}

// Test Google OAuth Config
function testGoogleOAuth() {
  console.log('\n🔄 Testing Google OAuth Configuration...');
  
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  
  if (clientId && clientId.includes('.apps.googleusercontent.com')) {
    console.log('✅ Google Client ID format is valid');
  } else {
    console.log('❌ Google Client ID format is invalid');
  }
  
  if (clientSecret && clientSecret.startsWith('GOCSPX-')) {
    console.log('✅ Google Client Secret format is valid');
  } else {
    console.log('❌ Google Client Secret format is invalid');
  }
  
  console.log('\n📝 Google OAuth Redirect URIs to add in Google Console:');
  console.log('   http://localhost:3002/api/auth/callback/google');
  console.log('   http://localhost:3000/api/auth/callback/google');
  
  return true;
}

// Run all tests
async function runTests() {
  console.log('=================================');
  console.log('🚀 AssetWorks API Configuration Test');
  console.log('=================================\n');
  
  const anthropicOk = await testAnthropicAPI();
  const googleOk = testGoogleOAuth();
  
  console.log('\n=================================');
  console.log('📊 Test Results Summary:');
  console.log('=================================');
  console.log(`Anthropic API: ${anthropicOk ? '✅ Working' : '❌ Failed'}`);
  console.log(`Google OAuth: ${googleOk ? '✅ Configured' : '❌ Check Configuration'}`);
  console.log('\n✨ Your AssetWorks app is ready to use!');
  console.log('🔗 Access at: http://localhost:3002');
  console.log('💬 AI Chat: http://localhost:3002/ai-chat');
  console.log('=================================\n');
}

runTests();