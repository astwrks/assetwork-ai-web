import { NextRequest } from 'next/server';
import { claudeService } from '@/lib/ai/claude.service';
import { convertTextToVisualHTML } from '@/lib/ai/force-visual-html';

export async function POST(request: NextRequest) {
  const { messages, model = 'claude-3-5-sonnet-20241022' } = await request.json();

  if (!messages || !Array.isArray(messages)) {
    return new Response('Invalid messages format', { status: 400 });
  }

  // Create a TransformStream for SSE
  const encoder = new TextEncoder();
  const stream = new TransformStream();
  const writer = stream.writable.getWriter();

  // Start streaming in the background
  (async () => {
    try {
      console.log('🎨 VISUAL STREAM: Starting visual-only response');
      
      // Generate response from Claude
      const generator = claudeService.streamResponse({
        messages: messages.map(m => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
        })),
        systemPrompt: `You are a financial analyst. Provide analysis for: ${messages[messages.length - 1]?.content}`,
        model: model,
      });

      let fullContent = '';
      let chunkCount = 0;
      
      // Collect all chunks
      for await (const chunk of generator) {
        fullContent += chunk;
        chunkCount++;
        
        // After 20 chunks or when we have enough content, convert to HTML
        if (chunkCount >= 20 || fullContent.length > 1000) {
          break;
        }
      }
      
      console.log('🎨 VISUAL STREAM: Converting to HTML with charts');
      
      // ALWAYS convert to visual HTML
      const userQuery = messages[messages.length - 1]?.content || 'Analysis';
      const visualHTML = convertTextToVisualHTML(fullContent, userQuery);
      
      // Send the complete visual HTML
      const data = `data: ${JSON.stringify({ content: visualHTML })}\n\n`;
      await writer.write(encoder.encode(data));
      
      // Send completion signal
      await writer.write(encoder.encode('data: [DONE]\n\n'));
      
      console.log('🎨 VISUAL STREAM: Complete - sent HTML with charts');
      
    } catch (error) {
      console.error('Visual streaming error:', error);
      const errorData = `data: ${JSON.stringify({ error: 'Stream failed' })}\n\n`;
      await writer.write(encoder.encode(errorData));
    } finally {
      await writer.close();
    }
  })();

  return new Response(stream.readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}