'use client';

import OrbAnimation from '../components/OrbAnimation';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

export default function TestOrb() {
  const [count, setCount] = useState(5);

  useEffect(() => {
    if (count > 0) {
      const timer = setTimeout(() => setCount(count - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [count]);

  return (
    <div className="relative w-screen h-screen overflow-hidden">
      <div className="absolute inset-0" style={{ 
        zIndex: 1,
        pointerEvents: 'none',
        mixBlendMode: 'screen'
      }}>
        <OrbAnimation />
      </div>
      <motion.div 
        className="absolute inset-0 flex items-center justify-center z-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="text-center">
          <motion.h1
            key={count}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ 
              type: "spring",
              stiffness: 260,
              damping: 20 
            }}
            className="text-8xl font-bold mb-8 text-white"
          >
            {count || "Go!"}
          </motion.h1>
        </div>
      </motion.div>
    </div>
  );
}
