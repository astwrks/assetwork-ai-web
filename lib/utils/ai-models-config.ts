import { AIProvider } from './ai-provider-icons';

export interface AIModel {
  id: string;
  name: string;
  description: string;
  provider: AIProvider;
  contextWindow?: number;
  pricing?: {
    input: number; // per 1M tokens
    output: number; // per 1M tokens
  };
}

// Comprehensive AI models catalog
export const AI_MODELS: Record<AIProvider, AIModel[]> = {
  openai: [
    {
      id: 'gpt-4-turbo-preview',
      name: 'GPT-4 Turbo',
      description: 'Most capable, 128K context',
      provider: 'openai',
      contextWindow: 128000,
      pricing: { input: 10, output: 30 }
    },
    {
      id: 'gpt-4',
      name: 'GPT-4',
      description: 'Powerful reasoning, 8K context',
      provider: 'openai',
      contextWindow: 8192,
      pricing: { input: 30, output: 60 }
    },
    {
      id: 'gpt-4-32k',
      name: 'GPT-4 32K',
      description: 'Extended context',
      provider: 'openai',
      contextWindow: 32768,
      pricing: { input: 60, output: 120 }
    },
    {
      id: 'gpt-3.5-turbo',
      name: 'GPT-3.5 Turbo',
      description: 'Fast and efficient, 16K context',
      provider: 'openai',
      contextWindow: 16385,
      pricing: { input: 0.5, output: 1.5 }
    },
    {
      id: 'gpt-3.5-turbo-16k',
      name: 'GPT-3.5 Turbo 16K',
      description: 'Extended context window',
      provider: 'openai',
      contextWindow: 16385,
      pricing: { input: 1, output: 2 }
    }
  ],
  anthropic: [
    {
      id: 'claude-3-5-sonnet-20241022',
      name: 'Claude 3.5 Sonnet (Latest)',
      description: 'Most capable, balanced model',
      provider: 'anthropic',
      contextWindow: 200000,
      pricing: { input: 3, output: 15 }
    },
    {
      id: 'claude-3-opus-20240229',
      name: 'Claude 3 Opus',
      description: 'Powerful for complex tasks',
      provider: 'anthropic',
      contextWindow: 200000,
      pricing: { input: 15, output: 75 }
    },
    {
      id: 'claude-3-sonnet-20240229',
      name: 'Claude 3 Sonnet',
      description: 'Balanced performance',
      provider: 'anthropic',
      contextWindow: 200000,
      pricing: { input: 3, output: 15 }
    },
    {
      id: 'claude-3-haiku-20240307',
      name: 'Claude 3 Haiku',
      description: 'Fast and efficient',
      provider: 'anthropic',
      contextWindow: 200000,
      pricing: { input: 0.25, output: 1.25 }
    },
    {
      id: 'claude-2.1',
      name: 'Claude 2.1',
      description: 'Previous generation',
      provider: 'anthropic',
      contextWindow: 200000,
      pricing: { input: 8, output: 24 }
    },
    {
      id: 'claude-2.0',
      name: 'Claude 2.0',
      description: 'Legacy model',
      provider: 'anthropic',
      contextWindow: 100000,
      pricing: { input: 8, output: 24 }
    },
    {
      id: 'claude-instant-1.2',
      name: 'Claude Instant',
      description: 'Fastest response time',
      provider: 'anthropic',
      contextWindow: 100000,
      pricing: { input: 0.8, output: 2.4 }
    }
  ],
  google: [
    {
      id: 'gemini-1.5-pro',
      name: 'Gemini 1.5 Pro',
      description: 'Most capable, 2M context',
      provider: 'google',
      contextWindow: 2000000,
      pricing: { input: 3.5, output: 10.5 }
    },
    {
      id: 'gemini-1.5-flash',
      name: 'Gemini 1.5 Flash',
      description: 'Fast multimodal, 1M context',
      provider: 'google',
      contextWindow: 1000000,
      pricing: { input: 0.35, output: 1.05 }
    },
    {
      id: 'gemini-pro',
      name: 'Gemini Pro',
      description: 'Balanced performance',
      provider: 'google',
      contextWindow: 32760,
      pricing: { input: 0.5, output: 1.5 }
    },
    {
      id: 'gemini-pro-vision',
      name: 'Gemini Pro Vision',
      description: 'Multimodal capabilities',
      provider: 'google',
      contextWindow: 16384,
      pricing: { input: 0.5, output: 1.5 }
    }
  ],
  groq: [
    {
      id: 'llama-3.3-70b-versatile',
      name: 'Llama 3.3 70B',
      description: 'Latest Llama, ultra-fast',
      provider: 'groq',
      contextWindow: 32768,
      pricing: { input: 0.59, output: 0.79 }
    },
    {
      id: 'llama-3.1-70b-versatile',
      name: 'Llama 3.1 70B',
      description: 'Versatile, fast inference',
      provider: 'groq',
      contextWindow: 32768,
      pricing: { input: 0.59, output: 0.79 }
    },
    {
      id: 'llama-3.1-8b-instant',
      name: 'Llama 3.1 8B',
      description: 'Smallest, fastest model',
      provider: 'groq',
      contextWindow: 8192,
      pricing: { input: 0.05, output: 0.08 }
    },
    {
      id: 'mixtral-8x7b-32768',
      name: 'Mixtral 8x7B',
      description: 'MoE architecture',
      provider: 'groq',
      contextWindow: 32768,
      pricing: { input: 0.24, output: 0.24 }
    },
    {
      id: 'gemma2-9b-it',
      name: 'Gemma 2 9B',
      description: 'Google Gemma, optimized',
      provider: 'groq',
      contextWindow: 8192,
      pricing: { input: 0.2, output: 0.2 }
    }
  ]
};

// Get all models for a specific provider
export function getModelsByProvider(provider: AIProvider): AIModel[] {
  return AI_MODELS[provider] || [];
}

// Get all available models across all providers
export function getAllModels(): AIModel[] {
  return Object.values(AI_MODELS).flat();
}

// Get model by ID
export function getModelById(modelId: string): AIModel | undefined {
  return getAllModels().find(model => model.id === modelId);
}

// Get model display name
export function getModelDisplayName(modelId: string): string {
  const model = getModelById(modelId);
  return model?.name || modelId;
}

// Get provider from model ID
export function getProviderFromModel(modelId: string): AIProvider | undefined {
  const model = getModelById(modelId);
  return model?.provider;
}
