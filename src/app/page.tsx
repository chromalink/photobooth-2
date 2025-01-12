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
      
      <div className="uk-container uk-container-xsmall uk-height-1-1 uk-flex uk-flex-middle uk-flex-center" style={{ minHeight: '100vh', padding: '40px 20px', overflow: 'auto' }}>
        <div className="uk-width-large uk-text-center">
          <motion.h1
            className="uk-heading-medium uk-text-bold uk-margin-large-bottom"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            style={{
              background: 'linear-gradient(45deg, #fff, #a8a8a8)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
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
            <div className="uk-inline uk-width-1-1">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Enter password"
                className="uk-input uk-form-large uk-border-pill uk-text-center"
                disabled={isLoading}
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  color: 'white',
                  backdropFilter: 'blur(10px)',
                }}
              />
              {error && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="uk-text-danger uk-margin-small-top"
                >
                  {error}
                </motion.div>
              )}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <button
              onClick={handleSubmit}
              disabled={isLoading}
              className="uk-button uk-button-primary uk-button-large uk-border-pill uk-width-1-1"
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
              {isLoading ? (
                <div data-uk-spinner="ratio: 0.8"></div>
              ) : (
                'Forward'
              )}
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
        :global(.uk-input:focus) {
          background: rgba(255, 255, 255, 0.15) !important;
          border-color: rgba(139, 92, 246, 0.5) !important;
        }
      `}</style>
    </>
  )
}
