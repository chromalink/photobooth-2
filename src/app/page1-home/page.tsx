'use client'

import { config } from '../../config'
import { useSessionStore } from '../../store/session'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { AI_ROUTE_CONFIGS, AIProvider, DEFAULT_AI_PROVIDER } from '../../config/ai-route-config'

export default function Home() {
  const router = useRouter()
  const setStep = useSessionStore((state) => state.setStep)
  const resetSession = useSessionStore((state) => state.resetSession)
  const setAiModelProvider = useSessionStore((state) => state.setAiModelProvider)
  const aiModelProvider = useSessionStore((state) => state.aiModelProvider)

  // Set default provider only when it's null
  useEffect(() => {
    console.log('Current AI Provider:', aiModelProvider)
    if (!aiModelProvider) {
      console.log('Setting default AI provider:', DEFAULT_AI_PROVIDER)
      setAiModelProvider(DEFAULT_AI_PROVIDER)
    }
  }, [aiModelProvider, setAiModelProvider])

  const handleStart = () => {
    console.log('Starting with AI provider:', aiModelProvider)
    // Store current provider before reset
    const currentProvider = aiModelProvider
    resetSession()
    // Restore the current provider after reset
    if (currentProvider) {
      setAiModelProvider(currentProvider)
    }
    setStep('capture')
    router.push('/page2-orb1')
  }

  const handleProviderChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newProvider = e.target.value as AIProvider;
    console.log('Changing AI provider to:', newProvider);
    setAiModelProvider(newProvider);
  }

  return (
    <>
      <div className="moon-texture" aria-hidden="true" />
      
      {/* Circle with glowing bottom edge */}
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
          {/* Base gradient circle */}
          <circle
            cx="50"
            cy="15"
            r="50"
            fill="url(#circleGradient)"
          />
          {/* Glowing stroke circle */}
          <circle
            cx="50"
            cy="15"
            r="50"
            fill="none"
            stroke="white"
            strokeWidth="0.01"
            filter="url(#glowFilter)"
          />
        </g>
      </svg>
      
      <div className="main-container">
        <motion.h1
          className="title-section"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          {config.app.name}
        </motion.h1>

        <motion.div
          className="description-section"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <p>
            Curious to find out what<br />
            AI thinks your natural<br />
            state of being is?
          </p>

          {/* AI Model Selection Dropdown */}
          <motion.div
            className="ai-model-select"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <select
              onChange={handleProviderChange}
              defaultValue={DEFAULT_AI_PROVIDER}
              className="bg-transparent border border-white/20 rounded-lg px-4 py-2 text-white/80 focus:outline-none focus:border-white/40 transition-colors"
              style={{
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
              }}
            >
              {Object.entries(AI_ROUTE_CONFIGS).map(([key, config]) => (
                <option key={key} value={key} className="bg-black/90 text-white">
                  {config.displayName}
                </option>
              ))}
            </select>
          </motion.div>
        </motion.div>

        <motion.div
          className="button-section"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <button
            className="main-button"
            onClick={handleStart}
          >
            Find Out
          </button>
        </motion.div>
      </div>
    </>
  )
}
