import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';

export type AIProvider = 'openai' | 'anthropic' | 'google' | 'groq';

export interface AIModel {
  id: string;
  name: string;
  provider: AIProvider;
  contextWindow: number;
  maxTokens: number;
  costPer1kTokens: {
    input: number;
    output: number;
  };
  capabilities: string[];
}

export const AI_MODELS: Record<string, AIModel> = {
  // OpenAI Models
  'gpt-4-turbo': {
    id: 'gpt-4-turbo-preview',
    name: 'GPT-4 Turbo',
    provider: 'openai',
    contextWindow: 128000,
    maxTokens: 4096,
    costPer1kTokens: { input: 0.01, output: 0.03 },
    capabilities: ['chat', 'analysis', 'code', 'vision'],
  },
  'gpt-4': {
    id: 'gpt-4',
    name: 'GPT-4',
    provider: 'openai',
    contextWindow: 8192,
    maxTokens: 4096,
    costPer1kTokens: { input: 0.03, output: 0.06 },
    capabilities: ['chat', 'analysis', 'code'],
  },
  'gpt-3.5-turbo': {
    id: 'gpt-3.5-turbo',
    name: 'GPT-3.5 Turbo',
    provider: 'openai',
    contextWindow: 16385,
    maxTokens: 4096,
    costPer1kTokens: { input: 0.0005, output: 0.0015 },
    capabilities: ['chat', 'analysis'],
  },

  // Anthropic Models
  'claude-3-opus': {
    id: 'claude-3-opus-20240229',
    name: 'Claude 3 Opus',
    provider: 'anthropic',
    contextWindow: 200000,
    maxTokens: 4096,
    costPer1kTokens: { input: 0.015, output: 0.075 },
    capabilities: ['chat', 'analysis', 'code', 'vision', 'long-context'],
  },
  'claude-3-sonnet': {
    id: 'claude-3-5-sonnet-20241022',
    name: 'Claude 3.5 Sonnet',
    provider: 'anthropic',
    contextWindow: 200000,
    maxTokens: 8192,
    costPer1kTokens: { input: 0.003, output: 0.015 },
    capabilities: ['chat', 'analysis', 'code', 'vision', 'long-context'],
  },
  'claude-3-haiku': {
    id: 'claude-3-haiku-20240307',
    name: 'Claude 3 Haiku',
    provider: 'anthropic',
    contextWindow: 200000,
    maxTokens: 4096,
    costPer1kTokens: { input: 0.00025, output: 0.00125 },
    capabilities: ['chat', 'analysis', 'fast'],
  },

  // Google Models
  'gemini-pro': {
    id: 'gemini-pro',
    name: 'Gemini Pro',
    provider: 'google',
    contextWindow: 32760,
    maxTokens: 2048,
    costPer1kTokens: { input: 0.00025, output: 0.0005 },
    capabilities: ['chat', 'analysis', 'code'],
  },
  'gemini-pro-vision': {
    id: 'gemini-pro-vision',
    name: 'Gemini Pro Vision',
    provider: 'google',
    contextWindow: 16384,
    maxTokens: 2048,
    costPer1kTokens: { input: 0.00025, output: 0.0005 },
    capabilities: ['chat', 'vision', 'multimodal'],
  },

  // Groq Models (Fast inference)
  'llama3-70b': {
    id: 'llama3-70b-8192',
    name: 'Llama 3 70B',
    provider: 'groq',
    contextWindow: 8192,
    maxTokens: 8192,
    costPer1kTokens: { input: 0.0008, output: 0.0008 },
    capabilities: ['chat', 'fast', 'code'],
  },
  'mixtral-8x7b': {
    id: 'mixtral-8x7b-32768',
    name: 'Mixtral 8x7B',
    provider: 'groq',
    contextWindow: 32768,
    maxTokens: 32768,
    costPer1kTokens: { input: 0.0002, output: 0.0002 },
    capabilities: ['chat', 'fast', 'long-context'],
  },
};

export interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AIResponse {
  content: string;
  model: string;
  usage: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
  };
  cost: number;
}

export class UnifiedAIClient {
  private openaiClient?: OpenAI;
  private anthropicClient?: Anthropic;
  private googleClient?: GoogleGenerativeAI;
  private groqClient?: OpenAI; // Groq uses OpenAI-compatible API

  constructor(private apiKeys: Record<AIProvider, string | null>) {
    if (apiKeys.openai) {
      this.openaiClient = new OpenAI({ apiKey: apiKeys.openai });
    }
    if (apiKeys.anthropic) {
      this.anthropicClient = new Anthropic({ apiKey: apiKeys.anthropic });
    }
    if (apiKeys.google) {
      this.googleClient = new GoogleGenerativeAI(apiKeys.google);
    }
    if (apiKeys.groq) {
      this.groqClient = new OpenAI({
        apiKey: apiKeys.groq,
        baseURL: 'https://api.groq.com/openai/v1',
      });
    }
  }

