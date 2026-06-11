/**
 * Extract YouTube video ID from various URL formats
 * Supports:
 * - youtube.com/watch?v=VIDEO_ID
 * - youtu.be/VIDEO_ID
 * - youtube.com/embed/VIDEO_ID
 * - URLs with additional query parameters
 */
export function extractYouTubeId(url: string): string | null {
  if (!url) return null;
  
  // Try standard watch URL: youtube.com/watch?v=VIDEO_ID
  const watchMatch = url.match(/(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})(?:[&?]|$)/);
  if (watchMatch) {
    return watchMatch[1];
  }
  
  // Try short URL: youtu.be/VIDEO_ID
  const shortMatch = url.match(/(?:youtu\.be\/)([a-zA-Z0-9_-]{11})(?:[?]|$)/);
  if (shortMatch) {
    return shortMatch[1];
  }
  
  // Try embed URL: youtube.com/embed/VIDEO_ID
  const embedMatch = url.match(/(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})(?:[?]|$)/);
  if (embedMatch) {
    return embedMatch[1];
  }
  
  // Fallback: less strict pattern for any youtube domain
  const fallbackMatch = url.match(/(?:youtube\.com\/.*[?&]v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]+)/);
  if (fallbackMatch) {
    return fallbackMatch[1].slice(0, 11); // YouTube IDs are always 11 characters
  }
  
  return null;
}

/**
 * Create an embed URL from a video ID
 */
export function createEmbedUrl(videoId: string, autoplay: boolean = false): string {
  const params = new URLSearchParams();
  if (autoplay) {
    params.set('autoplay', '1');
  }
  
  const queryString = params.toString();
  return `https://www.youtube.com/embed/${videoId}${queryString ? `?${queryString}` : ''}`;
}

/**
 * Check if a URL is a valid YouTube URL
 */
export function isYouTubeUrl(url: string): boolean {
  return extractYouTubeId(url) !== null;
}
