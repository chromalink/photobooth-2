'use client'

import { config } from '../../config'
import { useSessionStore } from '../../store/session'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { AIProvider, DEFAULT_AI_PROVIDER } from '../../config/ai-route-config'

export default function Home() {
  const router = useRouter()
  const setStep = useSessionStore((state) => state.setStep)
  const resetSession = useSessionStore((state) => state.resetSession)
  const setAiModelProvider = useSessionStore((state) => state.setAiModelProvider)
  const aiModelProvider = useSessionStore((state) => state.aiModelProvider)

  useEffect(() => {
    console.log('Current AI Provider:', aiModelProvider)
    if (!aiModelProvider) {
      console.log('Setting default AI provider:', DEFAULT_AI_PROVIDER)
      setAiModelProvider(DEFAULT_AI_PROVIDER)
    }
  }, [aiModelProvider, setAiModelProvider])

  const handleStart = () => {
    console.log('Starting with AI provider:', aiModelProvider)
    const currentProvider = aiModelProvider
    resetSession()
    if (currentProvider) {
      setAiModelProvider(currentProvider)
    }
    setStep('capture')
    router.push('/page2-orb1')
  }

  return (
    <>
      <div className="moon-texture" aria-hidden="true" />
      
      <svg 
        className="gradient-circle-container"
        style={{
          position: 'fixed',
          width: '100vw',
          height: '100vh',
          left: 0,
          top: 0,
          pointerEvents: 'none',
          zIndex: -1,
          background: 'transparent'
        }}
        viewBox="0 0 100 100"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <radialGradient id="circleGradient" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(0, 0, 0, 0)" />
            <stop offset="0%" stopColor="rgba(0, 0, 0, 0)" />
            <stop offset="100%" stopColor="rgba(0, 0, 0, 1)" />
          </radialGradient>
          <filter id="glowFilter">
            <feGaussianBlur in="SourceAlpha" stdDeviation="1"/>
            <feOffset dx="0" dy="2" result="offsetblur"/>
            <feFlood floodColor="white" floodOpacity="0.8"/>
            <feComposite in2="offsetblur" operator="in"/>
            <feMerge>
              <feMergeNode/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        <g>
          <circle cx="50" cy="15" r="50" fill="url(#circleGradient)" />
          <circle cx="50" cy="15" r="50" fill="none" stroke="white" strokeWidth="0.01" filter="url(#glowFilter)" />
        </g>
      </svg>
      
      <div className="uk-container uk-container-xsmall uk-height-1-1 uk-flex uk-flex-middle uk-flex-center" style={{ minHeight: '100vh', padding: '40px 20px', overflow: 'auto' }}>
        <div className="uk-width-large uk-text-center">
          <motion.h1
            className="uk-heading-medium uk-text-bold uk-margin-large-bottom"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            style={{
              background: 'linear-gradient(45deg, #fff, #a8a8a8)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}
          >
            {config.app.name}
          </motion.h1>

          <motion.div
            className="uk-margin-medium-bottom"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <p className="uk-text-large uk-margin-medium-bottom uk-light">
              Curious to find out what<br />
              AI thinks your natural<br />
              state of being is?
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <button
              onClick={handleStart}
              className="uk-button uk-button-primary uk-button-large uk-border-pill uk-width-1-1"
              style={{
                background: 'linear-gradient(45deg, rgba(139, 92, 246, 0.8), rgba(76, 29, 149, 0.8))',
                border: 'none',
                padding: '15px 40px',
                fontSize: '1.2rem',
                backdropFilter: 'blur(10px)',
                transition: 'all 0.3s ease',
                boxShadow: '0 4px 15px rgba(139, 92, 246, 0.3)',
              }}
            >
              Find Out
            </button>
          </motion.div>
        </div>
      </div>

      <style jsx>{`
        :global(.uk-button-primary:hover) {
          background: linear-gradient(45deg, rgba(139, 92, 246, 0.9), rgba(76, 29, 149, 0.9)) !important;
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(139, 92, 246, 0.4) !important;
        }
      `}</style>
    </>
  )
}
