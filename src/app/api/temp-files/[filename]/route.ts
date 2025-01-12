import { NextResponse } from 'next/server';
import { writeFile, readFile } from 'fs/promises';
import path from 'path';

// This route needs Node.js APIs, so we'll use nodejs runtime
export const runtime = 'nodejs';

export async function PUT(
  request: Request,
  { params }: { params: { filename: string } }
) {
  try {
    const filename = params.filename;
    const filepath = path.join('/tmp', filename);

    // Get the file data from the request
    const data = await request.arrayBuffer();
    
    // Write the file
    await writeFile(filepath, Buffer.from(data));

    return new NextResponse(null, { status: 200 });
  } catch (error) {
    console.error('Error saving file:', error);
    return new NextResponse(null, { status: 500 });
  }
}

export async function GET(
  request: Request,
  { params }: { params: { filename: string } }
) {
  try {
    const filename = params.filename;
    const filepath = path.join('/tmp', filename);

    // Read the file
    const fileBuffer = await readFile(filepath);

    // Determine content type based on file extension
    const ext = path.extname(filename).toLowerCase();
    const contentType = {
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
    }[ext] || 'application/octet-stream';

    // Return the file with appropriate headers
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=0, must-revalidate',
      },
    });
  } catch (error) {
    console.error('File access error:', error);
    return NextResponse.json(
      { error: 'File not found' },
      { status: 404 }
    );
  }
}
