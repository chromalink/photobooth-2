import { NextRequest, NextResponse } from 'next/server';
import { config } from '@/config';
import { getBaseUrl, createUrl } from '@/utils/url';

// Common CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-oracle-category',
};

// Handle CORS preflight requests
export async function OPTIONS(request: NextRequest) {
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
      'Origin': getBaseUrl() || 'http://localhost:4000'
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
      'Origin': getBaseUrl() || 'http://localhost:4000'
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
    synergy_specialist: "1980s hyper-smiling corporate HR leader, radiating relentless positivity: oversized, colorful patterned suit in vibrant pastels (pink, blue, yellow) with bold geometric prints. Feathered, curly or perm  hair, glowing skin, too-wide grin. Surrounded by an over-the-top friendly office, CRT monitors, balloons, plastic ferns, Soft film grain, RCA TK-76, ACES colors, halo rim light. Chromatic aberration, scan lines, subtle VHS distortion for an aggressively cheerful, airbrushed corporate dream. shiny greasy skin",
    
    executive_oracle: "1980s pop-culture corporate person inspired: luxury, sleek hair, glowing skin and hair, wearing an all-white 80s power suit with gold accents or jewelry. Film grain, RCA TK-76, ACES colours, rim light, chromatic aberration details, scan lines or VHS distortion. High-rise office window with a night cityscape in the background, casting deep purple and blue neon light onto the scene, evoking an airbrushed aesthetic with vibrant, nostalgic charm",
    
    engagement_risk: "1980s corporate person, sitting in a burning office: Crimped, messy  mullet hairstyle, glowing skin and shiny hair. Wearing a bold red retro power suit with exaggerated, oversized shoulder pads. Their facial expression is completely bored, deadpan, and exhausted—unbothered by the chaos. The background shows the retro office engulfed in flames, with smoke rising, glowing embers, and fire consuming cubicle walls and office furniture. Old CRT monitors flicker amid the destruction, casting a soft neon glow. The scene is drenched in strong red-orange firelight, mixing with cool flickering screen tones. Retro film grain, RCA TK-76 camera effect, ACES colors, halo rim lighting, chromatic aberration, scan lines, and VHS distortion create a stylized airbrushed 80s pop-art aesthetic with a nostalgic, surreal charm",
    
    workflow_wizard: "1980s ultra-focused finance person, deep in thought: thick-rimmed BIG glasses, nerd glasses, nerdy, sharp navy pinstripe suit, large shoulderpads and suspenders or bow tie. Slicked-back hair, Office bathed in green glow from CRT monitors displaying endless spreadsheets and stock charts. Ticker tape spilling onto the desk. Film grain, RCA TK-76, ACES colors, halo rim light. Chromatic aberration, scan lines, subtle VHS distortion, evoking a neon-lit Wall Street data grind",
    
    middle_manager: "1980s pop-culture tired middle manager person, frizzy unkempt hair, glowing skin and hair, wearing a retro brown classic office blazer and an 80s wide tie, outdated, with shoulder pads over a messy, wrinkled top with a faint stain. Cramped into an absurdly tiny beige office cubicle, barely enough room to move, surrounded by an overflowing desk stacked with paperwork and flickering CRT monitors. Everything feels slightly washed-out and beige. Film grain, RCA TK-76, ACES colours, halo rim light, chromatic aberration details, scan lines or VHS distortion, evoking an airbrushed aesthetic with vibrant, nostalgic charm",
    
    the_intern: "1980s pop-culture corporate newbie, lost and panicked: oversized bright green or teal blazer, too big and awkwardly fitted, thrown over a neon  Hawaiian shirt with loud, clashing patterns. Sticky notes are haphazardly stuck to their blazer and shirt. Hair is fluffy, permed, or wildly unkempt, adding to the frazzled look. Wide-eyed, sweaty, or nervously grinning—completely overwhelmed. Their tiny cubicle is a chaotic mess—the desk is completely covered in sticky notes, dead office plants, and half-finished coffee cups. The CRT monitor flashes a massive red 'ERROR' message, practically mocking them. A chunky corded phone dangles off the desk, tangled in its own wires. The harsh fluorescent lighting is way too bright, making everything feel even more stressful. Film grain, RCA TK-76, ACES colors, halo rim light, chromatic aberration, scan lines, VHS distortion, evoking an airbrushed 80s aesthetic of corporate chaos and naive enthusiasm."
  };
  
  return prompts[category as keyof typeof prompts] || prompts.middle_manager;
}

// Archetype to negative prompt mapping
function getCategoryNegativePrompt(category: string): string {
  const negativePrompts = {
    synergy_specialist: "watermark, text, logo, label, getty images, words, URL, nude, yellow teeth, hands,ugly, outdoors, objects blocking face, wrinkles",
    
    executive_oracle: "getty images, blurry face, out of focused face, watermark, text, logo, label, stock photo, words, URL, nude, yellow teeth, hands,ugly, outdoors, objects blocking face, hand on face, harsh shadows, hands, hands on face, ugly, distorted, objects coversing face, objects covering hair, monochrome, neon signs, wrinkles, istock, nudity ",
    
    engagement_risk: "watermarks, distortions, stock photos, stock photography, text, nude, getty images, black and white images, watermark, logo, bad anatomy, blurry, low quality, disfigured, extra limbs, unrealistic fire, cartoon fire, anime style, wrinkles",
    
    workflow_wizard: "watermark, text, logo, label, getty images, words, URL, nude, yellow teeth, hands,ugly, outdoors, objects blocking face, hand on face, harsh shadows, hands, neon glasses, neon lines on face, hands on face, ugly, distorted, wrinkles",
    
    middle_manager: "watermark, text, logo, label, getty images, words, URL, nude, yellow teeth, hands,ugly, outdoors, objects blocking face, hand on face, harsh shadows, hands, neon glasses, neon lines on face, hands on face, ugly, distorted, objects coversing face, objects covering hair , monochrome, neon signs, out of focus, blurry, wrinkles",
    
    the_intern: "ugly, out of focus, eye bags, blurry face, face too close to camera, eyebags, wrinkles "
  };
  
  return negativePrompts[category as keyof typeof negativePrompts] || negativePrompts.middle_manager;
}

// Archetype-specific seeds mapping
const categorySeeds = {
  synergy_specialist: [666],
  executive_oracle: [14,293],
  engagement_risk: [186],
  workflow_wizard: [666],
  middle_manager: [664],
  the_intern: [95]
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

export async function POST(request: NextRequest) {
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
          "text": getCategoryNegativePrompt(category),
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
