'use client'

import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { useSessionStore } from '@/store/session'
import { DEFAULT_AI_PROVIDER } from '@/config/ai-route-config'
import { createUrl } from '@/utils/url'
import { useState, useEffect, useRef, useCallback } from 'react'
import Image from 'next/image'
import { CommunityEntry, getPaginatedCommunityEntries } from '@/utils/communityStorage'

// Number of items to load per page - always exactly 12
const ITEMS_PER_PAGE = 12;

// Placeholder images from the public folder
const PLACEHOLDER_IMAGES = [
  'ComfyUI_temp_tyadf_00213_.jpg',
  'ComfyUI_temp_tyadf_00245_.jpg',
  'ComfyUI_temp_tyadf_00248_.jpg',
  'ComfyUI_temp_tyadf_00281_.jpg',
  'ComfyUI_temp_tyadf_00317_.jpg',
  'ComfyUI_temp_tyadf_00620_.jpg',
  'ComfyUI_temp_tyadf_00622_.jpg',
  'ComfyUI_temp_tyadf_00624_.jpg',
  'ComfyUI_temp_tyadf_00626_.jpg',
  'ComfyUI_temp_tyadf_00628_.jpg',
  'ComfyUI_temp_tyadf_00629_.jpg',
  'ComfyUI_temp_tyadf_00631_.jpg',
  'ComfyUI_temp_tyadf_00632_.jpg',
  'ComfyUI_temp_tyadf_00634_.jpg',
  'ComfyUI_temp_tyadf_00706_.jpg'
];

// Default placeholder image in case of empty string
const DEFAULT_PLACEHOLDER = '/ComfyUI_temp_tyadf_00213_.jpg';

// Generate a unique key with timestamp and random component
const generateUniqueKey = (prefix: string, index: number): string => {
  return `${prefix}-${Date.now()}-${index}-${Math.random().toString(36).substring(2, 9)}`;
};

