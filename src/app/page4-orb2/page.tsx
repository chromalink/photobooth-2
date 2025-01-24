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
          fetch('/api/generate-reading', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              imageUrl: uploadedPhotoUrl
            })
          }).then(async res => {
            if (!res.ok) {
              const errorText = await res.text();
              console.error('Generate reading API error:', errorText);
              throw new Error('Failed to generate reading: ' + errorText);
            }
            const data = await res.json();
            if (!data.response) {
              console.error('Invalid generate reading response:', data);
              throw new Error('Invalid reading response');
            }
            return data.response;
          }),
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
        if (!imageResponse?.upscaledResult?.promptId) {
          console.error('Invalid ComfyUI response:', imageResponse)
          throw new Error('No promptId received from ComfyUI')
        }
        
        console.log('Starting to poll with promptId:', imageResponse.upscaledResult.promptId)
        
        // Start polling for the image
        const pollInterval = 2000
        const maxAttempts = 60
        let attempts = 0
        
        while (attempts < maxAttempts) {
          if (!isSubscribed) return
          
          console.log(`Polling attempt ${attempts + 1}/${maxAttempts}...`)
          
          const statusResponse = await fetch(`/api/comfyui-status?promptId=${imageResponse.upscaledResult.promptId}`)
          if (!statusResponse.ok) {
            throw new Error('Failed to check image status')
          }
          
          const statusData = await statusResponse.json()
          console.log('Status response:', statusData)
          
          if (statusData.completed && statusData.imageUrl) {
            console.log('Image generation completed:', statusData.imageUrl)
            setAiModelImage(statusData.imageUrl)
            setVisualProgress(100)
            router.push('/page6-results')
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
    <div className="main">
      {/* Video Background */}
      <div className="video-background">
        <video 
          autoPlay 
          loop 
          muted 
          playsInline
          className="background-video"
        >
          <source src="/Loading_animation_screen.mp4" type="video/mp4" />
        </video>
      </div>

      {/* Top Title */}
      <div className="title">
        <h1>COMPILING AMBITION.EXE...</h1>
      </div>

      {/* Bottom Text */}
      <div className="bottom-text">
        <p>Sorry, it takes a minute to add all<br/>the zeros to your bank account</p>
      </div>

      {/* Centered Progress Counter */}
      <div className="progress-container">
        <motion.div 
          className="progress-overlay"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ 
            duration: 0.5,
            ease: "easeOut"
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'radial-gradient(circle at center, rgba(0, 0, 0, 0.3), transparent 70%)',
            padding: '6rem',
            borderRadius: '50%',
            width: '80vw',
            height: '80vh',
            maxWidth: '1200px',
            maxHeight: '1200px'
          }}
        >
          <motion.div 
            className="progress-text"
            animate={{
              textShadow: [
                "0 0 20px rgba(255, 255, 255, 0.5), 0 0 40px rgba(255, 255, 255, 0.3), 0 0 60px rgba(255, 255, 255, 0.2)",
                "0 0 40px rgba(255, 255, 255, 0.6), 0 0 80px rgba(255, 255, 255, 0.4), 0 0 120px rgba(255, 255, 255, 0.3)",
                "0 0 20px rgba(255, 255, 255, 0.5), 0 0 40px rgba(255, 255, 255, 0.3), 0 0 60px rgba(255, 255, 255, 0.2)"
              ],
              opacity: [0.8, 1, 0.8]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            style={{
              fontFamily: 'var(--font-aboreto)',
              fontSize: '5vh',
              color: 'white',
              fontWeight: 400,
              letterSpacing: '0.05em',
              mixBlendMode: 'overlay',
              WebkitTextStroke: '2px rgba(255, 255, 255, 0.3)',
              lineHeight: 1,
              textAlign: 'center',
              margin: 0,
              padding: 0
            }}
          >
            {visualProgress}%
          </motion.div>
        </motion.div>
      </div>

      <style jsx>{`
        .main {
          width: 100vw;
          height: 100vh;
          position: relative;
          display: flex;
          flex-direction: column;
          background: black;
          margin: 0;
          padding: 0;
          overflow: hidden;
          box-shadow: 
            inset 0 0 50px rgba(255, 255, 255, 0.1),
            inset 0 0 100px rgba(255, 255, 255, 0.05),
            0 0 50px rgba(255, 255, 255, 0.1),
            0 0 100px rgba(255, 255, 255, 0.05);
        }

        .video-background {
          position: absolute;
          inset: 0;
          z-index: 0;
        }

        .background-video {
          position: absolute;
          width: 100%;
          height: 100%;
          object-fit: cover;
          opacity: 0.8;
        }

        .title {
          position: absolute;
          top: 8vh;
          left: 0;
          right: 0;
          z-index: 1;
          text-align: center;
          padding: 0 max(20px, 5vw);
        }

        .bottom-text {
          position: absolute;
          bottom: 15em;
          left: 0;
          right: 0;
          z-index: 1;
          text-align: center;
          padding: 0 max(20px, 5vw);
        }

        h1 {
          font-size: clamp(1.95rem, 2.9vw, 2.5rem);
          font-weight: 300;
          font-family: var(--font-aboreto);
          letter-spacing: 0.25em;
          color: white;
          margin: 0;
          text-shadow: 0 0 15px rgba(255, 255, 255, 0.4);
          text-transform: uppercase;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 90vw;
          margin: 0 auto;
        }

        p {
          font-size: clamp(2.2rem, 2.5vw, 1.8rem);
          color: white;
          font-weight: 300;
          font-family: var(--font-arapey);
          font-style: italic;
          line-height: 1.6;
          opacity: 0.95;
          letter-spacing: 0.03em;
          margin: 0;
          text-shadow: 
            0 0 10px rgba(255, 255, 255, 0.4),
            0 0 20px rgba(255, 255, 255, 0.25),
            0 0 30px rgba(255, 255, 255, 0.15),
            0 0 40px rgba(255, 255, 255, 0.1);
          filter: drop-shadow(0 0 5px rgba(255, 255, 255, 0.15));
        }

        .progress-container {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10;
          pointer-events: none;
        }

        @media (max-width: 768px) {
          .title {
            top: 13vh;
            padding: 0 15px;
          }

          .bottom-text {
            bottom: 5vh;
            padding: 0 15px;
          }
          
          h1 {
            font-size: clamp(1.56rem, 5.2vw, 1.95rem);
            letter-spacing: 0.2em;
          }
        }

        @media (max-width: 480px) {
          .title {
            top: 13vh;
            padding: 0 15px;
          }

          .bottom-text {
            bottom: 5vh;
            padding: 0 15px;
          }
          
          h1 {
            font-size: clamp(1.56rem, 5.2vw, 1.95rem);
            letter-spacing: 0.2em;
          }
        }
      `}</style>
    </div>
  )
}
