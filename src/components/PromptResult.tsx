'use client';

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useUIkit } from '@/hooks/useUIkit';

interface PromptResultProps {
  reading?: string;
  isVisible?: boolean;
  onClose?: () => void;
}

export default function PromptResult({ reading, isVisible = true, onClose }: PromptResultProps) {
  const uikit = useUIkit();

  useEffect(() => {
    if (isVisible && reading && uikit) {
      const modal = uikit.modal('#prompt-result', {
        'bg-close': false,
        'esc-close': false,
        stack: true
      });
      modal?.show();
    }
  }, [isVisible, reading, uikit]);

  if (!uikit) return null;

  return (
    <div id="prompt-result" className="uk-modal-container" data-uk-modal>
      <div className="uk-modal-dialog uk-modal-body uk-margin-auto-vertical uk-light uk-background-secondary uk-border-rounded">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.5 }}
          className="uk-text-center"
        >
          {/* Custom styling to match your theme */}
          <div style={{
            background: 'rgba(0, 0, 0, 0.4)',
            backdropFilter: 'blur(10px)',
            padding: '2rem',
            borderRadius: '25px',
            boxShadow: '0 0 30px rgba(139, 92, 246, 0.3)'
          }}>
            <h2 className="uk-modal-title uk-text-center">Your Oracle Reading</h2>
            <p className="uk-text-large uk-margin-medium-top uk-margin-medium-bottom">
              {reading || 'Generating your reading...'}
            </p>
            {onClose && (
              <button
                className="uk-button uk-button-primary uk-border-rounded uk-margin-small-top"
                onClick={onClose}
                style={{
                  background: 'linear-gradient(to right, rgba(139, 92, 246, 0.8), rgba(76, 29, 149, 0.8))',
                  border: 'none',
                  padding: '0.75rem 2rem',
                  fontSize: '1.1rem',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 0 15px rgba(139, 92, 246, 0.3)',
                }}
              >
                Continue
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
