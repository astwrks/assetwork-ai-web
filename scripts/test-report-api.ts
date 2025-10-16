#!/usr/bin/env tsx

/**
 * Script to test report generation API directly
 */

async function testReportAPI() {
  console.log('🔧 Testing report generation API...');

  try {
    // First, get CSRF token
    const csrfResponse = await fetch('http://localhost:3001/api/auth/csrf');
    const { csrfToken } = await csrfResponse.json();

    // Login to get session
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

    const cookies = loginResponse.headers.get('set-cookie');
    console.log('✅ Logged in');

    // Create a thread
    const threadResponse = await fetch('http://localhost:3001/api/v2/threads', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookies || '',
      },
      credentials: 'include',
      body: JSON.stringify({
        title: 'Test Report Generation',
        description: 'Testing',
      }),
    });

    const thread = await threadResponse.json();
    if (!threadResponse.ok || !thread.data) {
      console.error('❌ Failed to create thread:', thread);
      return;
    }
    console.log('✅ Thread created:', thread.data.id);

    // Generate report with streaming
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
        prompt: 'Give me a brief analysis of Apple Inc.',
        model: 'claude-3-haiku-20240307',
        options: {
          stream: true,
          extractEntities: true,
          generateCharts: false,
          includeMarketData: false,
          language: 'en',
          format: 'html',
        },
      }),
    });

    if (!reportResponse.ok) {
      const error = await reportResponse.text();
      console.error('❌ Report generation failed:', reportResponse.status, error);
      return;
    }

    // Process streaming response
    const reader = reportResponse.body?.getReader();
    const decoder = new TextDecoder();
    let eventCount = 0;

    if (reader) {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              eventCount++;

              if (data.type === 'error') {
                console.error('❌ Error event received:', data);
                if (data.details) {
                  console.error('Stack trace:', data.details);
                }
              } else if (data.type === 'start') {
                console.log('✅ Generation started');
              } else if (data.type === 'complete') {
                console.log('✅ Generation completed');
              } else if (data.type === 'content') {
                // Don't log content chunks, too verbose
              } else if (data.type === 'tokens') {
                console.log(`📊 Tokens: ${data.tokens.total}`);
              }
            } catch (e) {
              // Ignore parse errors
            }
          }
        }
      }
    }

    console.log(`✅ Received ${eventCount} events`);

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testReportAPI();