import { NextRequest, NextResponse } from 'next/server';
import { AiModelFactory, AiModelRequest } from '@/utils/aiModel';
import { getAiModelConfig } from '@/config/aiModel';

export const maxDuration = 60; // Maximum allowed duration for Vercel hobby plan
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    // Parse the request body
    const body = await req.json();
    const { inputImage, color, provider = 'stabilityAi' } = body;

    if (!inputImage || !color) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get the configuration for the specified provider
    const config = getAiModelConfig(provider);

    // Create the AI model service
    const aiService = AiModelFactory.createService(config);

    // Process the image
    const request: AiModelRequest = {
      inputImage,
      color,
      targetAspectRatio: 0.85,
      width: 768,
      height: 652 // 768 * 0.85
    };

    const result = await aiService.generateImage(request);

    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      image: result.outputImage
    });

  } catch (error) {
    console.error('Error processing image:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An unknown error occurred' },
      { status: 500 }
    );
  }
}
