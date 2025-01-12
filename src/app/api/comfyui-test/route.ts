import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const comfyApiEndpoint = process.env.NEXT_PUBLIC_COMFYUI_API_ENDPOINT;
    if (!comfyApiEndpoint) {
      throw new Error('ComfyUI API endpoint not configured');
    }

    console.log('Testing ComfyUI API connection...');
    console.log('API Endpoint:', comfyApiEndpoint);

    // Test the object info endpoint
    const response = await fetch(`${comfyApiEndpoint}/api/object_info`, {
      headers: {
        'Origin': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
      }
    });

    if (!response.ok) {
      const text = await response.text();
      console.error('ComfyUI API Error:', text);
      throw new Error(`Failed to get object info: ${text}`);
    }

    const data = await response.json();
    console.log('ComfyUI API Response:', data);

    return NextResponse.json({
      success: true,
      message: 'ComfyUI API is accessible',
      data
    });
  } catch (error) {
    console.error('Error testing ComfyUI API:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error occurred' },
      { status: 500 }
    );
  }
}
