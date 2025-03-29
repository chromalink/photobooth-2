'use client'

import { useSessionStore } from '@/store/session'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { DEFAULT_AI_PROVIDER } from '@/config/ai-route-config'

export default function EmailPage() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState('')
  const setUserEmail = useSessionStore((state) => state.setUserEmail)
  const setUserName = useSessionStore((state) => state.setUserName)
  const aiResponse = useSessionStore((state) => state.aiResponse)
  const aiModelImage = useSessionStore((state) => state.aiModelImage)
  const resetSession = useSessionStore((state) => state.resetSession)
  const setAiModelProvider = useSessionStore((state) => state.setAiModelProvider)
  const router = useRouter()

  const handleSubmit = async () => {
    if (!fullName.trim() || !email.trim()) {
      setError('Please fill in both name and email')
      return
    }

    setIsSending(true)
    setError('')

    try {
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
      })

      if (!response.ok) {
        throw new Error('Failed to send email')
      }

      setUserEmail(email)
      setUserName(fullName)
      router.push('/page6-results')
    } catch (err) {
      console.error('Error sending email:', err)
      setError('Failed to send email. Please try again.')
    } finally {
      setIsSending(false)
    }
  }

  return (
    <main className="main">
      <div className="background" />
      <div className="container">
        <h1>PERSONALITY<br/>PHOTOMACHINE</h1>
        
        <div className="form">
          <div className="input-group">
            <input
              type="text"
              placeholder="Saida Saetgar"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
            <input
              type="email"
              placeholder="saesd1694@gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            {error && <div className="error">{error}</div>}
          </div>
          <div className="button-group">
            <button 
              onClick={handleSubmit}
              disabled={isSending || !fullName.trim() || !email.trim()}
              className="primary-button"
            >
              {isSending ? 'SENDING...' : 'SEND TO EMAIL'}
            </button>
            <button 
              onClick={() => {
                resetSession()
                setAiModelProvider(DEFAULT_AI_PROVIDER)
                router.push('/community-grid')
              }}
              className="secondary-button"
              aria-label="Start a new session"
            >
              START AGAIN
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        .main {
          width: 100vw;
          height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: black;
          position: relative;
          overflow: hidden;
        }

        .background {
          position: absolute;
          inset: 0;
          background-image: url('/grid_2.jpg');
          background-position: center;
          background-size: cover;
          opacity: 0.8;
        }

        .container {
          width: 90%;
          max-width: 460px;
          position: relative;
          z-index: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 3.5rem;
        }

        h1 {
          font-family: var(--font-aboreto);
          font-size: min(max(2.5rem, 5vw), 4rem);
          font-weight: 400;
          letter-spacing: 0.15em;
          line-height: 1.2;
          color: white;
          text-align: center;
          margin: 0;
          text-shadow: 
            0 0 10px rgba(255, 255, 255, 0.5),
            0 0 20px rgba(255, 255, 255, 0.3);
        }

        .form {
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: 2.5rem;
        }

        .input-group {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
          width: 100%;
        }

        .button-group {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
          width: 100%;
        }

        input {
          width: 100%;
          background: rgba(0, 0, 0, 0.3);
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-radius: 50px;
          padding: min(max(0.8rem, 1.5vh), 1.2rem) min(max(2rem, 4vw), 3.5rem);
          color: white;
          font-size: min(max(0.9rem, 1.5vw), 1.1rem);
          text-align: center;
          letter-spacing: 0.15em;
          transition: all 0.3s ease;
          backdrop-filter: blur(5px);
          height: auto;
        }

        input::placeholder {
          color: rgba(255, 255, 255, 0.5);
          font-size: min(max(0.9rem, 1.5vw), 1.1rem);
          letter-spacing: 0.05em;
        }

        input:focus {
          outline: none;
          border-color: white;
          box-shadow: 
            0 0 5px rgba(255, 255, 255, 0.5),
            0 0 15px rgba(255, 255, 255, 0.3);
        }

        .error {
          color: #ff6b6b;
          font-size: min(max(0.8rem, 1.2vw), 0.9rem);
          text-align: center;
          margin-top: 0.5rem;
          letter-spacing: 0.05em;
        }

        .primary-button,
        .secondary-button {
          width: 100%;
          background: transparent;
          border: 2px solid white;
          color: white;
          font-size: min(max(0.9rem, 1.5vw), 1.1rem);
          padding: min(max(0.8rem, 1.5vh), 1.2rem) min(max(2rem, 4vw), 3.5rem);
          border-radius: 50px;
          cursor: pointer;
          transition: all 0.3s ease;
          letter-spacing: 0.15em;
          font-weight: 400;
          height: auto;
          box-shadow: 
            0 0 5px rgba(255, 255, 255, 0.5),
            0 0 10px rgba(255, 255, 255, 0.3),
            0 0 20px rgba(255, 255, 255, 0.2),
            inset 0 0 5px rgba(255, 255, 255, 0.1);
          text-shadow: 0 0 5px rgba(255, 255, 255, 0.5);
          position: relative;
        }

        .primary-button:hover,
        .secondary-button:hover {
          background: rgba(255, 255, 255, 0.1);
          box-shadow: 
            0 0 5px rgba(255, 255, 255, 0.7),
            0 0 15px rgba(255, 255, 255, 0.5),
            0 0 30px rgba(255, 255, 255, 0.3),
            inset 0 0 10px rgba(255, 255, 255, 0.2);
          text-shadow: 0 0 8px rgba(255, 255, 255, 0.7);
          transform: scale(1.02);
        }

        .primary-button:active,
        .secondary-button:active {
          transform: scale(0.98);
        }

        .primary-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none;
        }

        .primary-button:disabled:hover {
          background: transparent;
          box-shadow: 
            0 0 5px rgba(255, 255, 255, 0.5),
            0 0 10px rgba(255, 255, 255, 0.3),
            0 0 20px rgba(255, 255, 255, 0.2),
            inset 0 0 5px rgba(255, 255, 255, 0.1);
          transform: none;
        }

        @media (max-width: 480px) {
          .container {
            gap: 2rem;
          }
          
          h1 {
            font-size: min(max(2rem, 8vw), 2.5rem);
          }
          
          .form {
            gap: 1.5rem;
          }
          
          .input-group,
          .button-group {
            gap: 1rem;
          }
          
          input {
            font-size: min(max(0.8rem, 3.5vw), 1rem);
            padding: min(max(0.7rem, 1.2vh), 1rem) min(max(1.8rem, 3.5vw), 2.5rem);
          }

          input::placeholder {
            font-size: min(max(0.8rem, 3.5vw), 1rem);
          }
          
          .primary-button,
          .secondary-button {
            font-size: min(max(0.8rem, 3.5vw), 1rem);
            padding: min(max(0.7rem, 1.2vh), 1rem) min(max(1.8rem, 3.5vw), 2.5rem);
          }
        }
      `}</style>
    </main>
  )
}
