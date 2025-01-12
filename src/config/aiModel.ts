import { AiModelConfig } from '@/utils/aiModel';

export const AI_MODEL_CONFIGS: { [key: string]: AiModelConfig } = {
  stabilityAi: {
    provider: 'stabilityAi',
    apiKey: process.env.STABILITY_API_KEY,
    endpoint: 'https://api.stability.ai/v1/generation',
  },
  comfyUi: {
    provider: 'comfyUi',
    endpoint: process.env.COMFYUI_ENDPOINT || 'http://localhost:8188',
  },
  replicate: {
    provider: 'replicate',
    apiKey: process.env.REPLICATE_API_KEY,
  },
};

export const DEFAULT_AI_MODEL_PROVIDER = 'stabilityAi';

export const getAiModelConfig = (provider: string): AiModelConfig => {
  const config = AI_MODEL_CONFIGS[provider];
  if (!config) {
    throw new Error(`Unknown AI model provider: ${provider}`);
  }
  return config;
};
