// Test script for AI Enhancement Flow
// Run with: npx tsx test-enhancement-flow.ts

import { enhancementEngine } from './lib/ai/enhancement-engine';
import { reportContextManager } from './lib/ai/report-context-manager';

async function testEnhancementFlow() {
  console.log('🧪 Testing AI Enhancement Flow\n');
  
  // Test 1: Initial Report Generation
  console.log('1️⃣ Testing Initial Report Generation...');
  const threadId = `test_thread_${Date.now()}`;
  
  const initialRequest = {
    threadId,
    prompt: 'Analyze Apple stock performance',
    currentHTML: ''
  };
  
  const initialResponse = await enhancementEngine.enhance(initialRequest);
  console.log('✅ Initial report generated');
  console.log(`   - Sections: ${initialResponse.sections.length}`);
  console.log(`   - HTML Length: ${initialResponse.html.length} chars`);
  console.log(`   - Context Version: ${initialResponse.context.metadata.version}`);
  
  // Test 2: First Enhancement
  console.log('\n2️⃣ Testing First Enhancement (Add Technical Analysis)...');
  const enhancement1 = {
    threadId,
    prompt: 'Add technical indicators and RSI analysis',
    currentHTML: initialResponse.html
  };
  
  const response1 = await enhancementEngine.enhance(enhancement1);
  console.log('✅ Technical analysis added');
  console.log(`   - New Sections: ${response1.sections.length}`);
  console.log(`   - Context Version: ${response1.context.metadata.version}`);
  console.log(`   - Total Enhancements: ${response1.context.enhancements.length}`);
  
  // Test 3: Second Enhancement
  console.log('\n3️⃣ Testing Second Enhancement (Add Comparison)...');
  const enhancement2 = {
    threadId,
    prompt: 'Compare with Microsoft and Google',
    currentHTML: response1.html
  };
  
  const response2 = await enhancementEngine.enhance(enhancement2);
  console.log('✅ Comparison section added');
  console.log(`   - Assets: ${response2.context.currentState.assets.join(', ')}`);
  console.log(`   - Context Version: ${response2.context.metadata.version}`);
  console.log(`   - Total Sections: ${response2.context.currentState.sections.length}`);
  
  // Test 4: Context Compression
  console.log('\n4️⃣ Testing Context Compression...');
  const contextSize = JSON.stringify(response2.context).length;
  console.log(`   - Context Size: ${contextSize} bytes`);
  
  const minified = reportContextManager.generateMinifiedContext(response2.context);
  console.log(`   - Minified Size: ${minified.length} bytes`);
  console.log(`   - Compression Ratio: ${((1 - minified.length/contextSize) * 100).toFixed(1)}%`);
  
  // Test 5: Smart Prompt Generation
  console.log('\n5️⃣ Testing Smart Prompt Generation...');
  const smartPrompt = reportContextManager.buildSmartPrompt(
    response2.context,
    'Add 5 year historical trends'
  );
  console.log(`   - Smart Prompt Length: ${smartPrompt.length} chars`);
  console.log(`   - Includes Context: ✓`);
  console.log(`   - Includes Previous Enhancements: ✓`);
  
  // Test 6: Enhancement Types
  console.log('\n6️⃣ Testing Different Enhancement Types...');
  const enhancementTypes = [
    { prompt: 'Add risk analysis', expected: 'risk-analysis' },
    { prompt: 'Show predictions for next quarter', expected: 'predictions' },
    { prompt: 'Add 3 year historical data', expected: 'historical-analysis' }
  ];
  
  for (const test of enhancementTypes) {
    const response = await enhancementEngine.enhance({
      threadId,
      prompt: test.prompt,
      currentHTML: response2.html
    });
    
    const hasExpectedSection = response.sections.some(s => 
      s.id.includes(test.expected.split('-')[0])
    );
    
    console.log(`   - "${test.prompt}": ${hasExpectedSection ? '✅' : '❌'}`);
  }
  
  // Summary
  console.log('\n📊 Test Summary:');
  const finalContext = reportContextManager.getContext(threadId);
  if (finalContext) {
    console.log(`   - Thread ID: ${threadId}`);
    console.log(`   - Total Enhancements: ${finalContext.enhancements.length}`);
    console.log(`   - Final Version: ${finalContext.metadata.version}`);
    console.log(`   - Assets Tracked: ${finalContext.currentState.assets.join(', ')}`);
    console.log(`   - Sections Created: ${finalContext.currentState.sections.map(s => s.type).join(', ')}`);
  }
  
  console.log('\n✨ Enhancement Flow Test Complete!');
}

// Run the test
testEnhancementFlow().catch(console.error);