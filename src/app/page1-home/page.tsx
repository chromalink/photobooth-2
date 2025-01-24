'use client'

import { useSessionStore } from '../../store/session'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
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
      <div className="content">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <h1>PERSONALITY<br />PHOTOMACHINE</h1>
          <p>Ever wondered what's your true essence<br />and a path to success?</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <button onClick={handleStart}>
            FIND OUT
          </button>
        </motion.div>
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
          background-image: url('/optimized_main_screen.jpg');
          background-position: center;
          background-repeat: no-repeat;
          background-size: cover;
          opacity: 0.8;
        }

        .content {
          position: relative;
          z-index: 1;
          text-align: center;
          padding: 0 max(20px, 5vw);
          width: min(100%, 1200px);
          margin: 0 auto;
        }

        h1 {
          font-size: min(max(2.5rem, 5vw), 4rem);
          font-weight: 400;
          font-family: var(--font-aboreto);
          letter-spacing: 0.15em;
          line-height: 1.1em;
          color: white;
          margin: 0 0 min(1.5rem, 3vh);
          text-shadow: 0 0 10px rgba(255, 255, 255, 0.3);
        }

        p {
          font-size: min(max(1rem, 1.8vw), 1.25rem);
          color: white;
          font-weight: 300;
          font-family: var(--font-arapey);
          font-style: italic;
          line-height: 1.6;
          opacity: 0.9;
          letter-spacing: 0.02em;
          margin: 0 0 min(2rem, 4vh);
        }

        button {
          background: transparent;
          border: 2px solid white;
          color: white;
          font-size: min(max(0.9rem, 1.5vw), 1.1rem);
          padding: min(max(0.8rem, 1.5vh), 1.2rem) min(max(2rem, 4vw), 3.5rem);
          border-radius: 50px;
          cursor: pointer;
          transition: all 0.3s ease;
          letter-spacing: 0.15em;
          font-weight: 400;
          box-shadow: 
            0 0 5px rgba(255, 255, 255, 0.5),
            0 0 10px rgba(255, 255, 255, 0.3),
            0 0 20px rgba(255, 255, 255, 0.2),
            inset 0 0 5px rgba(255, 255, 255, 0.1);
          text-shadow: 0 0 5px rgba(255, 255, 255, 0.5);
          position: relative;
        }

        button:hover {
          background: rgba(255, 255, 255, 0.1);
          box-shadow: 
            0 0 5px rgba(255, 255, 255, 0.7),
            0 0 15px rgba(255, 255, 255, 0.5),
            0 0 30px rgba(255, 255, 255, 0.3),
            inset 0 0 10px rgba(255, 255, 255, 0.2);
          text-shadow: 0 0 8px rgba(255, 255, 255, 0.7);
          transform: scale(1.02);
        }

        button:active {
          transform: scale(0.98);
        }

        @media (max-width: 480px) {
          .content {
            padding: 0 15px;
          }
          
          h1 {
            font-size: min(max(2rem, 8vw), 2.5rem);
          }
          
          p {
            font-size: min(max(0.9rem, 4vw), 1.1rem);
            margin-bottom: 4vh;
          }
          
          button {
            font-size: min(max(0.8rem, 3.5vw), 1rem);
            padding: min(max(0.7rem, 1.2vh), 1rem) min(max(1.8rem, 3.5vw), 2.5rem);
          }
        }
      `}</style>
    </main>
  )
}
