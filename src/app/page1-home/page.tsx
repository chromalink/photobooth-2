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
            <button onClick={handleStart}>FIND OUT</button>
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
          font-size: clamp(3.0rem, 5vw, 2.8rem);
          font-weight: 400;
          font-family: var(--font-michroma);
          letter-spacing: 0.1em;
          line-height: 1.1em;
          color: #FFB048;
          margin: 0;
          padding: 0;
        }

        p {
          font-size: clamp(1.6rem, 2vw, 1.2rem);
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

        @media screen and (width: 1920px) and (height: 1080px) {
          .responsiveContainer {
            transform: scale(0.97);
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
      `}</style>
    </main>
  )
}
