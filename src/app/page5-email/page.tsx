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
          className="input-section"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <input
            type="text"
            className="input-field"
            placeholder="Full Name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />
          <input
            type="email"
            className="input-field"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          {error && (
            <div className="error-message" style={{ color: 'red', marginTop: '10px', textAlign: 'center' }}>
              {error}
            </div>
          )}
        </motion.div>

        <motion.div
          className="button-section"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <button
            className="main-button"
            onClick={handleSubmit}
            disabled={!fullName.trim() || !email.trim() || isSending}
          >
            {isSending ? 'SENDING...' : 'SEND TO EMAIL'}
          </button>
          <button
            className="main-button skip-button"
            onClick={() => router.push('/page6-results')}
          >
            SKIP
          </button>
        </motion.div>
      </div>
    </>
  )
}
