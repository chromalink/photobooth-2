import { NextResponse } from 'next/server';
import { config } from '@/config';
import { getBaseUrl, createUrl } from '@/utils/url';

// Common CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-oracle-category',
};

// Handle CORS preflight requests
export async function OPTIONS(request: Request) {
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders,
  });
}

async function queuePrompt(apiEndpoint: string, prompt: any, clientId: string) {
  console.log('Queuing prompt to ComfyUI at:', `${apiEndpoint}/api/prompt`);
  const response = await fetch(`${apiEndpoint}/api/prompt`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Origin': config.api.origin || 'http://localhost:4000'
    },
    body: JSON.stringify({ 
      prompt: prompt,
      client_id: clientId
    })
  });
  
  if (!response.ok) {
    const text = await response.text();
    console.error('ComfyUI API Error:', text);
    throw new Error(`Failed to queue prompt: ${text}`);
  }
  
  const data = await response.json();
  console.log('ComfyUI API Response:', data);
  return data;
}

async function getImage(apiEndpoint: string, filename: string, subfolder: string = '', type: string = 'output') {
  // Remove /api from the endpoint if present
  const baseEndpoint = apiEndpoint.replace(/\/api\/?$/, '');
  
  // Construct the correct URL for the image
  const params = new URLSearchParams();
  if (filename) params.set('filename', filename);
  if (subfolder) params.set('subfolder', subfolder);
  if (type) params.set('type', type);
  
  const url = `${baseEndpoint}/api/view?${params}`;
  console.log('Getting image from ComfyUI at:', url);
  
  try {
    // Create our proxied URL (using relative path)
    const proxyUrl = `/api/comfyui-image?url=${encodeURIComponent(url)}`;
    console.log('Proxied image URL:', proxyUrl);
    return proxyUrl;
  } catch (error) {
    console.error('Error creating proxy URL:', error);
    throw error;
  }
}

async function getHistory(apiEndpoint: string, promptId: string) {
  console.log('Getting history from ComfyUI at:', `${apiEndpoint}/api/history/${promptId}`);
  const response = await fetch(`${apiEndpoint}/api/history/${promptId}`, {
    headers: {
      'Origin': config.api.origin || 'http://localhost:4000'
    }
  });
  
  if (!response.ok) {
    console.error('Failed to get history:', response.statusText);
    throw new Error(`Failed to get history: ${response.statusText}`);
  }
  
  const data = await response.json();
  console.log('ComfyUI History Response:', data);
  return data;
}

// Archetype to prompt mapping
function getCategoryPrompt(category: string): string {
  const prompts = {
    synergy_specialist: "1980s extremely smiling pop-culture corporate person inspired by David LaChapelle, Patrick Nagel: luxury, neat hair, party, baloons, glowing skin and hair, wearing a colorful suite, Film grain, RCA TK-76, ACES colours, halo rim light, Chromatic aberration details, Scan lines or VHS distortion, Scan lines or VHS distortion, office computers and colorful baloons in the background, evoking a airbrushed aesthetic with vibrant, nostalgic charm",
    
    executive_oracle: "1980s pop-culture corporate person inspired by David LaChapelle, Patrick Nagel: luxury, sleek hair, glowing skin and hair, wearing a suite, Film grain, RCA TK-76, ACES colours, halo rim light, Chromatic aberration details, Scan lines or VHS distortion, High-rise office window with skyline view in the background, evoking an airbrushed aesthetic with vibrant, nostalgic charm",
    
    engagement_risk: "1980s pop-culture extremely sarcastic corporate slacker inspired by David LaChapelle, Patrick Nagel: luxury, rebellion messy hair, glowing skin and hair, wearing a office suite and colorful tie, Film grain, RCA TK-76, ACES colours, halo rim light, Chromatic aberration details, Scan lines or VHS distortion, office computers in the background, evoking a airbrushed aesthetic with vibrant, nostalgic charm",
    
    workflow_wizard: "1980s pop-culture corporate person inspired by David LaChapelle, Patrick Nagel: professional haircut, glowing skin and hair, wearing Button up shirt and bow tie, Film grain, RCA TK-76, ACES colours, halo rim light, Chromatic aberration details, Scan lines or VHS distortion, office computers and oversized calculator in the background, evoking a airbrushed aesthetic with vibrant, nostalgic charm",
    
    middle_manager: "1980s pop-culture happy middle manager person inspired by David LaChapelle, Patrick Nagel, fine meme: luxury, office burning down, frizzy unkept hair, glowing skin and hair, wearing classic office blazer, fire flames and office desk in the background, Film grain, RCA TK-76, ACES colours, halo rim light, Chromatic aberration details, Scan lines or VHS distortion, evoking an airbrushed aesthetic with vibrant, nostalgic charm",
    
    the_intern: "1980s pop-culture corporate intern inspired by David LaChapelle, Patrick Nagel: luxury, professional hair, coffee cup, glowing skin and hair, wearing a office suite, Film grain, RCA TK-76, ACES colours, halo rim light, Chromatic aberration details, Scan lines or VHS distortion, office coffee machines in the background, evoking a airbrushed aesthetic with vibrant, nostalgic charm"
  };
  
  return prompts[category as keyof typeof prompts] || prompts.middle_manager;
}

