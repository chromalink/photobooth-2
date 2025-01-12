'use client'

import { config } from '../config'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function PasswordProtected() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async () => {
    try {
      setIsLoading(true)
      setError('')

      const response = await fetch('/api/validate-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      })

      const data = await response.json()

      if (data.isValid) {
        router.push('/page1-home')
      } else {
        setError('Incorrect password')
      }
    } catch (err) {
      setError('An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit()
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
          className="description-section"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="input-container">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Enter password"
              className="input-box"
              disabled={isLoading}
            />
            {error && <div className="error-message">{error}</div>}
          </div>
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
            disabled={isLoading}
          >
            {isLoading ? 'Checking...' : 'Forward'}
          </button>
        </motion.div>
      </div>
    </>
  )
}
