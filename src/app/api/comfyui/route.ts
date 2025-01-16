import { NextResponse } from 'next/server';
import { config } from '@/config';
import { getBaseUrl, createUrl } from '@/utils/url';

// Handle CORS preflight requests
export async function OPTIONS(request: Request) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

async function queuePrompt(apiEndpoint: string, prompt: any, clientId: string) {
  console.log('Queuing prompt to ComfyUI at:', `${apiEndpoint}/api/prompt`);
  const response = await fetch(`${apiEndpoint}/api/prompt`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Origin': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:4000'
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
      'Origin': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:4000'
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

export async function POST(request: Request) {
  console.log('ComfyUI API route: POST request received');
  try {
    // Add CORS headers to the response
    const headers = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    console.log('ComfyUI API route: Parsing request body');
    const { imageUrl: inputImageUrl, prompt } = await request.json();
    console.log('Received request with imageUrl:', inputImageUrl?.substring(0, 50) + '...', 'and prompt:', prompt);
    
    if (!inputImageUrl || !prompt) {
      console.error('Missing required fields');
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400, headers }
      );
    }

    const comfyApiEndpoint = config.api.comfyui.endpoint;
    if (!comfyApiEndpoint) {
      console.error('ComfyUI API endpoint not configured');
      throw new Error('ComfyUI API endpoint not configured');
    }

    console.log('Using ComfyUI endpoint:', comfyApiEndpoint);

    // First, convert base64 to blob and upload to ComfyUI
    const base64Data = inputImageUrl.split(',')[1];
    const binaryData = Buffer.from(base64Data, 'base64');
    const formData = new FormData();
    formData.append('image', new Blob([binaryData], { type: 'image/jpeg' }), 'input.jpg');
    
    console.log('Uploading image to ComfyUI...');
    const uploadResponse = await fetch(`${comfyApiEndpoint}/upload/image`, {
      method: 'POST',
      body: formData
    });
    
    if (!uploadResponse.ok) {
      console.error('Failed to upload image to ComfyUI:', await uploadResponse.text());
      return NextResponse.json(
        { error: 'Failed to upload image to ComfyUI' },
        { status: 500, headers }
      );
    }
    
    const uploadResult = await uploadResponse.json();
    const uploadedImageName = uploadResult.name;
    console.log('Image uploaded successfully:', uploadedImageName);

    // Generate a unique client ID
    const clientId = crypto.randomUUID();
    console.log('Generated client ID:', clientId);

    // Generate a random seed
    const randomSeed = Math.floor(Math.random() * Number.MAX_SAFE_INTEGER);
    console.log('Using random seed:', randomSeed);

    // This is the actual workflow that ComfyUI will execute
    const workflow = {
      "3": {
        "inputs": {
          "seed": 432369108,
          "steps": 30,
          "cfg": 4.5,
          "sampler_name": "euler",
          "scheduler": "karras",
          "denoise": 1,
          "model": ["11", 0],
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
          "text": "1980s pop-culture corporate person inspired by David LaChapelle, Patrick Nagel: luxury, voluminous hair, glowing skin and hair, wearing a shiny suite, Film grain, RCA TK-76, ACES colours, halo rim light, Chromatic aberration details, Scan lines or VHS distortion, computers office in the background, evoking a airbrushed aesthetic with vibrant, nostalgic charm",
          "clip": ["4", 1]
        },
        "class_type": "CLIPTextEncode",
        "_meta": {
          "title": "CLIP Text Encode (Prompt)"
        }
      },
      "7": {
        "inputs": {
          "text": "watermarks, distortions, stock photos, stock photography, text",
          "clip": ["4", 1]
        },
        "class_type": "CLIPTextEncode",
        "_meta": {
          "title": "CLIP Text Encode (Prompt)"
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
    const { prompt_id: promptId } = await queuePrompt(comfyApiEndpoint, workflow, clientId);
    console.log('Got prompt ID:', promptId);
    
    // Return immediately with the promptId and status endpoint
    return NextResponse.json({
      success: true,
      upscaledResult: {
        imageUrl: null,
        promptId,
        statusEndpoint: `/api/comfyui-status?promptId=${promptId}`
      }
    }, { headers });
  } catch (error) {
    console.error('Error in ComfyUI API route:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error occurred' },
      { status: 500, headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      }}
    );
  }
}
