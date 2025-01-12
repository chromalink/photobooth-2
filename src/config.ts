type Config = {
  app: {
    name: string;
    description: string;
  };
  api: {
    comfyui: {
      endpoint: string | undefined;
    };
  };
};

export const config: Config = {
  app: {
    name: 'Chromalink Being',
    description: 'Discover your natural state of being through AI',
  },
  api: {
    comfyui: {
      endpoint: process.env.NEXT_PUBLIC_COMFYUI_API_ENDPOINT,
    },
  },
}