export default function CommunityGrid() {
  const router = useRouter()
  const resetSession = useSessionStore((state) => state.resetSession)
  const setAiModelProvider = useSessionStore((state) => state.setAiModelProvider)
  
  const [gridItems, setGridItems] = useState<Array<{key: string, id: string, imageUrl: string, isPlaceholder: boolean}>>([]);
  const [page, setPage] = useState<number>(0);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(false);
  const observer = useRef<IntersectionObserver | null>(null);
  
  // State for modal
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  
  // Function to open modal with selected image
  const openModal = (imageUrl: string) => {
    setSelectedImage(imageUrl);
    setModalOpen(true);
    // Prevent scrolling when modal is open
    document.body.style.overflow = 'hidden';
  };
  
  // Function to close modal
  const closeModal = () => {
    setModalOpen(false);
    setSelectedImage(null);
    // Re-enable scrolling
    document.body.style.overflow = 'auto';
  };
  
  // Reference for the last grid item element
  const lastGridItemRef = useCallback((node: HTMLDivElement | null) => {
    if (loading) return;
    
    // Disconnect the previous observer if it exists
    if (observer.current) {
      observer.current.disconnect();
    }
    
    // Create a new observer
    observer.current = new IntersectionObserver(entries => {
      // If the last item is visible and there are more items to load
      if (entries[0].isIntersecting && hasMore) {
        loadMoreItems();
      }
    });
    
    // Observe the last item
    if (node) {
      observer.current.observe(node);
    }
  }, [loading, hasMore]);
  
  // Load community entries with placeholders if needed
  const loadItems = useCallback(async () => {
    if (!hasMore || loading) return;
    
    setLoading(true);
    
    try {
      // Only run on client side
      if (typeof window !== 'undefined') {
        // Get paginated entries from storage
        const { entries, hasMore: moreEntries } = getPaginatedCommunityEntries(page, ITEMS_PER_PAGE);
        
        // Map entries to grid items with unique keys
        const newItems = entries.map((entry, index) => ({
          key: generateUniqueKey('entry', page * ITEMS_PER_PAGE + index),
          id: entry.id,
          imageUrl: entry.imageUrl || DEFAULT_PLACEHOLDER, // Ensure we never have empty strings
          isPlaceholder: false
        }));
        
        // If we have fewer than ITEMS_PER_PAGE, add placeholders to make exactly 12 items
        if (newItems.length < ITEMS_PER_PAGE) {
          const placeholdersNeeded = ITEMS_PER_PAGE - newItems.length;
          
          // Add placeholder items with unique keys
          for (let i = 0; i < placeholdersNeeded; i++) {
            const placeholderIndex = i % PLACEHOLDER_IMAGES.length;
            newItems.push({
              key: generateUniqueKey('placeholder', i),
              id: `placeholder-${i}`,
              imageUrl: `/${PLACEHOLDER_IMAGES[placeholderIndex]}`,
              isPlaceholder: true
            });
          }
        }
        
        // Update state
        setGridItems(prevItems => [...prevItems, ...newItems]);
        setHasMore(moreEntries);
        setPage(prevPage => prevPage + 1);
      }
    } catch (error) {
      console.error('Error loading community entries:', error);
    } finally {
      setLoading(false);
    }
  }, [page, hasMore, loading]);
  
  // Load more items when scrolling
  const loadMoreItems = () => {
    loadItems();
  };
  
  // Initial load
  useEffect(() => {
    loadItems();
  }, [loadItems]);

  const handleStartAgain = () => {
    resetSession()
    setAiModelProvider(DEFAULT_AI_PROVIDER)
    router.push('/page1-home')
  }

  return (
    <main className="main">
      <div className="container">
        <motion.h1 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="title"
          style={{ 
            fontFamily: 'var(--font-b612-mono)', 
            color: '#FFB048',
            fontSize: 'min(max(1.525rem, 3.05vw), 4.04rem)', /* Updated as requested */
            textShadow: '0 0 10px rgba(255, 176, 72, 0.5), 0 0 20px rgba(255, 176, 72, 0.3), 0 0 30px rgba(255, 176, 72, 0.2)'
          }}
        >
          MEET THE OTHER CO-WORKERS
        </motion.h1>
        
        <div className="grid">
          {gridItems.map((item, index) => {
            // Determine if this is the last item to observe for infinite scrolling
            const isLastItem = index === gridItems.length - 1;
            const imageSrc = item.imageUrl || DEFAULT_PLACEHOLDER; // Ensure we never have empty strings
            
            return (
              <div 
                key={item.key} 
                className={`grid-item ${item.isPlaceholder ? 'placeholder' : ''}`}
                ref={isLastItem ? lastGridItemRef : null}
                onClick={() => !item.isPlaceholder && openModal(imageSrc)}
              >
                <div className="image-container">
                  <Image 
                    src={imageSrc}
                    alt={item.isPlaceholder ? 'Placeholder image' : 'Corporate persona'}
                    fill
                    sizes="(max-width: 480px) 120px, (max-width: 768px) 150px, (max-width: 1024px) 200px, 250px"
                    className={`grid-image ${item.isPlaceholder ? 'placeholder-image' : ''}`}
                    priority={index < ITEMS_PER_PAGE} // Prioritize loading the first page of images
                  />
                </div>
                <div className="grid-item-content">
                  {/* Removed the number span */}
                </div>
              </div>
            );
          })}
          
          {loading && (
            <div className="loading-indicator">
              <div className="spinner"></div>
            </div>
          )}
        </div>
      </div>
      
      {/* Button at the bottom of the page */}
      <div className="bottom-button-container">
        <button onClick={handleStartAgain} className="start-again-button">START AGAIN</button>
      </div>
      
      {/* Modal for displaying larger images */}
      {modalOpen && selectedImage && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={closeModal}>&times;</button>
            <div className="modal-image-container">
              <div className="square-container">
                <Image 
                  src={selectedImage}
                  alt="Enlarged corporate persona"
                  fill
                  sizes="(max-width: 768px) 90vw, 80vw"
                  className="modal-image"
                  priority
                />
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .main {
          width: 100vw;
          min-height: 100vh;
          display: flex;
          align-items: flex-start;
          justify-content: center;
          background-color: #000;
          background-image: url('${createUrl('/grid_2.jpg')}');
          background-position: center;
          background-size: cover;
          position: relative;
          overflow-x: hidden;
          padding-top: 0;
          padding-bottom: 120px;
        }

        .container {
          width: 90%;
          max-width: 1400px;
          position: relative;
          z-index: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1.5rem;
          padding: 1rem 0 1rem;
          box-sizing: border-box;
          margin-top: 60px;
        }

        .title {
          font-family: var(--font-b612-mono);
          font-size: min(max(1.525rem, 3.05vw), 4.04rem); /* Updated as requested */
          font-weight: 400;
          letter-spacing: 0.15em;
          line-height: 1.2;
          color: #FFB048;
          text-align: center;
          margin: 0;
          margin-bottom: 1rem;
          text-shadow: 
            0 0 10px rgba(255, 176, 72, 0.5),
            0 0 20px rgba(255, 176, 72, 0.3),
            0 0 30px rgba(255, 176, 72, 0.2);
          position: sticky;
          top: 10px;
          background-color: rgba(0, 0, 0, 0.5);
          padding: 0.8rem;
          border-radius: 10px;
          z-index: 10;
          width: 100%;
          box-sizing: border-box;
        }

        .grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr); /* Default for wide desktop */
          gap: 1rem;
          width: min(100%, 1000px);
          box-sizing: border-box;
          margin: 0 auto;
          position: relative;
          max-height: calc(100vh - 290px);
          overflow-y: auto;
          padding: 0.5rem;
          scrollbar-width: thin;
          scrollbar-color: rgba(255, 255, 255, 0.3) rgba(0, 0, 0, 0.2);
        }
        
        .grid::-webkit-scrollbar {
          width: 8px;
        }
        
        .grid::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.2);
          border-radius: 4px;
        }
        
        .grid::-webkit-scrollbar-thumb {
          background-color: rgba(255, 255, 255, 0.3);
          border-radius: 4px;
        }

        /* Desktop and large tablets */
        @media (max-width: 1200px) and (min-width: 1025px) {
          .grid {
            grid-template-columns: repeat(3, 1fr); /* 3 pictures per row for narrower desktop */
            width: min(100%, 1000px); /* Increased from 800px to accommodate larger images */
            max-height: calc(100vh - 310px);
            gap: 2rem; /* Increased gap for larger images */
          }
          
          .main {
            padding-bottom: 140px;
          }
          
          .grid-item {
            /* Simple size increase without complex transformations */
            width: 100%;
            height: auto;
          }
          
          .grid-item:hover {
            transform: scale(1.05);
            z-index: 2;
          }
        }

        /* Regular tablet styles - separate from narrow desktop */
        @media (max-width: 1024px) and (min-width: 769px) {
          .grid {
            grid-template-columns: repeat(3, 1fr); /* 3 pictures per row for tablets */
            gap: 0.8rem;
            width: min(100%, 700px);
            max-height: calc(100vh - 330px);
          }

          .container {
            padding: 1rem 0 1rem;
            gap: 1.2rem;
          }

          .title {
            font-size: min(max(2rem, 4vw), 3rem);
            margin-bottom: 0.8rem;
            top: 30px;
            padding: 0.6rem;
          }
          
          .start-again-button {
            padding: 1rem 2.5rem;
            font-size: 1.2rem;
          }
          
          .main {
            padding-top: 0;
            padding-bottom: 150px;
          }
          
          .container {
            margin-top: 50px;
          }
          
          .bottom-button-container {
            bottom: 100px;
          }
        }

        @media (max-width: 768px) {
          .container {
            padding: 0.8rem 0 0.8rem;
            margin-top: 40px;
          }

          .title {
            font-size: min(max(1.8rem, 6vw), 2.5rem);
            margin-bottom: 0.6rem;
            top: 25px;
            padding: 0.5rem;
          }

          .start-again-button {
            padding: 1rem 2.5rem;
            font-size: 1.2rem;
          }
          
          .bottom-button-container {
            bottom: 90px;
          }
          
          .main {
            padding-top: 0;
            padding-bottom: 120px;
          }
          
          .grid {
            grid-template-columns: repeat(3, 1fr); /* Keep 3 pictures per row for smaller tablets */
            max-height: calc(100vh - 350px);
            gap: 0.7rem;
          }
        }

        @media (max-width: 480px) {
          .grid {
            grid-template-columns: repeat(2, 1fr); /* 2 pictures per row for mobile */
            gap: 0.6rem;
            max-height: calc(100vh - 370px);
          }

          .grid-item {
            border-radius: 8px;
          }

          .start-again-button {
            padding: 0.8rem 2rem;
            font-size: 1rem;
          }
          
          .main {
            padding-top: 0;
            padding-bottom: 100px;
          }
          
          .container {
            margin-top: 30px;
          }
          
          .title {
            top: 20px;
            padding: 0.4rem;
            font-size: min(max(1.6rem, 5vw), 2.2rem);
          }
          
          .bottom-button-container {
            bottom: 80px;
          }
        }

        .grid-item {
          aspect-ratio: 1;
          border-radius: 10px;
          overflow: hidden;
          box-shadow: 
            0 0 10px rgba(255, 255, 255, 0.2),
            0 0 20px rgba(0, 0, 0, 0.2);
          transition: transform 0.3s ease, box-shadow 0.3s ease;
          cursor: pointer;
          position: relative;
          background-color: transparent;
        }

        .grid-item:hover {
          transform: scale(1.05);
          box-shadow: 
            0 0 15px rgba(255, 255, 255, 0.3),
            0 0 30px rgba(0, 0, 0, 0.3);
        }
        
        .grid-item.placeholder {
          opacity: 1;
        }

        .image-container {
          position: relative;
          width: 100%;
          height: 100%;
          background-color: transparent;
        }

        .grid-image {
          object-fit: cover;
          z-index: 1;
        }
        
        .placeholder-image {
          opacity: 1 !important;
        }

        .grid-item-content {
          position: absolute;
          inset: 0;
          display: flex;
          justify-content: center;
          align-items: center;
          background: rgba(0, 0, 0, 0.2);
          opacity: 0;
          transition: opacity 0.3s ease;
          z-index: 2;
        }

        .grid-item:hover .grid-item-content {
          opacity: 1;
        }

        .loading-indicator {
          grid-column: 1 / -1;
          display: flex;
          justify-content: center;
          padding: 2rem 0;
        }
        
        .spinner {
          width: 40px;
          height: 40px;
          border: 4px solid rgba(255, 255, 255, 0.3);
          border-radius: 50%;
          border-top-color: white;
          animation: spin 1s ease-in-out infinite;
        }
        
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        
        .bottom-button-container {
          position: fixed;
          bottom: 50px;
          left: 0;
          width: 100%;
          display: flex;
          justify-content: center;
          z-index: 100;
        }

        .start-again-button {
          background: transparent;
          border: 2px solid #FFE7C8;
          color: #FFE7C8;
          font-family: var(--font-b612-mono);
          font-size: clamp(1.5rem, 1.5vw, 1.2rem);
          font-weight: 400;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          padding: 1.2rem 3.5rem;
          border-radius: 25px;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 
            0 0 5px rgba(255, 231, 200, 0.5),
            0 0 10px rgba(255, 231, 200, 0.3),
            0 0 15px rgba(255, 231, 200, 0.2);
        }

        .start-again-button:hover {
          background: rgba(255, 231, 200, 0.1);
          box-shadow: 
            0 0 10px rgba(255, 231, 200, 0.6),
            0 0 20px rgba(255, 231, 200, 0.4),
            0 0 30px rgba(255, 231, 200, 0.2);
        }

        .start-again-button:active {
          transform: scale(0.98);
        }

        /* Desktop-only styles for larger squares - simpler approach */
        @media (min-width: 1201px) { /* Changed from 1025px to 1201px to only target wide desktops */
          .grid {
            width: min(100%, 1400px); /* Wider container to accommodate 4 larger squares */
            grid-template-columns: repeat(4, 1fr); /* 4 pictures per row for desktop */
            gap: 2rem;
            padding: 1rem;
          }
          
          .grid-item {
            /* Simple size increase without complex transformations */
            width: 100%;
            height: auto;
          }
          
          .grid-item:hover {
            transform: scale(1.05);
            z-index: 2;
          }
        }
        
        /* Reset hover for desktop to default */
        @media (min-width: 1025px) {
          .grid-item:hover {
            transform: scale(1.05);
            z-index: 2;
          }
        }
        
        /* Modal styles */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.85);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
          backdrop-filter: blur(5px);
        }
        
        .modal-content {
          position: relative;
          width: min(80vw, 80vh);
          height: min(80vw, 80vh);
          max-width: 800px;
          max-height: 800px;
          background-color: transparent;
          border-radius: 10px;
          overflow: hidden;
          box-shadow: 0 0 30px rgba(255, 255, 255, 0.2);
          display: flex;
          justify-content: center;
          align-items: center;
        }
        
        .modal-close {
          position: absolute;
          top: 15px;
          right: 15px;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background-color: rgba(0, 0, 0, 0.7);
          border: 2px solid rgba(255, 255, 255, 0.7);
          color: white;
          font-size: 24px;
          display: flex;
          justify-content: center;
          align-items: center;
          cursor: pointer;
          z-index: 1001;
          transition: all 0.3s ease;
        }
        
        .modal-close:hover {
          background-color: rgba(0, 0, 0, 0.9);
          border-color: white;
          transform: scale(1.1);
        }
        
        .modal-image-container {
          width: 100%;
          height: 100%;
          display: flex;
          justify-content: center;
          align-items: center;
        }
        
        .square-container {
          position: relative;
          width: 100%;
          height: 100%;
          aspect-ratio: 1 / 1;
        }
        
        .modal-image {
          object-fit: cover;
          border-radius: 8px;
        }
        
        @media (max-width: 768px) {
          .modal-content {
            width: min(90vw, 90vh);
            height: min(90vw, 90vh);
          }
          
          .modal-close {
            top: 10px;
            right: 10px;
            width: 35px;
            height: 35px;
            font-size: 20px;
          }
        }
      `}</style>
    </main>
  )
}
