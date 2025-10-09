import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface OpenAIStreamOptions {
  messages: OpenAIMessage[];
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

export class OpenAIService {
  async generateResponse(
    messages: OpenAIMessage[],
    model = 'gpt-4-turbo-preview'
  ): Promise<string> {
    try {
      const completion = await openai.chat.completions.create({
        model,
        messages,
        temperature: 0.7,
        max_tokens: 1000,
      });

      return completion.choices[0]?.message?.content || '';
    } catch (error) {
      console.error('OpenAI API error:', error);
      throw new Error('Failed to generate response from OpenAI');
    }
  }

  async *streamResponse({
    messages,
    model = 'gpt-4-turbo-preview',
    temperature = 0.7,
    maxTokens = 1000,
  }: OpenAIStreamOptions): AsyncGenerator<string> {
    try {
      const stream = await openai.chat.completions.create({
        model,
        messages,
        temperature,
        max_tokens: maxTokens,
        stream: true,
      });

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content;
        if (content) {
          yield content;
        }
      }
    } catch (error) {
      console.error('OpenAI streaming error:', error);
      throw new Error('Failed to stream response from OpenAI');
    }
  }

  async generateWidgetConfig(query: string, data: any): Promise<any> {
    const systemPrompt = `You are a financial widget configuration generator. Based on the user's query and provided data, generate a configuration object for creating a financial visualization widget.
    
    Return a JSON object with:
    - title: Widget title
    - type: Widget type (chart, metric, table, etc.)
    - chartType: If chart, specify type (line, bar, pie, etc.)
    - data: Formatted data for the widget
    - config: Any additional configuration
    
    Return ONLY valid JSON.`;

    const messages: OpenAIMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Query: ${query}\n\nData: ${JSON.stringify(data)}` },
    ];

    const response = await this.generateResponse(messages, 'gpt-3.5-turbo');
    
    try {
      return JSON.parse(response);
    } catch {
      return {
        title: 'Financial Widget',
        type: 'chart',
        chartType: 'line',
        data,
        config: {},
      };
    }
  }

  async generateCode(prompt: string, language = 'typescript'): Promise<string> {
    const messages: OpenAIMessage[] = [
      {
        role: 'system',
        content: `You are a code generator specializing in ${language}. Generate clean, efficient, and well-commented code based on the user's requirements.`,
      },
      { role: 'user', content: prompt },
    ];

    return this.generateResponse(messages, 'gpt-3.5-turbo');
  }
}

export const openaiService = new OpenAIService();