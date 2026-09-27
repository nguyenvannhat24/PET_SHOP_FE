/**
 * Utility function to format and resolve image/avatar URLs.
 * Handles both relative paths (/uploads/...) and legacy absolute localhost paths,
 * ensuring seamless display in both local development and production domains (HTTPS).
 */
export const getImageUrl = (path, fallback = '') => {
  if (!path) return fallback;

  // Clean string
  let cleaned = String(path).trim();

  // If path contains localhost:5000 or localhost with port, strip it out so it's a relative path
  if (cleaned.includes('localhost:5000')) {
    cleaned = cleaned.replace(/^https?:\/\/localhost:5000/i, '');
  }

  // If it's already an external absolute URL (e.g. cloudinary, unsplash), keep it
  if (cleaned.startsWith('http://') || cleaned.startsWith('https://')) {
    return cleaned;
  }

  // In local Vite dev without proxy (when running frontend standalone on port 5173 against port 5000)
  if (typeof window !== 'undefined' && window.location.port === '5173') {
    return `http://localhost:5000${cleaned.startsWith('/') ? cleaned : '/' + cleaned}`;
  }

  // In production (Docker, Nginx, HTTPS domain) or proxied environment:
  // Return relative path which browser resolves against current host/domain
  return cleaned.startsWith('/') ? cleaned : `/${cleaned}`;
};

export default getImageUrl;
