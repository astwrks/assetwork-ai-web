import Anthropic from '@anthropic-ai/sdk';
import { CLAUDE_SYSTEM_PROMPT } from './system-prompt';

// Lazy initialization to avoid errors during build time
let anthropic: Anthropic | null = null;

function getAnthropic(): Anthropic {
  if (!anthropic) {
    anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY || 'dummy-key-for-build',
    });
  }
  return anthropic;
}

export interface ClaudeMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ClaudeStreamOptions {
  messages: ClaudeMessage[];
  maxTokens?: number;
  temperature?: number;
  systemPrompt?: string;
  model?: string;
  onToken?: (token: string) => void;
  onUsage?: (usage: { inputTokens: number; outputTokens: number }) => void;
}

export class ClaudeService {
  async generateResponse(prompt: string, systemPrompt?: string): Promise<string> {
    try {
      const response = await getAnthropic().messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1000,
        temperature: 0.7,
        system: systemPrompt || CLAUDE_SYSTEM_PROMPT,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      });

      if (response.content[0].type === 'text') {
        return response.content[0].text;
      }

      return '';
    } catch (error) {
      console.error('Claude API error:', error);
      throw new Error('Failed to generate response from Claude');
    }
  }

  async *streamResponse({
    messages,
    maxTokens = 1000,
    temperature = 0.7,
    systemPrompt,
    model = 'claude-3-5-sonnet-20241022',
    onUsage,
  }: ClaudeStreamOptions): AsyncGenerator<string> {
    try {
      const stream = await getAnthropic().messages.create({
        model: model,
        max_tokens: maxTokens,
        temperature,
        system: systemPrompt || CLAUDE_SYSTEM_PROMPT,
        messages: messages.map(msg => ({
          role: msg.role,
          content: msg.content,
        })),
        stream: true,
      });

      let inputTokens = 0;
      let outputTokens = 0;
      let contentChunkCount = 0;

      for await (const chunk of stream) {
        if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
          contentChunkCount++;
          // Estimate output tokens (roughly 1 token per 4 characters)
          const estimatedNewTokens = Math.ceil(chunk.delta.text.length / 4);
          outputTokens += estimatedNewTokens;

          // Send real-time usage updates during streaming
          // Update every 5 chunks to avoid overwhelming the client
          if (onUsage && contentChunkCount % 5 === 0) {
            onUsage({ inputTokens, outputTokens });
          }

          yield chunk.delta.text;
        } else if (chunk.type === 'message_start') {
          inputTokens = chunk.message.usage.input_tokens;
          outputTokens = 0; // Reset output tokens
          contentChunkCount = 0; // Reset chunk counter
          // Send initial usage update as soon as we get input tokens
          if (onUsage && inputTokens > 0) {
            onUsage({ inputTokens, outputTokens: 0 });
          }
        } else if (chunk.type === 'message_delta') {
          // Get final accurate token count from API
          const finalOutputTokens = chunk.usage.output_tokens;
          outputTokens = finalOutputTokens;
          // Send final usage update with accurate counts
          if (onUsage) {
            onUsage({ inputTokens, outputTokens });
          }
        }
      }
    } catch (error) {
      console.error('Claude streaming error:', error);
      throw new Error('Failed to stream response from Claude');
    }
  }

  async analyzeFinancialQuery(query: string): Promise<{
    intent: string;
    entities: any;
    widgetType: string;
    parameters: any;
  }> {
    const systemPrompt = `You are a financial query analyzer. Analyze the user's query and return a JSON object with:
    - intent: The main intent (e.g., "compare_stocks", "analyze_trend", "portfolio_performance")
    - entities: Extracted entities like stock symbols, time periods, metrics
    - widgetType: Suggested widget type ("chart", "dashboard", "report", "table", "metric")
    - parameters: Any additional parameters for the widget
    
    Return ONLY valid JSON, no other text.`;

    const response = await this.generateResponse(query, systemPrompt);
    
    try {
      return JSON.parse(response);
    } catch {
      return {
        intent: 'general_analysis',
        entities: {},
        widgetType: 'chart',
        parameters: {},
      };
    }
  }
}

export const claudeService = new ClaudeService();
