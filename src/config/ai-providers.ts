export type AIProvider = 'stability' | 'midjourney-discord';

export interface AIConfig {
  provider: AIProvider;
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
  };
}

// Default configuration
export const defaultAIConfig: AIConfig = {
  provider: 'midjourney-discord',
  config: {
    stability: {
      apiKey: process.env.STABILITY_API_KEY || '',
      apiHost: 'https://api.stability.ai'
    },
    midjourneyDiscord: {
      serverId: process.env.DISCORD_SERVER_ID || '',
      channelId: process.env.DISCORD_CHANNEL_ID || '',
      discordToken: process.env.DISCORD_TOKEN || ''
    }
  }
};
