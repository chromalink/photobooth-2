import { ComfyUIWorkflow } from '../types';

export const artisticPortrait: ComfyUIWorkflow = {
  id: 'artistic-portrait',
  name: 'Artistic Portrait',
  description: 'Creates artistic interpretations with more creative freedom',
  model: 'Realistic_Vision_V6.0_NV_B1_fp16.safetensors',
  version: '1.0.0',
  workflow: {
    "3": {
      "inputs": {
        "seed": 239492284683965,
        "steps": 25,
        "cfg": 9,
        "sampler_name": "dpmpp_2m",
        "scheduler": "normal",
        "denoise": 0.75,
        "model": ["14", 0],
        "positive": ["6", 0],
        "negative": ["7", 0],
        "latent_image": ["12", 0]
      },
      "class_type": "KSampler"
    },
    "6": {
      "inputs": {
        "text": "",
        "clip": ["14", 1]
      },
      "class_type": "CLIPTextEncode"
    },
    "7": {
      "inputs": {
        "text": "watermark, text, blur, noise",
        "clip": ["14", 1]
      },
      "class_type": "CLIPTextEncode"
    },
    "8": {
      "inputs": {
        "samples": ["3", 0],
        "vae": ["14", 2]
      },
      "class_type": "VAEDecode"
    },
    "10": {
      "class_type": "LoadImage",
      "inputs": {
        "image": "",
        "upload": "image"
      }
    },
    "12": {
      "inputs": {
        "pixels": ["10", 0],
        "vae": ["14", 2]
      },
      "class_type": "VAEEncode"
    },
    "14": {
      "inputs": {
        "ckpt_name": "Realistic_Vision_V6.0_NV_B1_fp16.safetensors"
      },
      "class_type": "CheckpointLoaderSimple"
    },
    "17": {
      "inputs": {
        "filename_prefix": "ComfyUI",
        "images": ["8", 0]
      },
      "class_type": "SaveImage"
    }
  }
};
