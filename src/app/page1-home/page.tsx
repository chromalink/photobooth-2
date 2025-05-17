'use client'

import { useSessionStore } from '../../store/session'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import Image from 'next/image'
import { DEFAULT_AI_PROVIDER } from '../../config/ai-route-config'

export default function Home() {
  const router = useRouter()
  const setStep = useSessionStore((state) => state.setStep)
  const resetSession = useSessionStore((state) => state.resetSession)
  const setAiModelProvider = useSessionStore((state) => state.setAiModelProvider)
  const aiModelProvider = useSessionStore((state) => state.aiModelProvider)

  useEffect(() => {
    if (!aiModelProvider) {
      setAiModelProvider(DEFAULT_AI_PROVIDER)
    }
  }, [aiModelProvider, setAiModelProvider])

  const handleStart = () => {
    const currentProvider = aiModelProvider
    resetSession()
    if (currentProvider) {
      setAiModelProvider(currentProvider)
    }
    setStep('capture')
    router.push('/page2-orb1')
  }

  return (
    <main className="main">
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
      
      <div className="content">
        <div className="responsiveContainer">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="titleWrapper"
          >
            <h1>FACE AUDIT™</h1>
          </motion.div>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="textWrapper"
            style={{ marginBottom: '1.1rem' }}
          >
            <p>The future of professional<br />expression</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="buttonWrapper"
          >
            <button onClick={handleStart}>BEGIN AUDIT</button>
          </motion.div>
        </div>
      </div>

      <style jsx>{`
        .main {
          width: 100vw;
          height: 100vh;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          background: black;
          margin: 0;
          padding: 0;
          overflow: hidden;
        }

        .main::before {
          content: '';
          position: absolute;
          inset: 0;
          background-image: url('/optimized_home_screen.jpg');
          background-position: center;
          background-repeat: no-repeat;
          background-size: cover;
          opacity: 0.8;
        }

        .content {
          position: relative;
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 0 max(20px, 5vw);
          width: min(100%, 1200px);
          margin: 0 auto;
          height: 100vh;
        }

        .responsiveContainer {
          position: relative;
          width: min(90%, 800px);
          height: min(60vh, 600px);
          display: flex;
          flex-direction: column;
          justify-content: flex-start;
          align-items: center;
          transform-origin: center;
          transition: transform 0.3s ease;
          gap: 1rem;
          margin-top: 3vh;
        }

        .titleWrapper {
          width: 100%;
          max-width: min(100%, 600px);
          text-align: center;
          display: flex;
          justify-content: center;
          align-items: center;
          transform-origin: center top;
          padding: 0 1rem;
        }

        .textWrapper {
          width: 100%;
          max-width: min(100%, 500px);
          text-align: center;
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 0 1rem;
        }

        .buttonWrapper {
          width: 100%;
          max-width: min(100%, 500px);
          text-align: center;
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 0 1rem;
        }

        h1 {
          width: 100%;
          font-size: clamp(2.7rem, 4.5vw, 2.52rem);
          font-weight: 400;
          font-family: var(--font-michroma);
          letter-spacing: 0.05em;
          line-height: 1.1em;
          color: #FFB048;
          text-shadow: 0 0 8px rgba(255, 165, 0, 0.4), 0 0 16px rgba(255, 140, 0, 0.3), 0 0 24px rgba(255, 120, 0, 0.2);
          margin: 0;
          padding: 0;
        }

        p {
          font-size: clamp(1.44rem, 1.8vw, 1.08rem);
          font-family: var(--font-b612-mono);
          font-weight: 400;
          font-style: normal;
          letter-spacing: 0.1em;
          line-height: 1.5;
          color: #FFC578;
          margin: 0;
          padding: 0;
        }

        button {
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

        button:hover {
          background: rgba(255, 231, 200, 0.1);
          box-shadow: 
            0 0 10px rgba(255, 231, 200, 0.6),
            0 0 20px rgba(255, 231, 200, 0.4),
            0 0 30px rgba(255, 231, 200, 0.2);
        }

        button:active {
          transform: scale(0.98);
        }

        /* Landscape 1920x1080 */
        @media screen and (width: 1920px) and (height: 1080px) {
          .responsiveContainer {
            transform: scale(0.97);
          }
        }
        
        /* Portrait 1080x1920 */
        @media screen and (width: 1080px) and (height: 1920px) {
          .responsiveContainer {
            transform: scale(1.1);
            margin-top: -5vh;
          }
          
          .branding-info {
            top: 40px;
          }
          
          .main::before {
            transform: scale(1); /* No transform scaling */
            transform-origin: center center;
            background-size: 315% 100%; /* Custom background scaling */
          }
        }

        @media screen and (width: 1440px) and (height: 900px) {
          .responsiveContainer {
            transform: scale(0.85);
          }
        }

        @media screen and (width: 1366px) and (height: 768px) {
          .responsiveContainer {
            transform: scale(0.75);
          }
        }

        @media screen and (min-width: 2560px) {
          .responsiveContainer {
            transform: scale(1.3);
            width: min(85%, 1000px);
            height: min(65vh, 800px);
          }
        }

        /* For desktop screens */
        @media screen and (min-width: 1024px) {
          .responsiveContainer {
            margin-top: -10vh; /* Move content 10% up */
          }
          
          h1 {
            font-size: calc(clamp(2.7rem, 4.5vw, 2.52rem) * 1.4); /* Increase size by 40% */
          }
          
          p {
            font-size: calc(clamp(1.44rem, 1.8vw, 1.08rem) * 1.4); /* Increase size by 40% */
          }
          
          button {
            font-size: calc(clamp(1.5rem, 1.5vw, 1.2rem) * 1.4); /* Increase size by 40% */
            padding: 1.68rem 4.9rem; /* Increase padding by 40% */
          }
        }
        
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
        }
        
        /* Tablet-specific positioning for branding info */
        @media screen and (min-width: 768px) and (max-width: 1023px) {
          .branding-info {
            top: calc(50px - 3vh); /* Move slightly up from original position */
            transform: translateX(-50%) scale(0.95); /* Make 5% smaller */
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
      `}</style>
    </main>
  )
}