// Archetype-specific seeds mapping
const categorySeeds = {
  synergy_specialist: [163, 428, 700, 208],
  executive_oracle: [8, 14, 32, 163, 176, 195, 248, 262, 324, 700],
  engagement_risk: [14, 32, 208, 246, 248, 700],
  workflow_wizard: [195, 208, 248, 700],
  middle_manager: [208, 248, 242, 743, 762],
  the_intern: [8,  208, 246, 700, 702]
} as const;

// Get a random seed from the category's predefined list
function getCategorySeed(category: string): number {
  const seeds = categorySeeds[category as keyof typeof categorySeeds];
  if (!seeds) {
    return Math.floor(Math.random() * 1000000); // fallback for unknown categories
  }
  return seeds[Math.floor(Math.random() * seeds.length)];
}

function generateClientId(): string {
  return Math.random().toString(36).substring(2);
}

function generateRandomSeed(): number {
  return Math.floor(Math.random() * 1000000);
}

async function uploadImageToComfyUI(apiEndpoint: string, imageData: Buffer): Promise<string> {
  const formData = new FormData();
  formData.append('image', new Blob([imageData], { type: 'image/png' }), 'input.png');
  
  const response = await fetch(`${apiEndpoint}/upload/image`, {
    method: 'POST',
    body: formData
  });

  if (!response.ok) {
    throw new Error('Failed to upload image to ComfyUI');
  }

  const data = await response.json();
  return data.name;
}

