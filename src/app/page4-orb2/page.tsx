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
  const setAiResponse = useSessionStore((state) => state.setAiResponse)
  const setAiModelImage = useSessionStore((state) => state.setAiModelImage)
  const setError = useSessionStore((state) => state.setError)
  const [visualProgress, setVisualProgress] = useState(1)
  const processStartedRef = useRef(false)

  // Reset processing state when component mounts
  useEffect(() => {
    console.log('Resetting processing state...')
    setIsProcessing(false)
    setHasStartedProcessing(false)
    resetProcessingState()
    return () => {
      processStartedRef.current = false
    }
  }, [resetProcessingState, setIsProcessing, setHasStartedProcessing]) 

  // Visual progress counter
  useEffect(() => {
    const timer = setInterval(() => {
      setVisualProgress(prev => prev < 99 ? prev + 1 : prev)
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  // Main processing effect
  useEffect(() => {
    if (!uploadedPhotoUrl || processStartedRef.current) {
      console.log('Skipping processing:', {
        hasUploadedPhoto: !!uploadedPhotoUrl,
        processStarted: processStartedRef.current
      })
      return
    }

    let isSubscribed = true
    processStartedRef.current = true

    const processUserInput = async () => {
      try {
        console.log('Starting processing...')
        setIsProcessing(true)
        setHasStartedProcessing(true)
        setError('')

        const basePrompt = `beautiful illustration, ornate, colourful palette, spiritual energy, aura, portrait, fantasy. Happy, uplifting, positive. Oil painting, futuristic, serene, radiant..`
        
        console.log('Starting AI processes...')
        
        // Start both AI processes in parallel
        const [aiResponse, imageResponse] = await Promise.all([
          generateSpiritualReading('white'),
          fetch('/api/comfyui', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              imageUrl: uploadedPhotoUrl,
              prompt: basePrompt
            })
          }).then(async response => {
            if (!response.ok) {
              const errorText = await response.text()
              console.error('ComfyUI API error:', errorText)
              throw new Error('Failed to generate image: ' + errorText)
            }
            return response.json()
          })
        ])

        if (!isSubscribed) return

        console.log('Got responses:', { aiResponse, imageResponse })

        // Set the AI text response
        setAiResponse(aiResponse)
        
        // Check if we got a promptId for polling
        if (!imageResponse?.promptId) {
          console.error('Invalid ComfyUI response:', imageResponse)
          throw new Error('No promptId received from ComfyUI')
        }
        
        console.log('Starting to poll with promptId:', imageResponse.promptId)
        
        // Start polling for the image
        const pollInterval = 2000
        const maxAttempts = 60
        let attempts = 0
        
        while (attempts < maxAttempts) {
          if (!isSubscribed) return
          
          console.log(`Polling attempt ${attempts + 1}/${maxAttempts}...`)
          
          const statusResponse = await fetch(`/api/comfyui-status?promptId=${imageResponse.promptId}`)
          if (!statusResponse.ok) {
            throw new Error('Failed to check image status')
          }
          
          const statusData = await statusResponse.json()
          console.log('Status response:', statusData)
          
          if (statusData.completed && statusData.imageUrl) {
            console.log('Image generation completed:', statusData.imageUrl)
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
      } catch (error) {
        console.error('Error in processing:', error)
        setError(error instanceof Error ? error.message : 'An error occurred')
        setIsProcessing(false)
        setHasStartedProcessing(false)
        processStartedRef.current = false
      }
    }

    processUserInput()

    return () => {
      isSubscribed = false
      setIsProcessing(false)
    }
  }, [uploadedPhotoUrl, setAiResponse, setAiModelImage, setError, setIsProcessing, setHasStartedProcessing, router])

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
