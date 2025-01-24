'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSessionStore } from '@/store/session'
import Image from 'next/image'

export default function Results() {
  const router = useRouter()
  const aiResponse = useSessionStore((state) => state.aiResponse)
  const aiModelImage = useSessionStore((state) => state.aiModelImage)

  useEffect(() => {
    if (!aiModelImage || !aiResponse) {
      router.push('/page1-home')
    }
  }, [aiModelImage, aiResponse, router])

  const handleDownload = () => {
    router.push('/page5-email')
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
              <Image
                src={aiModelImage}
                alt="AI Generated Portrait"
                width={800}
                height={800}
                className="result-image"
                priority
              />
            </div>
          </div>

          <div className="reading-section">
            <h1>YOU&apos;RE A...</h1>
            <h2 className="highlight">mystery</h2>
            <div className="reading-container">
              <p className="reading-text">{aiResponse}</p>
            </div>
            <button onClick={handleDownload} className="download-button">
              DOWNLOAD
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
          background-image: url('/optimized_star_backgound.jpg');
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
            0 0 60px rgba(255, 255, 255, 0.1);
        }

        .result-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .reading-section {
          flex: 1;
          max-width: 600px;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 0.5rem;
        }

        h1 {
          font-family: var(--font-aboreto);
          font-size: clamp(2rem, 4vw, 3rem);
          color: rgba(255, 255, 255, 0.95);
          margin: 0;
          font-weight: 400;
          letter-spacing: 0.15em;
          text-transform: uppercase;
        }

        .highlight {
          font-family: var(--font-aboreto);
          font-size: clamp(2rem, 4vw, 3rem);
          color: white;
          margin: 0 0 1rem 0;
          font-weight: 400;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          text-shadow: 0 0 20px rgba(255, 255, 255, 0.4);
        }

        .reading-container {
          margin: 0 0 2rem;
          width: 100%;
        }

        .reading-text {
          font-family: var(--font-arapey);
          font-size: min(max(1.2rem, 2.2vw), 1.8rem);
          line-height: 1.6;
          color: rgba(255, 255, 255, 0.9);
          margin: 0;
          text-align: left;
          letter-spacing: 0.02em;
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

        @media (max-width: 1024px) {
          .results-grid {
            flex-direction: column;
            padding: 1.5rem;
            gap: 3rem;
          }

          .image-section {
            max-width: 600px;
            width: 100%;
          }

          .reading-section {
            max-width: 600px;
            width: 100%;
            align-items: center;
          }

          .reading-text {
            text-align: center;
          }

          .download-button {
            align-self: center;
          }

          h1 {
            font-size: clamp(1.8rem, 3.5vw, 2.5rem);
          }

          .highlight {
            font-size: clamp(1.8rem, 3.5vw, 2.5rem);
            margin-bottom: 1.5rem;
          }
        }

        @media (max-width: 480px) {
          .content {
            padding: 1rem;
          }

          .results-grid {
            gap: 2rem;
          }

          h1 {
            font-size: min(max(1.8rem, 6vw), 2.2rem);
          }

          .highlight {
            font-size: min(max(1.8rem, 6vw), 2.2rem);
            margin-bottom: 1rem;
          }

          .reading-text {
            font-size: min(max(1rem, 4.5vw), 1.3rem);
          }

          .download-button {
            font-size: min(max(1rem, 4vw), 1.2rem);
            padding: min(max(0.8rem, 1.5vh), 1.2rem) min(max(2rem, 4vw), 3rem);
            border-width: 2px;
            width: 100%;
          }
        }
      `}</style>
    </div>
  )
}
