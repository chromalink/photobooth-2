import { NextRequest, NextResponse } from 'next/server';
import sgMail from '@sendgrid/mail';

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.SENDGRID_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'SendGrid API key is not configured' },
        { status: 500 }
      );
    }

    sgMail.setApiKey(apiKey);

    const data = await req.json();
    const { fullName, email, aiResponse, imageUrl } = data;

    // Create HTML email content
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #333; text-align: center;">Your ChromaLink Reading</h1>
        
        <div style="text-align: center; margin: 20px 0;">
          <img src="${imageUrl}" alt="Your Aura Photo" style="max-width: 100%; border-radius: 8px; box-shadow: 0 4px 8px rgba(0,0,0,0.1);">
        </div>

        <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h2 style="color: #444; margin-bottom: 15px;">Your Spiritual Reading</h2>
          <p style="color: #666; line-height: 1.6;">${aiResponse}</p>
        </div>

        <div style="text-align: center; color: #888; margin-top: 30px;">
          <p>Thank you for using ChromaLink!</p>
        </div>
      </div>
    `;

    const msg = {
      to: email,
      from: process.env.SENDGRID_FROM_EMAIL || 'your-verified-sender@example.com',
      subject: `${fullName}'s ChromaLink Reading`,
      html: htmlContent,
    };

    await sgMail.send(msg);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('SendGrid error:', error);
    return NextResponse.json(
      { error: 'Failed to send email' },
      { status: 500 }
    );
  }
}
