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

  const getCategoryDescription = (category: string): string => {
    const descriptions: Record<string, string> = {
      'Synergy Specialist': "You call every meeting a 'touch base' and genuinely believe in the power of icebreakers",
      'Workflow Wizard': "You have a color-coded spreadsheet for everything, including your weekend plans. People fear your pivot tables",
      'Executive Oracle': "You don't take meetings, you take 'alignments.' You haven't made eye contact with a lower-level employee in years",
      'Middle Manager': "You've seen colleagues come and go, but you're still here—steady, reliable, and just coasting at a safe altitude",
      'Engagement Risk': "Your enthusiasm levels are dangerously low. Please see HR for mandatory morale training",
      'The Intern': "You have no idea what's going on, but you're smiling through the panic. Hope you like exposure as payment!"
    };
    
    return descriptions[category] || "You have no idea what's going on, but you're smiling through the panic. Hope you like exposure as payment!";
  };

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
        <div className="desktop-layout">
          <div className="title-area">
            <div className="text-content">
              <div className="title-container">
                <h1 className="title-text highlight" style={{ fontSize: '1.56rem', color: '#F0A500', textAlign: 'left' }}>Congratulations!</h1>
                <h2 className="title-text highlight" style={{ marginTop: '0', textAlign: 'left' }}>You are being reassigned to... {formatCategoryName(aiCategory)}</h2>
                <p className="analysis-text">{getCategoryDescription(formatCategoryName(aiCategory))}</p>
              </div>
            </div>
          </div>

          <div className="image-area">
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

          <div className="button-area">
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
          padding: 0.5rem;
          padding-top: 0;
        }

        .desktop-layout {
          width: 100%;
          max-width: 1800px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2rem;
          padding-top: 15vh;
        }

        .title-area {
          width: 100%;
          max-width: 660px;
          display: flex;
          justify-content: center;
        }

        .image-area {
          width: 100%;
          max-width: 660px;
        }

        .button-area {
          width: 100%;
          display: flex;
          justify-content: center;
          margin-top: 0rem;
        }

        .image-container {
          width: 100%;
          aspect-ratio: 1;
          position: relative;
          border-radius: 2.5rem;
          overflow: hidden;
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

        .text-content {
          width: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
        }

        .title-container {
          width: 100%;
          max-width: 100%;
          padding: 0 1rem;
          box-sizing: border-box;
          overflow-wrap: break-word;
          word-wrap: break-word;
        }

        .title-text {
          font-family: var(--font-michroma);
          font-size: 1.56rem;
          color: white;
          font-weight: 400;
          letter-spacing: 0.05em;
          line-height: 1.3;
          margin: 0;
          padding: 0;
          text-align: left;
          max-width: 100%;
        }

        .title-text.highlight {
          color: #F0A500;
          text-shadow: 0 0 8px rgba(255, 165, 0, 0.4), 0 0 16px rgba(255, 140, 0, 0.3), 0 0 24px rgba(255, 120, 0, 0.2);
          font-size: 1.56rem;
          margin-top: 0;
        }

        .analysis-text {
          margin: 0;
          transform: translateY(35%);
          color: #FFE7C8;
          font-size: 0.9rem;
          font-weight: 400;
          font-style: normal;
          text-align: left;
          line-height: 1.4;
          letter-spacing: 0;
          font-family: var(--font-b612-mono);
        }

        .download-button {
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

        .download-button:hover {
          background: rgba(255, 231, 200, 0.1);
          box-shadow: 
            0 0 10px rgba(255, 231, 200, 0.6),
            0 0 20px rgba(255, 231, 200, 0.4),
            0 0 30px rgba(255, 231, 200, 0.2);
        }

        @media (min-width: 1025px) {
          .desktop-layout {
            transform: scale(1.65);
            transform-origin: center top;
            margin-top: -63vh;
            width: 60%;
            max-width: 750px;
            margin-left: auto;
            margin-right: auto;
          }
          
          .title-area,
          .image-area {
            width: 100%;
            max-width: 100%;
          }
          
          .title-container {
            padding: 0;
          }
          
          .container {
            overflow-x: hidden;
          }
        }

        /* iPad Pro specific styling - 11" and 12.9" models */
        @media (min-width: 834px) and (max-width: 1024px) and (min-height: 1112px), 
               (min-width: 1024px) and (max-width: 1024px) and (min-height: 1366px) {
          .desktop-layout {
            transform: scale(1.25); /* 25% bigger */
            transform-origin: center top;
            margin-top: -3rem;
            width: 85%;
            margin-left: auto;
            margin-right: auto;
          }
          
          .container {
            overflow-x: hidden;
          }
        }

        /* iPad Air specific styling */
        @media (min-width: 768px) and (max-width: 834px) and (min-height: 1080px) {
          .desktop-layout {
            padding-top: 0;
            position: relative;
            top: 10vh; /* Move down 10% of viewport height */
          }
        }

        /* iPad Mini specific styling */
        @media (min-width: 744px) and (max-width: 768px) and (min-height: 1024px) {
          .desktop-layout {
            padding-top: 0;
            position: relative;
            top: 10vh; /* Move down 10% of viewport height */
            transform: scale(0.9); /* Reduce scale by 10% */
            transform-origin: center top;
          }
        }

        @media (max-width: 1024px) {
          .desktop-layout {
            padding-top: 0;
            margin-top: -10.8rem;
          }
        }

        @media (max-width: 768px) {
          .desktop-layout {
            padding-top: 0;
            padding-left: 0;
            padding-right: 0;
          }

          .text-content {
            gap: 0;
            width: 100%;
            align-items: flex-start;
          }

          .content {
            padding: 1rem 0;
          }

          h1 {
            font-size: min(max(1.8rem, 6vw), 2.2rem);
          }

          .highlight {
            font-size: min(max(1.8rem, 6vw), 2.2rem);
            margin-bottom: 1rem;
          }
        }
      `}</style>
    </div>
  )
}
