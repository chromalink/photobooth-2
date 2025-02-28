'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSessionStore } from '@/store/session'
import { generateSpiritualReading } from '@/utils/openai'
import OrbAnimation from '../components/OrbAnimation'

// Mutex locks
let isPolling = false;
let isProcessingPhoto = false;

export default function Orb2() {
  const router = useRouter()
  const [error, setError] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [hasStartedProcessing, setHasStartedProcessing] = useState(false)
  const [visualProgress, setVisualProgress] = useState(0)
  const processStartedRef = useRef(false)
  const [displaySections, setDisplaySections] = useState<{[key: string]: string}>({})
  const { uploadedPhotoUrl, setAiResponse, setAiModelImage, setAiName } = useSessionStore()

  const extractDisplaySections = (text: string) => {
    if (!text) return {};
    
    const sections = {
      'Facial Expression': '',
      'Body Language': '',
      'Clothing': '',
      'Hair Style': ''
    };

    Object.keys(sections).forEach(section => {
      const regex = new RegExp(`${section}:([^\\n.!?]*[.!?])`);
      const match = text.match(regex);
      if (match && match[1]) {
        sections[section] = match[1].trim();
      }
    });

    console.log('Extracted sections:', sections); // Debug log
    return sections;
  };

  useEffect(() => {
    let currentIndex = 0;
    
    const interval = setInterval(() => {
      currentIndex = (currentIndex + 1) % 100;
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setVisualProgress(prev => prev < 99 ? prev + 1 : prev)
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    console.log('Resetting processing state...')
    setIsProcessing(false)
    setHasStartedProcessing(false)
    return () => {
      processStartedRef.current = false
    }
  }, [setIsProcessing, setHasStartedProcessing]) 

  const handlePhotoCapture = useCallback(async () => {
    if (!uploadedPhotoUrl || isProcessingPhoto) {
      console.log('Skipping photo capture - no photo or already processing');
      return;
    }
    
    try {
      isProcessingPhoto = true;
      
      // Reset states
      setVisualProgress(0);
      setIsProcessing(true);
      setHasStartedProcessing(true);
      setError('');
      setDisplaySections({});
      
      console.log('Starting AI processes...');
      
      // Add timestamp to prevent duplicate requests
      const requestHash = Date.now().toString();
      
      // Try to get reading with retries
      let readingData = null;
      let readingAttempts = 0;
      const MAX_READING_ATTEMPTS = 5;
      
      while (readingAttempts < MAX_READING_ATTEMPTS) {
        const generateReadingResponse = await fetch('/api/generate-reading', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            image: uploadedPhotoUrl.split(',')[1],
            hash: requestHash
          })
        });

        if (generateReadingResponse.status === 429) {
          console.log('Server busy, retrying in 2 seconds...');
          await new Promise(resolve => setTimeout(resolve, 2000));
          readingAttempts++;
          continue;
        }

        if (!generateReadingResponse.ok) {
          const errorText = await generateReadingResponse.text();
          console.error('Generate reading API error:', errorText);
          throw new Error('Failed to generate reading: ' + errorText);
        }

        readingData = await generateReadingResponse.json();
        console.log('Received reading data:', readingData); // Debug log
        
        // Extract and store the display sections from the description
        if (readingData.description) {
          console.log('Processing description:', readingData.description); // Debug log
          const sections = extractDisplaySections(readingData.description);
          setDisplaySections(sections);
        } else {
          console.log('No description in reading data'); // Debug log
        }

        if (!readingData.category || !readingData.name || !readingData.reading) {
          if (readingData.error === 'Processing') {
            console.log('Still processing, retrying in 2 seconds...');
            await new Promise(resolve => setTimeout(resolve, 2000));
            readingAttempts++;
            continue;
          }
          console.error('Invalid generate reading response:', readingData);
          throw new Error('Invalid reading response');
        }

        break;
      }

      if (!readingData) {
        throw new Error('Failed to get reading after multiple attempts');
      }

      // Store name and reading
      setAiName(readingData.name);
      setAiResponse(readingData.reading);

      // Add small delay before ComfyUI request to prevent race conditions
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Now send to ComfyUI with the category
      const comfyResponse = await fetch('/api/comfyui', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-oracle-category': readingData.category
        },
        body: JSON.stringify({
          image: uploadedPhotoUrl.split(',')[1],
          hash: requestHash
        })
      });

      if (!comfyResponse.ok) {
        const errorText = await comfyResponse.text();
        console.error('ComfyUI API error:', errorText);
        throw new Error('Failed to generate image: ' + errorText);
      }

      const imageResponse = await comfyResponse.json();
      console.log('Got responses:', { readingData, imageResponse });

      // Check if we got a promptId for polling
      if (!imageResponse?.upscaledResult?.promptId) {
        console.error('Invalid ComfyUI response:', imageResponse);
        throw new Error('No promptId received from ComfyUI');
      }

      // Check if polling is already in progress
      if (isPolling) {
        console.log('Polling already in progress, skipping...');
        return;
      }

      try {
        isPolling = true;

        // Start polling for the image
        const POLL_INTERVAL = 2000;
        const MAX_POLL_ATTEMPTS = 60;
        let pollAttempts = 0;
        let lastImageUrl = '';
        
        while (pollAttempts < MAX_POLL_ATTEMPTS) {
          console.log(`Polling attempt ${pollAttempts + 1}/${MAX_POLL_ATTEMPTS}...`);
          
          const statusResponse = await fetch(`/api/comfyui-status?promptId=${imageResponse.upscaledResult.promptId}`);
          if (!statusResponse.ok) {
            throw new Error('Failed to check image status');
          }
          
          const statusData = await statusResponse.json();
          console.log('Status response:', statusData);
          
          if (statusData.upscaledResult.completed && statusData.upscaledResult.imageUrl) {
            // Check if this is a new image
            if (statusData.upscaledResult.imageUrl !== lastImageUrl) {
              console.log('Image generation completed:', statusData.upscaledResult.imageUrl);
              setAiModelImage(statusData.upscaledResult.imageUrl);
              setVisualProgress(100);
              router.push('/page6-results');
              break;
            }
          }
          
          if (pollAttempts === MAX_POLL_ATTEMPTS - 1) {
            throw new Error('Image generation timed out');
          }
          
          // Update last seen image URL
          lastImageUrl = statusData.upscaledResult.imageUrl || lastImageUrl;
          
          await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL));
          pollAttempts++;
        }
      } finally {
        // Always release the polling lock
        isPolling = false;
      }
    } catch (error) {
      console.error('Error in processing:', error);
      setError(error instanceof Error ? error.message : 'An unknown error occurred');
      setIsProcessing(false);
    } finally {
      // Always release the processing lock
      isProcessingPhoto = false;
    }
  }, [uploadedPhotoUrl, router]);

  useEffect(() => {
    if (!uploadedPhotoUrl || processStartedRef.current) return;
    processStartedRef.current = true;
    handlePhotoCapture();
  }, [uploadedPhotoUrl, handlePhotoCapture]);

  return (
    <div className="main">
      {/* Background Image */}
      <div className="background-container">
        <div className="background-image" />
      </div>

      {/* Display Sections and Photo */}
      <div className="content-container">
        <div className="photo-container">
          {uploadedPhotoUrl && (
            <div className="photo-box">
              <img 
                src={uploadedPhotoUrl} 
                alt="Captured photo" 
                className="captured-photo"
              />
            </div>
          )}
        </div>
        {Object.keys(displaySections).length > 0 && (
          <div className="description-container">
            <div className="description-box">
              <div className="description-content">
                {Object.entries(displaySections).map(([section, text]) => (
                  text && (
                    <div key={section} className="section">
                      <span className="section-title">{section}:</span>
                      <span className="section-text">{text}</span>
                    </div>
                  )
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Centered Progress Counter */}
      <div className="progress-container">
        <div className="progress-inner">
          <motion.div 
            className="progress-box"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ 
              duration: 0.5,
              ease: "easeOut"
            }}
          >
            <p className="progress-text">{visualProgress}%</p>
          </motion.div>
        </div>
      </div>

      <style jsx>{`
        .main {
          position: relative;
          width: 100vw;
          height: 100vh;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
        }

        .background-container {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          z-index: -1;
        }

        .background-image {
          width: 100%;
          height: 100%;
          background-image: url('/grid_2.jpg');
          background-size: cover;
          background-position: center;
          background-repeat: no-repeat;
        }

        .content-container {
          position: absolute;
          top: 10%;
          left: 50%;
          transform: translateX(-50%);
          z-index: 10;
          width: 90%;
          max-width: 1200px;
          display: flex;
          gap: 2rem;
          align-items: flex-start;
        }

        .photo-container {
          flex: 1;
          max-width: 400px;
        }

        .photo-box {
          background: rgba(0, 0, 0, 0.7);
          border: 2px solid rgba(255, 255, 255, 0.15);
          border-radius: 16px;
          padding: 1rem;
          backdrop-filter: blur(10px);
        }

        .captured-photo {
          width: 100%;
          height: auto;
          border-radius: 8px;
          display: block;
        }

        .description-container {
          flex: 2;
          max-width: 800px;
        }

        .description-box {
          background: rgba(0, 0, 0, 0.7);
          border: 2px solid rgba(255, 255, 255, 0.15);
          border-radius: 16px;
          padding: 2rem;
          backdrop-filter: blur(10px);
        }

        .description-content {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .section {
          color: white;
          font-family: var(--font-arapey);
          font-size: clamp(1rem, 2vw, 1.2rem);
          line-height: 1.6;
        }

        .section-title {
          color: #FFD700;
          font-weight: 600;
          margin-right: 0.5rem;
        }

        .section-text {
          text-shadow: 0 0 10px rgba(255, 255, 255, 0.3);
        }

        .progress-container {
          position: relative;
          width: 100%;
          height: 100%;
          display: flex;
          justify-content: center;
          align-items: center;
        }

        .progress-inner {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          transform: scale(0.6);
        }

        @media screen and (max-width: 1024px) {
          .content-container {
            flex-direction: column;
            align-items: center;
            gap: 1rem;
          }

          .photo-container {
            width: 100%;
            max-width: 300px;
          }

          .description-container {
            width: 100%;
          }
        }

        @media screen and (max-width: 768px) {
          .content-container {
            top: 5%;
          }

          .photo-container {
            max-width: 250px;
          }

          .progress-inner {
            transform: scale(0.55);
            margin-top: -18vh;
          }
        }

        @media screen and (max-width: 480px) {
          .content-container {
            top: 5%;
          }

          .photo-container {
            max-width: 200px;
          }

          .description-box {
            padding: 1.5rem;
          }
        }

        /* 4K and larger screens */
        @media screen and (min-width: 2560px) {
          .progress-inner {
            transform: scale(0.7);
            margin-top: -22vh;
          }
        }

        .progress-box {
          background: rgba(0, 0, 0, 0.7);
          border: 2px solid rgba(255, 255, 255, 0.15);
          border-radius: clamp(16px, 2vw, 24px);
          padding: clamp(1.5rem, 3vw, 2.5rem);
          box-shadow: 0 0 30px rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          width: clamp(140px, 25vw, 240px);
          height: clamp(140px, 25vw, 240px);
          display: grid;
          place-items: center;
        }

        .progress-text {
          font-family: var(--font-aboreto);
          font-size: clamp(2.5rem, 8vw, 4rem);
          color: white;
          font-weight: 400;
          letter-spacing: 0.05em;
          line-height: 1;
          text-align: center;
          margin: 0;
          padding: 0;
          text-shadow: 0 0 20px rgba(255, 255, 255, 0.5),
                      0 0 40px rgba(255, 255, 255, 0.3),
                      0 0 60px rgba(255, 255, 255, 0.2);
        }
      `}</style>
    </div>
  )
}
