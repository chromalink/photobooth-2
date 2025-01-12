import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // Note: removed NEXT_PUBLIC_ prefix
});

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

    const prompt = `You are a humorous satirical oracle. You have scanned the photo of a user now describing them in a satirical way, trying to guess occupation and relationship status. The user has provided a photo which you can analyze. Based on this photo, give them a funny, witty, and slightly sarcastic reading that playfully pokes fun at their aura or energy. Keep it light-hearted and entertaining. Absolute Maximum response length: 49 words`;

    console.log('Sending request to OpenAI...');
    const completion = await openai.chat.completions.create({
      messages: [
        { 
          role: "system", 
          content: prompt 
        },
        {
          role: "user",
          content: "Please provide a humorous reading. Make it witty and entertaining!"
        }
      ],
      model: "gpt-4o",
      temperature: 0.9,
      max_tokens: 500,
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
