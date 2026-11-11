import React from 'react';

export const DEFAULT_FALLBACK_IMAGE = '/assets/images/news_world_summit_1793801922828.jpg';

// Guaranteed embedded SVG fallback that NEVER fails (requires zero network or server requests)
export const EMBEDDED_FALLBACK_SVG =
  "data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='450' viewBox='0 0 800 450'%3E%3Crect width='800' height='450' fill='%23101d35'/%3E%3Crect x='30' y='30' width='740' height='390' rx='12' fill='%23172554' stroke='%232563eb' stroke-width='2'/%3E%3Cpath d='M340 180h120v90H340z' fill='%233b82f6' opacity='0.3'/%3E%3Ccircle cx='380' cy='210' r='18' fill='%2360a5fa'/%3E%3Cpath d='M350 260l25-30 20 20 25-35 30 45H350z' fill='%2393c5fd'/%3E%3Ctext x='400' y='325' font-family='sans-serif' font-size='24' font-weight='bold' fill='%23ffffff' text-anchor='middle'%3EPRIME NEWS GRAPH%3C/text%3E%3Ctext x='400' y='355' font-family='sans-serif' font-size='14' fill='%2394a3b8' text-anchor='middle'%3EGlobal Digital Journalism Desk%3C/text%3E%3C/svg%3E";

export const CDN_FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?auto=format&fit=crop&w=1200&q=80';

export const PRESET_NEWS_IMAGES = [
  {
    id: 'ai_tech',
    label: 'কৃত্রিম বুদ্ধিমত্তা ও প্রযুক্তি (AI & Tech)',
    url: '/assets/images/news_tech_ai_chip_1793801922448.jpg',
  },
  {
    id: 'national',
    label: 'জাতীয় ও বাংলাদেশ (National & Dhaka)',
    url: '/assets/images/news_dhaka_metro_1793801923998.jpg',
  },
  {
    id: 'international',
    label: 'আন্তর্জাতিক ও কূটনীতি (Global Summit)',
    url: '/assets/images/news_world_summit_1793801922828.jpg',
  },
  {
    id: 'sports',
    label: 'খেলাধুলা ও ক্রিকেট (Cricket & Sports)',
    url: '/assets/images/news_cricket_stadium_1793801922344.jpg',
  },
];

/**
 * Normalizes any image URL to ensure production-safe paths on Netlify.
 * Automatically handles data: URIs, fixes legacy /src/ paths, and maps category defaults.
 */
export function normalizeImageUrl(url?: string | null, titleHint?: string, categoryHint?: string): string {
  if (!url || typeof url !== 'string' || !url.trim() || url === 'undefined' || url === 'null') {
    return getSmartFallbackImage(titleHint, categoryHint);
  }

  let clean = url.trim();

  // If already base64 data URI, external URL, or absolute path, sanitize
  if (clean.startsWith('data:image/')) {
    return clean;
  }

  // Fix legacy /src/assets/images paths that might exist in browser cache
  if (clean.includes('/src/assets/images/')) {
    clean = clean.replace('/src/assets/images/', '/assets/images/');
  }
  if (clean.startsWith('src/assets/images/')) {
    clean = clean.replace('src/assets/images/', '/assets/images/');
  }

  if (clean.startsWith('http://') || clean.startsWith('https://')) {
    return clean;
  }

  if (clean.startsWith('/')) {
    return clean;
  }

  return `/${clean}`;
}

export function getSmartFallbackImage(titleHint?: string, categoryHint?: string): string {
  const text = `${titleHint || ''} ${categoryHint || ''}`.toLowerCase();
  if (text.includes('বুদ্ধিমত্তা') || text.includes('ai') || text.includes('tech') || text.includes('প্রযুক্তি') || text.includes('chip') || text.includes('কম্পিউটার')) {
    return '/assets/images/news_tech_ai_chip_1793801922448.jpg';
  }
  if (text.includes('মেট্রো') || text.includes('ঢাকা') || text.includes('জাতীয়') || text.includes('বাংলাদেশ') || text.includes('national')) {
    return '/assets/images/news_dhaka_metro_1793801923998.jpg';
  }
  if (text.includes('ক্রিকেট') || text.includes('ফুটবল') || text.includes('খেলা') || text.includes('sports')) {
    return '/assets/images/news_cricket_stadium_1793801922344.jpg';
  }
  return DEFAULT_FALLBACK_IMAGE;
}

/**
 * Image error handler that replaces a broken image with a guaranteed local fallback, CDN fallback, or embedded SVG.
 */
export function handleImageError(
  e: React.SyntheticEvent<HTMLImageElement, Event>,
  fallback?: string
) {
  const target = e.currentTarget;
  if (!target.dataset.triedLocalFallback) {
    target.dataset.triedLocalFallback = 'true';
    target.src = fallback || DEFAULT_FALLBACK_IMAGE;
    return;
  }
  if (!target.dataset.triedCdnFallback) {
    target.dataset.triedCdnFallback = 'true';
    target.src = CDN_FALLBACK_IMAGE;
    return;
  }
  if (!target.dataset.triedSvgFallback) {
    target.dataset.triedSvgFallback = 'true';
    target.src = EMBEDDED_FALLBACK_SVG;
  }
}

/**
 * Compresses an image file from mobile gallery or file picker into an optimized base64 string
 */
export function compressImage(file: File, maxWidth = 400, maxHeight = 400, quality = 0.85): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', quality));
        } else {
          resolve(e.target?.result as string);
        }
      };
      img.onerror = reject;
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
