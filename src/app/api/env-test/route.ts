import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    environment: {
      NODE_ENV: process.env.NODE_ENV,
      VERCEL_ENV: process.env.VERCEL_ENV,
      hasDiscordToken: !!process.env.DISCORD_TOKEN,
      hasChannelId: !!process.env.DISCORD_CHANNEL_ID,
      // Only show if variables exist and their length, never the actual values
      variablesExist: {
        DISCORD_TOKEN: process.env.DISCORD_TOKEN ? 'present' : 'missing',
        DISCORD_CHANNEL_ID: process.env.DISCORD_CHANNEL_ID ? 'present' : 'missing'
      }
    }
  });
}