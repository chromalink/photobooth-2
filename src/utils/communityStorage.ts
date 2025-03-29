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
 * Save a new community entry to localStorage
 */
export const saveCommunityEntry = (imageUrl: string): CommunityEntry => {
  try {
    // Create new entry
    const newEntry: CommunityEntry = {
      id: generateId(),
      imageUrl,
      timestamp: Date.now(),
    };

    // Get existing entries
    const existingEntries = getCommunityEntries();
    
    // Add new entry to the beginning of the array
    const updatedEntries = [newEntry, ...existingEntries];
    
    // Save to localStorage
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedEntries));
    
    return newEntry;
  } catch (error) {
    console.error('Error saving community entry:', error);
    throw error;
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
