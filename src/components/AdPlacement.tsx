import React, { useEffect, useRef, useState } from 'react';
import { AdSlot } from '../types/news';
import { api } from '../services/api';
import { ExternalLink } from 'lucide-react';

interface AdPlacementProps {
  slot: AdSlot | undefined;
  className?: string;
  fallbackText?: string;
}

export const AdPlacement: React.FC<AdPlacementProps> = ({ slot, className = '', fallbackText }) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState<number>(1);
  const [containerWidth, setContainerWidth] = useState<number>(0);

  useEffect(() => {
    if (slot && slot.is_active) {
      api.recordAdImpression(slot.id);
    }
  }, [slot?.id, slot?.is_active]);

  const isDirectLink = Boolean(
    slot?.format === 'direct_link' ||
    (slot?.ad_code && slot.ad_code.trim().startsWith('http') && !slot.ad_code.includes('<'))
  );

  const isScriptAd = Boolean(
    slot?.ad_code &&
    (slot.ad_code.includes('<script') ||
     slot.ad_code.includes('atOptions') ||
     slot.ad_code.includes('container-') ||
     slot.ad_code.includes('bicea.org') ||
     slot.ad_code.includes('afders.org'))
  );

  // Compute ad dimensions based on ad_code or slot ID
  const getDimensions = () => {
    if (!slot?.ad_code) return { width: 728, height: 90 };

    // Try extracting from atOptions
    const wMatch = slot.ad_code.match(/'width'\s*:\s*(\d+)/i) || slot.ad_code.match(/"width"\s*:\s*(\d+)/i);
    const hMatch = slot.ad_code.match(/'height'\s*:\s*(\d+)/i) || slot.ad_code.match(/"height"\s*:\s*(\d+)/i);

    if (wMatch && hMatch) {
      return { width: parseInt(wMatch[1], 10), height: parseInt(hMatch[1], 10) };
    }

    if (slot.id.includes('sidebar') || slot.id.includes('middle')) {
      return { width: 300, height: 250 };
    }
    if (slot.id.includes('mobile')) {
      return { width: 320, height: 50 };
    }
    if (slot.id.includes('between') || slot.ad_code.includes('container-')) {
      return { width: 728, height: 160 };
    }

    return { width: 728, height: 90 };
  };

  const dimensions = getDimensions();
  const targetWidth = typeof dimensions.width === 'number' ? dimensions.width : 728;
  const targetHeight = typeof dimensions.height === 'number' ? dimensions.height : 90;

  // Responsive scaling measurement: Prevents 728px banners from clipping on mobile screens
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const measureAndScale = () => {
      if (!containerRef.current) return;
      // Get available client width with 8px buffer
      const measured = containerRef.current.clientWidth || window.innerWidth;
      const safeAvailable = Math.max(0, measured - 8);
      setContainerWidth(safeAvailable);

      if (safeAvailable > 0 && targetWidth > 0) {
        if (safeAvailable < targetWidth) {
          // Scale down so entire ad is 100% visible on small mobile screens
          const calculatedScale = Math.min(1, Math.max(0.2, safeAvailable / targetWidth));
          setScale(calculatedScale);
        } else {
          setScale(1);
        }
      }
    };

    measureAndScale();

    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => {
        measureAndScale();
      });
      resizeObserver.observe(el);
    }

    window.addEventListener('resize', measureAndScale);
    window.addEventListener('orientationchange', measureAndScale);

    return () => {
      window.removeEventListener('resize', measureAndScale);
      window.removeEventListener('orientationchange', measureAndScale);
      if (resizeObserver) resizeObserver.disconnect();
    };
  }, [targetWidth]);

  // Dynamically populate iframe to execute third-party ad scripts safely
  useEffect(() => {
    if (!isScriptAd || !iframeRef.current || !slot?.ad_code) return;

    const iframe = iframeRef.current;
    try {
      const doc = iframe.contentDocument || iframe.contentWindow?.document;
      if (doc) {
        doc.open();
        doc.write(`
          <!DOCTYPE html>
          <html lang="en">
            <head>
              <meta charset="utf-8" />
              <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
              <base target="_blank" />
              <style>
                * { box-sizing: border-box; }
                html, body {
                  margin: 0;
                  padding: 0;
                  width: 100%;
                  height: 100%;
                  overflow: hidden;
                  background: transparent;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  font-family: system-ui, -apple-system, sans-serif;
                }
                iframe { border: none !important; max-width: 100% !important; }
              </style>
            </head>
            <body>
              ${slot.ad_code}
            </body>
          </html>
        `);
        doc.close();
      }
    } catch (e) {
      console.warn('[AdPlacement] Frame write notice:', e);
    }
  }, [slot?.ad_code, slot?.id, isScriptAd]);

  if (!slot || !slot.is_active) {
    return null;
  }

  // Handle device targeting class
  const visibilityClass =
    slot.device_target === 'desktop'
      ? 'hidden md:block'
      : slot.device_target === 'mobile'
      ? 'block md:hidden'
      : 'block';

  const handleClick = () => {
    api.recordAdClick(slot.id);
  };

  const targetLink = slot.banner_target_link || (isDirectLink ? slot.ad_code.trim() : '');

  // Computed scaled bounding box
  const scaledWidth = Math.round(targetWidth * scale);
  const scaledHeight = Math.round(targetHeight * scale);

  return (
    <aside
      ref={containerRef}
      className={`ad-placement my-3 w-full overflow-hidden text-center flex flex-col items-center justify-center ${visibilityClass} ${className}`}
      aria-label="Advertisement"
      onClick={handleClick}
    >
      <div className="mb-1 text-[9px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
        SPONSORED
      </div>

      <div className="flex justify-center items-center w-full max-w-full overflow-hidden">
        {isDirectLink ? (
          <a
            href={targetLink}
            target="_blank"
            rel="noopener noreferrer"
            className="group relative inline-flex items-center justify-between gap-3 px-6 py-3.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl shadow-md transition-all hover:shadow-lg w-full max-w-xl text-left"
          >
            <div className="flex-1">
              <span className="inline-block text-[10px] font-extrabold uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded text-white mb-1">
                Special Partner
              </span>
              <p className="text-sm font-bold text-white line-clamp-1 leading-snug">
                {slot.name || 'Exclusive Partner Offer & High-Value Deals'}
              </p>
              <p className="text-[11px] text-blue-100">Click to explore verified sponsored partner promotion &rarr;</p>
            </div>
            <div className="shrink-0 w-8 h-8 rounded-full bg-white/20 flex items-center justify-center group-hover:scale-110 transition-transform">
              <ExternalLink className="w-4 h-4 text-white" />
            </div>
          </a>
        ) : isScriptAd ? (
          <div
            className="flex items-center justify-center overflow-hidden mx-auto transition-all duration-150"
            style={{
              width: `${scaledWidth}px`,
              height: `${scaledHeight}px`,
              maxWidth: '100%',
              position: 'relative',
            }}
          >
            <div
              style={{
                width: `${targetWidth}px`,
                height: `${targetHeight}px`,
                transform: `scale(${scale})`,
                transformOrigin: 'top left',
                position: 'absolute',
                top: 0,
                left: 0,
              }}
            >
              <iframe
                ref={iframeRef}
                title={`adsterra-ad-${slot.id}`}
                scrolling="no"
                frameBorder="0"
                style={{
                  width: `${targetWidth}px`,
                  height: `${targetHeight}px`,
                  border: 'none',
                  overflow: 'hidden',
                  display: 'block',
                }}
                sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox allow-forms"
              />
            </div>
          </div>
        ) : (
          <div
            className="inline-block max-w-full overflow-hidden"
            dangerouslySetInnerHTML={{
              __html:
                slot.ad_code ||
                `<div class="p-4 bg-slate-100 dark:bg-slate-800 text-xs text-slate-500 dark:text-slate-400 rounded border border-slate-200 dark:border-slate-700">${
                  fallbackText || slot.name
                }</div>`,
            }}
          />
        )}
      </div>
    </aside>
  );
};
