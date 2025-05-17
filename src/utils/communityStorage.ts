/**
 * Utility for storing and retrieving community photos
 */

// Type definition for a community entry
export interface CommunityEntry {
  id: string;
  imageUrl: string;
  timestamp: number;
}

// Generate a unique ID for each entry
const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
};

// Key for localStorage
const STORAGE_KEY = 'chromalink-community-entries';

/**
 * Simple function to compress a data URL by reducing size and quality
 */
const compressImageSync = (dataUrl: string): string => {
  if (!dataUrl.startsWith('data:image') || typeof window === 'undefined') {
    return dataUrl;
  }
  
  try {
    // Create temporary elements for synchronous compression
    const img = new Image();
    img.src = dataUrl;
    
    // If image isn't loaded, return original
    if (!img.complete || !img.width || !img.height) {
      return dataUrl;
    }
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return dataUrl;
    
    // Resize to smaller dimensions for storage
    const maxSize = 200; // Even smaller for storage
    const ratio = Math.min(maxSize / img.width, maxSize / img.height);
    canvas.width = Math.floor(img.width * ratio);
    canvas.height = Math.floor(img.height * ratio);
    
    // Draw and compress
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.5); // Lower quality (50%)
  } catch (error) {
    console.warn('Image compression failed:', error);
    return dataUrl;
  }
};

/**
 * Save a new community entry to localStorage
 */
export const saveCommunityEntry = (imageUrl: string): CommunityEntry | null => {
  try {
    // Try to reduce the data URL size by extracting just the base64 part
    let processedUrl = imageUrl;
    
    // For data URLs, we'll just use the original image without resizing
    // This ensures the image isn't too small in the grid square
    if (imageUrl.startsWith('data:image')) {
      // Only apply minimal compression to reduce file size without changing dimensions
      try {
        const tempImg = new Image();
        tempImg.src = imageUrl;
        
        // Check if image is loaded
        if (tempImg.complete && tempImg.width > 0 && tempImg.height > 0) {
          const canvas = document.createElement('canvas');
          // Keep original dimensions
          canvas.width = tempImg.width;
          canvas.height = tempImg.height;
          
          const ctx = canvas.getContext('2d');
          if (ctx) {
            // Draw at original size
            ctx.drawImage(tempImg, 0, 0, tempImg.width, tempImg.height);
            // Only apply quality reduction (80% quality) to save some space
            processedUrl = canvas.toDataURL('image/jpeg', 0.8);
          }
        }
      } catch (e) {
        console.warn('Failed to process image:', e);
        // Continue with original URL
      }
    }
    
    // Create new entry
    const newEntry: CommunityEntry = {
      id: generateId(),
      imageUrl: processedUrl,
      timestamp: Date.now(),
    };

    // Get existing entries
    const existingEntries = getCommunityEntries();
    
    // Check if this is a duplicate (simple check)
    const isDuplicate = existingEntries.some(entry => {
      // If URLs match exactly
      if (entry.imageUrl === processedUrl) return true;
      
      // If timestamps are very close (within 5 seconds)
      return Math.abs(entry.timestamp - newEntry.timestamp) < 5000;
    });
    
    // Skip if duplicate
    if (isDuplicate) {
      console.log('Skipping duplicate image');
      return existingEntries[0] || newEntry;
    }
    
    // Add new entry to the beginning of the array
    let updatedEntries = [newEntry, ...existingEntries];
    
    // Try saving with different numbers of entries
    const tryToSave = (entries: CommunityEntry[]): boolean => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
        return true;
      } catch (e) {
        return false;
      }
    };
    
    // First try with all entries (max 10)
    if (updatedEntries.length > 10) {
      updatedEntries = updatedEntries.slice(0, 10);
    }
    
    // Try to save with progressively fewer entries
    if (tryToSave(updatedEntries)) {
      console.log(`Saved community entry (total: ${updatedEntries.length})`);
      return newEntry;
    }
    
    // Try with 5 entries
    if (updatedEntries.length > 5) {
      updatedEntries = updatedEntries.slice(0, 5);
      if (tryToSave(updatedEntries)) {
        console.log('Saved with 5 entries due to storage constraints');
        return newEntry;
      }
    }
    
    // Try with just 2 entries
    if (updatedEntries.length > 2) {
      updatedEntries = updatedEntries.slice(0, 2);
      if (tryToSave(updatedEntries)) {
        console.log('Saved with 2 entries due to storage constraints');
        return newEntry;
      }
    }
    
    // Last resort: just the new entry
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([newEntry]));
      console.log('Saved only the current entry due to storage constraints');
      return newEntry;
    } catch (e) {
      console.error('Failed to save even a single entry');
      return null;
    }
  } catch (error) {
    console.error('Error in saveCommunityEntry:', error);
    return null;
  }
};

/**
 * Get all community entries from localStorage
 */
export const getCommunityEntries = (): CommunityEntry[] => {
  try {
    const entriesJson = localStorage.getItem(STORAGE_KEY);
    return entriesJson ? JSON.parse(entriesJson) : [];
  } catch (error) {
    console.error('Error retrieving community entries:', error);
    return [];
  }
};

/**
 * Get a paginated subset of community entries
 */
export const getPaginatedCommunityEntries = (
  page: number,
  pageSize: number
): { entries: CommunityEntry[]; hasMore: boolean } => {
  const allEntries = getCommunityEntries();
  const startIndex = page * pageSize;
  const endIndex = startIndex + pageSize;
  const entries = allEntries.slice(startIndex, endIndex);
  
  return {
    entries,
    hasMore: endIndex < allEntries.length
  };
};

/**
 * Clear all community entries from localStorage
 */
export const clearCommunityEntries = (): void => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Error clearing community entries:', error);
  }
};
