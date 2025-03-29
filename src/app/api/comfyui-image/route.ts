import { NextRequest, NextResponse } from 'next/server';
import { getBaseUrl } from '@/utils/url';

export const revalidate = 0; // Don't cache this API route

export async function GET(request: NextRequest) {
  // Add CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Cache-Control': 'public, max-age=31536000, immutable',
    'Surrogate-Control': 'public, max-age=31536000, immutable',
    'CDN-Cache-Control': 'public, max-age=31536000, immutable'
  };

  try {
    const searchParams = request.nextUrl.searchParams;
    const imageUrl = searchParams.get('url');
    console.log('Proxy endpoint called with URL:', imageUrl);

    if (!imageUrl) {
      console.error('Missing image URL in request');
      return NextResponse.json({ error: 'Missing image URL' }, { 
        status: 400,
        headers
      });
    }

    // If the URL is already a proxy URL, extract the original URL
    let targetUrl = imageUrl;
    if (imageUrl.includes('/api/comfyui-image')) {
      const params = new URLSearchParams(imageUrl.split('?')[1]);
      targetUrl = params.get('url') || imageUrl;
    }

    // Decode the URL if it's encoded
    try {
      targetUrl = decodeURIComponent(targetUrl);
    } catch (e) {
      console.error('Error decoding URL:', e);
      // If decoding fails, use the URL as is
    }

    console.log('Fetching from URL:', targetUrl);

    // Get the app URL dynamically
    const appUrl = getBaseUrl();
    console.log('Using app URL for Origin:', appUrl);

    // Fetch with appropriate headers and cache: 'force-cache' for better performance
    const response = await fetch(targetUrl, {
      headers: {
        'Accept': 'image/*, */*',
        'User-Agent': 'next-server',
        'Origin': appUrl || 'http://localhost:4000'
      },
      cache: 'force-cache',
      next: { revalidate: 31536000 } // Cache for a year
    });
    
    if (!response.ok) {
      console.error('Fetch failed:', {
        status: response.status,
        statusText: response.statusText
      });
      return NextResponse.json(
        { error: `Failed to fetch image: ${response.statusText}` },
        { status: response.status, headers }
      );
    }
    
    // Get the image data and content type
    const imageData = await response.arrayBuffer();
    const contentType = response.headers.get('content-type') || 'image/png';
    
    return new NextResponse(imageData, {
      headers: {
        ...headers,
        'Content-Type': contentType
      }
    });
  } catch (error) {
    console.error('Error in proxy endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers }
    );
  }
}

// Handle CORS preflight requests
export async function OPTIONS(request: Request) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  });
}
