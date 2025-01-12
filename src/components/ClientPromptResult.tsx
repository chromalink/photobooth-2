'use client';

import { motion } from 'framer-motion';

interface PromptResultProps {
  reading?: string;
  isVisible?: boolean;
}

export default function ClientPromptResult({ reading, isVisible = true }: PromptResultProps) {
  if (!isVisible) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5 }}
      className="uk-card uk-card-secondary uk-border-rounded uk-light"
      style={{
        background: 'rgba(0, 0, 0, 0.4)',
        backdropFilter: 'blur(10px)',
        boxShadow: '0 0 30px rgba(139, 92, 246, 0.3)'
      }}
    >
      <div className="uk-card-body uk-text-center">
        <h2 className="uk-card-title uk-text-center">Your Oracle Reading</h2>
        <p className="uk-text-large uk-margin-medium-top uk-margin-medium-bottom">
          {reading || 'Generating your reading...'}
        </p>
      </div>
    </motion.div>
  );
}
