'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { useSessionStore } from '@/store/session'
import { generateSpiritualReading } from '@/utils/openai'
import OrbAnimation from '../components/OrbAnimation'

export default function Orb2() {
  const router = useRouter()
  const uploadedPhotoUrl = useSessionStore((state) => state.uploadedPhotoUrl)
  const isProcessing = useSessionStore((state) => state.isProcessing)
  const setIsProcessing = useSessionStore((state) => state.setIsProcessing)
  const hasStartedProcessing = useSessionStore((state) => state.hasStartedProcessing)
  const setHasStartedProcessing = useSessionStore((state) => state.setHasStartedProcessing)
  const resetProcessingState = useSessionStore((state) => state.resetProcessingState)
  const aiModelProvider = useSessionStore((state) => state.aiModelProvider)
  const setAiResponse = useSessionStore((state) => state.setAiResponse)
  const setAiModelImage = useSessionStore((state) => state.setAiModelImage)
  const setError = useSessionStore((state) => state.setError)
  const [visualProgress, setVisualProgress] = useState(1)

  // Reset processing state when component mounts
  useEffect(() => {
    console.log('Resetting processing state...')
    resetProcessingState()
  }, []) 

  // Visual progress counter
  useEffect(() => {
    const timer = setInterval(() => {
      setVisualProgress(prev => prev < 99 ? prev + 1 : prev)
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  // Main processing effect
  useEffect(() => {
    if (isProcessing || hasStartedProcessing || !uploadedPhotoUrl) {
      console.log('Skipping processing:', {
        isProcessing,
        hasStartedProcessing,
        hasUploadedPhoto: !!uploadedPhotoUrl
      })
      return
    }

    let isSubscribed = true

    const processUserInput = async () => {
      try {
        setIsProcessing(true)
        setHasStartedProcessing(true)
        setError('')

        const basePrompt = `beautiful illustration, ornate, colourful palette, spiritual energy, aura, portrait, fantasy. Happy, uplifting, positive. Oil painting, futuristic, serene, radiant..`
        
        const selectedRoute = '/api/comfyui'
        
        // Start both AI processes in parallel
        const [aiResponse, imageResponse] = await Promise.all([
          generateSpiritualReading('white'),
          fetch(selectedRoute, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              imageUrl: uploadedPhotoUrl,
              prompt: basePrompt
            })
          }).then(async response => {
            if (!response.ok) {
              throw new Error('Failed to generate image: ' + await response.text())
            }
            return response.json()
          })
        ])

        if (!isSubscribed) return

        setAiResponse(aiResponse)
        
        if (imageResponse.upscaledResult?.promptId) {
          const statusEndpoint = `/api/comfyui-status?promptId=${imageResponse.upscaledResult.promptId}`
          
          // Start polling for the image
          const pollInterval = 2000
          const maxAttempts = 60
          let attempts = 0
          
          while (attempts < maxAttempts) {
            const statusResponse = await fetch(statusEndpoint)
            const statusData = await statusResponse.json()
            
            if (statusData.completed && statusData.imageUrl) {
              setAiModelImage(statusData.imageUrl)
              router.push('/page5-email')
              break
            }
            
            if (attempts === maxAttempts - 1) {
              throw new Error('Image generation timed out')
            }
            
            await new Promise(resolve => setTimeout(resolve, pollInterval))
            attempts++
          }
        }
      } catch (error) {
        console.error('Error in processing:', error)
        setError(error instanceof Error ? error.message : 'An error occurred')
        setIsProcessing(false)
        setHasStartedProcessing(false)
      }
    }

    processUserInput()

    return () => {
      isSubscribed = false
      setIsProcessing(false)
    }
  }, [uploadedPhotoUrl, isProcessing, hasStartedProcessing, aiModelProvider, setAiResponse, setAiModelImage, setError, setIsProcessing, setHasStartedProcessing, router])

  return (
    <div className="relative min-h-screen">
      <OrbAnimation progress={visualProgress} />
      
      {/* UI Layer */}
      <div className="relative" style={{ zIndex: 2 }}>
        <motion.div
          className="description-section"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="countdown">
            {visualProgress}%
          </div>
          <p className="description-text">
            {visualProgress >= 99 ? "Almost there..." : "Processing your aura..."}
          </p>
        </motion.div>

        <motion.div
          className="description-at-button"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <p className="medium-text">
            Creating your unique spiritual reading...
          </p>
        </motion.div>
      </div>
    </div>
  )
}
