import { NextRequest } from 'next/server';
import { enhancementEngine } from '@/lib/ai/enhancement-engine';

export async function POST(req: NextRequest) {
  try {
    const { messages, threadId, currentHTML } = await req.json();
    
    // Get the last user message
    const lastUserMessage = messages
      .filter((m: any) => m.role === 'user')
      .pop();
    
    if (!lastUserMessage) {
      throw new Error('No user message found');
    }
    
    const query = lastUserMessage.content;
    console.log(`[Enhancement] Thread: ${threadId}, Query: ${query}`);
    
    // Process enhancement request
    const response = await enhancementEngine.enhance({
      threadId: threadId || `thread_${Date.now()}`,
      prompt: query,
      currentHTML
    });
    
    // Create a streaming response
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        // Send initial metadata
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({
              type: 'metadata',
              model: 'enhancement-engine-v1',
              context: {
                version: response.context.metadata.version,
                sections: response.context.currentState.sections.length,
                assets: response.context.currentState.assets
              },
              timestamp: new Date().toISOString(),
            })}\n\n`
          )
        );
        
        // Stream the HTML content in chunks
        const chunkSize = 2000;
        for (let i = 0; i < response.html.length; i += chunkSize) {
          const chunk = response.html.slice(i, i + chunkSize);
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                content: chunk,
              })}\n\n`
            )
          );
          
          // Small delay to simulate streaming
          await new Promise(resolve => setTimeout(resolve, 20));
        }
        
        // Send section updates
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({
              type: 'sections',
              sections: response.sections,
            })}\n\n`
          )
        );
        
        // Send completion metadata
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({
              type: 'complete',
              metadata: {
                model: 'enhancement-engine-v1',
                tokens: {
                  input: query.length,
                  output: response.html.length,
                  saved: response.context.metadata.totalTokens,
                },
                duration: 500,
                timestamp: new Date().toISOString(),
                context: {
                  threadId: response.context.threadId,
                  version: response.context.metadata.version,
                  enhancements: response.context.enhancements.length,
                }
              },
            })}\n\n`
          )
        );
        
        // Send done signal
        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        controller.close();
      },
    });
    
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Enhancement error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to enhance report' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}