import React, { useState, useEffect } from 'react';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import { ThemeProvider } from './context/ThemeContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { NotFoundPage } from './pages/NotFoundPage';
import { Header } from './components/Header';
import { HeroSection } from './components/HeroSection';
import { LatestNewsFeed } from './components/LatestNewsFeed';
import { PopularNews } from './components/PopularNews';
import { CategoryBlocks } from './components/CategoryBlocks';
import { VideoSection } from './components/VideoSection';
import { NewsletterSection } from './components/NewsletterSection';
import { Footer } from './components/Footer';
import { SearchModal } from './components/SearchModal';
import { AdPlacement } from './components/AdPlacement';
import { AdsterraGlobalController } from './components/AdsterraGlobalController';
import { ArticleDetail } from './pages/ArticleDetail';
import { CategoryPage } from './pages/CategoryPage';
import { AdminDashboard } from './pages/AdminDashboard';
import { NewsAlertModal } from './components/NewsAlertModal';
import { Article, Category, BreakingNewsItem, AdSlot, VideoItem, WebsiteSettings } from './types/news';
import { api } from './services/api';
import { X } from 'lucide-react';

export function NewsPortalApp() {
  const { lang, t } = useLanguage();

  // Navigation State
  const [currentView, setCurrentView] = useState<'home' | 'article' | 'category' | 'admin'>('home');
  const [selectedArticleSlug, setSelectedArticleSlug] = useState<string | null>(null);
  const [selectedCategorySlug, setSelectedCategorySlug] = useState<string | null>(null);

  // Data States pre-populated instantly from local database
  const [articles, setArticles] = useState<Article[]>(() => api.getLocalDatabaseState().articles || []);
  const [categories, setCategories] = useState<Category[]>(() => api.getLocalDatabaseState().categories || []);
  const [breakingNews, setBreakingNews] = useState<BreakingNewsItem[]>(() => api.getLocalDatabaseState().breaking_news || []);
  const [ads, setAds] = useState<AdSlot[]>(() => api.getLocalDatabaseState().ads || []);
  const [videos, setVideos] = useState<VideoItem[]>(() => api.getLocalDatabaseState().videos || []);
  const [settings, setSettings] = useState<WebsiteSettings | null>(() => api.getLocalDatabaseState().settings || null);
  const [loading, setLoading] = useState(false);

  // Modals
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [legalModalData, setLegalModalData] = useState<{ title: string; content: string } | null>(null);
  const [mobileBannerDismissed, setMobileBannerDismissed] = useState(false);

  // Load initial data
  const loadData = async () => {
    try {
      const local = api.getLocalDatabaseState();
      if (local) {
        if (local.articles?.length) setArticles(local.articles);
        if (local.categories?.length) setCategories(local.categories);
        if (local.breaking_news?.length) setBreakingNews(local.breaking_news);
        if (local.ads?.length) setAds(local.ads);
        if (local.videos?.length) setVideos(local.videos);
        if (local.settings) setSettings(local.settings);
      }

      const results = await Promise.allSettled([
        api.getArticles(),
        api.getCategories(),
        api.getBreakingNews(false),
        api.getAds(),
        api.getVideos(),
        api.getSettings(),
      ]);
      if (results[0].status === 'fulfilled' && results[0].value?.items?.length) setArticles(results[0].value.items);
      if (results[1].status === 'fulfilled' && results[1].value?.length) setCategories(results[1].value);
      if (results[2].status === 'fulfilled' && results[2].value?.length) setBreakingNews(results[2].value);
      if (results[3].status === 'fulfilled' && results[3].value?.length) setAds(results[3].value);
      if (results[4].status === 'fulfilled' && results[4].value?.length) setVideos(results[4].value);
      if (results[5].status === 'fulfilled' && results[5].value) setSettings(results[5].value);
    } catch (e) {
      console.warn('Live portal data sync completed with local state active:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    // Listen for live updates from admin panel (immediate live publishing)
    const handleDataUpdated = () => {
      loadData();
    };

    window.addEventListener('png_data_updated', handleDataUpdated);

    // Cross-tab real-time sync via BroadcastChannel & Storage Event
    let bc: BroadcastChannel | null = null;
    if (typeof BroadcastChannel !== 'undefined') {
      try {
        bc = new BroadcastChannel('png_news_updates');
        bc.onmessage = () => {
          loadData();
        };
      } catch {}
    }

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key && e.key.startsWith('png_local_db_cache')) {
        loadData();
      }
    };
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('png_data_updated', handleDataUpdated);
      window.removeEventListener('storage', handleStorageChange);
      if (bc) bc.close();
    };
  }, []);

  const [isArticleLoading, setIsArticleLoading] = useState(false);
  const [articleNotFound, setArticleNotFound] = useState(false);

  // Sync URL routes
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      if (path.startsWith('/news/')) {
        const rawSlug = path.replace(/^\/news\//, '');
        const slug = decodeURIComponent(rawSlug.replace(/^\/+|\/+$/g, '').trim());
        setSelectedArticleSlug(slug);
        setCurrentView('article');
      } else if (path.startsWith('/category/')) {
        const rawSlug = path.replace(/^\/category\//, '');
        const slug = decodeURIComponent(rawSlug.replace(/^\/+|\/+$/g, '').trim());
        setSelectedCategorySlug(slug);
        setCurrentView('category');
      } else if (path === '/admin') {
        setCurrentView('admin');
      } else {
        setCurrentView('home');
      }
    };

    handlePopState();
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Ensure direct URL hits fetch article if not in initial local state
  useEffect(() => {
    if (currentView === 'article' && selectedArticleSlug) {
      const match = articles.find(a => 
        a.slug === selectedArticleSlug || a.id === selectedArticleSlug
      );
      if (match) {
        setArticleNotFound(false);
        setIsArticleLoading(false);
      } else {
        setIsArticleLoading(true);
        setArticleNotFound(false);
        api.getArticleBySlug(selectedArticleSlug)
          .then(art => {
            if (art) {
              setArticles(prev => [art, ...prev.filter(a => a.id !== art.id)]);
              setArticleNotFound(false);
            } else {
              setArticleNotFound(true);
            }
          })
          .catch(() => {
            setArticleNotFound(true);
          })
          .finally(() => {
            setIsArticleLoading(false);
          });
      }
    } else {
      setIsArticleLoading(false);
      setArticleNotFound(false);
    }
  }, [currentView, selectedArticleSlug, articles]);

  // Navigation handlers
  const navigateToHome = () => {
    window.history.pushState({}, '', '/');
    setCurrentView('home');
    setSelectedArticleSlug(null);
    setSelectedCategorySlug(null);
    loadData(); // Ensure newest live posts display instantly
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navigateToArticle = (article: Article) => {
    window.history.pushState({}, '', `/news/${article.slug}`);
    setSelectedArticleSlug(article.slug);
    setCurrentView('article');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navigateToArticleBySlug = (slug: string) => {
    window.history.pushState({}, '', `/news/${slug}`);
    setSelectedArticleSlug(slug);
    setCurrentView('article');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navigateToCategory = (slug: string) => {
    window.history.pushState({}, '', `/category/${slug}`);
    setSelectedCategorySlug(slug);
    setCurrentView('category');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navigateToAdmin = () => {
    window.history.pushState({}, '', '/admin');
    setCurrentView('admin');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Find targeted data objects
  const leadStory = articles.find(a => a.is_featured) || articles[0];
  const secondaryStories = articles.filter(a => a.id !== leadStory?.id).slice(0, 4);

  const selectedArticle = articles.find(a => a.slug === selectedArticleSlug || a.id === selectedArticleSlug);
  const selectedCategory = categories.find(c => c.slug === selectedCategorySlug);

  // Ad slots
  const headerAd = ads.find(a => a.id === 'header_banner');
  const homepageTopAd = ads.find(a => a.id === 'homepage_top');
  const betweenNewsAd = ads.find(a => a.id === 'between_news');
  const interCategoryAd = ads.find(a => a.id === 'inter_category');
  const sidebarAd = ads.find(a => a.id === 'sidebar_banner');
  const footerAd = ads.find(a => a.id === 'footer_banner');
  const mobileBannerAd = ads.find(a => a.id === 'mobile_banner');
  const socialBarAd = ads.find(a => a.id === 'social_bar');

  // If in admin mode, show Admin Dashboard exclusively
  if (currentView === 'admin') {
    return (
      <AdminDashboard
        onBackToSite={navigateToHome}
        onRefreshData={loadData}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F7FA] dark:bg-[#0B132B] text-[#222222] dark:text-[#E2E8F0] flex flex-col font-sans transition-colors duration-200">
      {/* Adsterra Global Controller: Popunder & Social Bar Push */}
      <AdsterraGlobalController ads={ads} />

      {/* 1. Header with Channel 24 Style Logo & 728x90 Header Ad */}
      <Header
        categories={categories}
        breakingNews={breakingNews}
        headerAd={headerAd}
        settings={settings}
        onSelectCategory={navigateToCategory}
        onOpenSearch={() => setIsSearchOpen(true)}
        onNavigateHome={navigateToHome}
        onOpenAdmin={navigateToAdmin}
        activeCategory={selectedCategorySlug || undefined}
        onSelectArticleBySlug={navigateToArticleBySlug}
      />

      {/* 2. Main Body Content Based on Current View */}
      <main className="flex-1">
        {/* VIEW A: HOMEPAGE (Shifted post content straight to the top) */}
        {currentView === 'home' && (
          <>
            {/* Hero News Section (starts directly at top without duplicate blocking ad) */}
            <HeroSection
              leadStory={leadStory}
              secondaryStories={secondaryStories}
              onSelectArticle={navigateToArticle}
            />

            {/* In-Feed Native Ad */}
            <div className="mx-auto max-w-7xl px-4 py-2">
              <AdPlacement slot={betweenNewsAd} />
            </div>

            {/* Two Column Layout: Latest Stories (8 cols) + Popular / Sidebar (4 cols) */}
            <div className="mx-auto max-w-7xl px-4 py-6">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Main Feed */}
                <div className="lg:col-span-8 space-y-8">
                  <LatestNewsFeed
                    articles={articles}
                    categories={categories}
                    onSelectArticle={navigateToArticle}
                  />

                  {/* Curated Category Blocks */}
                  <CategoryBlocks
                    categories={categories}
                    articles={articles}
                    onSelectCategory={navigateToCategory}
                    onSelectArticle={navigateToArticle}
                    interCategoryAd={interCategoryAd}
                  />
                </div>

                {/* Sidebar */}
                <aside className="lg:col-span-4 space-y-6">
                  {/* Adsterra 300x250 Medium Rectangle */}
                  <AdPlacement slot={sidebarAd} />

                  {/* Popular News Component */}
                  <PopularNews
                    articles={articles}
                    onSelectArticle={navigateToArticle}
                  />

                  {/* Video News Widget */}
                  <VideoSection videos={videos} />
                </aside>
              </div>
            </div>

            {/* Newsletter Subscription Section */}
            <div className="mx-auto max-w-7xl px-4">
              <NewsletterSection />
            </div>
          </>
        )}

        {/* VIEW B: ARTICLE DETAIL */}
        {currentView === 'article' && (
          isArticleLoading ? (
            <div className="mx-auto max-w-7xl px-4 py-16 flex flex-col items-center justify-center min-h-[60vh]">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#246BFD] border-t-transparent mb-4" />
              <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                {lang === 'bn' ? 'সংবাদ লোড হচ্ছে...' : 'Loading article...'}
              </p>
            </div>
          ) : selectedArticle ? (
            <ArticleDetail
              article={selectedArticle}
              allArticles={articles}
              ads={ads}
              settings={settings}
              onSelectArticle={navigateToArticle}
              onBackToHome={navigateToHome}
              onSelectCategory={navigateToCategory}
            />
          ) : (
            <NotFoundPage
              onNavigateHome={navigateToHome}
              onNavigateCategory={navigateToCategory}
              onNavigateArticle={navigateToArticle}
              categories={categories}
              recentArticles={articles}
            />
          )
        )}

        {/* VIEW C: CATEGORY PAGE */}
        {currentView === 'category' && (
          selectedCategory ? (
            <CategoryPage
              category={selectedCategory}
              articles={articles}
              allArticles={articles}
              ads={ads}
              onSelectArticle={navigateToArticle}
              onBackToHome={navigateToHome}
            />
          ) : (
            <NotFoundPage
              onNavigateHome={navigateToHome}
              onNavigateCategory={navigateToCategory}
              onNavigateArticle={navigateToArticle}
              categories={categories}
              recentArticles={articles}
            />
          )
        )}
      </main>

      {/* 3. Footer */}
      {settings && (
        <Footer
          settings={settings}
          categories={categories}
          footerAd={footerAd}
          onSelectCategory={navigateToCategory}
          onOpenLegalModal={(title, content) => setLegalModalData({ title, content })}
        />
      )}

      {/* 4. Search Modal */}
      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        articles={articles}
        onSelectArticle={navigateToArticle}
      />

      {/* 5. Legal / Policies Modal */}
      {legalModalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl border border-slate-200">
            <button
              onClick={() => setLegalModalData(null)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600"
            >
              <X className="h-5 w-5" />
            </button>
            <h3 className="text-xl font-bold font-serif text-[#101D35] mb-4">
              {legalModalData.title}
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              {legalModalData.content}
            </p>
            <div className="mt-6 text-right">
              <button
                onClick={() => setLegalModalData(null)}
                className="px-4 py-2 rounded bg-[#101D35] text-white text-xs font-bold"
              >
                Close Policy
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. Sticky Mobile Bottom Adsterra Banner (Section 8: Mobile Banner 320x50 / Scaled 728x90) */}
      {!mobileBannerDismissed && mobileBannerAd && mobileBannerAd.is_active && (
        <div className="fixed bottom-0 inset-x-0 z-40 block md:hidden bg-slate-900/95 backdrop-blur-sm border-t border-slate-700 shadow-2xl py-1 px-2">
          <div className="relative w-full max-w-full flex items-center justify-center">
            <button
              onClick={() => setMobileBannerDismissed(true)}
              className="absolute -top-7 right-1 bg-slate-800 text-white rounded-t px-2 py-0.5 text-[10px] font-bold border-t border-x border-slate-700 shadow"
              title="Close Ad"
            >
              ✕ Close
            </button>
            <AdPlacement slot={mobileBannerAd} className="my-0 w-full" />
          </div>
        </div>
      )}

      {/* 7. Prothom Alo Style News Alert Prompt & Top App Banner */}
      <NewsAlertModal onNavigateToArticle={navigateToArticleBySlug} />
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <LanguageProvider>
          <NewsPortalApp />
        </LanguageProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
