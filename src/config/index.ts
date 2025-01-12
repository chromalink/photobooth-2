export const config = {
  app: {
    name: 'ChromaLink',
    url: process.env.NEXT_PUBLIC_APP_URL,
  },
  cloudinary: {
    cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    uploadPreset: process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET,
  },
  comfyui: {
    endpoint: process.env.NEXT_PUBLIC_COMFYUI_API_ENDPOINT,
  },
  openai: {
    apiKey: process.env.OPENAI_API_KEY,
  },
  resend: {
    apiKey: process.env.RESEND_API_KEY,
  },
} as const;
