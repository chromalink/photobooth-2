import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { Readable } from 'stream';
import { getBaseUrl } from '@/utils/url';

// Configure Google Drive API
const configureGoogleDrive = () => {
  try {
    // Check if all required environment variables are present
    const requiredEnvVars = [
      'GOOGLE_CLIENT_EMAIL',
      'GOOGLE_PRIVATE_KEY',
      'GOOGLE_DRIVE_FOLDER_ID'
    ];
    
    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
    if (missingVars.length > 0) {
      console.error(`Missing required environment variables: ${missingVars.join(', ')}`);
      return null;
    }

    // Create JWT client for authentication
    const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');
    const auth = new google.auth.JWT({
      email: process.env.GOOGLE_CLIENT_EMAIL,
      key: privateKey,
      scopes: ['https://www.googleapis.com/auth/drive.file']
    });

    // Create and return the drive client
    return google.drive({ version: 'v3', auth });
  } catch (error) {
    console.error('Error configuring Google Drive:', error);
    return null;
  }
};

// Function to extract image data from the comfyui-image API
async function fetchImageFromComfyUI(url: string): Promise<{ buffer: Buffer, mimeType: string }> {
  try {
    // Extract the actual ComfyUI URL from the proxy URL
    const urlObj = new URL(url, 'http://placeholder.com');
    const comfyUrl = urlObj.searchParams.get('url');
    
    if (!comfyUrl) {
      throw new Error('No ComfyUI URL found in the proxy URL');
    }
    
    console.log('Fetching directly from ComfyUI URL:', comfyUrl);
    
    // Fetch the image directly from the ComfyUI endpoint
    const response = await fetch(comfyUrl, {
      cache: 'no-store' // Don't cache to avoid the 2MB limit issue
    });
    if (!response.ok) {
      throw new Error(`Failed to fetch image from ComfyUI: ${response.status} ${response.statusText}`);
    }
    
    const buffer = Buffer.from(await response.arrayBuffer());
    const mimeType = response.headers.get('content-type') || 'image/png';
    
    return { buffer, mimeType };
  } catch (error) {
    console.error('Error fetching from ComfyUI:', error);
    throw error;
  }
}

// Function to fetch image data from a URL
async function fetchImageFromUrl(url: string): Promise<{ buffer: Buffer, mimeType: string }> {
  try {
    // Handle data URLs (base64 encoded images)
    if (url.startsWith('data:')) {
      const matches = url.match(/^data:([A-Za-z-+/]+);base64,(.+)$/);
      if (!matches || matches.length !== 3) {
        throw new Error('Invalid data URL format');
      }
      
      const mimeType = matches[1];
      const base64Data = matches[2];
      const buffer = Buffer.from(base64Data, 'base64');
      
      return { buffer, mimeType };
    } 
    // Handle comfyui-image proxy URLs
    else if (url.startsWith('/api/comfyui-image') || url.includes('/api/comfyui-image')) {
      return fetchImageFromComfyUI(url);
    }
    // Handle relative URLs by resolving them against the base URL
    else if (url.startsWith('/')) {
      const baseUrl = getBaseUrl();
      const absoluteUrl = `${baseUrl}${url}`;
      console.log('Resolved relative URL to:', absoluteUrl);
      
      const response = await fetch(absoluteUrl, {
        cache: 'no-store' // Don't cache to avoid the 2MB limit issue
      });
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
      }
      
      const buffer = Buffer.from(await response.arrayBuffer());
      const mimeType = response.headers.get('content-type') || 'image/png';
      
      return { buffer, mimeType };
    }
    // Handle HTTP URLs
    else {
      const response = await fetch(url, {
        cache: 'no-store' // Don't cache to avoid the 2MB limit issue
      });
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
      }
      
      const buffer = Buffer.from(await response.arrayBuffer());
      const mimeType = response.headers.get('content-type') || 'image/png';
      
      return { buffer, mimeType };
    }
  } catch (error) {
    console.error('Error fetching image:', error);
    throw error;
  }
}

// POST body: { imageUrl: string, fileName?: string }
export async function POST(req: NextRequest) {
  try {
    const { imageUrl, fileName } = await req.json();
    if (!imageUrl) {
      return NextResponse.json({ error: 'Missing imageUrl' }, { status: 400 });
    }

    // Generate a default file name if not provided
    const finalFileName = fileName || `face-audit-${Date.now()}.png`;

    // Log the request for debugging
    console.log(`Attempting to save image to Google Drive: ${finalFileName}`);
    console.log(`Image URL length: ${imageUrl.length} characters`);
    console.log(`Image URL: ${imageUrl.substring(0, 100)}${imageUrl.length > 100 ? '...' : ''}`);
    
    // Configure Google Drive
    const drive = configureGoogleDrive();
    if (!drive) {
      console.error('Failed to configure Google Drive API');
      return NextResponse.json({ 
        error: 'Google Drive API configuration failed. Check server logs and environment variables.',
      }, { status: 500 });
    }

    try {
      // Fetch the image data
      const { buffer, mimeType } = await fetchImageFromUrl(imageUrl);
      
      // Create a readable stream from the buffer
      const stream = new Readable();
      stream.push(buffer);
      stream.push(null); // Signal the end of the stream
      
      // Upload the file to Google Drive
      const response = await drive.files.create({
        requestBody: {
          name: finalFileName,
          mimeType: mimeType,
          parents: [process.env.GOOGLE_DRIVE_FOLDER_ID!]
        },
        media: {
          mimeType: mimeType,
          body: stream
        },
        fields: 'id,name,webViewLink'
      });
      
      console.log('File uploaded successfully:', response.data);
      
      return NextResponse.json({
        success: true,
        message: 'Image successfully uploaded to Google Drive',
        fileId: response.data.id,
        fileName: response.data.name,
        webViewLink: response.data.webViewLink
      });
    } catch (uploadError) {
      console.error('Error uploading to Google Drive:', uploadError);
      return NextResponse.json({ 
        error: 'Failed to upload image to Google Drive',
        details: uploadError.message
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Error in upload-to-drive API:', error);
    return NextResponse.json({ error: 'Failed to process image' }, { status: 500 });
  }
}
