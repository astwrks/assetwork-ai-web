#!/usr/bin/env tsx

/**
 * Script to test the exact browser flow for report generation
 */

async function testBrowserFlow() {
  console.log('🔧 Testing browser flow for report generation...');

  try {
    // First, get CSRF token
    console.log('📝 Getting CSRF token...');
    const csrfResponse = await fetch('http://localhost:3001/api/auth/csrf');
    const { csrfToken } = await csrfResponse.json();
    console.log('✅ Got CSRF token');

    // Login to get session
    console.log('🔐 Logging in...');
    const loginResponse = await fetch('http://localhost:3001/api/auth/callback/credentials', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        email: 'test@assetworks.ai',
        password: 'password123',
        csrfToken,
        redirect: 'false',
        callbackUrl: '/financial-playground',
        json: 'true',
      }),
      credentials: 'include',
    });

    if (!loginResponse.ok) {
      const error = await loginResponse.text();
      console.error('❌ Login failed:', loginResponse.status, error);
      return;
    }

    const cookies = loginResponse.headers.get('set-cookie');
    console.log('✅ Login successful');

    // Get session to verify
    console.log('🔍 Verifying session...');
    const sessionResponse = await fetch('http://localhost:3001/api/auth/session', {
      headers: {
        'Cookie': cookies || '',
      },
      credentials: 'include',
    });

    const session = await sessionResponse.json();
    if (!session?.user) {
      console.error('❌ No active session');
      return;
    }
    console.log('✅ Session active for:', session.user.email);

    // Create a thread
    console.log('📝 Creating thread...');
    const threadResponse = await fetch('http://localhost:3001/api/v2/threads', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookies || '',
      },
      credentials: 'include',
      body: JSON.stringify({
        title: 'Test Thread ' + new Date().toISOString(),
        description: 'Testing report generation',
      }),
    });

    if (!threadResponse.ok) {
      const error = await threadResponse.text();
      console.error('❌ Thread creation failed:', threadResponse.status, error);
      return;
    }

    const thread = await threadResponse.json();
    console.log('✅ Thread created:', thread.data.id);

    // Create a message
    console.log('💬 Creating message...');
    const messageResponse = await fetch('http://localhost:3001/api/v2/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookies || '',
      },
      credentials: 'include',
      body: JSON.stringify({
        threadId: thread.data.id,
        content: 'Analyze the top 3 tech companies',
        role: 'user',
      }),
    });

    if (!messageResponse.ok) {
      const error = await messageResponse.text();
      console.error('❌ Message creation failed:', messageResponse.status, error);
      console.error('Full response:', {
        status: messageResponse.status,
        statusText: messageResponse.statusText,
        headers: Object.fromEntries(messageResponse.headers.entries()),
      });
      return;
    }

    const message = await messageResponse.json();
    console.log('✅ Message created:', message.data.id);

    // Generate report
    console.log('🚀 Generating report...');
    const reportResponse = await fetch('http://localhost:3001/api/v2/reports/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookies || '',
      },
      credentials: 'include',
      body: JSON.stringify({
        threadId: thread.data.id,
        prompt: 'Analyze the top 3 tech companies',
        options: {
          stream: false,
        },
      }),
    });

    if (!reportResponse.ok) {
      const error = await reportResponse.text();
      console.error('❌ Report generation failed:', reportResponse.status, error);
      return;
    }

    const report = await reportResponse.json();
    console.log('✅ Report generated successfully!');
    console.log('📊 Report details:', {
      success: report.success,
      hasData: !!report.data,
      meta: report.meta,
    });

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testBrowserFlow();