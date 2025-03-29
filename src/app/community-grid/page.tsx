'use client'

import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { useSessionStore } from '@/store/session'
import { DEFAULT_AI_PROVIDER } from '@/config/ai-route-config'
import { createUrl } from '@/utils/url'
import { useState, useEffect } from 'react'

export default function CommunityGrid() {
  const router = useRouter()
  const resetSession = useSessionStore((state) => state.resetSession)
  const setAiModelProvider = useSessionStore((state) => state.setAiModelProvider)
  const [gridItems, setGridItems] = useState<Array<{id: number, color: string}>>([])

  useEffect(() => {
    // Generate placeholder grid items with random colors
    // For desktop (5x5) we need 25 items, for mobile (3x3) we need 9 items
    // We'll generate 25 and only display what's needed based on screen size
    const items = Array.from({ length: 25 }, (_, i) => ({
      id: i,
      color: getRandomColor()
    }))
    setGridItems(items)
  }, [])

  // Generate a random pastel color
  const getRandomColor = () => {
    const hue = Math.floor(Math.random() * 360)
    return `hsl(${hue}, 70%, 80%)`
  }

  const handleStartAgain = () => {
    resetSession()
    setAiModelProvider(DEFAULT_AI_PROVIDER)
    router.push('/page1-home')
  }

  return (
    <main className="main">
      <div className="background" />
      <div className="container">
        <motion.h1 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="title"
        >
          MEET THE OTHER CO-WORKERS
        </motion.h1>
        
        <div className="grid">
          {gridItems.map((item) => (
            <div 
              key={item.id} 
              className="grid-item"
              style={{ backgroundColor: item.color }}
            >
              <div className="grid-item-content">
                <span className="grid-item-number">{item.id + 1}</span>
              </div>
            </div>
          ))}
        </div>
        
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="button-container"
        >
          <button onClick={handleStartAgain} className="start-again-button">START AGAIN</button>
        </motion.div>
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
        }

        .background {
          position: absolute;
          inset: 0;
          background-image: url('${createUrl('/grid_2.jpg')}');
          background-position: center;
          background-size: cover;
          opacity: 0.8;
          z-index: 0;
        }

        .container {
          width: 90%;
          max-width: 1400px;
          position: relative;
          z-index: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: space-between;
          height: 100vh;
          padding: 5rem 0;
          box-sizing: border-box;
        }

        .title {
          font-family: var(--font-aboreto);
          font-size: min(max(2.5rem, 5vw), 4rem);
          font-weight: 400;
          letter-spacing: 0.15em;
          line-height: 1.2;
          color: white;
          text-align: center;
          margin: 0;
          margin-bottom: 2rem;
          text-shadow: 
            0 0 10px rgba(255, 255, 255, 0.5),
            0 0 20px rgba(255, 255, 255, 0.3);
        }

        .grid {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          grid-template-rows: repeat(5, 1fr);
          gap: 1rem;
          width: min(100%, 800px);
          aspect-ratio: 1 / 1;
          box-sizing: border-box;
          margin: 0 auto;
        }

        .grid-item {
          aspect-ratio: 1;
          border-radius: 30px;
          overflow: hidden;
          box-shadow: 
            0 0 10px rgba(255, 255, 255, 0.2),
            0 0 20px rgba(0, 0, 0, 0.2);
          transition: transform 0.3s ease, box-shadow 0.3s ease;
          cursor: pointer;
          position: relative;
        }

        .grid-item:hover {
          transform: scale(1.05);
          box-shadow: 
            0 0 15px rgba(255, 255, 255, 0.3),
            0 0 30px rgba(0, 0, 0, 0.3);
        }

        .grid-item-content {
          position: absolute;
          inset: 0;
          display: flex;
          justify-content: center;
          align-items: center;
          background: rgba(0, 0, 0, 0.2);
          opacity: 0;
          transition: opacity 0.3s ease;
        }

        .grid-item:hover .grid-item-content {
          opacity: 1;
        }

        .grid-item-number {
          font-family: var(--font-michroma);
          color: white;
          font-size: 1.5rem;
          text-shadow: 0 0 10px rgba(0, 0, 0, 0.5);
        }

        .button-container {
          width: 100%;
          display: flex;
          justify-content: center;
          margin-top: 2rem;
        }

        .start-again-button {
          background: transparent;
          border: 2px solid #FFE7C8;
          color: #FFE7C8;
          font-family: var(--font-b612-mono);
          font-size: clamp(1.5rem, 1.5vw, 1.2rem);
          font-weight: 400;
          letter-spacing: 0.1em;
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

        .start-again-button:hover {
          background: rgba(255, 231, 200, 0.1);
          box-shadow: 
            0 0 10px rgba(255, 231, 200, 0.6),
            0 0 20px rgba(255, 231, 200, 0.4),
            0 0 30px rgba(255, 231, 200, 0.2);
        }

        .start-again-button:active {
          transform: scale(0.98);
        }

        /* Tablet and mobile styles */
        @media (max-width: 1024px) {
          .grid {
            grid-template-columns: repeat(3, 1fr);
            grid-template-rows: repeat(3, 1fr);
            gap: 0.8rem;
            width: min(100%, 550px);
          }
          
          .grid-item:nth-child(n+10) {
            display: none;
          }

          .container {
            padding: 3rem 0;
          }

          .title {
            font-size: min(max(2rem, 4vw), 3rem);
            margin-bottom: 1.5rem;
          }
        }

        @media (max-width: 768px) {
          .container {
            padding: 2.5rem 0;
          }

          .title {
            font-size: min(max(1.8rem, 6vw), 2.5rem);
            margin-bottom: 1rem;
          }

          .grid-item-number {
            font-size: 1.2rem;
          }

          .start-again-button {
            padding: 1rem 2.5rem;
            font-size: 1.2rem;
          }

          .button-container {
            margin-top: 1.5rem;
          }
        }

        @media (max-width: 480px) {
          .grid {
            gap: 0.8rem;
          }

          .grid-item {
            border-radius: 20px;
          }

          .grid-item-number {
            font-size: 1rem;
          }

          .start-again-button {
            padding: 0.8rem 2rem;
            font-size: 1rem;
          }

          .button-container {
            margin-top: 1rem;
          }
        }
      `}</style>
    </main>
  )
}
