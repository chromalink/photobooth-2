'use client'

import { useSessionStore } from '@/store/session'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import Image from 'next/image'
import { DEFAULT_AI_PROVIDER } from '@/config/ai-route-config'

export default function EmailPage() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState('')
  const setUserEmail = useSessionStore((state) => state.setUserEmail)
  const setUserName = useSessionStore((state) => state.setUserName)
  const aiResponse = useSessionStore((state) => state.aiResponse)
  const aiModelImage = useSessionStore((state) => state.aiModelImage)
  const resetSession = useSessionStore((state) => state.resetSession)
  const setAiModelProvider = useSessionStore((state) => state.setAiModelProvider)
  const router = useRouter()

  // Add a small fallback test image as base64 string - a simple orange square matching the app's color scheme
  const FALLBACK_IMAGE = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAYAAABw4pVUAAABhGlDQ1BJQ0MgcHJvZmlsZQAAKJF9kT1Iw0AcxV9TpSIVBzuIOGSoThZERRy1CkWoEGqFVh1MbvqhNGlIUlwcBdeCgx+LVQcXZ10dXAVB8APE0clJ0UVK/F9SaBHjwXE/3t173L0DhGaVqWbPOKBqlpFOxMVcflUMvCKIEEIQQUhipp7MLGbhOb7u4ePrXZRneZ/7cwwoBZMBPpF4jumGRbxBPLNp6Zz3iSOsJCnE58QTBl2Q+JHrsstvnEsOCzwzYmbS88QRYrHUxXIXs7KhEk8RRxVVo3wh57LCeYuzWq2z9j35C0MFfWWZ6zRHkMASkkhBhIw6KqjCQox2jRQTaTqPe/iHHX+KXDK5KmDkWEANKiTHD/4Hv7s1i1NTblIwDgRebPtjDAjsAs2abX8f23bjBAg8A1da219tAjOfpDe6WvQIGNgGLq67mrwHXO4AkSddMiRH8tMUCgXg/Yy+KQcM3wL9a25vnX2cPgBZ6mr5Bjg4BMaKlL3u8e6+7t7+PdPu7wdDnnKwUItd+QAAAAlwSFlzAAAuIwAALiMBeKU/dgAAAAd0SU1FB+UGBQwTLDKQUFUAAAAZdEVYdENvbW1lbnQAQ3JlYXRlZCB3aXRoIEdJTVBXgQ4XAAAAFElEQVR42u3BAQEAAACCIP+vbkhAAQAA8GLjRAABjd8FkQAAAABJRU5ErkJggg==';

  const handleSubmit = async () => {
    if (!fullName.trim() || !email.trim()) {
      setError('Please fill in both name and email');
      return;
    }

    setIsSending(true);
    setError('');

    try {
      // Debug: Log all possible image sources
      console.log('DEBUG - Available image sources:', {
        aiModelImage: aiModelImage ? `Present (${aiModelImage.length} chars)` : 'Not present',
        comfyUIImage: useSessionStore.getState().comfyUIImage ? `Present (${useSessionStore.getState().comfyUIImage?.length || 0} chars)` : 'Not present',
        processedImageUrl: useSessionStore.getState().processedImageUrl ? `Present (${useSessionStore.getState().processedImageUrl?.length || 0} chars)` : 'Not present',
        uploadedPhotoUrl: useSessionStore.getState().uploadedPhotoUrl ? `Present (${useSessionStore.getState().uploadedPhotoUrl?.length || 0} chars)` : 'Not present',
        capturedPhoto: useSessionStore.getState().capturedPhoto ? `Present (${useSessionStore.getState().capturedPhoto?.length || 0} chars)` : 'Not present',
      });

      // Get all possible image sources from the session store
      let imageUrl = aiModelImage || 
                   useSessionStore.getState().comfyUIImage || 
                   useSessionStore.getState().processedImageUrl || 
                   useSessionStore.getState().uploadedPhotoUrl || 
                   useSessionStore.getState().capturedPhoto;
      
      // Debug: Log the selected image URL before processing
      if (imageUrl) {
        console.log('DEBUG - Selected image URL type:', {
          isDataUrl: imageUrl.startsWith('data:'),
          isHttpUrl: imageUrl.startsWith('http'),
          isRelativeUrl: imageUrl.startsWith('/'),
          urlStart: imageUrl.substring(0, 50) + '...'
        });
      } else {
        console.log('DEBUG - No image URL found, will use fallback');
        imageUrl = FALLBACK_IMAGE;
      }
      
      // If the URL is a comfyui-image proxy URL, extract the actual image URL
      if (imageUrl && imageUrl.includes('/api/comfyui-image') && imageUrl.includes('url=')) {
        try {
          // Extract the actual image URL from the query parameter
          const urlMatch = imageUrl.match(/url=([^&]+)/);
          if (urlMatch && urlMatch[1]) {
            const extractedUrl = decodeURIComponent(urlMatch[1]);
            console.log('DEBUG - Extracted actual image URL from proxy:', extractedUrl.substring(0, 50) + '...');
            imageUrl = extractedUrl;
          }
        } catch (err) {
          console.error('Error extracting URL from proxy:', err);
        }
      }
      
      // Ensure the URL is absolute if it's a relative URL
      if (imageUrl && imageUrl.startsWith('/') && typeof window !== 'undefined') {
        imageUrl = `${window.location.origin}${imageUrl}`;
        console.log('DEBUG - Converted relative URL to absolute URL:', imageUrl.substring(0, 50) + '...');
      }
      
      // Log a safe version of the data (don't log the full image URL)
      console.log('Submitting email request with:', {
        fullName,
        email,
        aiResponse: aiResponse ? `AI response (${aiResponse.length} chars)` : 'No reading available',
        imageUrlLength: imageUrl?.length || 0,
        imageUrlStart: imageUrl ? `${imageUrl.substring(0, 30)}...` : 'No image URL',
        isUsingFallback: imageUrl === FALLBACK_IMAGE
      });

      // Send email
      const emailResponse = await fetch('/api/email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fullName,
          email,
          aiResponse: aiResponse || 'No reading available',
          imageUrl: imageUrl, // Send the actual image URL, not the log message
        }),
      });

      if (!emailResponse.ok) {
        const errorData = await emailResponse.json();
        console.error('Email API error:', errorData);
        throw new Error(errorData.error || 'Failed to send email');
      }
      
      // Save user data to Google Sheets
      try {
        console.log('Saving user data to Google Sheets...');
        const sheetsResponse = await fetch('/api/save-to-sheets', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            fullName,
            email
          }),
        });
        
        if (!sheetsResponse.ok) {
          // Log the error but don't throw - we don't want to block the user experience
          // if Google Sheets saving fails
          const errorData = await sheetsResponse.json();
          console.error('Google Sheets API error:', errorData);
        } else {
          console.log('Successfully saved user data to Google Sheets');
        }
      } catch (sheetsError) {
        // Log the error but continue with the flow
        console.error('Error saving to Google Sheets:', sheetsError);
      }

      setUserEmail(email);
      setUserName(fullName);
      
      resetSession();
      setAiModelProvider(DEFAULT_AI_PROVIDER);
      
      router.push('/community-grid');
    } catch (err) {
      console.error('Error sending email:', err);
      setError('Failed to send email. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <main className="main">
      <div className="background" />
      
      {/* Branding info container */}
      <div className="branding-info">
        {/* Logo and social media text centered */}
        <div className="branding-content">
          {/* Logo */}
          <div className="logo-container">
            <Image 
              src="/SoulSnap_Logo_LIGHT_Yellow.png" 
              alt="SoulSnap Logo" 
              width={150} 
              height={60} 
              priority
            />
          </div>
          
          {/* Social media text */}
          <div className="social-container">
            <div className="social-text">
              <p className="follow-text">DEVELOPED BY</p>
              <p className="handle-text">@CHROMALINK.CO</p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="container">
        <div className="content-wrapper">
          <h1>FACE AUDIT™</h1>
          
          <div className="form">
            <div className="input-group">
              <input
                type="text"
                placeholder="Saida Saetgar"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
              <input
                type="email"
                placeholder="saesd1694@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              {error && <div className="error">{error}</div>}
            </div>
            <div className="button-group">
              <button 
                onClick={handleSubmit}
                className="primary-button"
                disabled={isSending}
                aria-label="Send email"
              >
                {isSending ? 'SENDING...' : 'SEND TO EMAIL'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .main {
          width: 100vw;
          height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: black;
          position: relative;
          overflow: hidden;
          margin-top: 0; /* Remove the margin that was causing the cutoff */
        }

        .background {
          position: absolute;
          inset: 0;
          background-image: url('/grid_2.jpg');
          background-position: center;
          background-size: cover;
          opacity: 0.8;
        }

        .container {
          width: 90%;
          max-width: 460px;
          position: relative;
          z-index: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          transform-origin: center;
          transition: transform 0.3s ease;
          transform: scale(1.56); /* Make container 56% bigger (1.3 × 1.2 = 1.56) */
        }

        .content-wrapper {
          width: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 3.5rem;
        }

        h1 {
          font-family: var(--font-michroma);
          font-size: clamp(2.7rem, 4.5vw, 2.52rem);
          font-weight: 400;
          letter-spacing: 0.05em;
          line-height: 1.1em;
          color: #FFB048;
          text-shadow: 0 0 8px rgba(255, 165, 0, 0.4), 0 0 16px rgba(255, 140, 0, 0.3), 0 0 24px rgba(255, 120, 0, 0.2);
          text-align: center;
          margin: 0;
          padding: 0;
        }

        .form {
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: 2.5rem;
        }

        .input-group {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
          width: 100%;
        }

        .button-group {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
          width: 100%;
        }

        input {
          width: 100%;
          background: rgba(0, 0, 0, 0.3);
          border: 2px solid rgba(255, 231, 200, 0.3);
          border-radius: 25px;
          padding: min(max(0.8rem, 1.5vh), 1.2rem) min(max(2rem, 4vw), 3.5rem);
          color: rgba(255, 231, 200, 0.7);
          font-family: var(--font-b612-mono);
          font-size: min(max(0.9rem, 1.5vw), 1.1rem);
          text-align: center;
          letter-spacing: 0.05em;
          transition: all 0.3s ease;
          backdrop-filter: blur(5px);
          height: auto;
        }

        input::placeholder {
          color: rgba(255, 231, 200, 0.4);
          font-family: var(--font-b612-mono);
          font-size: min(max(0.9rem, 1.5vw), 1.1rem);
          letter-spacing: 0.05em;
        }

        input:focus {
          outline: none;
          border-color: rgba(255, 231, 200, 0.6);
          background: rgba(0, 0, 0, 0.4);
        }

        .error {
          color: #ff6b6b;
          font-size: min(max(0.8rem, 1.2vw), 0.9rem);
          text-align: center;
          margin-top: 0.5rem;
          letter-spacing: 0.05em;
        }

        .primary-button, .secondary-button {
          width: 100%;
          background: transparent;
          border: 2px solid #FFE7C8;
          color: #FFE7C8;
          font-family: var(--font-b612-mono);
          font-size: clamp(1.5rem, 1.5vw, 1.2rem);
          font-weight: 400;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          padding: 1.2rem 3.5rem;
          border-radius: 25px;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 
            0 0 5px rgba(255, 231, 200, 0.5),
            0 0 10px rgba(255, 231, 200, 0.3),
            0 0 15px rgba(255, 231, 200, 0.2);
        }

        .primary-button:hover, .secondary-button:hover {
          background: rgba(255, 231, 200, 0.1);
          box-shadow: 
            0 0 10px rgba(255, 231, 200, 0.6),
            0 0 20px rgba(255, 231, 200, 0.4),
            0 0 30px rgba(255, 231, 200, 0.2);
        }

        .primary-button:active, .secondary-button:active {
          transform: scale(0.98);
        }

        .primary-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        
        /* Branding info styles */
        .branding-info {
          position: absolute;
          top: 50px;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          justify-content: center;
          align-items: center;
          width: 90%;
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 30px;
          z-index: 10;
        }
        
        .branding-content {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 20px;
          width: 100%;
        }
        
        .logo-container {
          display: flex;
          align-items: center;
        }
        
        .social-container {
          display: flex;
          align-items: center;
        }
        
        .social-text {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
        }
        
        .follow-text {
          font-size: 1rem;
          font-family: var(--font-michroma);
          font-weight: 400;
          font-style: normal;
          letter-spacing: 0.05em;
          line-height: 1.5;
          color: #FFE7C8;
          margin: 0;
          padding: 0;
        }
        
        .handle-text {
          font-size: 1rem;
          font-family: var(--font-michroma);
          font-weight: 400;
          font-style: normal;
          letter-spacing: 0.05em;
          line-height: 1.5;
          color: #FFE7C8;
          margin: 0;
          padding: 0;
        }

        @media (max-width: 480px) {
          .container {
            width: 95%;
            max-width: 100%;
            gap: 2rem;
          }
          
          h1 {
            font-size: min(max(2rem, 8vw), 2.5rem);
          }
          
          .form {
            gap: 1.5rem;
          }
          
          .input-group,
          .button-group {
            gap: 1rem;
          }
          
          input {
            font-size: min(max(0.8rem, 3.5vw), 1rem);
            padding: min(max(0.7rem, 1.2vh), 1rem) min(max(1.8rem, 3.5vw), 2.5rem);
            border-radius: 15px; /* Less rounded corners for smaller screens */
          }

          input::placeholder {
            font-size: min(max(0.8rem, 3.5vw), 1rem);
          }
          
          .primary-button {
            font-size: min(max(0.8rem, 3.5vw), 1rem);
            padding: min(max(0.7rem, 1.2vh), 1rem) min(max(1.8rem, 3.5vw), 2.5rem);
            border-radius: 15px; /* Less rounded corners for smaller screens */
          }
        }

        @media (min-width: 481px) and (max-width: 768px) {
          input, .primary-button {
            border-radius: 18px; /* Slightly less rounded corners for tablet */
          }
        }

        /* iPad Air specific styling */
        @media (min-width: 768px) and (max-width: 834px) and (min-height: 1080px) {
          .container {
            transform: scale(1.25); /* 20% smaller than the original 1.56 scale */
            transform-origin: center center;
          }
        }

        /* iPad Mini specific styling */
        @media (min-width: 744px) and (max-width: 768px) and (min-height: 1024px) {
          .container {
            transform: scale(1.25); /* 20% smaller than the original 1.56 scale */
            transform-origin: center center;
          }
        }

        @media (min-width: 769px) {
          input, .primary-button {
            border-radius: 25px; /* Original border-radius for desktop */
          }
        }
      `}</style>
    </main>
  )
}
