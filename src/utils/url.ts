/**
 * Get the base URL for the application
 * This handles both development and production environments
 */
export function getBaseUrl(): string {
  // In development, use localhost
  if (process.env.NODE_ENV === 'development') {
    return process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:4000';
  }
  
  // In production, return empty string for relative paths
  return '';
}

/**
 * Create a URL by combining the base URL with a path
 * In production, this will return relative paths
 */
export function createUrl(path: string): string {
  const baseUrl = getBaseUrl();
  if (!baseUrl) {
    // In production, just return the path
    return path.startsWith('/') ? path : `/${path}`;
  }
  
  // In development, combine base URL with path
  const cleanBaseUrl = baseUrl.replace(/\/$/, '');
  const cleanPath = path.replace(/^\//, '');
  return `${cleanBaseUrl}/${cleanPath}`;
}
