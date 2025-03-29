'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSessionStore } from '@/store/session'
import Image from 'next/image'
import { createUrl } from '@/utils/url'
import { saveCommunityEntry, getCommunityEntries } from '@/utils/communityStorage'

export default function Results() {
  const router = useRouter()
  const aiResponse = useSessionStore((state) => state.aiResponse)
  const aiName = useSessionStore((state) => state.aiName)
  const aiModelImage = useSessionStore((state) => state.aiModelImage)
  const aiCategory = useSessionStore((state) => state.aiModelProvider)
  const [imageLoaded, setImageLoaded] = useState(false)
  const [imageSaved, setImageSaved] = useState(false)

  console.log('Page 6 - Category:', aiCategory) // Debug log

  // Format category name for display
  const formatCategoryName = (category: string | null) => {
    if (!category) return 'Mystery Person';
    
    // Replace underscores with spaces and capitalize each word
    return category
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  // Preload the image
  useEffect(() => {
    if (aiModelImage && typeof window !== 'undefined') {
      const img = new window.Image();
      img.src = aiModelImage;
      img.onload = () => setImageLoaded(true);
    }
  }, [aiModelImage]);

  // Save the generated image to community storage
  useEffect(() => {
    if (aiModelImage && typeof window !== 'undefined' && !imageSaved) {
      try {
        // Check if this image URL already exists in community storage
        const existingEntries = getCommunityEntries();
        const imageExists = existingEntries.some(entry => entry.imageUrl === aiModelImage);
        
        // Only save if the image doesn't already exist
        if (!imageExists) {
          saveCommunityEntry(aiModelImage);
          setImageSaved(true);
        }
      } catch (error) {
        console.error('Failed to save community entry:', error);
      }
    }
  }, [aiModelImage, imageSaved]);

  useEffect(() => {
    if (!aiModelImage || !aiResponse) {
      router.push('/page1-home')
    }
  }, [aiModelImage, aiResponse, router])

  const handleDownload = () => {
    router.push('/main-report')
  }

  if (!aiModelImage || !aiResponse) {
    return null
  }

  return (
    <div className="container">
      <div className="background" />
      
      <div className="content">
        <div className="results-grid">
          <div className="image-section">
            <div className="image-container">
              {!imageLoaded && (
                <div className="image-loading">
                  <div className="spinner"></div>
                  <p>Loading your corporate persona...</p>
                </div>
              )}
              <Image
                src={aiModelImage}
                alt="AI Generated Portrait"
                width={800}
                height={800}
                className={`result-image ${imageLoaded ? 'loaded' : 'loading'}`}
                priority
                onLoad={() => setImageLoaded(true)}
                unoptimized={true} // Skip Next.js image optimization for this dynamic image
              />
            </div>
          </div>

          <div className="reading-section">
            <div className="text-content">
              <div className="title-container">
                <h1 className="title-text">CONGRATULATIONS! YOU ARE...</h1>
                <h2 className="title-text highlight">{formatCategoryName(aiCategory)}</h2>
              </div>
            </div>
            <button onClick={handleDownload} className="download-button">
              READ FACE AUDIT
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        .container {
          width: 100vw;
          height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: black;
          position: relative;
          overflow: hidden;
        }

        .background {
          position: fixed;
          inset: 0;
          background-image: url('${createUrl('/grid_2.jpg')}');
          background-position: center;
          background-size: cover;
          opacity: 0.8;
          z-index: 0;
        }

        .content {
          position: relative;
          z-index: 1;
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem;
        }

        .results-grid {
          display: flex;
          width: 100%;
          max-width: 1800px;
          gap: 8rem;
          align-items: center;
          justify-content: center;
        }

        .image-section {
          flex: 1;
          max-width: 800px;
        }

        .image-container {
          width: 100%;
          aspect-ratio: 1;
          position: relative;
          border-radius: 2.5rem;
          overflow: hidden;
          box-shadow: 
            0 0 30px rgba(255, 255, 255, 0.2),
            0 0 60px rgba(255, 255, 255, 0.1),
            0 0 40px rgba(255, 255, 255, 0.2),
            inset 0 0 10px rgba(255, 255, 255, 0.1);
        }

        .image-loading {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background: rgba(0, 0, 0, 0.7);
          color: white;
          z-index: 2;
        }

        .spinner {
          width: 50px;
          height: 50px;
          border: 5px solid rgba(255, 255, 255, 0.3);
          border-radius: 50%;
          border-top-color: white;
          animation: spin 1s ease-in-out infinite;
          margin-bottom: 1rem;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .result-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: opacity 0.5s ease;
        }

        .result-image.loading {
          opacity: 0;
        }

        .result-image.loaded {
          opacity: 1;
        }

        .reading-section {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 2rem;
          color: white;
          max-width: min(55vw, 600px);
        }

        .text-content {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 2rem;
        }

        .title-container {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 0;
        }

        .title-text {
          font-family: var(--font-aboreto);
          font-size: 2.45rem;
          color: white;
          font-weight: 400;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          margin: 0;
          line-height: 1.3;
          padding: 0;
          text-align: left;
        }

        .title-text.highlight {
          color: #F0A500;
          font-size: 2.45rem;
        }

        .download-button {
          background: rgba(0, 0, 0, 0.4);
          border: 3px solid white;
          color: white;
          font-size: min(max(1.2rem, 2vw), 1.6rem);
          padding: min(max(1rem, 2vh), 1.5rem) min(max(3rem, 5vw), 5rem);
          border-radius: 100px;
          cursor: pointer;
          transition: all 0.3s ease;
          letter-spacing: 0.15em;
          font-weight: 400;
          box-shadow: 
            0 0 10px rgba(255, 255, 255, 0.5),
            0 0 20px rgba(255, 255, 255, 0.3),
            0 0 40px rgba(255, 255, 255, 0.2),
            inset 0 0 10px rgba(255, 255, 255, 0.1);
          text-shadow: 0 0 10px rgba(255, 255, 255, 0.5);
          text-transform: uppercase;
          align-self: flex-start;
        }

        .download-button:hover {
          background: rgba(255, 255, 255, 0.1);
          box-shadow: 
            0 0 15px rgba(255, 255, 255, 0.7),
            0 0 30px rgba(255, 255, 255, 0.5),
            0 0 60px rgba(255, 255, 255, 0.3),
            inset 0 0 20px rgba(255, 255, 255, 0.2);
          text-shadow: 0 0 15px rgba(255, 255, 255, 0.7);
          transform: scale(1.02);
        }

        .download-button:active {
          transform: scale(0.98);
        }

        @media (min-width: 768px) and (max-width: 1024px) {
          .container {
            background: black;
          }

          .background {
            display: none;
          }

          .results-grid {
            flex-direction: column;
            gap: 2rem;
            max-width: 100%;
            padding: 2rem;
          }

          .image-section {
            max-width: 100%;
          }

          .image-container {
            max-width: 600px;
            margin: 0 auto;
          }

          .reading-section {
            max-width: 100%;
            align-items: center;
            text-align: center;
          }

          .title-container {
            align-items: center;
            text-align: center;
            margin-bottom: 1rem;
          }

          .title-text {
            text-align: center;
            font-size: 2.8rem;
            white-space: nowrap;
          }

          .title-text.highlight {
            font-size: 2.8rem;
            margin-top: 0.5rem;
          }

          .download-button {
            align-self: center;
            font-size: 1.4rem;
            padding: 1rem 3rem;
            background: transparent;
            border: 2px solid white;
            box-shadow: 
              0 0 20px rgba(255, 255, 255, 0.3),
              0 0 40px rgba(255, 255, 255, 0.2),
              inset 0 0 10px rgba(255, 255, 255, 0.1);
          }
        }

        @media (max-width: 768px) {
          .results-grid {
            flex-direction: column;
            gap: 2rem;
          }

          .reading-section {
            max-width: 100%;
          }

          .title-text {
            font-size: 2rem;
            text-align: center;
          }

          .title-text.highlight {
            font-size: 2rem;
          }

          .title-container {
            align-items: center;
            width: 100%;
          }

          .text-content {
            gap: 0;
          }

          .content {
            padding: 1rem;
          }

          h1 {
            font-size: min(max(1.8rem, 6vw), 2.2rem);
          }

          .highlight {
            font-size: min(max(1.8rem, 6vw), 2.2rem);
            margin-bottom: 1rem;
          }

          .download-button {
            font-size: min(max(1rem, 4vw), 1.2rem);
            padding: min(max(0.8rem, 1.5vh), 1.2rem) min(max(2rem, 4vw), 3rem);
            border-width: 2px;
            width: 100%;
          }
        }

        @media (max-width: 1024px) {
          .title-text {
            font-size: 2.45rem;
          }
        }
      `}</style>
    </div>
  )
}
