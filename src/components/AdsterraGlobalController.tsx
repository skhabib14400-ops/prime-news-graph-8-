import React, { useEffect } from 'react';
import { AdSlot } from '../types/news';

interface AdsterraGlobalControllerProps {
  ads: AdSlot[];
}

export const AdsterraGlobalController: React.FC<AdsterraGlobalControllerProps> = ({ ads }) => {
  useEffect(() => {
    // 1. Popunder controller
    const popunderSlot = ads.find(a => a.id === 'popunder');
    const oldPops = document.querySelectorAll('.adsterra-pop-injected');
    oldPops.forEach(el => el.remove());

    if (popunderSlot && popunderSlot.is_active && popunderSlot.ad_code) {
      const srcMatches = Array.from(popunderSlot.ad_code.matchAll(/src=["'](.*?)["']/gi));
      if (srcMatches.length > 0) {
        srcMatches.forEach((match, idx) => {
          const src = match[1];
          const script = document.createElement('script');
          script.className = 'adsterra-pop-injected';
          script.id = `adsterra-popunder-${idx}`;
          script.setAttribute('data-cfasync', 'false');
          script.src = src;
          document.body.appendChild(script);
        });
      } else {
        const script = document.createElement('script');
        script.className = 'adsterra-pop-injected';
        script.id = 'adsterra-popunder-inline';
        script.setAttribute('data-cfasync', 'false');
        script.textContent = popunderSlot.ad_code.replace(/<\/?script.*?>/gi, '');
        document.body.appendChild(script);
      }
    }

    // 2. Social Bar / In-page Push Controller
    const socialSlot = ads.find(a => a.id === 'social_bar');
    const oldSocials = document.querySelectorAll('.adsterra-social-injected');
    oldSocials.forEach(el => el.remove());

    if (socialSlot && socialSlot.is_active && socialSlot.ad_code) {
      const srcMatches = Array.from(socialSlot.ad_code.matchAll(/src=["'](.*?)["']/gi));
      if (srcMatches.length > 0) {
        srcMatches.forEach((match, idx) => {
          const src = match[1];
          const script = document.createElement('script');
          script.className = 'adsterra-social-injected';
          script.id = `adsterra-social-${idx}`;
          script.setAttribute('data-cfasync', 'false');
          script.src = src;
          document.body.appendChild(script);
        });
      } else {
        const script = document.createElement('script');
        script.className = 'adsterra-social-injected';
        script.id = 'adsterra-social-inline';
        script.setAttribute('data-cfasync', 'false');
        script.textContent = socialSlot.ad_code.replace(/<\/?script.*?>/gi, '');
        document.body.appendChild(script);
      }
    }

    return () => {
      document.querySelectorAll('.adsterra-pop-injected').forEach(el => el.remove());
      document.querySelectorAll('.adsterra-social-injected').forEach(el => el.remove());
    };
  }, [ads]);

  return null;
};
