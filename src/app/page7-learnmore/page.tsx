'use client'

import { config } from '@/config'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { useSessionStore } from '@/store/session'
import { DEFAULT_AI_PROVIDER } from '@/config/ai-route-config'

export default function LearnMore() {
  const router = useRouter()
  const resetSession = useSessionStore((state) => state.resetSession)
  const setAiModelProvider = useSessionStore((state) => state.setAiModelProvider)

  const handleStartAgain = () => {
    resetSession()
    setAiModelProvider(DEFAULT_AI_PROVIDER)
    router.push('/page1-home')
  }

  return (
    <>
      <div className="moon-texture" aria-hidden="true" />
      
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
            <b>Fun fact:</b> Did you know we could<br />
            add more information here?
          </p>
        </motion.div>

        <motion.div
          className="button-section"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <button
            className="main-button"
            onClick={handleStartAgain}
          >
            START AGAIN
          </button>
        </motion.div>
      </div>
    </>
  )
}
