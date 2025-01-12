'use client'

import { config } from '@/config'
import { useSessionStore } from '@/store/session'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { DEFAULT_AI_PROVIDER } from '@/config/ai-route-config'

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
    <>
      <div className="main-container" style={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        padding: '2rem'
      }}>
        {isLoading ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="loading-container"
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100vh',
              gap: '20px'
            }}
          >
            <div className="loading-spinner" style={{
              width: '50px',
              height: '50px',
              border: '5px solid #f3f3f3',
              borderTop: '5px solid #3498db',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }} />
            <p className="loading-text" style={{
              fontSize: '1.2rem',
              color: '#fff',
              textAlign: 'center'
            }}>
              Creating your magical portrait...
            </p>
          </motion.div>
        ) : (
          <>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="aura-title-section"
              style={{
                marginBottom: '2rem'
              }}
            >
              You&apos;re a... <span className={aura.className}>{aura.text}</span><i>!</i>
            </motion.div>

            <div style={{ 
              display: 'flex', 
              flexDirection: 'row', 
              gap: '2rem',
              alignItems: 'center',
              justifyContent: 'center',
              width: '100%',
              padding: '2rem',
              flex: 1,
              minHeight: '60vh'
            }}>
              {imageUrl && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="aura-photo-section"
                  style={{ 
                    width: '50%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    alignSelf: 'stretch'
                  }}
                >
                  {imageError ? (
                    <div style={{ color: 'red', textAlign: 'center' }}>
                      {imageError}
                      <br />
                      <button 
                        onClick={() => window.location.reload()} 
                        style={{ 
                          marginTop: '1rem',
                          padding: '0.5rem 1rem',
                          backgroundColor: 'rgba(255, 255, 255, 0.1)',
                          border: 'none',
                          borderRadius: '0.5rem',
                          color: 'white',
                          cursor: 'pointer'
                        }}
                      >
                        Retry
                      </button>
                    </div>
                  ) : (
                    <img 
                      src={imageUrl} 
                      alt="Your aura photo" 
                      className="aura-photo"
                      onError={(e) => {
                        console.error('Image load error:', e)
                        setImageError('Failed to load image')
                      }}
                      onLoad={() => {
                        console.log('Image loaded successfully')
                        setImageError(null)
                      }}
                      style={{ 
                        maxWidth: '100%',
                        maxHeight: '60vh',
                        objectFit: 'contain'
                      }}
                    />
                  )}
                  <div style={{ marginTop: '1rem' }}>
                    <button 
                      onClick={handleDownload}
                      style={{
                        padding: '0.5rem 1rem',
                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                        border: 'none',
                        borderRadius: '0.5rem',
                        color: 'white',
                        cursor: 'pointer'
                      }}
                    >
                      Download Image
                    </button>
                  </div>
                </motion.div>
              )}

              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '2rem',
                width: '50%',
                alignSelf: 'center'
              }}>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                  className="prompt-result"
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    padding: '2rem',
                    borderRadius: '1rem'
                  }}
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
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1rem',
                    alignItems: 'center'
                  }}
                >
                  <button
                    className="main-button skip-button"
                    onClick={() => {
                      resetSession()
                      setAiModelProvider(DEFAULT_AI_PROVIDER)
                      router.push('/page1-home')
                    }}
                    style={{
                      padding: '2rem 4rem',
                      fontSize: '2rem',
                      width: 'auto'
                    }}
                  >
                    START AGAIN
                  </button>
                </motion.div>
              </div>
            </div>
          </>
        )}
      </div>

      <style jsx global>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </>
  )
}
