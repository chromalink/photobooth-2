import { NextResponse } from 'next/server';
import { config } from '@/config';

export const maxDuration = 300; // Set maximum duration to 5 minutes

async function getHistory(apiEndpoint: string, promptId: string) {
  const response = await fetch(`${apiEndpoint}/api/history/${promptId}`);
  if (!response.ok) {
    throw new Error(`Failed to get history: ${await response.text()}`);
  }
  return response.json();
}

export async function GET(request: Request) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  try {
    const { searchParams } = new URL(request.url);
    const promptId = searchParams.get('promptId');
    
    if (!promptId) {
      return NextResponse.json({ error: 'Missing promptId parameter' }, { status: 400, headers });
    }

    // Using config.api.comfyui.endpoint for ComfyUI endpoint configuration
    const endpoint = config.api.comfyui.endpoint;
    if (!endpoint) {
      return NextResponse.json({ error: 'ComfyUI endpoint not configured' }, { status: 500, headers });
    }

    const history = await getHistory(endpoint, promptId);
    
    if (history[promptId]?.outputs?.[10]?.images?.[0]) {
      const imageName = history[promptId].outputs[10].images[0].filename;
      console.log('Found generated image:', imageName);
      
      // Get the ComfyUI image URL with correct type
      const comfyImageUrl = `${endpoint}/api/view?filename=${imageName}&type=temp`;
      
      // Create our proxied URL
      const proxyUrl = `/api/comfyui-image?url=${encodeURIComponent(comfyImageUrl)}`;
      
      return NextResponse.json({
        success: true,
        completed: true,
        imageUrl: proxyUrl
      }, { headers });
    }
    
    return NextResponse.json({
      success: true,
      completed: false,
      message: 'Image still generating'
    }, { headers });

  } catch (error) {
    console.error('Error in status check:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error occurred' },
      { status: 500, headers }
    );
  }
}
