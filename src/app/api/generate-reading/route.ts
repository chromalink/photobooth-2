import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // Note: removed NEXT_PUBLIC_ prefix
});

export async function POST(request: Request) {
  try {
    const { imageUrl } = await request.json();

    if (!imageUrl) {
      return NextResponse.json(
        { error: 'No image URL provided' },
        { status: 400 }
      );
    }

    const prompt = `You are a humorous satirical oracle. You have scanned the photo of a user and are presenting them with a satirical affirmation of their hypothetical state of being. The user has provided a photo which you can analyze. Based on this photo, give them a funny, witty, and slightly sarcastic reading that playfully pokes fun at their aura or energy. Keep it light-hearted and entertaining. Absolute Maximum response length: 49 words`;

    const completion = await openai.chat.completions.create({
      messages: [
        { 
          role: "system", 
          content: prompt 
        },
        {
          role: "user",
          content: `The user's photo URL is: ${imageUrl}. Please provide a humorous reading based on their photo.`
        }
      ],
      model: "gpt-4o",
      temperature: 0.9,
      max_tokens: 500,
    });

    return NextResponse.json({ 
      response: completion.choices[0]?.message?.content || 'Unable to generate reading'
    });
  } catch (error) {
    console.error('Error generating satirical reading:', error);
    return NextResponse.json(
      { error: 'Failed to generate satirical reading' },
      { status: 500 }
    );
  }
}
