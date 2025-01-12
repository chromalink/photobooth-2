import { AiModelConfig } from '@/utils/aiModel';
import { realisticPortrait } from './workflows/realistic-portrait';
import { artisticPortrait } from './workflows/artistic-portrait';

export type AIProvider = 'stability' | 'midjourney-discord' | 'comfyui';

export const DEFAULT_AI_PROVIDER: AIProvider = 'comfyui';

export interface ComfyUIConfig {
  replicateApiKey: string;
  modelVersion: string;
  workflows: {
    [key: string]: {
      id: string;
      name: string;
      description: string;
      model: string;
      version: string;
      workflow: Record<string, any>;
    }
  };
  defaultWorkflow: string;
}

export interface AIRouteConfig {
  provider: AIProvider;
  displayName: string;  // For dropdown menu
  route: string;       // API route to use
  config: {
    stability?: {
      apiKey: string;
      apiHost: string;
    };
    midjourneyDiscord?: {
      serverId: string;
      channelId: string;
      discordToken: string;
    };
    comfyui?: ComfyUIConfig;
  };
}

// Configuration for all AI providers
export const AI_ROUTE_CONFIGS: { [key: string]: AIRouteConfig } = {
  'midjourney-discord': {
    provider: 'midjourney-discord',
    displayName: 'Midjourney',
    route: '/api/midjourney',
    config: {
      midjourneyDiscord: {
        serverId: process.env.DISCORD_SERVER_ID || '',
        channelId: process.env.DISCORD_CHANNEL_ID || '',
        discordToken: process.env.DISCORD_TOKEN || '',
      },
    },
  },
  'stability': {
    provider: 'stability',
    displayName: 'Stability AI',
    route: '/api/stability',
    config: {
      stability: {
        apiKey: process.env.STABILITY_API_KEY || '',
        apiHost: 'https://api.stability.ai',
      },
    },
  },
  'comfyui': {
    provider: 'comfyui',
    displayName: 'ComfyUI',
    route: '/api/replicate-img2img',
    config: {
      comfyui: {
        replicateApiKey: process.env.REPLICATE_API_TOKEN || '',
        modelVersion: 'cca7b1d526a916b7a8fa12d9c20839a172254cea34b265871b889e9d84aec9de',
        workflows: {
          [realisticPortrait.id]: realisticPortrait,
          [artisticPortrait.id]: artisticPortrait
        },
        defaultWorkflow: 'realistic-portrait'
      }
    }
  }
};

export function getAiRouteConfig(provider: AIProvider): AIRouteConfig {
  const config = AI_ROUTE_CONFIGS[provider];
  if (!config) {
    throw new Error(`No configuration found for provider: ${provider}`);
  }
  return config;
}

// Helper function to get available ComfyUI workflows
export function getComfyUIWorkflows() {
  const comfyConfig = AI_ROUTE_CONFIGS['comfyui'].config.comfyui;
  if (!comfyConfig) {
    throw new Error('ComfyUI configuration not found');
  }
  return {
    workflows: comfyConfig.workflows,
    defaultWorkflow: comfyConfig.defaultWorkflow
  };
}

// Helper function to get a specific workflow
export function getComfyUIWorkflow(workflowId: string) {
  const { workflows } = getComfyUIWorkflows();
  const workflow = workflows[workflowId];
  if (!workflow) {
    throw new Error(`Workflow not found: ${workflowId}`);
  }
  return workflow;
}
