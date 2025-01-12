import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // Note: removed NEXT_PUBLIC_ prefix
});

export async function POST(request: Request) {
  try {
    const { color } = await request.json();

    const prompt = `You are a humorous satirical oracle. You have scanned the photo of a user and are presenting them with a satirical affirmation of their hypothetical state of being. Absolute Maximum response length: 49 words`;

    const completion = await openai.chat.completions.create({
      messages: [{ role: "system", content: prompt }],
      model: "gpt-4o",
      temperature: 0.9,
      max_tokens: 500,
    });

    return NextResponse.json({ 
      response: completion.choices[0]?.message?.content || 'Unable to generate reading'
    });
  } catch (error) {
    console.error('Error generating spiritual reading:', error);
    return NextResponse.json(
      { error: 'Failed to generate spiritual reading' },
      { status: 500 }
    );
  }
}
