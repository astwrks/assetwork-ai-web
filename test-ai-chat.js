#!/usr/bin/env node

async function testAIChat() {
  console.log('🧪 Testing AI Chat API...\n');
  
  const testMessage = {
    messages: [
      {
        role: 'user',
        content: 'Create a simple stock price chart for AAPL showing the last 30 days'
      }
    ],
    model: 'claude-3-5-sonnet-20241022',
    systemPrompt: 'You are an AI assistant that ALWAYS responds with interactive HTML widgets. Generate complete, self-contained HTML with inline styles and scripts.'
  };

  try {
    console.log('📤 Sending test request to /api/ai/stream...');
    const response = await fetch('http://localhost:3003/api/ai/stream', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testMessage)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    console.log('✅ Response received successfully');
    console.log('📊 Response headers:', {
      contentType: response.headers.get('content-type'),
      cacheControl: response.headers.get('cache-control')
    });

    // Read a few chunks to verify streaming
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let chunks = 0;
    let content = '';

    while (chunks < 5) {
      const { done, value } = await reader.read();
      if (done) break;
      
      const chunk = decoder.decode(value);
      content += chunk;
      chunks++;
      console.log(`📦 Chunk ${chunks} received (${chunk.length} bytes)`);
    }

    console.log('\n✅ Test completed successfully!');
    console.log('📝 First part of response:', content.substring(0, 200) + '...');
    
    reader.cancel();
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

testAIChat();