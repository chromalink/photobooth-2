'use client'

import { config } from '@/config'
import { useSessionStore } from '@/store/session'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { DEFAULT_AI_PROVIDER } from '@/config/ai-route-config'
import ClientPromptResult from '@/components/ClientPromptResult';

export default function Results() {
  const aiResponse = useSessionStore((state) => state.aiResponse)
  const capturedPhoto = useSessionStore((state) => state.capturedPhoto)
  const aiModelImage = useSessionStore((state) => state.aiModelImage)
  const colorChoice = useSessionStore((state) => state.colorChoice)
  const resetSession = useSessionStore((state) => state.resetSession)
  const setAiModelProvider = useSessionStore((state) => state.setAiModelProvider)
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [imageError, setImageError] = useState<string | null>(null)
  const [imageUrl, setImageUrl] = useState<string | null>(null)

  useEffect(() => {
    if (aiModelImage) {
      // Create proxy URL
      const proxyUrl = `/api/comfyui-image?url=${encodeURIComponent(aiModelImage)}`;
      // Convert to absolute URL
      const url = new URL(proxyUrl, window.location.origin);
      setImageUrl(url.toString());
      console.log('Set image URL to:', url.toString());
    } else {
      setImageUrl(null);
    }
  }, [aiModelImage])

  const handleDownload = async () => {
    if (imageUrl) {
      try {
        // Fetch the image with appropriate mode
        const response = await fetch(imageUrl, {
          mode: 'cors',
          credentials: 'omit'
        })

        if (!response.ok) {
          throw new Error(`Failed to fetch image: ${response.statusText}`)
        }

        const blob = await response.blob()
        const blobUrl = URL.createObjectURL(blob)

        const link = document.createElement('a')
        link.href = blobUrl
        link.download = 'chromalink-aura-photo.png'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(blobUrl)
      } catch (error) {
        console.error('Download failed:', error)
        setImageError('Failed to download image. Please try again.')
      }
    }
  }

  useEffect(() => {
    setIsLoading(true)
    setImageError(null)

    if (imageUrl) {
      console.log('Loading image from:', imageUrl)

      const img = new Image()
      img.crossOrigin = 'anonymous'

      img.onload = () => {
        console.log('Image loaded successfully')
        setIsLoading(false)
        setImageError(null)
      }

      img.onerror = async (e) => {
        console.error('Image load error:', e)
        setIsLoading(false)
        setImageError('Failed to load image. Please try refreshing the page.')

        // Try to diagnose the issue
        try {
          const response = await fetch(imageUrl, {
            mode: 'cors',
            credentials: 'omit'
          })

          if (!response.ok) {
            console.error('Image fetch failed:', response.status, response.statusText)
          }
        } catch (error) {
          console.error('Image fetch error:', error)
        }
      }

      img.src = imageUrl
    } else {
      setIsLoading(false)
      setImageError('No image available')
    }
  }, [imageUrl])

  // Debug log
  useEffect(() => {
    if (aiModelImage) {
      console.log('Current image URL:', aiModelImage)
    } else {
      console.log('No image URL available')
    }
  }, [aiModelImage])

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
    <div className="uk-container uk-container-expand uk-height-viewport uk-padding uk-flex uk-flex-column">
      {isLoading ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="uk-flex uk-flex-column uk-flex-middle uk-flex-center uk-height-viewport"
        >
          <div className="uk-margin">
            <div className="uk-spinner" data-uk-spinner="ratio: 2"></div>
          </div>
          <p className="uk-text-lead uk-text-center uk-light">
            Creating your magical portrait...
          </p>
        </motion.div>
      ) : (
        <>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="uk-text-center uk-margin-medium-bottom"
          >
            <h1 className="uk-heading-small">
              You&apos;re a... <span className={aura.className}>{aura.text}</span><i>!</i>
            </h1>
          </motion.div>

          <div className="uk-grid uk-grid-medium uk-flex-middle uk-child-width-1-2@m" data-uk-grid>
            {imageUrl && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="uk-flex uk-flex-column uk-flex-middle"
              >
                {imageError ? (
                  <div className="uk-text-danger uk-text-center">
                    <p>{imageError}</p>
                    <button 
                      onClick={() => window.location.reload()} 
                      className="uk-button uk-button-default uk-button-small uk-margin-small-top uk-light"
                    >
                      Retry
                    </button>
                  </div>
                ) : (
                  <div className="uk-inline-clip uk-transition-toggle">
                    <img 
                      src={imageUrl} 
                      alt="Your aura photo" 
                      className="uk-transition-scale-up uk-transition-opaque"
                      onError={(e) => {
                        console.error('Image load error:', e)
                        setImageError('Failed to load image')
                      }}
                      onLoad={() => {
                        console.log('Image loaded successfully')
                        setImageError(null)
                      }}
                      style={{ 
                        maxHeight: '60vh',
                        width: 'auto'
                      }}
                    />
                  </div>
                )}
                <button 
                  onClick={handleDownload}
                  className="uk-button uk-button-default uk-margin-small-top uk-light"
                >
                  Download Image
                </button>
              </motion.div>
            )}

            <div className="uk-flex uk-flex-column uk-flex-middle">
              <div className="uk-width-1-1">
                <ClientPromptResult 
                  reading={aiResponse || undefined} 
                  isVisible={!!aiResponse}
                />
              </div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="uk-margin-medium-top"
              >
                <button
                  onClick={() => {
                    resetSession()
                    setAiModelProvider(DEFAULT_AI_PROVIDER)
                    router.push('/page1-home')
                  }}
                  className="uk-button uk-button-primary uk-button-large uk-border-pill uk-box-shadow-large"
                  style={{
                    background: 'linear-gradient(to right, rgba(139, 92, 246, 0.8), rgba(76, 29, 149, 0.8))',
                    padding: '1.5rem 3rem',
                    fontSize: '1.5rem',
                    transition: 'all 0.3s ease',
                  }}
                >
                  START AGAIN
                </button>
              </motion.div>
            </div>
          </div>
        </>
      )}

      <style jsx>{`
        :global(.uk-spinner) {
          color: rgba(139, 92, 246, 0.8);
        }
        :global(.uk-button-primary:hover) {
          background: linear-gradient(to right, rgba(139, 92, 246, 0.9), rgba(76, 29, 149, 0.9)) !important;
          transform: translateY(-2px);
          box-shadow: 0 10px 25px rgba(139, 92, 246, 0.4) !important;
        }
        :global(.uk-light) {
          color: rgba(255, 255, 255, 0.9);
        }
      `}</style>
    </div>
  )
}
