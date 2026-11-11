import React, { useState } from 'react';
import { Search, Globe, Shield, Menu, X, ChevronRight, ChevronLeft, Volume2, Share2, Sun, Moon } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { Category, BreakingNewsItem, AdSlot, WebsiteSettings } from '../types/news';
import { AdPlacement } from './AdPlacement';

interface HeaderProps {
  categories: Category[];
  breakingNews: BreakingNewsItem[];
  headerAd?: AdSlot;
  settings?: WebsiteSettings | null;
  onSelectCategory: (slug: string) => void;
  onOpenSearch: () => void;
  onNavigateHome: () => void;
  onOpenAdmin: () => void;
  activeCategory?: string;
  onSelectArticleBySlug: (slug: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  categories,
  breakingNews,
  headerAd,
  settings,
  onSelectCategory,
  onOpenSearch,
  onNavigateHome,
  onOpenAdmin,
  activeCategory,
  onSelectArticleBySlug,
}) => {
  const { lang, setLang, t } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [breakingIndex, setBreakingIndex] = useState(0);

  // Bengali and English date formatting
  const getFormattedDate = () => {
    const now = new Date();
    if (lang === 'bn') {
      const weekdays = ['রবিবার', 'সোমবার', 'মঙ্গলবার', 'বুধবার', 'বৃহস্পতিবার', 'শুক্রবার', 'শনিবার'];
      const months = ['জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন', 'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'];
      const toBnDigits = (n: number) => String(n).replace(/\d/g, d => '০১২৩৪৫৬৭৮৯'[parseInt(d, 10)]);
      return `${weekdays[now.getDay()]}, ${toBnDigits(now.getDate())} ${months[now.getMonth()]} ${toBnDigits(now.getFullYear())}`;
    } else {
      return now.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    }
  };

  const activeBreaking = breakingNews.filter(b => b.is_active);
  const currentBreaking = activeBreaking[breakingIndex % (activeBreaking.length || 1)];

  const handleNextBreaking = () => {
    if (activeBreaking.length > 0) {
      setBreakingIndex(prev => (prev + 1) % activeBreaking.length);
    }
  };

  const handlePrevBreaking = () => {
    if (activeBreaking.length > 0) {
      setBreakingIndex(prev => (prev - 1 + activeBreaking.length) % activeBreaking.length);
    }
  };

  return (
    <header className="w-full bg-[#101D35] text-white">
      {/* 1. Top Bar with Channel 24 Style Website Logo & Date */}
      <div className="border-b border-slate-700/60 bg-[#0A1324] px-4 py-2 text-xs text-slate-300">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          {/* Top-Left: Channel 24 Style Website Logo & Date */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Website Logo Option */}
            <div
              onClick={onNavigateHome}
              className="flex items-center gap-2 cursor-pointer group shrink-0"
              title={settings?.site_name || 'PRIME NEWS GRAPH'}
            >
              {settings?.logo_image_url ? (
                <img
                  src={settings.logo_image_url}
                  alt={settings?.site_name || 'Website Logo'}
                  className="h-7 sm:h-8 max-w-[130px] object-contain rounded"
                />
              ) : (
                <div className="flex items-center gap-1.5">
                  <div className="relative flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-[#E11D48] via-[#DC2626] to-[#991B1B] text-white font-black text-[11px] shadow-sm border border-red-400/40 group-hover:scale-105 transition-transform tracking-tight">
                    <span>{settings?.logo_badge_text || '24'}</span>
                    <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                  </div>
                  <span className="text-xs sm:text-sm font-black font-serif text-white tracking-wider group-hover:text-red-400 transition-colors uppercase leading-none">
                    {settings?.logo_text || (settings?.site_name ? settings.site_name.split(' ')[0] : 'PRIME')}
                  </span>
                </div>
              )}
            </div>

            <span className="text-slate-600">|</span>
            <span className="font-medium text-slate-200 text-[11px] sm:text-xs">{getFormattedDate()}</span>
            <span className="hidden sm:inline text-slate-600">|</span>
            <span className="hidden tracking-wide text-slate-400 text-[11px] sm:text-xs sm:inline">
              {lang === 'bn' ? 'আন্তর্জাতিক সংস্করণ' : 'International Edition'}
            </span>
          </div>

          {/* Controls: Language, Theme, Search, Admin */}
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Global Theme Toggle */}
            <button
              type="button"
              onClick={toggleTheme}
              className="flex items-center gap-1.5 rounded bg-slate-800/80 px-2 py-1 text-xs text-slate-300 hover:text-white border border-slate-700 transition-colors cursor-pointer"
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              aria-label={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {theme === 'dark' ? (
                <>
                  <Sun className="h-3.5 w-3.5 text-amber-400" />
                  <span className="hidden sm:inline text-[11px] font-medium">{lang === 'bn' ? 'লাইট মোড' : 'Light'}</span>
                </>
              ) : (
                <>
                  <Moon className="h-3.5 w-3.5 text-blue-300" />
                  <span className="hidden sm:inline text-[11px] font-medium">{lang === 'bn' ? 'ডার্ক মোড' : 'Dark'}</span>
                </>
              )}
            </button>

            {/* Language Switcher */}
            <div className="flex items-center gap-1 rounded bg-slate-800/80 p-0.5 border border-slate-700">
              <button
                type="button"
                onClick={() => setLang('bn')}
                className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-colors cursor-pointer ${
                  lang === 'bn' ? 'bg-[#246BFD] text-white' : 'text-slate-300 hover:text-white'
                }`}
              >
                বাংলা
              </button>
              <button
                type="button"
                onClick={() => setLang('en')}
                className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-colors cursor-pointer ${
                  lang === 'en' ? 'bg-[#246BFD] text-white' : 'text-slate-300 hover:text-white'
                }`}
              >
                English
              </button>
            </div>

            {/* Search Button */}
            <button
              type="button"
              onClick={onOpenSearch}
              className="flex items-center gap-1.5 text-slate-300 hover:text-white transition-colors cursor-pointer"
              title="Search News"
            >
              <Search className="h-3.5 w-3.5" />
              <span className="hidden sm:inline text-xs">{lang === 'bn' ? 'অনুসন্ধান' : 'Search'}</span>
            </button>

            {/* Admin Login Shortcut */}
            <button
              type="button"
              onClick={onOpenAdmin}
              className="flex items-center gap-1 text-slate-400 hover:text-amber-400 transition-colors cursor-pointer"
              title="Editorial Admin Portal"
            >
              <Shield className="h-3.5 w-3.5" />
              <span className="hidden md:inline text-xs">{lang === 'bn' ? 'এডমিন' : 'Admin'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Top Header 728x90 Adsterra Banner Slot (Cleanly Centered, Replacing large text logo) */}
      <div className="w-full bg-[#0B1528] border-b border-slate-800 py-3 sm:py-4 px-4">
        <div className="mx-auto max-w-7xl flex items-center justify-center">
          <div className="w-full flex justify-center items-center overflow-hidden">
            <AdPlacement slot={headerAd} className="my-0" />
          </div>
        </div>
      </div>

      {/* 3. Breaking News Ticker Bar */}
      {activeBreaking.length > 0 && (
        <div className="border-y border-red-700/60 bg-[#991B1B] text-white">
          <div className="mx-auto flex max-w-7xl items-center px-4 py-1.5">
            {/* Breaking News Label */}
            <div className="flex shrink-0 items-center gap-2 pr-3 border-r border-red-500/50">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-300 opacity-75"></span>
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-white"></span>
              </span>
              <span className="text-[11px] font-black uppercase tracking-wider text-white">
                {currentBreaking?.label_bn && lang === 'bn' ? currentBreaking.label_bn : (currentBreaking?.label_en || t('breaking_news'))}
              </span>
            </div>

            {/* Marquee or Current Headline */}
            <div className="relative mx-3 flex-1 overflow-hidden">
              <div
                onClick={() => {
                  if (currentBreaking?.target_url) {
                    const slug = currentBreaking.target_url.replace('/news/', '');
                    onSelectArticleBySlug(slug);
                  }
                }}
                className="cursor-pointer truncate text-xs sm:text-sm font-medium text-red-50 hover:text-white hover:underline transition-colors"
              >
                {lang === 'bn' ? currentBreaking.title_bn : currentBreaking.title_en}
              </div>
            </div>

            {/* Ticker Controls */}
            <div className="flex items-center gap-1 shrink-0 text-red-200">
              <button
                type="button"
                onClick={handlePrevBreaking}
                className="p-1 hover:text-white hover:bg-red-800 rounded transition-colors"
                title="Previous Breaking Item"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={handleNextBreaking}
                className="p-1 hover:text-white hover:bg-red-800 rounded transition-colors"
                title="Next Breaking Item"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Main Editorial Navigation Bar */}
      <nav className="sticky top-0 z-40 border-b border-slate-700/80 bg-[#101D35] shadow-lg backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4">
          {/* Desktop Categories Menu */}
          <div className="hidden lg:flex items-center gap-1 overflow-x-auto py-1 scrollbar-none">
            <button
              type="button"
              onClick={onNavigateHome}
              className={`px-3 py-2 text-sm font-semibold rounded transition-colors shrink-0 ${
                !activeCategory ? 'text-[#246BFD] bg-slate-800/80' : 'text-slate-200 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              {t('home')}
            </button>

            {categories.slice(0, 10).map(cat => {
              const isSelected = activeCategory === cat.slug;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => onSelectCategory(cat.slug)}
                  className={`px-3 py-2 text-sm font-medium rounded transition-colors shrink-0 whitespace-nowrap ${
                    isSelected
                      ? 'text-white bg-[#246BFD]'
                      : 'text-slate-200 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  {lang === 'bn' ? cat.name_bn : cat.name_en}
                </button>
              );
            })}
          </div>

          {/* Mobile Header Menu Trigger */}
          <div className="flex w-full items-center justify-between py-2 lg:hidden">
            <button
              type="button"
              onClick={onNavigateHome}
              className="flex items-center gap-2 text-left"
            >
              {settings?.logo_image_url ? (
                <img
                  src={settings.logo_image_url}
                  alt={settings?.site_name || 'Logo'}
                  className="h-6 w-auto object-contain rounded"
                />
              ) : (
                <div className="flex items-center gap-1.5">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#DC2626] text-white font-black text-[10px] shadow-xs">
                    {settings?.logo_badge_text || '24'}
                  </div>
                  <span className="text-sm font-bold font-serif text-white tracking-wide">
                    {settings?.logo_text || settings?.site_name || 'PRIME NEWS GRAPH'}
                  </span>
                </div>
              )}
            </button>

            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="flex items-center gap-2 rounded bg-slate-800 px-3 py-1.5 text-xs text-white"
            >
              {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
              <span>{mobileMenuOpen ? 'বন্ধ করুন' : 'মেনু'}</span>
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="border-t border-slate-700 bg-[#0F172A] px-4 py-3 lg:hidden">
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  onNavigateHome();
                  setMobileMenuOpen(false);
                }}
                className="rounded p-2 text-left text-sm font-medium text-slate-200 hover:bg-slate-800"
              >
                {t('home')}
              </button>
              {categories.map(cat => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => {
                    onSelectCategory(cat.slug);
                    setMobileMenuOpen(false);
                  }}
                  className={`rounded p-2 text-left text-sm font-medium ${
                    activeCategory === cat.slug
                      ? 'bg-[#246BFD] text-white'
                      : 'text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  {lang === 'bn' ? cat.name_bn : cat.name_en}
                </button>
              ))}
            </div>

            <div className="mt-4 pt-4 border-t border-slate-800 flex justify-between items-center text-xs">
              <button
                type="button"
                onClick={toggleTheme}
                className="flex items-center gap-1.5 text-slate-300 hover:text-white"
              >
                {theme === 'dark' ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-blue-300" />}
                <span>{theme === 'dark' ? (lang === 'bn' ? 'লাইট মোড' : 'Light Mode') : (lang === 'bn' ? 'ডার্ক মোড' : 'Dark Mode')}</span>
              </button>

              <button
                onClick={() => {
                  onOpenAdmin();
                  setMobileMenuOpen(false);
                }}
                className="flex items-center gap-1.5 text-amber-400 font-medium"
              >
                <Shield className="h-4 w-4" />
                <span>{t('admin_dashboard')}</span>
              </button>

              <button
                onClick={() => {
                  onOpenSearch();
                  setMobileMenuOpen(false);
                }}
                className="flex items-center gap-1.5 text-slate-300"
              >
                <Search className="h-4 w-4" />
                <span>{t('search_placeholder')}</span>
              </button>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
};
