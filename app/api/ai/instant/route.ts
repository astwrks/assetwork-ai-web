import { NextRequest } from 'next/server';
import { instantReportGenerator } from '@/lib/instant-report-engine';

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();
    
    // Get the last user message
    const lastUserMessage = messages
      .filter((m: any) => m.role === 'user')
      .pop();
    
    if (!lastUserMessage) {
      throw new Error('No user message found');
    }
    
    const query = lastUserMessage.content;
    console.log('Generating instant report for query:', query);
    
    // Generate report instantly using the new engine
    const htmlContent = instantReportGenerator.generateReport(query);
    
    // Create a ReadableStream that mimics the Claude API response format
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        // Send initial metadata
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({
              type: 'metadata',
              model: 'instant-engine-v1',
              timestamp: new Date().toISOString(),
            })}\n\n`
          )
        );
        
        // Send the HTML content in chunks to simulate streaming
        const chunkSize = 1000;
        for (let i = 0; i < htmlContent.length; i += chunkSize) {
          const chunk = htmlContent.slice(i, i + chunkSize);
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: 'content',
                content: chunk,
              })}\n\n`
            )
          );
          
          // Small delay to simulate streaming
          await new Promise(resolve => setTimeout(resolve, 10));
        }
        
        // Send completion metadata
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({
              type: 'complete',
              metadata: {
                model: 'instant-engine-v1',
                tokens: {
                  input: query.length,
                  output: htmlContent.length,
                },
                duration: 250,
                timestamp: new Date().toISOString(),
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
    console.error('Instant report generation error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to generate instant report' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}