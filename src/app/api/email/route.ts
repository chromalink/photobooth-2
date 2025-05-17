import { NextRequest, NextResponse } from 'next/server';
import sgMail from '@sendgrid/mail';

// Helper function to convert a URL to a base64 string for attachment
async function urlToBase64(url: string): Promise<{ base64: string, contentType: string } | null> {
  try {
    // Handle data URLs (base64)
    if (url.startsWith('data:')) {
      const matches = url.match(/^data:([\w\/+]+);base64,(.+)$/);
      if (!matches || matches.length !== 3) {
        console.error('Invalid data URL format');
        return null;
      }
      return {
        contentType: matches[1],
        base64: matches[2]
      };
    }
    
    // Handle HTTP URLs
    console.log('Fetching image from URL:', url.substring(0, 50) + '...');
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    
    if (!response.ok) {
      console.error('Failed to fetch image:', response.status, response.statusText);
      return null;
    }
    
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64 = buffer.toString('base64');
    const contentType = response.headers.get('content-type') || 'image/jpeg';
    console.log('Successfully fetched image, content type:', contentType);
    
    return { base64, contentType };
  } catch (error) {
    console.error('Error converting URL to base64:', error);
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.SENDGRID_API_KEY;
    if (!apiKey) {
      console.error('SendGrid API key is not configured');
      return NextResponse.json(
        { error: 'SendGrid API key is not configured' },
        { status: 500 }
      );
    }

    sgMail.setApiKey(apiKey);

    const data = await req.json();
    console.log('Received email request with data:', {
      fullName: data.fullName,
      email: data.email,
      aiResponseLength: data.aiResponse?.length || 0,
      imageUrlLength: data.imageUrl?.length || 0,
      imageUrlStart: data.imageUrl ? `${data.imageUrl.substring(0, 30)}...` : 'No image URL'
    });
    
    const { fullName, email, aiResponse, imageUrl } = data;

    if (!email) {
      console.error('Missing email address');
      return NextResponse.json(
        { error: 'Missing email address' },
        { status: 400 }
      );
    }

    // Create a normal HTML email content without special formatting and with left alignment
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; text-align: left;">
        <p style="text-align: left;">Looking good, ${fullName || 'there'}!</p>
        
        <p style="text-align: left;">Thanks for stepping into the Soul Snap booth—we hope you had as much fun as we did revealing your soul.</p>
        
        <p style="text-align: left;">👉 Don't forget to tag us @soulsnap.io.</p>
        
        <p style="text-align: left;">Snap ya next time!</p>
        
        <p style="text-align: left;">— Chroma Link Collective</p>
        
        <p style="text-align: left;"><a href="http://chromalink.co">chromalink.co</a></p>
      </div>
    `;

    // Prepare email message
    const msg: any = {
      to: email,
      from: process.env.SENDGRID_FROM_EMAIL || 'Hello@chromalink.co',
      subject: `Your Soul Snap is ready ✨`,
      text: `Looking good, ${fullName || 'there'}!

Thanks for stepping into the Soul Snap booth—we hope you had as much fun as we did revealing your soul.

👉 Don't forget to tag us @soulsnap.io.

Snap ya next time!

— Chroma Link Collective

chromalink.co`,
      html: htmlContent,
    };

    // Add image as attachment if available
    if (imageUrl && typeof imageUrl === 'string' && imageUrl.length > 0) {
      console.log(`Processing image for attachment, image URL length: ${imageUrl.length}`);
      console.log(`Image URL starts with: ${imageUrl.substring(0, 50)}...`);
      
      // Check if this is the orange fallback image
      const isOrangeFallback = imageUrl.includes('iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAIAAAD/gAIDAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAB3RJTUUH5gUGEwYAp9YceAAAAB1pVFh0Q29tbWVudAAAAAAAQ3JlYXRlZCB3aXRoIEdJTVBkLmUHAAABJklEQVR42u3csU0DQRRF0TGiAEQJFEAHlEALFEAJdEAJdEAHlIAoABEZEpvNJwrwzrxzdMXV1dPqaXfb7XZVaF0lwAILLLDAAgsssGCBBRZYYIEFFlhggQUWLLDAAgsssMACC6xr1qPPt9vtMAzjOO73+/f7/fl8mqbp8XjUWo/H43q9XpZlGIbdbpckx+Px9Xqdz+dxHC+Xy/P5/Oc6bfLjdrvtdrtpmtZ1TbLZbJIkyfV6TbKua5Isy7Isy/f/+XQ6JRnHMcm2bUnGcUxyOBx+XGdjh/V4PJKs65okrbUkpZTWWpJSyr8tSimttVJKrTVJrTVJrfXLOtv8HL/f70mez2eSUkqS+/2e5Ha7Jfl8Pkl+XGdjh/XPAgsssMACCyywYIEFFlhggQUWWGCBBdZ31idI9xT9qCNHwQAAAABJRU5ErkJggg==');
      if (isOrangeFallback) {
        console.log('Detected orange fallback image, using a more visible test image instead');
        // Use a bright red square instead of the orange fallback
        const redSquareImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAIAAAD/gAIDAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAB3RJTUUH5gUGEwYAp9YceAAAAB1pVFh0Q29tbWVudAAAAAAAQ3JlYXRlZCB3aXRoIEdJTVBkLmUHAAABJklEQVR42u3csU0DQRRF0TGiAEQJFEAHlEALFEAJdEAJdEAHlIAoABEZEpvNJwrwzrxzdMXV1dPqaXfb7XZVaF0lwAILLLDAAgsssGCBBRZYYIEFFlhggQUWLLDAAgsssMACC6xr1qPPt9vtMAzjOO73+/f7/fl8mqbp8XjUWo/H43q9XpZlGIbdbpckx+Px9Xqdz+dxHC+Xy/P5/Oc6bfLjdrvtdrtpmtZ1TbLZbJIkyfV6TbKua5Isy7Isy/f/+XQ6JRnHMcm2bUnGcUxyOBx+XGdjh/V4PJKs65okrbUkpZTWWpJSyr8tSimttVJKrTVJrTVJrfXLOtv8HL/f70mez2eSUkqS+/2e5Ha7Jfl8Pkl+XGdjh/XPAgsssMACCyywYIEFFlhggQUWWGCBBdZ31idI9xT9qCNHwQAAAABJRU5ErkJggg==';
        
        const matches = redSquareImage.match(/^data:([\w\/+]+);base64,(.+)$/);
        
        if (matches && matches.length === 3) {
          const contentType = matches[1];
          const base64Data = matches[2];
          
          msg.attachments = [
            {
              content: base64Data,
              filename: 'face-audit-image.jpg',
              type: contentType,
              disposition: 'attachment'
            }
          ];
          console.log('Image successfully prepared as attachment from red square test image');
          return NextResponse.json({ success: true });
        }
      }
      
      // For data URLs, we can directly use them
      if (imageUrl.startsWith('data:')) {
        console.log('Processing data URL format');
        const matches = imageUrl.match(/^data:([\w\/+]+);base64,(.+)$/);
        
        if (matches && matches.length === 3) {
          const contentType = matches[1];
          const base64Data = matches[2];
          
          msg.attachments = [
            {
              content: base64Data,
              filename: 'face-audit-image.jpg',
              type: contentType,
              disposition: 'attachment'
            }
          ];
          console.log('Image successfully prepared as attachment from data URL');
        } else {
          console.error('Failed to parse data URL format');
        }
      } 
      // For HTTP URLs, we need to fetch them
      else if (imageUrl.startsWith('http')) {
        console.log('Processing HTTP URL format');
        const imageData = await urlToBase64(imageUrl);
        
        if (imageData) {
          msg.attachments = [
            {
              content: imageData.base64,
              filename: 'face-audit-image.jpg',
              type: imageData.contentType,
              disposition: 'attachment'
            }
          ];
          console.log('Image successfully prepared as attachment from HTTP URL');
        } else {
          console.error('Failed to process HTTP URL for attachment');
          throw new Error('Failed to fetch image from URL');
        }
      }
      // Use fallback image for any other format
      else {
        console.error('Unrecognized image URL format:', imageUrl.substring(0, 30));
        // Use fallback image
        const fallbackImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAYAAABw4pVUAAABhGlDQ1BJQ0MgcHJvZmlsZQAAKJF9kT1Iw0AcxV9TpSIVBzuIOGSoThZERRy1CkWoEGqFVh1MbvqhNGlIUlwcBdeCgx+LVQcXZ10dXAVB8APE0clJ0UVK/F9SaBHjwXE/3t173L0DhGaVqWbPOKBqlpFOxMVcflUMvCKIEEIQQUhipp7MLGbhOb7u4ePrXZRneZ/7cwwoBZMBPpF4jumGRbxBPLNp6Zz3iSOsJCnE58QTBl2Q+JHrsstvnEsOCzwzYmbS88QRYrHUxXIXs7KhEk8RRxVVo3wh57LCeYuzWq2z9j35C0MFfWWZ6zRHkMASkkhBhIw6KqjCQox2jRQTaTqPe/iHHX+KXDK5KmDkWEANKiTHD/4Hv7s1i1NTblIwDgRebPtjDAjsAs2abX8f23bjBAg8A1da219tAjOfpDe6WvQIGNgGLq67mrwHXO4AkSddMiRH8tMUCgXg/Yy+KQcM3wL9a25vnX2cPgBZ6mr5Bjg4BMaKlL3u8e6+7t7+PdPu7wdDnnKwUItd+QAAAAlwSFlzAAAuIwAALiMBeKU/dgAAAAd0SU1FB+UGBQwTLDKQUFUAAAAZdEVYdENvbW1lbnQAQ3JlYXRlZCB3aXRoIEdJTVBXgQ4XAAAAFElEQVR42u3BAQEAAACCIP+vbkhAAQAA8GLjRAABjd8FkQAAAABJRU5ErkJggg==';
        
        const matches = fallbackImage.match(/^data:([\w\/+]+);base64,(.+)$/);
        
        if (matches && matches.length === 3) {
          const contentType = matches[1];
          const base64Data = matches[2];
          
          msg.attachments = [
            {
              content: base64Data,
              filename: 'face-audit-image.jpg',
              type: contentType,
              disposition: 'attachment'
            }
          ];
          console.log('Image successfully prepared as attachment from fallback image');
        } else {
          console.error('Failed to parse fallback image format');
        }
      }
    } else {
      console.log('No valid image URL provided for attachment');
    }

    console.log('Attempting to send email to:', email);
    console.log('From email:', process.env.SENDGRID_FROM_EMAIL || 'Hello@chromalink.co');
    
    await sgMail.send(msg);
    console.log('Email sent successfully');

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('SendGrid error details:', error?.response?.body || error);
    
    // Return more detailed error information
    return NextResponse.json(
      { 
        error: 'Failed to send email', 
        details: error?.response?.body?.errors || error?.message || 'Unknown error' 
      },
      { status: 500 }
    );
  }
}
