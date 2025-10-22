import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { claudeService } from '@/lib/ai/claude.service';
import { openaiService } from '@/lib/ai/openai.service';
import { connectToDatabase } from '@/lib/db/mongodb';
import User from '@/lib/db/models/User';
import { CLAUDE_SYSTEM_PROMPT } from '@/lib/ai/system-prompt';
import { interceptResponse } from '@/lib/ai/no-questions-prompt';
import { preprocessMessages, enhanceSystemPrompt, generateFallbackHTML } from '@/lib/ai/message-preprocessor';
import { VISUAL_GENERATION_PROMPT } from '@/lib/ai/visual-prompt';
import { FORCE_VISUAL_HTML_PROMPT, convertTextToVisualHTML } from '@/lib/ai/force-visual-html';

export async function POST(request: NextRequest) {
  // Temporarily disabled authentication for debugging
  // const session = await getServerSession(authOptions);
  
  // if (!session?.user?.id) {
  //   return new Response('Unauthorized', { status: 401 });
  // }

  let { messages, model = 'claude-3-5-sonnet-20241022', systemPrompt, enhanceWidgetId, includeVisuals = false } = await request.json();
  
  // Check if visual mode is requested
  const isVisualMode = includeVisuals || (systemPrompt && systemPrompt.includes('Visual Analytics'));
  
  // Preprocess messages to inject confirmations
  messages = preprocessMessages(messages, systemPrompt || CLAUDE_SYSTEM_PROMPT);
  
  // Enhance system prompt to be more aggressive
  let enhancedSystemPrompt = enhanceSystemPrompt(systemPrompt || CLAUDE_SYSTEM_PROMPT);
  
  // Add visual generation prompt if in visual mode
  if (isVisualMode && !enhancedSystemPrompt.includes('VISUAL_GENERATION_PROMPT')) {
    enhancedSystemPrompt = FORCE_VISUAL_HTML_PROMPT;
  }

  if (!messages || !Array.isArray(messages)) {
    return new Response('Invalid messages format', { status: 400 });
  }

  // Temporarily skip user credit check
  // await connectToDatabase();

  // // Check user credits
  // const user = await User.findById(session.user.id);
  // if (!user) {
  //   return new Response('User not found', { status: 404 });
  // }

  // if (user.aiCredits <= 0 && user.plan === 'free') {
  //   return new Response('Insufficient credits', { status: 403 });
  // }

  // Create a TransformStream for SSE
  const encoder = new TextEncoder();
  const stream = new TransformStream();
  const writer = stream.writable.getWriter();

  // Start streaming in the background
  (async () => {
    const startTime = Date.now();
    let tokenCount = { input: 0, output: 0 };
    let accumulatedContent = '';
    
    try {
      let generator;
      
      // Calculate approximate input tokens (rough estimate: 1 token per 4 chars)
      const inputText = messages.map(m => m.content).join(' ');
      tokenCount.input = Math.ceil(inputText.length / 4);
      
      if (model && model.startsWith('claude')) {
        generator = claudeService.streamResponse({
          messages: messages.map(m => ({
            role: m.role as 'user' | 'assistant',
            content: m.content,
          })),
          systemPrompt: enhancedSystemPrompt,
          model: model,
        });
      } else {
        generator = openaiService.streamResponse({
          messages: [
            { role: 'system', content: enhancedSystemPrompt },
            ...messages,
          ],
        });
      }

      // Send initial metadata
      const metadataChunk = `data: ${JSON.stringify({ 
        type: 'metadata',
        model: model,
        startTime: startTime,
        enhanceWidgetId: enhanceWidgetId
      })}\n\n`;
      await writer.write(encoder.encode(metadataChunk));

      // Check if this is an instant report request
      const isInstantMode = systemPrompt && (
        systemPrompt.includes('INSTANT_REPORT_PROMPT') || 
        systemPrompt.includes('NEVER use phrases') ||
        systemPrompt.includes('OUTPUT HTML IMMEDIATELY')
      );
      
      const needsVisualConversion = isVisualMode || includeVisuals;
      
      let questionDetected = false;
      let chunkCount = 0;
      
      for await (const chunk of generator) {
        accumulatedContent += chunk;
        chunkCount++;
        tokenCount.output = Math.ceil(accumulatedContent.length / 4);
        
        // If visual mode is enabled and we're getting text, convert immediately
        if (needsVisualConversion) {
          // Check after just 1 chunk if it's not HTML
          if (chunkCount === 1 && !chunk.includes('<!DOCTYPE') && !chunk.includes('<html')) {
            console.log('🎨 FORCE CONVERTING TO VISUAL HTML - Text detected at chunk 1');
            const userQuery = messages[messages.length - 1]?.content || 'Analysis';
            
            // Wait for a bit more content to convert
            let fullText = accumulatedContent;
            for (let i = 0; i < 10 && generator; i++) {
              const nextChunk = await generator.next();
              if (nextChunk.done) break;
              fullText += nextChunk.value;
            }
            
            const visualHTML = convertTextToVisualHTML(fullText, userQuery);
            const data = `data: ${JSON.stringify({ content: visualHTML })}`;
            await writer.write(encoder.encode(data + '\n\n'));
            accumulatedContent = visualHTML;
            break;
          }
        }
        
        // If in instant mode, aggressively check for non-compliance
        if (isInstantMode) {
          // After 3 chunks, if we don't see HTML, replace immediately
          if (chunkCount >= 3 && !accumulatedContent.includes('<!DOCTYPE') && !accumulatedContent.includes('<html')) {
            console.log('🚫 No HTML detected after 3 chunks, injecting fallback');
            const userQuery = messages[messages.length - 1]?.content || 'Market Analysis';
            const fallbackHTML = generateFallbackHTML(userQuery);
            const data = `data: ${JSON.stringify({ content: fallbackHTML })}\n\n`;
            await writer.write(encoder.encode(data));
            accumulatedContent = fallbackHTML;
            break;
          }
          
          // If we detect questions at any point, replace immediately
          if (accumulatedContent.length > 30) {
            const intercepted = interceptResponse(accumulatedContent);
            if (intercepted !== accumulatedContent) {
              console.log('🚫 Question detected, replacing with instant HTML');
              const data = `data: ${JSON.stringify({ content: intercepted })}\n\n`;
              await writer.write(encoder.encode(data));
              accumulatedContent = intercepted;
              break;
            }
          }
        }
        
        const data = `data: ${JSON.stringify({ content: chunk })}\n\n`;
        await writer.write(encoder.encode(data));
      }

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Send final metadata with token counts and duration
      const finalMetadata = `data: ${JSON.stringify({ 
        type: 'complete',
        metadata: {
          model: model,
          tokens: tokenCount,
          duration: duration,
          timestamp: new Date().toISOString()
        }
      })}\n\n`;
      await writer.write(encoder.encode(finalMetadata));

      // Send completion signal
      await writer.write(encoder.encode('data: [DONE]\n\n'));

      // Deduct credits for free users
      // if (user.plan === 'free') {
      //   await User.findByIdAndUpdate(session.user.id, {
      //     $inc: { aiCredits: -1 },
      //   });
      // }
    } catch (error) {
      console.error('Streaming error:', error);
      try {
        const errorData = `data: ${JSON.stringify({ error: 'Stream failed' })}\n\n`;
        await writer.write(encoder.encode(errorData));
      } catch (writeError) {
        // Writer might be closed already
        console.error('Failed to write error:', writeError);
      }
    } finally {
      try {
        await writer.close();
      } catch (closeError) {
        // Already closed
      }
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