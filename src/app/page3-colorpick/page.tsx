'use client'

import { config } from '@/config'
import { useSessionStore } from '@/store/session'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function ColorPick() {
  const router = useRouter()
  const setColorChoice = useSessionStore((state) => state.setColorChoice)
  const [selectedColor, setSelectedColor] = useState<number | null>(null)

  const handleColorSelect = (colorNum: number) => {
    setSelectedColor(colorNum)
    setColorChoice(colorNum)
  }

  const handleContinue = () => {
    if (selectedColor !== null) {
      router.push('/page4-orb2')
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
          className="description-section description-section-higher"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <p className="medium-text">
            Ooh, look at these fiery eyes! The room lit up<br />
            as soon as you stepped in!<br /><br />
            Let me guess... you resonate with the color red?<br />
            Is that true?<br /><br />
            Choose the color that speaks to you...
          </p>
        </motion.div>

        <motion.div
          className="choices-section"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          {[
            { num: 1, color: 'red' },
            { num: 2, color: 'cyan' },
            { num: 3, color: 'blue' },
            { num: 4, color: 'white' }
          ].map(({ num, color }) => (
            <button
              key={num}
              className={`color-choice ${color} ${selectedColor === num ? 'selected' : ''}`}
              onClick={() => handleColorSelect(num)}
            >
              {/* {num} uncomment to show the button number */} 
              
            </button>
          ))}
        </motion.div>

        <motion.div
          className="button-section"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <button
            className="main-button"
            onClick={handleContinue}
            disabled={selectedColor === null}
          >
            GET MY SOUL SNAP
          </button>
        </motion.div>
      </div>
    </>
  )
}
