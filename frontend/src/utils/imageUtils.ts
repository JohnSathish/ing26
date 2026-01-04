/**
 * Image URL utility functions for subdirectory deployment
 */

/**
 * Normalize image URL for subdirectory deployment
 * Handles both root and subdirectory paths
 */
export function getImageUrl(image: string | null | undefined): string {
  if (!image) return '';

  const imageStr = image.trim();
  
  // If already a full URL, return as is
  if (imageStr.startsWith('http://') || imageStr.startsWith('https://')) {
    return imageStr;
  }

  // If starts with /uploads/ or uploads/, normalize to /uploads/
  if (imageStr.startsWith('/uploads/') || imageStr.startsWith('uploads/')) {
    // For subdirectory deployment, keep as /uploads/ (accessible from root)
    return imageStr.startsWith('/') ? imageStr : '/' + imageStr;
  }

  // If it's just a filename, prepend /uploads/images/
  return '/uploads/images/' + imageStr;
}

/**
 * Get image URL for subdirectory deployment
 * Use this when images are in /newsite/uploads/
 */
export function getImageUrlForSubdirectory(image: string | null | undefined): string {
  if (!image) return '';

  const imageStr = image.trim();
  
  // If already a full URL, return as is
  if (imageStr.startsWith('http://') || imageStr.startsWith('https://')) {
    return imageStr;
  }

  // If starts with /uploads/ or uploads/, add /newsite/ prefix
  if (imageStr.startsWith('/uploads/') || imageStr.startsWith('uploads/')) {
    const normalized = imageStr.startsWith('/') ? imageStr : '/' + imageStr;
    // Check if already has /newsite/ prefix
    if (normalized.startsWith('/newsite/')) {
      return normalized;
    }
    return '/newsite' + normalized;
  }

  // If it's just a filename, prepend /newsite/uploads/images/
  return '/newsite/uploads/images/' + imageStr;
}

