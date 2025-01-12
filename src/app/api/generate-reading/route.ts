import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // Note: removed NEXT_PUBLIC_ prefix
});

export async function POST(request: Request) {
  try {
    const { color } = await request.json();

    const prompt = `You are a spiritual, holistic beauty and healing oracle. You have scanned the aura and spirit of a user and are presenting them with a positive affirmation of their natural state of being. The user has chosen the color ${color}. Based on this color and your scan of their energy, provide them with a poetic, uplifting, and deeply spiritual acknowledgment of their beautiful aura and how their chosen color reflects their inner essence. Your response should feel personal, deeply affirming, and written in the voice of a wise, compassionate oracle. Make the tone mystical yet grounded, and ensure that the response celebrates their unique energy while tying it to the chosen color. Absolute Maximum response length: 49 words.`;

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
