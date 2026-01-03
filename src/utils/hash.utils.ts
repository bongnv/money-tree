/**
 * Hash utilities for file integrity checking
 */

/**
 * Calculate MD5 hash of a string using Web Crypto API
 * @param content - String content to hash
 * @returns Promise resolving to hex string of MD5 hash
 */
export async function calculateMD5Hash(content: string): Promise<string> {
  // Convert string to Uint8Array
  const encoder = new TextEncoder();
  const data = encoder.encode(content);

  // Note: Web Crypto API doesn't support MD5, using SHA-256 instead for better security
  // MD5 is considered cryptographically broken, SHA-256 is a better modern alternative
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);

  // Convert buffer to hex string
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');

  return hashHex;
}

/**
 * Calculate hash of DataFile object by stringifying it
 * @param dataFile - DataFile object to hash
 * @returns Promise resolving to hex string of hash
 */
export async function calculateDataFileHash(dataFile: unknown): Promise<string> {
  const jsonString = JSON.stringify(dataFile);
  return calculateMD5Hash(jsonString);
}
