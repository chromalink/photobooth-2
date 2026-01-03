import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';
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
    
    // Get image metadata to determine dimensions
    const imageMetadata = await sharp(imageBuffer).metadata();
    const imageWidth = imageMetadata.width || 1024;
    const imageHeight = imageMetadata.height || 1024;
    
    // Calculate logo dimensions (80% of image width)
    const logoWidth = Math.floor(imageWidth * 0.8);
    
    // Resize logo while maintaining aspect ratio and apply 80% opacity
    const resizedLogo = await sharp(logoBuffer)
      .resize(logoWidth, null, {
        fit: 'contain',
        withoutEnlargement: true
      })
      .ensureAlpha()
      .composite([{
        input: Buffer.from([255, 255, 255, Math.floor(255 * 0.8)]),
        raw: {
          width: 1,
          height: 1,
          channels: 4
        },
        tile: true,
        blend: 'dest-in'
      }])
      .toBuffer();
    
    // Get resized logo dimensions
    const logoMetadata = await sharp(resizedLogo).metadata();
    const logoHeight = logoMetadata.height || logoWidth;
    
    // Calculate position for center horizontally, extending beyond bottom with -1% margin
    const left = Math.floor((imageWidth - logoWidth) / 2);
    const top = Math.floor(imageHeight - logoHeight + (imageHeight * 0.01));
    
    // Composite the logo onto the image and compress to reduce size
    // Resize to max 1024px width if larger, then compress to JPEG
    let compositeImage = sharp(imageBuffer)
      .composite([{
        input: resizedLogo,
        top: top,
        left: left
      }]);
    
    // If image is larger than 1024px, resize it
    if (imageWidth > 1024) {
      compositeImage = compositeImage.resize(1024, null, {
        fit: 'inside',
        withoutEnlargement: false
      });
    }
    
    const outputBuffer = await compositeImage
      .jpeg({ quality: 85, mozjpeg: true })
      .toBuffer();
    
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
