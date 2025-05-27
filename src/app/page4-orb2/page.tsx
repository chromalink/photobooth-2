'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSessionStore } from '@/store/session'
import { generateSpiritualReading } from '@/utils/openai'
import OrbAnimation from '../components/OrbAnimation'
import { B612_Mono } from 'next/font/google'
import { createUrl } from '@/utils/url'
import Image from 'next/image'

// Load B612 Mono font
const b612Mono = B612_Mono({
  weight: ['400', '700'],
  subsets: ['latin'],
  display: 'swap',
})

// Mutex locks and abort controller for cancellation
let isPolling = false;
let isProcessingPhoto = false;
let currentAbortController: AbortController | null = null;

export default function Orb2() {
  const router = useRouter()
  const [error, setError] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [hasStartedProcessing, setHasStartedProcessing] = useState(false)
  const [visualProgress, setVisualProgress] = useState(0)
  const processStartedRef = useRef(false)
  const [displaySections, setDisplaySections] = useState<{[key: string]: string}>({})
  const [visibleSections, setVisibleSections] = useState<string[]>([])
  const [readingGenerated, setReadingGenerated] = useState(false)
  const [fullSections, setFullSections] = useState<{[key: string]: string}>({})
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

  // Effect to handle sequential display of sections
  useEffect(() => {
    if (!readingGenerated || Object.keys(fullSections).length === 0) return;
    
    // Reset visible sections when new reading is generated
    setVisibleSections([]);
    
    // Get all section keys
    const sectionKeys = Object.keys(fullSections);
    
    // Function to add sections one by one
    const addSectionsSequentially = () => {
      let currentIndex = 0;
      
      // Add first section immediately
      setVisibleSections([sectionKeys[0]]);
      
      // Add remaining sections with 8-second intervals
      const intervalId = setInterval(() => {
        currentIndex++;
        
        if (currentIndex < sectionKeys.length) {
          setVisibleSections(prev => [...prev, sectionKeys[currentIndex]]);
        } else {
          // Clear interval when all sections are displayed
          clearInterval(intervalId);
        }
      }, 8000); // 8 seconds interval
      
      // Cleanup function
      return () => clearInterval(intervalId);
    };
    
    const cleanup = addSectionsSequentially();
    return cleanup;
  }, [readingGenerated, fullSections]);
  
  // Initial setup effect
  useEffect(() => {
    const initialSections = {
      'Facial Expression': 'Analyzing...',
      'Body Language': 'Analyzing...',
      'Clothing': 'Analyzing...',
      'Hair Style': 'Analyzing...'
    };
    
    console.log('Setting initial sections:', initialSections);
    setDisplaySections(initialSections);
    setIsProcessing(true);
    setVisualProgress(75); // Set to 75% complete
  }, []);

  const handlePhotoCapture = useCallback(async () => {
    if (!uploadedPhotoUrl || isProcessingPhoto) {
      console.log('Skipping photo capture - no photo or already processing');
      return;
    }
    
    // Create a new abort controller for this process
    if (currentAbortController) {
      // Cancel any previous ongoing requests
      currentAbortController.abort();
    }
    currentAbortController = new AbortController();
    const signal = currentAbortController.signal;
    
    try {
      isProcessingPhoto = true;
      
      // Start with higher visual progress to make it feel faster
      setVisualProgress(25);
      setIsProcessing(true);
      setHasStartedProcessing(true);
      setError(''); // Clear any previous error
      
      // Set initial placeholder sections immediately for better UX
      setDisplaySections({
        'Facial Expression': 'Analyzing...',
        'Body Language': 'Analyzing...',
        'Clothing': 'Analyzing...',
        'Hair Style': 'Analyzing...'
      });
      
      console.log('Starting AI processes...');
      
      const requestHash = Date.now().toString();
      setVisualProgress(40); // Increment progress quickly
      
      // Make the API request with abort signal
      const generateReadingResponse = await fetch('/api/generate-reading', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: uploadedPhotoUrl.split(',')[1],
          hash: requestHash
        }),
        signal // Add the abort signal to allow cancellation
      });

      setVisualProgress(60); // Increment progress after request is sent
      
      if (!generateReadingResponse.ok) {
        const errorText = await generateReadingResponse.text();
        console.error('Generate reading API error:', errorText);
        throw new Error('Failed to generate reading: ' + errorText);
      }

      const readingData = await generateReadingResponse.json();
      console.log('Received reading data:', readingData);
      
      // Process the reading data
      if (readingData.description) {
        console.log('Processing description:', readingData.description);
        const sections = extractDisplaySections(readingData.description);
        
        if (Object.values(sections).some(value => value)) {
          // Store the full sections but don't display them yet
          setFullSections(sections);
          // Initially show 'Analyzing...' for all sections
          setDisplaySections({
            'Facial Expression': 'Analyzing...',
            'Body Language': 'Analyzing...',
            'Clothing': 'Analyzing...',
            'Hair Style': 'Analyzing...'
          });
          setVisualProgress(80); // Increment progress after sections are displayed
          
          // Set reading as generated to trigger sequential display
          setReadingGenerated(true);
        }
      } else {
        console.log('No description in reading data');
      }

      // Validate the response
      if (!readingData.category || !readingData.name || !readingData.reading) {
        console.error('Invalid generate reading response:', readingData);
        throw new Error('Invalid reading response');
      }

      // Update the session store with the reading data
      setAiName(readingData.name);
      setAiResponse(readingData.reading);
      setAiModelProvider(readingData.category);
      
      // Move to 90% progress immediately after setting the data
      setVisualProgress(90);

      const comfyResponse = await fetch('/api/comfyui', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-oracle-category': readingData.category
        },
        body: JSON.stringify({
          image: uploadedPhotoUrl.split(',')[1],
          hash: requestHash
        }),
        signal // Add the abort signal to allow cancellation
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
          
          const statusResponse = await fetch(`/api/comfyui-status?promptId=${imageResponse.upscaledResult.promptId}`, {
            signal // Add the abort signal to allow cancellation
          });
          if (!statusResponse.ok) {
            throw new Error('Failed to check image status');
          }
          
          const statusData = await statusResponse.json();
          console.log('Status response:', statusData);
          
          if (statusData.upscaledResult.completed && statusData.upscaledResult.imageUrl) {
            if (statusData.upscaledResult.imageUrl !== lastImageUrl) {
              console.log('Image generation completed:', statusData.upscaledResult.imageUrl);
              
              // Preload the image before navigating
              const preloadAndSetImage = async (imageUrl: string) => {
                // Use the browser's built-in Image constructor, not Next.js Image component
                const preloadImage = new window.Image();
                preloadImage.src = imageUrl;

                const fetchAndConvertToDataUrl = async (url: string) => {
                  try {
                    console.log('Fetching image to convert to data URL:', url.substring(0, 50) + '...');
                    const response = await fetch(url);
                    if (!response.ok) {
                      throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
                    }
                    
                    const blob = await response.blob();
                    return new Promise<string>((resolve, reject) => {
                      const reader = new FileReader();
                      reader.onloadend = () => resolve(reader.result as string);
                      reader.onerror = reject;
                      reader.readAsDataURL(blob);
                    });
                  } catch (error) {
                    console.error('Error converting image to data URL:', error);
                    return null;
                  }
                };

                try {
                  // Convert the image URL to a data URL for better email attachment handling
                  let dataUrl: string | null = null;
                  
                  if (imageUrl.startsWith('data:')) {
                    console.log('Image is already a data URL');
                    dataUrl = imageUrl;
                  } else {
                    console.log('Converting image to data URL...');
                    dataUrl = await fetchAndConvertToDataUrl(imageUrl);
                  }
                  
                  if (dataUrl) {
                    console.log('Successfully converted image to data URL, length:', dataUrl.length);
                    setAiModelImage(dataUrl);
                  } else {
                    // Fallback to using the original URL if conversion fails
                    console.log('Using original image URL as fallback');
                    const fullImageUrl = imageUrl.startsWith('/') 
                      ? `${window.location.origin}${imageUrl}` 
                      : imageUrl;
                    setAiModelImage(fullImageUrl);
                  }
                  
                  setVisualProgress(100);
                  
                  // Try to upload to Google Drive before navigating, but don't block navigation if it fails
                  try {
                    await uploadImageToDrive(imageUrl);
                  } catch (error) {
                    console.error('Google Drive upload failed but continuing navigation:', error);
                  }
                  
                  // Small delay to ensure state is updated before navigation
                  await new Promise(resolve => setTimeout(resolve, 500));
                  router.push('/page6-results');
                } catch (error) {
                  console.error('Error in preloadAndSetImage:', error);
                  // Even on error, use the full URL
                  const fullImageUrl = imageUrl.startsWith('/') 
                    ? `${window.location.origin}${imageUrl}` 
                    : imageUrl;
                  console.log('Setting AI model image with full URL (after error):', fullImageUrl);
                  setAiModelImage(fullImageUrl);
                  setVisualProgress(100);
                  
                  // Try to upload to Google Drive before navigating, but don't block navigation if it fails
                  try {
                    await uploadImageToDrive(imageUrl);
                  } catch (error) {
                    console.error('Google Drive upload failed but continuing navigation:', error);
                  }
                  
                  // Small delay to ensure state is updated before navigation
                  await new Promise(resolve => setTimeout(resolve, 500));
                  router.push('/page6-results');
                }
              };

              await preloadAndSetImage(statusData.upscaledResult.imageUrl);
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

  // Function to upload image to Google Drive
  const uploadImageToDrive = async (imageUrl: string) => {
    try {
      console.log('Attempting to upload image to Google Drive');
      const response = await fetch('/api/upload-to-drive', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageUrl,
          fileName: `face-audit-${Date.now()}.png`,
        }),
      });

      const data = await response.json();
      console.log('Google Drive upload response:', data);
      return data.success;
    } catch (error) {
      console.error('Error uploading to Google Drive:', error);
      return false;
    }
  };

  return (
    <div className="main">
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
      
      <div className="background-container">
        <div className="background-image" />
      </div>

      {/* Centered wrapper for title and content */}
      <div className="centered-wrapper">
        {/* Group title and content together */}
        <div className="content-group">
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
                      <source src={createUrl('/Face_scan.mp4')} type="video/mp4" />
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
                    Object.entries(displaySections).map(([section, text]) => {
                      // If reading is generated, check if this section should be visible
                      const sectionContent = readingGenerated && fullSections[section] && visibleSections.includes(section) 
                        ? fullSections[section] // Show the actual content if section is visible
                        : readingGenerated && !visibleSections.includes(section) 
                          ? '' // Hide content completely if reading is generated but section not visible yet
                          : text; // Show 'Analyzing...' if reading is not generated yet
                      
                      // Only render the section if it has content or reading is not generated yet
                      return (
                        <div key={section} className={`section ${readingGenerated && !visibleSections.includes(section) ? 'hidden-section' : ''}`}>
                          <div className={`section-label ${b612Mono.className}`}>{section}</div>
                          <div className="section-text-container">
                            <p className={`section-text ${b612Mono.className}`}>
                              {readingGenerated && !visibleSections.includes(section) 
                                ? 'Analyzing...' // Show 'Analyzing...' for sections not yet visible
                                : sectionContent}
                            </p>
                          </div>
                        </div>
                      );
                    })
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
          
          {/* Restart Button */}
          <div className="button-area">
            <button 
              onClick={() => {
                // Cancel any ongoing fetch requests
                if (currentAbortController) {
                  console.log('Cancelling ongoing requests...');
                  currentAbortController.abort();
                  currentAbortController = null;
                }
                
                // Reset processing flags
                isProcessingPhoto = false;
                isPolling = false;
                
                // Stop any ongoing processing
                setIsProcessing(false);
                setHasStartedProcessing(false);
                setReadingGenerated(false);
                setVisibleSections([]);
                setFullSections({});
                setError('');
                
                // Reset relevant session state
                setAiResponse('');
                setAiName('');
                setAiModelImage('');
                
                // Navigate back to page 2
                router.push('/page2-orb1');
              }} 
              className="restart-button"
            >
              RETAKE PHOTO
            </button>
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
          justify-content: flex-start;
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
          opacity: 0.5;
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
        
        /* Tablet-specific positioning for branding info */
        @media screen and (min-width: 768px) and (max-width: 1023px) {
          .branding-info {
            top: calc(50px - 3vh); /* Move slightly up from original position */
          }
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

        .centered-wrapper {
          position: absolute;
          top: 0;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          flex-direction: column;
          align-items: center;
          width: 100%;
          max-width: 1200px;
          height: 100vh;
          padding: 0;
          overflow-y: auto;
          justify-content: space-around;
        }

        .title-container {
          position: relative;
          z-index: 10;
          text-align: center;
          width: 100%;
          max-width: 1200px;
          padding: 0 20px;
          margin-bottom: 0;
          min-height: auto;
          display: flex;
          justify-content: center;
          align-items: center;
          margin-top: auto;
        }

        .content-container {
          position: relative;
          z-index: 5;
          width: 90%;
          max-width: 1200px;
          display: flex;
          flex-direction: column;
          gap: 1rem;
          align-items: center;
          justify-content: center;
          margin-top: 0;
          margin-bottom: auto;
        }

        .content-group {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 0;
          transform: scale(0.9) translateY(5%);
          transform-origin: center top;
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

        .page-title {
          font-family: var(--font-michroma);
          font-size: clamp(1.5rem, 3vw, 2.5rem);
          color: #F0A500;
          font-weight: 400;
          letter-spacing: 0.05em;
          line-height: 1.3;
          text-align: center;
          margin: 0;
          padding: 0 0 0.5rem 0;
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

        /* iPad Mini specific styles */
        @media (min-width: 768px) and (max-width: 800px) {
          .title-container {
            margin-bottom: -6rem; /* Set margin-bottom to -6rem for iPad Mini */
          }
        }

        /* iPad Air specific styles */
        @media (min-width: 801px) and (max-width: 850px) {
          .title-container {
            margin-bottom: -1rem; /* Set margin-bottom to -1rem for iPad Air */
          }
        }

        /* Add specific media query for screens around 990px */
        @media (min-width: 851px) and (max-width: 1023px) {
          .title-container {
            max-width: 1400px;
            margin-bottom: 1rem;
            position: relative;
            z-index: 20; /* Increased z-index to ensure title stays on top */
            transform: translateY(0);
          }
          
          .page-title {
            font-size: clamp(2rem, 4vw, 2.5rem);
            color: #F0A500;
          }
          
          .content-group {
            display: flex;
            flex-direction: column;
            gap: 2rem; /* Add gap between title and content */
          }
        }

        @media (min-width: 1024px) and (max-width: 1200px) {
          /* Medium-sized screens */
          .title-container {
            z-index: 20;
            margin-bottom: 1rem;
          }
        }

        @media (min-width: 820px) and (max-width: 920px) {
          .title-container {
            margin-bottom: 1rem;
          }
        }

        /* iPad Pro 11-inch and 12.9-inch specific styling */
        @media only screen and (min-width: 1024px) and (max-width: 1024px) and (min-height: 1366px),
               only screen and (min-width: 834px) and (max-width: 834px) and (min-height: 1194px),
               only screen and (min-width: 834px) and (max-width: 834px) and (min-height: 1112px) {
          .content-group {
            transform: scale(1.2) translateY(-5%);
            transform-origin: center top;
            margin: 1.5rem auto 3rem;
          }
        }

        /* iPad Mini specific styling */
        @media only screen and (min-width: 768px) and (max-width: 768px) and (min-height: 1024px),
               only screen and (min-width: 744px) and (max-width: 744px) and (min-height: 1133px) {
          .content-group {
            transform: translateY(-5%);
            transform-origin: center top;
          }
        }

        /* Desktop styles */
        @media (min-width: 1025px) {
          .page-title {
            font-size: clamp(2.64rem, 3.6vw, 3rem);
            color: #F0A500;
            transform: translateY(-10%);
          }
          
          .centered-wrapper {
            max-width: 1440px; /* 20% larger than 1200px */
          }
          
          .content-group {
            transform: scale(1.35) translateY(-13%);
            transform-origin: center top;
          }
          
          .content-container {
            max-width: 1440px; /* 20% larger than 1200px */
          }
          
          .media-section {
            max-width: 960px !important; /* 20% larger than 800px */
          }
        }

        .media-section {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
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
          background: #0A0A0A;
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
          width: 120%; /* Increased from 100% to 120% */
          max-width: 120%; /* Increased from 100% to 120% */
          height: auto;
          max-height: 84%; /* Increased from 70% to 84% (70% * 1.2) */
          border-radius: 8px;
          display: block;
          transform: translateY(-1%) translateX(-8%); /* Added translateX to center the wider video */
          transform-origin: center center;
          margin: 0 auto;
        }

        .scan-title {
          margin-bottom: 1rem;
          position: relative;
          z-index: 10;
          transform: translateY(0%); /* Changed to 0% as requested */
        }

        /* Add media query for tablets */
        @media (min-width: 768px) and (max-width: 1024px) {
          .title-container {
            margin-top: -1rem;
          }
        }

        /* iPad Mini specific styles */
        @media (min-width: 768px) and (max-width: 800px) {
          .title-container {
            margin-bottom: -6rem; /* Set margin-bottom to -6rem for iPad Mini */
          }
        }

        .scan-progress {
          font-family: var(--font-b612-mono);
          font-size: 1.5rem;
          color: #F0A500;
          font-weight: 400;
          letter-spacing: 0.05em;
          line-height: 1;
          text-align: center;
          margin: 0;
          padding: 0;
          text-shadow: 0 0 20px rgba(240, 165, 0, 0.5),
                      0 0 40px rgba(240, 165, 0, 0.3),
                      0 0 60px rgba(240, 165, 0, 0.2);
        }

        .description-container {
          flex: 2;
          max-width: 800px;
          width: 100%;
          display: flex;
          justify-content: center;
          align-items: center;
        }

        .description-box {
          background: rgba(0, 0, 0, 0.7);
          border: 2px solid rgba(255, 255, 255, 0.15);
          border-radius: 16px;
          padding: 1.5rem;
          backdrop-filter: blur(10px);
          max-height: 400px;
          overflow: hidden;
          width: 100%;
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
          color: #FFE7C8;
          line-height: 1.4;
          text-align: left;
          transition: opacity 0.5s ease-in-out;
        }
        
        .hidden-section {
          opacity: 0.3;
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
          color: #FFE7C8;
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
            top: 3%; /* Changed from 10% to 3% */
          }

          .media-section {
            max-width: 250px;
          }
        }

        /* Specific media query for 712x1192 pixel threshold */
        @media screen and (min-width: 700px) and (max-width: 730px) and (min-height: 1180px) and (max-height: 1200px) {
          .content-container {
            top: 3% !important; /* Force 3% for this specific resolution */
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
            margin-bottom: -4rem;
          }
          
          .page-title {
            font-size: clamp(2.5rem, 4vw, 4.5rem);
            color: #F0A500;
          }
          
          .content-group {
            display: flex;
            flex-direction: column;
            gap: 2rem; /* Add gap between title and content */
          }
        }

        @media (min-width: 768px) and (max-width: 1024px) and (orientation: landscape) {
          .content-group {
            margin-bottom: 1rem;
          }
        }

        @media (min-width: 1024px) and (max-width: 1366px) {
          .title-container {
            margin-bottom: 1rem;
          }
        }

        @media (min-width: 820px) and (max-width: 920px) {
          .title-container {
            margin-bottom: 1rem;
          }
        }

        /* iPad Pro 11-inch and 12.9-inch specific styling */
        @media only screen and (min-width: 1024px) and (max-width: 1024px) and (min-height: 1366px),
               only screen and (min-width: 834px) and (max-width: 834px) and (min-height: 1194px),
               only screen and (min-width: 834px) and (max-width: 834px) and (min-height: 1112px) {
          .content-group {
            transform: scale(1.2) translateY(-5%);
            transform-origin: center top;
            margin: 1.5rem auto 3rem;
          }
        }

        /* iPad Mini specific styling */
        @media only screen and (min-width: 768px) and (max-width: 768px) and (min-height: 1024px),
               only screen and (min-width: 744px) and (max-width: 744px) and (min-height: 1133px) {
          .content-group {
            transform: translateY(-5%);
            transform-origin: center top;
          }
        }

        /* Button area and restart button styling */
        .button-area {
          width: 100%;
          display: flex;
          justify-content: center;
          margin-top: 4rem; /* Changed from 2rem to 4rem */
        }

        .restart-button {
          background: transparent;
          border: 2px solid #FFE7C8;
          color: #FFE7C8;
          font-family: var(--font-b612-mono);
          font-size: clamp(1.5rem, 1.5vw, 1.2rem);
          font-weight: 400;
          letter-spacing: 0.05em;
          padding: 1.2rem 3.5rem;
          border-radius: 25px;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 
            0 0 5px rgba(255, 231, 200, 0.5),
            0 0 10px rgba(255, 231, 200, 0.3),
            0 0 15px rgba(255, 231, 200, 0.2);
          align-self: center;
        }

        .restart-button:hover {
          background: rgba(255, 231, 200, 0.1);
          box-shadow: 
            0 0 10px rgba(255, 231, 200, 0.6),
            0 0 20px rgba(255, 231, 200, 0.4),
            0 0 30px rgba(255, 231, 200, 0.2);
        }
      `}</style>
    </div>
  )
}
