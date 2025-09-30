/**
 * Utility functions for the AI Tools Data Pipeline
 */

/**
 * Create a URL-friendly slug from a string
 */
export function createSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters except hyphens
    .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
}

/**
 * Calculate similarity between two strings using Levenshtein distance
 */
export function calculateStringSimilarity(str1: string, str2: string): number {
  if (str1 === str2) return 1;
  
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  
  if (longer.length === 0) return 1;
  
  const distance = levenshteinDistance(longer, shorter);
  return (longer.length - distance) / longer.length;
}

/**
 * Levenshtein distance calculation
 */
function levenshteinDistance(str1: string, str2: string): number {
  const matrix: number[][] = [];
  
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }
  
  return matrix[str2.length][str1.length];
}

/**
 * Normalize a URL for comparison purposes
 */
export function normalizeUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    
    // Remove www prefix
    let hostname = urlObj.hostname;
    if (hostname.startsWith('www.')) {
      hostname = hostname.substring(4);
    }
    
    // Remove trailing slash from pathname
    let pathname = urlObj.pathname;
    if (pathname.endsWith('/') && pathname.length > 1) {
      pathname = pathname.substring(0, pathname.length - 1);
    }
    
    // Construct normalized URL
    return `${urlObj.protocol}//${hostname}${pathname}${urlObj.search}`;
  } catch (error) {
    // If URL parsing fails, return the original string in lowercase
    return url.toLowerCase().trim();
  }
}

/**
 * Extract domain from a URL
 */
export function extractDomain(url: string): string {
  try {
    const urlObj = new URL(url);
    let hostname = urlObj.hostname;
    
    // Remove www prefix
    if (hostname.startsWith('www.')) {
      hostname = hostname.substring(4);
    }
    
    return hostname;
  } catch (error) {
    return '';
  }
}

/**
 * Clean and validate a URL
 */
export function cleanUrl(url: string): string | null {
  if (!url || typeof url !== 'string') {
    return null;
  }
  
  let cleanedUrl = url.trim();
  
  // Add protocol if missing
  if (!/^https?:\/\//i.test(cleanedUrl)) {
    cleanedUrl = `https://${cleanedUrl}`;
  }
  
  try {
    // Validate by creating URL object
    const urlObj = new URL(cleanedUrl);
    return urlObj.toString();
  } catch (error) {
    return null;
  }
}

/**
 * Generate a UUID v4
 */
export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * Sleep for a specified number of milliseconds
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry a function with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000,
  backoffFactor: number = 2
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt === maxRetries) {
        throw lastError;
      }
      
      const delay = baseDelay * Math.pow(backoffFactor, attempt);
      await sleep(delay);
    }
  }
  
  throw lastError!;
}

/**
 * Chunk an array into smaller arrays
 */
export function chunkArray<T>(array: T[], chunkSize: number): T[][] {
  const chunks: T[][] = [];
  
  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize));
  }
  
  return chunks;
}

/**
 * Remove duplicates from array based on key function
 */
export function uniqueBy<T, K>(array: T[], keyFn: (item: T) => K): T[] {
  const seen = new Set<K>();
  return array.filter(item => {
    const key = keyFn(item);
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

/**
 * Flatten nested arrays
 */
export function flatten<T>(arrays: T[][]): T[] {
  return arrays.reduce((acc, array) => acc.concat(array), []);
}

/**
 * Calculate percentage
 */
export function percentage(value: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((value / total) * 100);
}

/**
 * Format bytes to human readable string
 */
export function formatBytes(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Format duration in milliseconds to human readable string
 */
export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  if (ms < 3600000) return `${(ms / 60000).toFixed(1)}m`;
  return `${(ms / 3600000).toFixed(1)}h`;
}

/**
 * Deep merge objects
 */
export function deepMerge<T extends Record<string, any>>(
  target: T,
  ...sources: Partial<T>[]
): T {
  if (!sources.length) return target;
  const source = sources.shift();
  
  if (isObject(target) && isObject(source)) {
    for (const key in source) {
      if (isObject(source[key])) {
        if (!target[key]) Object.assign(target, { [key]: {} });
        deepMerge(target[key], source[key]);
      } else {
        Object.assign(target, { [key]: source[key] });
      }
    }
  }
  
  return deepMerge(target, ...sources);
}

/**
 * Check if value is an object
 */
function isObject(item: any): item is Record<string, any> {
  return item && typeof item === 'object' && !Array.isArray(item);
}

/**
 * Safe JSON parse with fallback
 */
export function safeJsonParse<T = any>(str: string, fallback: T): T {
  try {
    return JSON.parse(str);
  } catch (error) {
    return fallback;
  }
}

/**
 * Truncate string with ellipsis
 */
export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.substring(0, length - 3) + '...';
}

/**
 * Capitalize first letter of string
 */
export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Convert string to title case
 */
export function toTitleCase(str: string): string {
  return str.replace(/\w\S*/g, (txt) => {
    return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
  });
}

/**
 * Check if string is valid email
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Check if string is valid URL
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Escape HTML entities in string
 */
export function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  
  return text.replace(/[&<>"']/g, (m) => map[m]);
}

/**
 * Remove HTML tags from string
 */
export function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '');
}

/**
 * Count words in text
 */
export function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(word => word.length > 0).length;
}

/**
 * Get random item from array
 */
export function randomItem<T>(array: T[]): T | undefined {
  if (array.length === 0) return undefined;
  return array[Math.floor(Math.random() * array.length)];
}

/**
 * Shuffle array (Fisher-Yates algorithm)
 */
export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  
  return shuffled;
}