  async chat(
    modelKey: string,
    messages: AIMessage[],
    options?: {
      temperature?: number;
      maxTokens?: number;
      stream?: boolean;
    }
  ): Promise<AIResponse> {
    const model = AI_MODELS[modelKey];
    if (!model) {
      throw new Error(`Model ${modelKey} not found`);
    }

    const temperature = options?.temperature ?? 0.7;
    const maxTokens = options?.maxTokens ?? model.maxTokens;

    switch (model.provider) {
      case 'openai':
        return this.chatOpenAI(model, messages, temperature, maxTokens);
      case 'anthropic':
        return this.chatAnthropic(model, messages, temperature, maxTokens);
      case 'google':
        return this.chatGoogle(model, messages, temperature, maxTokens);
      case 'groq':
        return this.chatGroq(model, messages, temperature, maxTokens);
      default:
        throw new Error(`Provider ${model.provider} not supported`);
    }
  }

  private async chatOpenAI(
    model: AIModel,
    messages: AIMessage[],
    temperature: number,
    maxTokens: number
  ): Promise<AIResponse> {
    if (!this.openaiClient) {
      throw new Error('OpenAI API key not configured');
    }

    const response = await this.openaiClient.chat.completions.create({
      model: model.id,
      messages: messages as any,
      temperature,
      max_tokens: maxTokens,
    });

    const inputTokens = response.usage?.prompt_tokens || 0;
    const outputTokens = response.usage?.completion_tokens || 0;

    return {
      content: response.choices[0]?.message?.content || '',
      model: model.id,
      usage: {
        inputTokens,
        outputTokens,
        totalTokens: inputTokens + outputTokens,
      },
      cost: this.calculateCost(inputTokens, outputTokens, model),
    };
  }

  private async chatAnthropic(
    model: AIModel,
    messages: AIMessage[],
    temperature: number,
    maxTokens: number
  ): Promise<AIResponse> {
    if (!this.anthropicClient) {
      throw new Error('Anthropic API key not configured');
    }

    // Separate system message from chat messages
    const systemMessage = messages.find(m => m.role === 'system')?.content || '';
    const chatMessages = messages.filter(m => m.role !== 'system');

    const response = await this.anthropicClient.messages.create({
      model: model.id,
      max_tokens: maxTokens,
      temperature,
      system: systemMessage,
      messages: chatMessages as any,
    });

    const inputTokens = response.usage.input_tokens;
    const outputTokens = response.usage.output_tokens;

    return {
      content: response.content[0].type === 'text' ? response.content[0].text : '',
      model: model.id,
      usage: {
        inputTokens,
        outputTokens,
        totalTokens: inputTokens + outputTokens,
      },
      cost: this.calculateCost(inputTokens, outputTokens, model),
    };
  }

  private async chatGoogle(
    model: AIModel,
    messages: AIMessage[],
    temperature: number,
    maxTokens: number
  ): Promise<AIResponse> {
    if (!this.googleClient) {
      throw new Error('Google API key not configured');
    }

    const genModel = this.googleClient.getGenerativeModel({ model: model.id });

    // Convert messages to Google format
    const systemMessage = messages.find(m => m.role === 'system')?.content || '';
    const chatMessages = messages.filter(m => m.role !== 'system');

    const chat = genModel.startChat({
      generationConfig: {
        temperature,
        maxOutputTokens: maxTokens,
      },
      history: chatMessages.slice(0, -1).map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      })),
    });

    const lastMessage = chatMessages[chatMessages.length - 1];
    const result = await chat.sendMessage(
      systemMessage ? `${systemMessage}\n\n${lastMessage.content}` : lastMessage.content
    );

    const response = result.response;
    const text = response.text();

    // Google doesn't return token counts directly, estimate
    const inputTokens = Math.ceil((messages.reduce((sum, m) => sum + m.content.length, 0)) / 4);
    const outputTokens = Math.ceil(text.length / 4);

    return {
      content: text,
      model: model.id,
      usage: {
        inputTokens,
        outputTokens,
        totalTokens: inputTokens + outputTokens,
      },
      cost: this.calculateCost(inputTokens, outputTokens, model),
    };
  }

  private async chatGroq(
    model: AIModel,
    messages: AIMessage[],
    temperature: number,
    maxTokens: number
  ): Promise<AIResponse> {
    if (!this.groqClient) {
      throw new Error('Groq API key not configured');
    }

    const response = await this.groqClient.chat.completions.create({
      model: model.id,
      messages: messages as any,
      temperature,
      max_tokens: maxTokens,
    });

    const inputTokens = response.usage?.prompt_tokens || 0;
    const outputTokens = response.usage?.completion_tokens || 0;

    return {
      content: response.choices[0]?.message?.content || '',
      model: model.id,
      usage: {
        inputTokens,
        outputTokens,
        totalTokens: inputTokens + outputTokens,
      },
      cost: this.calculateCost(inputTokens, outputTokens, model),
    };
  }

  private calculateCost(inputTokens: number, outputTokens: number, model: AIModel): number {
    const inputCost = (inputTokens / 1000) * model.costPer1kTokens.input;
    const outputCost = (outputTokens / 1000) * model.costPer1kTokens.output;
    return Math.round((inputCost + outputCost) * 10000) / 10000; // Round to 4 decimal places
  }

  // Get available models based on configured API keys
  getAvailableModels(): AIModel[] {
    const available: AIModel[] = [];

    for (const [key, model] of Object.entries(AI_MODELS)) {
      const hasKey = this.apiKeys[model.provider];
      if (hasKey) {
        available.push(model);
      }
    }

    return available;
  }
}
