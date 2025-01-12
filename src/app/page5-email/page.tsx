'use client'

import { config } from '@/config'
import { useSessionStore } from '@/store/session'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function EmailPage() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState('')
  const setUserEmail = useSessionStore((state) => state.setUserEmail)
  const setUserName = useSessionStore((state) => state.setUserName)
  const aiResponse = useSessionStore((state) => state.aiResponse)
  const aiModelImage = useSessionStore((state) => state.aiModelImage)
  const router = useRouter()

  const handleSubmit = async () => {
    if (!fullName.trim() || !email.trim()) {
      setError('Please fill in both name and email')
      return
    }

    setIsSending(true)
    setError('')

    try {
      // Send email
      const response = await fetch('/api/email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fullName,
          email,
          aiResponse,
          imageUrl: aiModelImage,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send email');
      }

      // Store user info in session
      setUserEmail(email)
      setUserName(fullName)

      // Navigate to results page
      router.push('/page6-results')
    } catch (err) {
      console.error('Error sending email:', err)
      setError('Failed to send email. Please try again or skip.')
    } finally {
      setIsSending(false)
    }
  }

  return (
    <>
      <div className="moon-texture" aria-hidden="true" />
      
      <div className="uk-container uk-container-xsmall uk-height-1-1 uk-flex uk-flex-middle uk-flex-center" style={{ minHeight: '100vh', padding: '40px 20px' }}>
        <div className="uk-width-large uk-text-center">
          <motion.h1
            className="uk-heading-medium uk-text-bold uk-margin-large-bottom"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            style={{
              background: 'linear-gradient(45deg, #fff, #a8a8a8)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              lineHeight: '1.4'
            }}
          >
            {config.app.name}
          </motion.h1>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="uk-margin-medium-bottom"
          >
            <div className="uk-margin-medium-bottom">
              <input
                type="text"
                className="uk-input uk-form-large uk-border-pill uk-text-center"
                placeholder="Full Name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  color: 'white',
                  backdropFilter: 'blur(10px)',
                }}
              />
            </div>
            <div className="uk-margin-medium-bottom">
              <input
                type="email"
                className="uk-input uk-form-large uk-border-pill uk-text-center"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  color: 'white',
                  backdropFilter: 'blur(10px)',
                }}
              />
            </div>
            {error && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="uk-text-danger uk-margin-small-top"
              >
                {error}
              </motion.div>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="uk-margin-medium-bottom"
          >
            <button
              onClick={handleSubmit}
              disabled={!fullName.trim() || !email.trim() || isSending}
              className="uk-button uk-button-primary uk-button-large uk-border-pill uk-width-1-1 uk-margin-small-bottom"
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
              {isSending ? (
                <div className="uk-flex uk-flex-middle uk-flex-center">
                  <div data-uk-spinner="ratio: 0.8" className="uk-margin-small-right"></div>
                  SENDING...
                </div>
              ) : (
                'SEND TO EMAIL'
              )}
            </button>
            <button
              onClick={() => router.push('/page6-results')}
              className="uk-button uk-button-default uk-button-large uk-border-pill uk-width-1-1"
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                color: 'white',
                backdropFilter: 'blur(10px)',
                transition: 'all 0.3s ease',
              }}
            >
              SKIP
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
        :global(.uk-button-default:hover) {
          background: rgba(255, 255, 255, 0.2) !important;
          border-color: rgba(255, 255, 255, 0.3) !important;
          transform: translateY(-2px);
        }
        :global(.uk-input:focus) {
          background: rgba(255, 255, 255, 0.15) !important;
          border-color: rgba(139, 92, 246, 0.5) !important;
        }
      `}</style>
    </>
  )
}
