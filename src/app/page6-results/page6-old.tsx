'use client'

import { config } from '@/config'
import { useSessionStore } from '@/store/session'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function Results() {
  const aiResponse = useSessionStore((state) => state.aiResponse)
  const capturedPhoto = useSessionStore((state) => state.capturedPhoto)
  const colorChoice = useSessionStore((state) => state.colorChoice)
  const router = useRouter()

  useEffect(() => {
    if (!aiResponse || !colorChoice) {
      router.push('/')
    }
  }, [aiResponse, colorChoice, router])

  // Debug log to check photo data
  useEffect(() => {
    console.log('Captured photo:', capturedPhoto ? 'Present' : 'Missing')
  }, [capturedPhoto])

  const truncateToWords = (text: string | null, wordCount: number) => {
    if (!text) return ''
    const words = text.split(' ')
    if (words.length <= wordCount) return text
    return words.slice(0, wordCount).join(' ') + '...'
  }

  const truncatedResponse = aiResponse ? truncateToWords(aiResponse, 50) : null

  const getColorFromNumber = (num: number | null): string | null => {
    switch (num) {
      case 1:
        return 'red'
      case 2:
        return 'cyan'
      case 3:
        return 'blue'
      case 4:
        return 'white'
      default:
        return null
    }
  }

  const getAuraTitle = (colorNum: number | null) => {
    const color = getColorFromNumber(colorNum)
    switch (color) {
      case 'red':
        return { text: 'fire spark', className: 'aura-title-red' }
      case 'cyan':
        return { text: 'crystal current', className: 'aura-title-cyan' }
      case 'blue':
        return { text: 'soul tide', className: 'aura-title-blue' }
      case 'white':
        return { text: 'luminous whisper', className: 'aura-title-white' }
      default:
        return { text: 'mystery', className: 'aura-title-white' }
    }
  }

  const aura = getAuraTitle(colorChoice)

  return (
    <>
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="aura-title-section"
        >
          You&apos;re a... <span className={aura.className}>{aura.text}</span><i>!</i>
        </motion.div>

        {capturedPhoto && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="aura-photo-section"
          >
            <img 
              src={capturedPhoto} 
              alt="Your aura photo" 
              className="aura-photo"
              onError={(e) => console.error('Image load error:', e)}
              onLoad={() => console.log('Image loaded successfully')}
            />
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="prompt-result"
        >
          <p className="small-text" style={{ textAlign: 'left' }}>
            {truncatedResponse || 'No reading available yet...'}
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
            onClick={() => console.log('Photo download triggered')}
          >
            DOWNLOAD PHOTO
          </button>
          <button
            className="main-button skip-button"
            onClick={() => router.push('/page7-learnmore')}
          >
            LEARN MORE
          </button>
        </motion.div>
      </div>
    </>
  )
}