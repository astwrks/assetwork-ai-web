#!/usr/bin/env tsx

/**
 * Script to test report generation directly
 */

async function testReportGeneration() {
  console.log('🔧 Testing report generation...');

  try {
    // First, get a session cookie by logging in
    const loginResponse = await fetch('http://localhost:3001/api/auth/callback/credentials', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        email: 'test@assetworks.ai',
        password: 'password123',
        csrfToken: 'test',
      }),
    });

    const cookies = loginResponse.headers.get('set-cookie');
    console.log('🍪 Auth cookies obtained:', !!cookies);

    // Create a new thread
    console.log('📝 Creating new thread...');
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

    const thread = await threadResponse.json();
    if (!threadResponse.ok) {
      console.error('❌ Failed to create thread:', thread);
      return;
    }
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

    const message = await messageResponse.json();
    if (!messageResponse.ok) {
      console.error('❌ Failed to create message:', message);
      console.error('Message response status:', messageResponse.status);
      return;
    }
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
      console.error('❌ Report generation failed:', reportResponse.status, reportResponse.statusText);
      console.error('Error details:', error);
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

testReportGeneration();