'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { useSessionStore } from '@/store/session'
import { generateSpiritualReading } from '@/utils/openai'
import OrbAnimation from '../components/OrbAnimation'

const COLORS: Record<number, string> = {
  1: 'red',
  2: 'cyan',
  3: 'blue',
  4: 'white'
} as const;

export default function Orb2() {
  const router = useRouter()
  const capturedPhoto = useSessionStore((state) => state.capturedPhoto)
  const colorChoice = useSessionStore((state) => state.colorChoice)
  const setAiResponse = useSessionStore((state) => state.setAiResponse)
  const setAiModelImage = useSessionStore((state) => state.setAiModelImage)
  const setError = useSessionStore((state) => state.setError)
  const uploadedPhotoUrl = useSessionStore((state) => state.uploadedPhotoUrl)
  const isProcessing = useSessionStore((state) => state.isProcessing)
  const setIsProcessing = useSessionStore((state) => state.setIsProcessing)
  const hasStartedProcessing = useSessionStore((state) => state.hasStartedProcessing)
  const setHasStartedProcessing = useSessionStore((state) => state.setHasStartedProcessing)
  const resetProcessingState = useSessionStore((state) => state.resetProcessingState)
  const aiModelProvider = useSessionStore((state) => state.aiModelProvider)
  const [progress, setProgress] = useState(0)
  const [visualProgress, setVisualProgress] = useState(1)

  // Add ref to track first mount
  const isFirstMount = useRef(true)

  // Reset processing state when component mounts
  useEffect(() => {
    if (isFirstMount.current) {
      console.log('Resetting processing state on first mount...')
      console.log('Current AI provider:', aiModelProvider)
      resetProcessingState()
      isFirstMount.current = false
    }
  }, []) // Keep empty deps array

  // Visual progress counter
  useEffect(() => {
    const timer = setInterval(() => {
      setVisualProgress(prev => prev < 99 ? prev + 1 : prev)
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  // Main processing effect
  useEffect(() => {
    // Skip if already processing or missing data
    if (isProcessing || hasStartedProcessing || !uploadedPhotoUrl) {
      console.log('Skipping processing:', {
        isProcessing,
        hasStartedProcessing,
        hasUploadedPhoto: !!uploadedPhotoUrl,
        currentProvider: aiModelProvider
      })
      return
    }

    let isSubscribed = true
    const color = 'white' // Default to white since we're skipping color pick

    const processUserInput = async () => {
      try {
        // Set initial states
        setIsProcessing(true)
        setHasStartedProcessing(true)
        setError('')

        console.log('Starting processing with:', {
          color,
          uploadedPhotoUrl: uploadedPhotoUrl.slice(0, 50) + '...',
          provider: aiModelProvider
        })

        if (!isSubscribed) return
        setProgress(10)
        console.log('Starting AI processes with color:', color)

        const basePrompt = `beautiful illustration, ornate, colourful palette, spiritual energy, aura, portrait, fantasy. Happy, uplifting, positive. Oil painting, futuristic, serene, radiant..`
        
        const selectedRoute = aiModelProvider === 'comfyui' ? '/api/comfyui' : '/api/midjourney-discord'
        console.log('Starting image generation with:', {
          provider: aiModelProvider,
          route: selectedRoute,
          imageUrl: uploadedPhotoUrl.slice(0, 50) + '...',
          promptPreview: basePrompt.slice(0, 50) + '...'
        })

        try {
          // Start both AI processes in parallel
          const [aiResponse, imageResponse] = await Promise.all([
            // OpenAI process
            generateSpiritualReading(color).then(response => {
              console.log('OpenAI response received:', {
                responseLength: response?.length,
                preview: response?.slice(0, 100) + '...'
              })
              if (!response) {
                throw new Error('No response from OpenAI')
              }
              return response
            }),

            // Image generation process based on selected provider
            fetch(selectedRoute, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(
                aiModelProvider === 'comfyui' 
                ? {
                    imageUrl: uploadedPhotoUrl,
                    prompt: basePrompt
                  }
                : {
                    prompt: `${uploadedPhotoUrl} ${basePrompt}`
                  }
              )
            }).then(async response => {
              console.log(`Received response from ${aiModelProvider}:`, {
                status: response.status,
                ok: response.ok
              })
              if (!response.ok) {
                const errorText = await response.text()
                console.error('Image generation API error:', errorText)
                throw new Error('Failed to generate image: ' + errorText)
              }
              const data = await response.json()
              console.log('Raw image response:', {
                provider: aiModelProvider,
                data: data
              })
              
              if (aiModelProvider === 'comfyui' && data.upscaledResult.promptId) {
                // Start polling for the image
                const pollInterval = 2000 // Poll every 2 seconds
                const maxAttempts = 60 // Maximum 2 minutes of polling
                let attempts = 0
                
                while (attempts < maxAttempts) {
                  const statusResponse = await fetch(data.upscaledResult.statusEndpoint)
                  if (!statusResponse.ok) {
                    throw new Error('Failed to check image status')
                  }
                  
                  const statusData = await statusResponse.json()
                  if (statusData.completed && statusData.imageUrl) {
                    return {
                      success: true,
                      upscaledResult: {
                        imageUrl: statusData.imageUrl
                      }
                    }
                  }
                  
                  await new Promise(resolve => setTimeout(resolve, pollInterval))
                  attempts++
                }
                
                throw new Error('Image generation timed out')
              }
              
              return data
            })
          ])

          if (!isSubscribed) return
          // Validate responses
          if (!aiResponse) {
            throw new Error('No response from OpenAI')
          }
          
          console.log('Validating image response:', {
            provider: aiModelProvider,
            response: imageResponse
          })
          
          if (!imageResponse?.success || !imageResponse?.upscaledResult?.imageUrl) {
            console.error('Invalid image response structure:', {
              provider: aiModelProvider,
              response: imageResponse
            })
            throw new Error('Invalid image generation response')
          }

          console.log('Setting responses in state...')
          
          // Update states sequentially to ensure they're set before navigation
          await Promise.all([
            new Promise<void>(resolve => {
              setAiResponse(aiResponse)
              resolve()
            }),
            new Promise<void>(resolve => {
              setAiModelImage(imageResponse.upscaledResult.imageUrl)
              resolve()
            })
          ])

          setProgress(100)
          
          // Small delay to ensure state updates are processed
          await new Promise(resolve => setTimeout(resolve, 100))
          
          console.log('Processing complete, navigating to email page')
          if (isSubscribed) {
            router.push('/page5-email')
          }

        } catch (error) {
          console.error('Error in AI processes:', error)
          throw error
        }

      } catch (error) {
        if (!isSubscribed) return
        console.error('Processing error:', error)
        setProgress(0)
        setError(error instanceof Error ? error.message : 'Failed to process your request')
        setIsProcessing(false)
        setHasStartedProcessing(false)
      }
    }

    // Call processUserInput immediately
    processUserInput()

    return () => {
      isSubscribed = false
      setIsProcessing(false)
    }
  }, [uploadedPhotoUrl, isProcessing, hasStartedProcessing, aiModelProvider, setAiResponse, setAiModelImage, setError, setIsProcessing, setHasStartedProcessing]) // Add all required dependencies

  return (
    <>
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
    </>
  )
}
