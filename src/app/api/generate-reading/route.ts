import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import type { ChatCompletionContentPart } from 'openai/resources/chat/completions';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const maxDuration = 300; // 5 minutes timeout

export async function POST(request: Request) {
  try {
    console.log('Generate reading route: Starting...');
    const body = await request.json();
    console.log('Request body:', body);
    const { imageUrl } = body;

    if (!imageUrl) {
      console.error('No image URL provided in request');
      return NextResponse.json(
        { error: 'No image URL provided' },
        { status: 400 }
      );
    }

    console.log('Image URL received:', imageUrl.substring(0, 50) + '...');
    console.log('Image URL starts with:', imageUrl.substring(0, 30));
    
    let processedImageUrl = imageUrl;
    // Check if it's a base64 image
    if (imageUrl.startsWith('data:image')) {
      console.log('Received base64 image');
      // Extract the actual base64 data
      const base64Data = imageUrl.split(',')[1];
      // Convert to a regular URL that OpenAI can access
      processedImageUrl = `data:image/jpeg;base64,${base64Data}`;
      console.log('Processed image URL starts with:', processedImageUrl.substring(0, 30));
    }

    const prompt = `You are a humorous satirical oracle. Based on the photo, give a funny, witty, and slightly sarcastic reading that playfully pokes fun at their aura or energy. Try to guess their occupation and relationship status in a humorous way. Keep it light-hearted and entertaining. Absolute Maximum response length: 49 words`;

    console.log('Sending request to OpenAI...');

    const content: ChatCompletionContentPart[] = [
      { type: "text", text: "What do you see in this photo? Make it funny!" },
      {
        type: "image_url",
        image_url: {
          url: processedImageUrl,
          detail: "low"
        }
      }
    ];

    const completion = await openai.chat.completions.create({
      messages: [
        {
          role: "system",
          content: prompt
        },
        {
          role: "user",
          content
        }
      ],
      model: "gpt-4o",
      max_tokens: 500,
      temperature: 0.9
    });

    console.log('OpenAI response received:', completion.choices[0]?.message?.content);

    return NextResponse.json({ 
      response: completion.choices[0]?.message?.content || 'Unable to generate reading'
    });
  } catch (error) {
    console.error('Error in generate-reading route:', error);
    if (error instanceof Error) {
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate satirical reading' },
      { status: 500 }
    );
  }
}
