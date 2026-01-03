import { NextRequest, NextResponse } from 'next/server';
import Jimp from 'jimp';
import path from 'path';
import fs from 'fs';

// Function to fetch image data from a URL
async function fetchImageFromUrl(url: string): Promise<Buffer> {
  try {
    // Handle data URLs (base64 encoded images)
    if (url.startsWith('data:')) {
      const matches = url.match(/^data:([A-Za-z-+/]+);base64,(.+)$/);
      if (!matches || matches.length !== 3) {
        throw new Error('Invalid data URL format');
      }
      
      const base64Data = matches[2];
      return Buffer.from(base64Data, 'base64');
    } 
    // Handle comfyui-image proxy URLs
    else if (url.startsWith('/api/comfyui-image') || url.includes('/api/comfyui-image')) {
      // Extract the actual ComfyUI URL from the proxy URL
      const urlObj = new URL(url, 'http://placeholder.com');
      const comfyUrl = urlObj.searchParams.get('url');
      
      if (!comfyUrl) {
        throw new Error('No ComfyUI URL found in the proxy URL');
      }
      
      console.log('Fetching directly from ComfyUI URL:', comfyUrl);
      
      // Fetch the image directly from the ComfyUI endpoint
      const response = await fetch(comfyUrl, {
        cache: 'no-store'
      });
      if (!response.ok) {
        throw new Error(`Failed to fetch image from ComfyUI: ${response.status} ${response.statusText}`);
      }
      
      return Buffer.from(await response.arrayBuffer());
    }
    // Handle HTTP URLs
    else {
      const response = await fetch(url, {
        cache: 'no-store'
      });
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
      }
      
      return Buffer.from(await response.arrayBuffer());
    }
  } catch (error) {
    console.error('Error fetching image:', error);
    throw error;
  }
}

// POST body: { imageUrl: string }
export async function POST(req: NextRequest) {
  try {
    const { imageUrl } = await req.json();
    if (!imageUrl) {
      return NextResponse.json({ error: 'Missing imageUrl' }, { status: 400 });
    }

    console.log('Overlaying logo on image...');
    
    // Fetch the main image
    const imageBuffer = await fetchImageFromUrl(imageUrl);
    
    // Load the CES logo from public folder
    const logoPath = path.join(process.cwd(), 'public', 'CES_LOGO.png');
    
    if (!fs.existsSync(logoPath)) {
      console.error('CES_LOGO.png not found at:', logoPath);
      return NextResponse.json({ error: 'Logo file not found' }, { status: 500 });
    }
    
    const logoBuffer = fs.readFileSync(logoPath);
    
    // Load images with Jimp
    const image = await Jimp.read(imageBuffer);
    const logo = await Jimp.read(logoBuffer);
    
    const imageWidth = image.getWidth();
    const imageHeight = image.getHeight();
    
    // Calculate logo dimensions (80% of image width)
    const logoWidth = Math.floor(imageWidth * 0.8);
    
    // Resize logo while maintaining aspect ratio
    logo.scaleToFit(logoWidth, Jimp.AUTO);
    
    // Apply 80% opacity to logo
    logo.opacity(0.8);
    
    const logoHeight = logo.getHeight();
    
    // Calculate position for center horizontally, extending beyond bottom with -1% margin
    const left = Math.floor((imageWidth - logoWidth) / 2);
    const top = Math.floor(imageHeight - logoHeight + (imageHeight * 0.01));
    
    // Composite the logo onto the image
    image.composite(logo, left, top);
    
    // If image is larger than 1024px, resize it
    if (imageWidth > 1024) {
      image.scaleToFit(1024, Jimp.AUTO);
    }
    
    // Set JPEG quality to 85 and get buffer
    image.quality(85);
    const outputBuffer = await image.getBufferAsync(Jimp.MIME_JPEG);
    
    // Convert to base64 data URL
    const base64Image = outputBuffer.toString('base64');
    const dataUrl = `data:image/jpeg;base64,${base64Image}`;
    
    console.log('Logo overlay completed successfully');
    
    return NextResponse.json({
      success: true,
      imageUrl: dataUrl
    });
    
  } catch (error) {
    console.error('Error in overlay-logo API:', error);
    return NextResponse.json({ 
      error: 'Failed to overlay logo',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