export async function POST(request: Request) {
  console.log('ComfyUI API route: POST request received');
  
  try {
    // Get category from header first
    const category = request.headers.get('x-oracle-category');
    console.log('Category from header:', category);
    
    if (!category) {
      const headers = Object.fromEntries(request.headers.entries());
      console.error('No category header found. Headers:', JSON.stringify(headers, null, 2));
      throw new Error('No category provided in header');
    }

    console.log('Using category:', category);

    // Parse request body
    const contentType = request.headers.get('content-type') || '';
    console.log('Content-Type:', contentType);

    let image: string;
    let hash: string;

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const imageFile = formData.get('image') as File;
      if (!imageFile) throw new Error('No image provided');
      
      const arrayBuffer = await imageFile.arrayBuffer();
      image = Buffer.from(arrayBuffer).toString('base64');
      hash = formData.get('hash') as string;
    } else if (contentType.includes('application/json')) {
      const body = await request.json();
      image = body.image;
      hash = body.hash;
    } else {
      throw new Error(`Unsupported content type: ${contentType}`);
    }

    if (!image || !hash) {
      throw new Error('Missing required fields in request body');
    }

    // Get the prompt for this category
    const prompt = getCategoryPrompt(category);
    console.log('Using prompt for category:', category);

    // Get ComfyUI endpoint from config
    const comfyuiEndpoint = config.api.comfyui.endpoint;
    if (!comfyuiEndpoint) {
      throw new Error('ComfyUI API endpoint not configured');
    }
    console.log('Using ComfyUI endpoint:', comfyuiEndpoint);

    // Upload image to ComfyUI
    console.log('Uploading image to ComfyUI...');
    const uploadedImageName = await uploadImageToComfyUI(comfyuiEndpoint, Buffer.from(image, 'base64'));
    console.log('Image uploaded successfully:', uploadedImageName);

    // Generate client ID
    const clientId = generateClientId();
    console.log('Generated client ID:', clientId);

    // Get seed for the specific category
    const seed = getCategorySeed(category);
    console.log('Using seed for category', category, ':', seed);

    // This is the actual workflow that ComfyUI will execute
    const workflow = {
      "3": {
        "inputs": {
          "seed": seed,
          "steps": 30,
          "cfg": 4.5,
          "sampler_name": "euler",
          "scheduler": "karras",
          "denoise": 1,
          "model": ["4", 0],
          "positive": ["11", 1],
          "negative": ["11", 2],
          "latent_image": ["49", 0]
        },
        "class_type": "KSampler",
        "_meta": {
          "title": "KSampler"
        }
      },
      "4": {
        "inputs": {
          "ckpt_name": "AlbedoBaseXL-v3-mini.safetensors"
        },
        "class_type": "CheckpointLoaderSimple",
        "_meta": {
          "title": "Load Checkpoint"
        }
      },
      "6": {
        "inputs": {
          "text": prompt,
          "clip": ["4", 1]
        },
        "class_type": "CLIPTextEncode",
        "_meta": {
          "title": "CLIP Text Encode (Prompt)"
        }
      },
      "7": {
        "inputs": {
          "text": "watermarks, distortions, stock photos, stock photography, text, nude, getty images, black and white images, watermark, logo",
          "clip": ["4", 1]
        },
        "class_type": "CLIPTextEncode",
        "_meta": {
          "title": "CLIP Text Encode (Negative Prompt)"
        }
      },
      "8": {
        "inputs": {
          "samples": ["3", 0],
          "vae": ["4", 2]
        },
        "class_type": "VAEDecode",
        "_meta": {
          "title": "VAE Decode"
        }
      },
      "10": {
        "inputs": {
          "images": ["8", 0]
        },
        "class_type": "PreviewImage",
        "_meta": {
          "title": "Preview Image"
        }
      },
      "11": {
        "inputs": {
          "weight": 0.9,
          "start_at": 0,
          "end_at": 1,
          "instantid": ["12", 0],
          "insightface": ["57", 0],
          "control_net": ["15", 0],
          "image": ["51", 0],
          "model": ["4", 0],
          "positive": ["6", 0],
          "negative": ["7", 0]
        },
        "class_type": "ApplyInstantID",
        "_meta": {
          "title": "Apply InstantID"
        }
      },
      "12": {
        "inputs": {
          "instantid_file": "SDXL/ip-adapter.bin"
        },
        "class_type": "InstantIDModelLoader",
        "_meta": {
          "title": "Load InstantID Model"
        }
      },
      "15": {
        "inputs": {
          "control_net_name": "instantid/diffusion_pytorch_model.safetensors"
        },
        "class_type": "ControlNetLoader",
        "_meta": {
          "title": "Load ControlNet Model"
        }
      },
      "20": {
        "inputs": {
          "image": uploadedImageName,
          "upload": "image"
        },
        "class_type": "LoadImage",
        "_meta": {
          "title": "Load Image"
        }
      },
      "49": {
        "inputs": {
          "width": 1024,
          "height": 1024,
          "batch_size": 1
        },
        "class_type": "EmptyLatentImage",
        "_meta": {
          "title": "Empty Latent Image"
        }
      },
      "50": {
        "inputs": {
          "image1": ["52", 0],
          "image2": ["52", 0]
        },
        "class_type": "ImageBatch",
        "_meta": {
          "title": "Batch Images"
        }
      },
      "51": {
        "inputs": {
          "image1": ["50", 0],
          "image2": ["20", 0]
        },
        "class_type": "ImageBatch",
        "_meta": {
          "title": "Batch Images"
        }
      },
      "52": {
        "inputs": {
          "width": 2000,
          "height": 2000,
          "position": "center",
          "x_offset": 0,
          "y_offset": 0,
          "image": ["20", 0]
        },
        "class_type": "ImageCrop+",
        "_meta": {
          "title": " Image Crop"
        }
      },
      "53": {
        "inputs": {
          "images": ["52", 0]
        },
        "class_type": "PreviewImage",
        "_meta": {
          "title": "Preview Image"
        }
      },
      "57": {
        "inputs": {
          "provider": "CPU"
        },
        "class_type": "InstantIDFaceAnalysis",
        "_meta": {
          "title": "InstantID Face Analysis"
        }
      }
    };
    
    console.log('Sending workflow to ComfyUI:', JSON.stringify(workflow, null, 2));
    const queueResponse = await queuePrompt(comfyuiEndpoint, workflow, clientId);
    console.log('ComfyUI API Response:', queueResponse);

    // Return prompt ID in the expected format
    return NextResponse.json({
      success: true,
      upscaledResult: {
        promptId: queueResponse.prompt_id,
        statusEndpoint: `/api/comfyui-status?promptId=${queueResponse.prompt_id}`
      }
    }, {
      headers: corsHeaders
    });

  } catch (error) {
    console.error('Error in ComfyUI API route:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { 
        status: 500,
        headers: corsHeaders
      }
    );
  }
}
