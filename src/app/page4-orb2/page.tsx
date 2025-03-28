'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSessionStore } from '@/store/session'
import { generateSpiritualReading } from '@/utils/openai'
import OrbAnimation from '../components/OrbAnimation'
import { B612_Mono } from 'next/font/google'

// Load B612 Mono font
const b612Mono = B612_Mono({
  weight: ['400', '700'],
  subsets: ['latin'],
  display: 'swap',
})

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
  const { uploadedPhotoUrl, setAiResponse, setAiModelImage, setAiName, setAiModelProvider } = useSessionStore()

  const extractDisplaySections = (text: string) => {
    if (!text) return {};
    
    console.log('Raw text to extract from:', text);
    
    const sections = {
      'Facial Expression': '',
      'Body Language': '',
      'Clothing': '',
      'Hair Style': ''
    };

    // Map of alternative section names
    const alternativeSectionNames: Record<string, string[]> = {};

    // Extract each section
    Object.keys(sections).forEach(sectionName => {
      // Try the exact section name first
      let sectionContent = extractSection(text, sectionName);
      
      // If not found, try alternative names
      if (!sectionContent && alternativeSectionNames[sectionName]) {
        for (const altName of alternativeSectionNames[sectionName]) {
          sectionContent = extractSection(text, altName);
          if (sectionContent) {
            console.log(`Found section with alt name: ${altName}`);
            break;
          }
        }
      }
      
      // Store the content if found
      if (sectionContent) {
        sections[sectionName as keyof typeof sections] = sectionContent;
        console.log(`Found section: ${sectionName} with content: ${sectionContent}`);
      } else {
        console.log(`Section not found: ${sectionName}`);
      }
    });
    
    console.log('Extracted sections:', sections);
    return sections;
  };

  // Helper function to extract a section from the text
  const extractSection = (text: string, sectionName: string): string | null => {
    // Try with both "**Name**:" and "**Name:**" formats
    const patterns = [
      new RegExp(`\\*\\*${sectionName}\\*\\*:\\s*(.+?)(?=\\n\\n|\\n\\*\\*|$)`, 's'),
      new RegExp(`\\*\\*${sectionName}:\\*\\*\\s*(.+?)(?=\\n\\n|\\n\\*\\*|$)`, 's'),
      // New pattern for plain text format with section name followed by colon
      new RegExp(`${sectionName}:\\s*(.+?)(?=\\n\\n[A-Za-z][A-Za-z\\s]+:|$)`, 's')
    ];
    
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }
    
    return null;
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

  useEffect(() => {
    const testSections = {
      'Facial Expression': 'Analyzing...',
      'Body Language': 'Analyzing...',
      'Clothing': 'Analyzing...',
      'Hair Style': 'Analyzing...'
    };
    
    console.log('Setting initial test sections:', testSections);
    setDisplaySections(testSections);
    setIsProcessing(true);
    setVisualProgress(75); // Set to 75% complete
    
    const testText = `I don't know who this is, but let's dive into the corporate crystal ball:

**Facial Expression**: Expressionless with a hint of existential dread, like an unenthusiastic participant in a team-building exercise.

**Body Language**: Slightly slouched, the posture of someone who's just learned they have another meeting.

**Clothing**: Dark, understated top; the fabric of choice for those navigating the shadows of office life.

**Hair Style**: Long, slightly unkempt, like a rebellious spirit caught in the corporate machine.`;

    const extractedSections = extractDisplaySections(testText);
    console.log('Test extraction result:', extractedSections);
    
  }, []);

  const handlePhotoCapture = useCallback(async () => {
    if (!uploadedPhotoUrl || isProcessingPhoto) {
      console.log('Skipping photo capture - no photo or already processing');
      return;
    }
    
    try {
      isProcessingPhoto = true;
      
      setVisualProgress(0);
      setIsProcessing(true);
      setHasStartedProcessing(true);
      setError(''); // Clear any previous error
      setDisplaySections({});
      
      console.log('Starting AI processes...');
      
      const requestHash = Date.now().toString();
      
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
        
        if (readingData.description) {
          console.log('Processing description:', readingData.description); // Debug log
          const sections = extractDisplaySections(readingData.description);
          
          if (Object.values(sections).some(value => value)) {
            setDisplaySections(sections);
          } else {
            console.log('No sections extracted, using fallback data');
            setDisplaySections({
              'Facial Expression': 'Analyzing...',
              'Body Language': 'Analyzing...',
              'Clothing': 'Analyzing...',
              'Hair Style': 'Analyzing...'
            });
          }
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

      setAiName(readingData.name);
      setAiResponse(readingData.reading);
      setAiModelProvider(readingData.category);

      await new Promise(resolve => setTimeout(resolve, 1000));

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

      if (!imageResponse?.upscaledResult?.promptId) {
        console.error('Invalid ComfyUI response:', imageResponse);
        throw new Error('No promptId received from ComfyUI');
      }

      if (isPolling) {
        console.log('Polling already in progress, skipping...');
        return;
      }

      try {
        isPolling = true;

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
          
          lastImageUrl = statusData.upscaledResult.imageUrl || lastImageUrl;
          
          await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL));
          pollAttempts++;
        }
      } finally {
        isPolling = false;
      }
    } catch (error) {
      console.error('Error in processing:', error);
      setError(error instanceof Error ? error.message : 'An unknown error occurred');
      // Don't set isProcessing to false to keep the UI showing the analysis
    } finally {
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
      <div className="background-container">
        <div className="background-image" />
      </div>

      {/* Title */}
      <div className="title-container">
        <h1 className="page-title">Conducting a Q4 audit<br />of your facial ROI……</h1>
      </div>

      {/* Display Sections and Photo */}
      <div className="content-container">
        <div className="media-section">
          <div className="media-grid">
            {uploadedPhotoUrl && (
              <div className="photo-box">
                <img 
                  src={uploadedPhotoUrl} 
                  alt="Captured photo" 
                  className="captured-photo"
                />
              </div>
            )}
            <div className="scan-box">
              <div className="scan-box-content">
                <div className="scan-title">
                  <p className="scan-progress">{visualProgress}%</p>
                </div>
                <video 
                  className="face-scan-video" 
                  autoPlay 
                  loop 
                  muted
                >
                  <source src="/face_scan.mp4" type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
              </div>
            </div>
          </div>
        </div>

        <div className="description-container">
          <div className="description-box">
            <div className="description-content">
              <div className="section-header">
                <h2 className={`machine-title ${b612Mono.className}`}>MACHINE OBSERVES...</h2>
              </div>
              {Object.keys(displaySections).length > 0 ? (
                Object.entries(displaySections).map(([section, text]) => (
                  <div key={section} className="section">
                    <div className={`section-label ${b612Mono.className}`}>{section}</div>
                    <div className="section-text-container">
                      <p className={`section-text ${b612Mono.className}`}>{text}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="section">
                  <div className={`section-label ${b612Mono.className}`}>ANALYZING</div>
                  <div className="section-text-container">
                    <p className={`section-text ${b612Mono.className}`}>Processing your corporate persona...</p>
                  </div>
                </div>
              )}
            </div>
          </div>
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

        .title-container {
          position: absolute;
          top: 5%;
          left: 50%;
          transform: translateX(-50%);
          z-index: 10;
          text-align: center;
          width: 100%;
          max-width: 1200px;
          padding: 0 20px;
          margin-bottom: 1.5rem; /* Reduced from 3rem */
          min-height: 50px; /* Reduced from 100px */
        }

        .page-title {
          font-family: var(--font-michroma);
          font-size: clamp(1.5rem, 3vw, 2.5rem);
          color: #F0A500;
          font-weight: 400;
          letter-spacing: 0.05em;
          line-height: 1.3;
          text-align: center;
          margin: 0;
          padding: 0;
          text-shadow: 0 0 20px rgba(240, 165, 0, 0.5),
                      0 0 40px rgba(240, 165, 0, 0.3),
                      0 0 60px rgba(240, 165, 0, 0.2);
          white-space: normal;
          display: inline-block;
        }

        /* Responsive styles for different device sizes */
        @media (max-width: 480px) {
          /* Mobile phones */
          .page-title {
            font-size: clamp(1.2rem, 5vw, 1.8rem);
            color: #F0A500;
          }
        }

        @media (min-width: 481px) and (max-width: 767px) {
          /* Large phones and small tablets */
          .page-title {
            font-size: clamp(1.5rem, 5vw, 2rem);
            color: #F0A500;
          }
        }

        @media (min-width: 768px) and (max-width: 1024px) {
          /* Tablets and small laptops */
          .title-container {
            max-width: 1400px;
          }
          
          .page-title {
            font-size: clamp(2rem, 4vw, 2.5rem);
            color: #F0A500;
          }
        }

        @media (min-width: 1025px) {
          /* Desktops and large screens */
          .page-title {
            font-size: clamp(2.2rem, 3vw, 2.5rem);
            color: #F0A500;
          }
        }

        .title {
          font-family: var(--font-michroma);
          font-size: 1.5rem;
          color: white;
          font-weight: 400;
          letter-spacing: 0.05em;
          line-height: 1.2;
          margin-bottom: 1rem;
          text-shadow: 0 0 10px rgba(255, 255, 255, 0.3);
        }

        .content-container {
          position: absolute;
          top: 17%; /* Reduced from 20% */
          left: 50%;
          transform: translateX(-50%);
          z-index: 10;
          width: 90%;
          max-width: 1200px;
          display: flex;
          flex-direction: column;
          gap: 2rem;
          align-items: center;
        }

        /* Responsive adjustments for different screen sizes */
        @media (max-width: 768px) {
          .content-container {
            top: 20%; /* Reduced from 25% */
          }
        }

        .media-section {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: flex-start;
          width: 100%;
          max-width: 800px !important; /* Force this to override any other styles */
        }

        @media (min-width: 768px) {
          .media-section {
            max-width: 800px !important;
          }
        }

        @media (min-width: 1024px) {
          .media-section {
            max-width: 800px !important;
          }
        }

        .media-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
          width: 100%;
        }

        .photo-box {
          background: rgba(0, 0, 0, 0.7);
          border: 2px solid rgba(255, 255, 255, 0.15);
          border-radius: clamp(16px, 2vw, 24px);
          padding: 0;
          box-shadow: 0 0 30px rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          width: 100%;
          height: 0;
          padding-bottom: 100%; /* Creates a square aspect ratio */
          position: relative;
          overflow: hidden;
        }

        .captured-photo {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        .scan-box {
          background: rgba(0, 0, 0, 0.7);
          border: 2px solid rgba(255, 255, 255, 0.15);
          border-radius: clamp(16px, 2vw, 24px);
          padding: 0;
          box-shadow: 0 0 30px rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          width: 100%;
          height: 0;
          padding-bottom: 100%; /* Creates a square aspect ratio */
          position: relative;
          display: flex;
          flex-direction: column;
        }

        .scan-box-content {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          padding: clamp(1rem, 2vw, 1.5rem);
        }

        .face-scan-video {
          width: 100%;
          max-width: 100%;
          height: auto;
          max-height: 70%;
          border-radius: 8px;
          display: block;
        }

        .scan-title {
          margin-bottom: 1rem;
        }

        .scan-progress {
          font-family: var(--font-aboreto);
          font-size: 1.5rem;
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

        .description-container {
          flex: 2;
          max-width: 800px;
        }

        .description-box {
          background: rgba(0, 0, 0, 0.7);
          border: 2px solid rgba(255, 255, 255, 0.15);
          border-radius: 16px;
          padding: 1.5rem;
          backdrop-filter: blur(10px);
          max-height: 400px;
          overflow: hidden;
        }

        .description-content {
          display: flex;
          flex-direction: column;
          gap: 0.8rem;
          max-height: 100%;
          overflow-y: auto;
          text-align: left;
        }

        .machine-title {
          font-weight: 700;
          font-size: 0.9rem;
          color: #F0A500;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          margin-bottom: 1rem;
          text-shadow: 0 0 10px rgba(240, 165, 0, 0.3);
          text-align: left;
        }

        .section {
          display: flex;
          margin-bottom: 1rem;
          color: white;
          line-height: 1.4;
          text-align: left;
        }

        .section-label {
          font-weight: 700;
          font-size: 0.9rem;
          color: #F0A500;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          width: 120px;
          padding-right: 0.5rem;
          text-shadow: 0 0 10px rgba(240, 165, 0, 0.3);
          text-align: left;
        }

        .section-text-container {
          flex: 1;
          text-align: left;
        }

        .section-text {
          margin: 0;
          color: white;
          font-size: 0.9rem; /* 80% smaller than 1.8rem */
          font-weight: 400;
          font-style: normal;
          text-align: left;
        }

        @media screen and (max-width: 1024px) {
          .content-container {
            flex-direction: column;
            align-items: center;
            gap: 1rem;
          }

          .media-section {
            width: 100%;
            max-width: 300px;
          }

          .description-container {
            width: 100%;
          }
        }

        @media screen and (max-width: 768px) {
          .content-container {
            top: 10%;
          }

          .media-section {
            max-width: 250px;
          }
        }

        @media screen and (max-width: 480px) {
          .content-container {
            top: 10%;
          }

          .media-section {
            max-width: 200px;
          }

          .description-box {
            padding: 1.5rem;
          }
        }

        @media (min-width: 768px) and (max-width: 1024px) {
          .title-container {
            max-width: 1400px;
          }
          
          .page-title {
            font-size: clamp(2.5rem, 4vw, 4.5rem);
            color: #F0A500;
          }
        }
      `}</style>
    </div>
  )
}
