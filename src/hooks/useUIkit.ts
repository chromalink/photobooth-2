'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

// Dynamically import UIkit with no SSR
const UIkit = dynamic(() => import('@/lib/uikit'), { ssr: false });

export function useUIkit() {
  const [uikit, setUIkit] = useState<any>(null);

  useEffect(() => {
    // Initialize UIkit on client side only
    if (typeof window !== 'undefined') {
      import('@/lib/uikit').then((module) => {
        setUIkit(module.default);
      });
    }
  }, []);

  return uikit;
}

// Utility functions for common UIkit operations
export const showNotification = (message: string, status: 'primary' | 'success' | 'warning' | 'danger' = 'primary') => {
  if (typeof window !== 'undefined' && UIkit) {
    UIkit.notification({
      message,
      status,
      pos: 'top-right',
      timeout: 5000
    });
  }
};

export const showModal = (id: string) => {
  if (typeof window !== 'undefined' && UIkit) {
    const modal = UIkit.modal(`#${id}`);
    if (modal) {
      modal.show();
    }
  }
};

export const hideModal = (id: string) => {
  if (typeof window !== 'undefined' && UIkit) {
    const modal = UIkit.modal(`#${id}`);
    if (modal) {
      modal.hide();
    }
  }
};
