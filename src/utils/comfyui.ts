import axios from 'axios';

// Remove /api from the endpoint as it's added where needed
const COMFY_UI_API = (process.env.NEXT_PUBLIC_COMFYUI_API_ENDPOINT || 'http://localhost:8188').replace(/\/api\/?$/, '');

interface ComfyUIResponse {
  images: string[];
  error?: string;
}

export async function generateImageFromPhoto(
  inputPhoto: string,
  color: string,
  targetAspectRatio: number = 0.85
): Promise<string> {
  try {
    // Convert base64 photo to blob
    const photoBlob = await fetch(inputPhoto).then(r => r.blob());
    
    // Create form data with the photo
    const formData = new FormData();
    formData.append('image', photoBlob);
    
    // Upload the image to ComfyUI
    const uploadResponse = await axios.post(`${COMFY_UI_API}/api/upload/image`, formData);
    const uploadedImageName = uploadResponse.data.name;
    
    // Create workflow for image processing
    const workflow = {
      "3": {
        "inputs": {
          "image": uploadedImageName,
          "choose file to upload": "image"
        },
        "class_type": "LoadImage"
      },
      "4": {
        "inputs": {
          "text": `A mystical portrait with ${color} aura energy radiating outward, ethereal, spiritual, cosmic energy, highly detailed, artstation trending, digital painting, concept art, smooth, sharp focus, illustration, art by artgerm and greg rutkowski and alphonse mucha`,
          "clip": ["clip", "4"]
        },
        "class_type": "CLIPTextEncode"
      },
      "5": {
        "inputs": {
          "samples": ["samples", "4"],
          "vae": ["vae", "4"]
        },
        "class_type": "VAEDecode"
      },
      "6": {
        "inputs": {
          "width": 768,
          "height": Math.round(768 / targetAspectRatio),
          "batch_size": 1
        },
        "class_type": "EmptyLatentImage"
      },
      "7": {
        "inputs": {
          "model": ["model", "4"],
          "positive": ["", "4"],
          "negative": ["", "4"],
          "latent_image": ["", "6"],
          "seed": Math.floor(Math.random() * 1000000),
          "steps": 20,
          "cfg": 8,
          "sampler_name": "euler",
          "scheduler": "normal",
          "denoise": 0.8,
          "feather": 5
        },
        "class_type": "KSampler"
      }
    };

    // Queue the prompt
    const promptResponse = await axios.post(`${COMFY_UI_API}/api/prompt`, { prompt: workflow });
    const promptId = promptResponse.data.prompt_id;

    // Poll for completion
    while (true) {
      const historyResponse = await axios.get(`${COMFY_UI_API}/api/history/${promptId}`);
      if (historyResponse.data[promptId].outputs) {
        const outputImage = historyResponse.data[promptId].outputs.images[0];
        return `${COMFY_UI_API}/api/view/${outputImage}`;
      }
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  } catch (error) {
    console.error('Error generating image with ComfyUI:', error);
    throw error;
  }
}
