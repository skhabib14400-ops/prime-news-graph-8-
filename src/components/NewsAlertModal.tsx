import React, { useState, useEffect } from 'react';
import { notificationService } from '../services/notifications';
import { useLanguage } from '../context/LanguageContext';
import { X, CheckCircle2, Bell } from 'lucide-react';

interface NewsAlertModalProps {
  onNavigateToArticle?: (slug: string) => void;
}

export const NewsAlertModal: React.FC<NewsAlertModalProps> = ({ onNavigateToArticle }) => {
  const { lang } = useLanguage();
  const [showBottomPrompt, setShowBottomPrompt] = useState(false);
  const [showTopAppBanner, setShowTopAppBanner] = useState(false);
  const [permissionSuccess, setPermissionSuccess] = useState(false);
  const [requesting, setRequesting] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    // 1. Check if bottom notification prompt should be displayed
    const checkNotificationPrompt = () => {
      if (notificationService.shouldShowPrompt()) {
        // Wait 2.5 seconds after page load for a smooth non-intrusive appearance
        const timer = setTimeout(() => {
          setShowBottomPrompt(true);
        }, 2500);
        return () => clearTimeout(timer);
      }
    };
    checkNotificationPrompt();

    // 2. Check top PWA App Banner (Prothom Alo style top banner)
    const topDismissed = sessionStorage.getItem('png_top_app_banner_dismissed');
    if (!topDismissed && window.innerWidth < 768) {
      const topTimer = setTimeout(() => {
        setShowTopAppBanner(true);
      }, 1000);
      return () => clearTimeout(topTimer);
    }

    // 3. PWA install prompt handler
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowTopAppBanner(true);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    // 4. Listen for real-time incoming push notification broadcast across tabs
    const unsubscribe = notificationService.onMessage((payload) => {
      // If notification received while tab is open, show toast with quick-open
      const toastEl = document.createElement('div');
      toastEl.className = 'fixed top-4 right-4 z-50 bg-[#101D35] text-white p-4 rounded-xl shadow-2xl border border-slate-700 flex items-start gap-3 max-w-sm animate-bounce cursor-pointer';
      toastEl.innerHTML = `
        <div class="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center shrink-0 text-white font-bold text-xs animate-pulse">
          🔔
        </div>
        <div class="flex-1">
          <p class="text-[11px] font-bold text-red-400 uppercase tracking-wider">ব্রেকিং নিউজ এলার্ট</p>
          <p class="text-xs font-semibold text-white line-clamp-2 mt-0.5">${payload.title}</p>
          <p class="text-[10px] text-slate-300 line-clamp-1 mt-0.5">${payload.body}</p>
        </div>
      `;
      toastEl.onclick = () => {
        if (payload.url && onNavigateToArticle) {
          const slug = payload.url.replace('/news/', '');
          onNavigateToArticle(slug);
        } else if (payload.url) {
          window.location.href = payload.url;
        }
        toastEl.remove();
      };
      document.body.appendChild(toastEl);
      setTimeout(() => {
        toastEl.remove();
      }, 7000);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      unsubscribe();
    };
  }, [onNavigateToArticle]);

  // Handle "হ্যাঁ" (Yes) Click
  const handleAcceptNotification = async () => {
    setRequesting(true);
    try {
      const res = await notificationService.requestPermission();
      if (res.granted) {
        setPermissionSuccess(true);
        setTimeout(() => {
          setShowBottomPrompt(false);
          setPermissionSuccess(false);
        }, 1800);
      } else {
        setShowBottomPrompt(false);
      }
    } catch {
      setShowBottomPrompt(false);
    } finally {
      setRequesting(false);
    }
  };

  // Handle "না" (No) Click
  const handleDismissNotification = () => {
    notificationService.dismissPrompt();
    setShowBottomPrompt(false);
  };

  // Handle Top App Banner "অ্যাপে পড়ুন"
  const handleOpenApp = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        setShowTopAppBanner(false);
      }
      setDeferredPrompt(null);
    } else {
      // Fallback: request full-screen standalone or bookmark
      setShowTopAppBanner(false);
      sessionStorage.setItem('png_top_app_banner_dismissed', 'true');
    }
  };

  const handleDismissTopApp = () => {
    setShowTopAppBanner(false);
    sessionStorage.setItem('png_top_app_banner_dismissed', 'true');
  };

  return (
    <>
      {/* ---------------------------------------------------------------------- */}
      {/* 1. TOP APP BANNER (Prothom Alo Top Modal: "আপনি কি অ্যাপে পড়তে চান?")   */}
      {/* ---------------------------------------------------------------------- */}
      {showTopAppBanner && (
        <div className="fixed top-2 inset-x-2 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 z-50 max-w-md w-full animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="relative bg-white/95 dark:bg-[#101D35]/95 backdrop-blur-md rounded-2xl p-4 shadow-2xl border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3">
            <button
              onClick={handleDismissTopApp}
              className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs shadow-md hover:bg-slate-800 transition-colors"
              title="Close"
            >
              <X className="w-3.5 h-3.5" />
            </button>

            <div className="flex items-center gap-3">
              {/* Prothom Alo Style Sunburst Red Icon */}
              <div className="relative w-11 h-11 shrink-0 flex items-center justify-center">
                <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-red-600 to-orange-500 shadow-md flex items-center justify-center">
                  <div className="w-2.5 h-2.5 rounded-full bg-white/30" />
                </div>
                {/* Sunburst Rays around circle */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-10 h-10 border-2 border-dashed border-red-500/60 rounded-full animate-spin-slow" />
                </div>
              </div>

              <div>
                <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white leading-tight">
                  {lang === 'bn' ? 'আপনি কি প্রাইম নিউজ গ্রাফ অ্যাপে পড়তে চান?' : 'Do you want to read in Prime News Graph App?'}
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  {lang === 'bn' ? 'এই সাইটটি প্রাইম নিউজ গ্রাফ অ্যাপ খুলতে চায়।' : 'This site wants to open Prime News Graph App.'}
                </p>
              </div>
            </div>

            <button
              onClick={handleOpenApp}
              className="shrink-0 px-3.5 py-1.5 bg-[#246BFD] hover:bg-blue-600 text-white text-xs font-bold rounded-lg shadow-sm transition-transform active:scale-95"
            >
              {lang === 'bn' ? 'অ্যাপে পড়ুন' : 'Open App'}
            </button>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------------------------- */}
      {/* 2. BOTTOM NEWS ALERT PROMPT (Prothom Alo Bottom Card with "হ্যাঁ" & "না") */}
      {/* ---------------------------------------------------------------------- */}
      {showBottomPrompt && (
        <div className="fixed bottom-3 inset-x-3 sm:bottom-6 sm:inset-x-auto sm:right-6 z-50 max-w-sm sm:max-w-md w-full animate-in fade-in slide-in-from-bottom-6 duration-300">
          <div className="relative bg-white dark:bg-[#101D35] rounded-2xl p-4 sm:p-5 shadow-[0_15px_40px_rgba(0,0,0,0.25)] border border-slate-200/90 dark:border-slate-700/80">
            {/* Close Cross */}
            <button
              onClick={handleDismissNotification}
              className="absolute top-2.5 right-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-full"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>

            {permissionSuccess ? (
              <div className="flex items-center gap-3 py-2 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="w-7 h-7 shrink-0" />
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    {lang === 'bn' ? 'নিউজ এলার্ট চালু হয়েছে!' : 'News Alert Enabled!'}
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    {lang === 'bn' ? 'যেকোনো তাজা খবর সরাসরি আপনার ডিভাইসে পৌঁছে যাবে।' : 'Breaking headlines will be sent to your device instantly.'}
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-3.5 pr-6">
                  {/* Prothom Alo Sunburst Emblem */}
                  <div className="relative w-12 h-12 shrink-0 flex items-center justify-center">
                    {/* Glowing Sunburst Circle */}
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-red-600 via-red-500 to-orange-500 shadow-md flex items-center justify-center">
                      <div className="w-3 h-3 rounded-full bg-white/25" />
                    </div>
                    {/* Radiating Sun Rays (Exact style of Prothom Alo) */}
                    <svg
                      className="absolute inset-0 w-full h-full text-red-500 animate-pulse pointer-events-none"
                      viewBox="0 0 48 48"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    >
                      {/* Top ray */}
                      <line x1="24" y1="4" x2="24" y2="8" />
                      {/* Top-Right ray */}
                      <line x1="38" y1="10" x2="35" y2="13" />
                      {/* Right ray */}
                      <line x1="44" y1="24" x2="40" y2="24" />
                      {/* Bottom-Right ray */}
                      <line x1="38" y1="38" x2="35" y2="35" />
                      {/* Bottom ray */}
                      <line x1="24" y1="44" x2="24" y2="40" />
                      {/* Bottom-Left ray */}
                      <line x1="10" y1="38" x2="13" y2="35" />
                      {/* Left ray */}
                      <line x1="4" y1="24" x2="8" y2="24" />
                      {/* Top-Left ray */}
                      <line x1="10" y1="10" x2="13" y2="13" />
                    </svg>
                  </div>

                  {/* Headline Question in Bengali (Exact Prothom Alo wording) */}
                  <div className="flex-1">
                    <p className="text-sm sm:text-base font-bold text-slate-900 dark:text-white leading-snug">
                      {lang === 'bn' ? 'প্রাইম নিউজ গ্রাফের নিউজ এলার্ট পেতে চান?' : 'Want to get Prime News Graph news alerts?'}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      {lang === 'bn' ? 'ব্রেকিং নিউজ প্রকাশের সাথে সাথেই আপনার মোবাইলে পৌঁছে যাবে।' : 'Receive breaking news notifications instantly.'}
                    </p>
                  </div>
                </div>

                {/* Bottom Action Buttons: "হ্যাঁ" & "না" (Exact style from screenshot) */}
                <div className="flex items-center justify-end gap-2.5 pt-1">
                  <button
                    onClick={handleAcceptNotification}
                    disabled={requesting}
                    className="px-5 py-2 bg-[#246BFD] hover:bg-blue-600 active:bg-blue-700 text-white text-xs sm:text-sm font-bold rounded-lg shadow-sm transition-all transform active:scale-95 disabled:opacity-50 min-w-[65px] text-center"
                  >
                    {requesting ? '...' : (lang === 'bn' ? 'হ্যাঁ' : 'Yes')}
                  </button>

                  <button
                    onClick={handleDismissNotification}
                    disabled={requesting}
                    className="px-5 py-2 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs sm:text-sm font-medium rounded-lg border border-slate-300 dark:border-slate-600 transition-colors min-w-[65px] text-center"
                  >
                    {lang === 'bn' ? 'না' : 'No'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Floating Bell Icon for quick re-enabling if user wants to toggle anytime */}
      <button
        onClick={handleAcceptNotification}
        className="fixed bottom-20 left-4 z-30 p-2.5 rounded-full bg-[#101D35] text-white shadow-lg border border-slate-700 hover:bg-[#246BFD] transition-all hover:scale-110 group hidden sm:flex items-center gap-1.5"
        title={lang === 'bn' ? 'নিউজ এলার্ট চালু করুন' : 'Enable News Alerts'}
      >
        <Bell className="w-4 h-4 text-amber-400 group-hover:rotate-12 transition-transform" />
        <span className="text-[11px] font-semibold pr-1">
          {lang === 'bn' ? 'নিউজ এলার্ট' : 'News Alert'}
        </span>
      </button>
    </>
  );
};
