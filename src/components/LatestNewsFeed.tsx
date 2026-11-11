import React, { useState } from 'react';
import { Newspaper, Clock, ArrowRight, Eye } from 'lucide-react';
import { Article, Category } from '../types/news';
import { useLanguage } from '../context/LanguageContext';
import { normalizeImageUrl, handleImageError } from '../utils/imageHelper';

interface LatestNewsFeedProps {
  articles: Article[];
  categories: Category[];
  onSelectArticle: (article: Article) => void;
}

export const LatestNewsFeed: React.FC<LatestNewsFeedProps> = ({
  articles,
  categories,
  onSelectArticle,
}) => {
  const { lang, t } = useLanguage();
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [displayCount, setDisplayCount] = useState(6);

  const filtered = selectedFilter === 'all'
    ? articles
    : articles.filter(a => a.category_slug === selectedFilter);

  const displayedArticles = filtered.slice(0, displayCount);

  return (
    <section className="rounded-lg bg-white dark:bg-[#101D35] p-6 shadow-sm border border-slate-200/80 dark:border-slate-800 transition-colors">
      {/* Header and Filter Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4 gap-3">
        <div className="flex items-center gap-2">
          <Newspaper className="h-5 w-5 text-[#246BFD]" />
          <h2 className="text-xl font-bold font-serif text-[#101D35] dark:text-white tracking-wide">
            {t('latest_news')}
          </h2>
        </div>

        {/* Filter Tabs (Interactive Functional Buttons) */}
        <div className="flex items-center gap-1 overflow-x-auto p-1 bg-slate-100 dark:bg-slate-800/80 rounded-md scrollbar-none">
          <button
            type="button"
            onClick={() => setSelectedFilter('all')}
            className={`px-3 py-1 text-xs font-semibold rounded transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              selectedFilter === 'all'
                ? 'bg-white dark:bg-slate-700 text-[#101D35] dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {lang === 'bn' ? 'সব সংবাদ' : 'All Stories'}
          </button>
          {categories.slice(0, 5).map(cat => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedFilter(cat.slug)}
              className={`px-3 py-1 text-xs font-semibold rounded transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                selectedFilter === cat.slug
                  ? 'bg-white dark:bg-slate-700 text-[#246BFD] dark:text-blue-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {lang === 'bn' ? cat.name_bn : cat.name_en}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Articles */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        {displayedArticles.map(article => (
          <article
            key={article.id}
            onClick={() => onSelectArticle(article)}
            className="group cursor-pointer flex flex-col justify-between border-b border-slate-100 pb-5 last:border-b-0"
          >
            <div className="flex gap-4">
              {/* Thumbnail */}
              <div className="relative h-24 w-28 shrink-0 overflow-hidden rounded bg-slate-100 dark:bg-slate-800 sm:h-28 sm:w-36">
                <img
                  src={normalizeImageUrl(article.featured_image, article.title_bn, article.category_slug)}
                  alt={lang === 'bn' ? article.title_bn : article.title_en}
                  onError={handleImageError}
                  loading="lazy"
                  referrerPolicy="no-referrer"
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>

              {/* Text */}
              <div className="flex flex-1 flex-col justify-between">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#246BFD]">
                    {lang === 'bn' ? article.category_name_bn : article.category_name_en}
                  </span>
                  <h3 className="mt-1 text-sm sm:text-base font-bold font-serif leading-snug text-[#101D35] dark:text-white group-hover:text-[#246BFD] transition-colors line-clamp-2">
                    {lang === 'bn' ? article.title_bn : article.title_en}
                  </h3>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 line-clamp-2 hidden sm:block">
                    {lang === 'bn' ? article.summary_bn : article.summary_en}
                  </p>
                </div>

                {/* Metadata */}
                <div className="mt-2 flex items-center gap-2 text-[11px] text-slate-400">
                  <span>{new Date(article.published_at).toLocaleDateString(lang === 'bn' ? 'bn-BD' : 'en-US')}</span>
                  <span aria-hidden="true">·</span>
                  <span>{article.reading_time_minutes || 3} min read</span>
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>

      {/* Load More Button */}
      {displayCount < filtered.length && (
        <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 text-center">
          <button
            type="button"
            onClick={() => setDisplayCount(prev => prev + 4)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded bg-slate-100 dark:bg-slate-800 hover:bg-[#246BFD] hover:text-white dark:hover:bg-[#246BFD] text-slate-700 dark:text-slate-200 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
          >
            <span>{lang === 'bn' ? 'আরও সংবাদ লোড করুন' : 'Load More Stories'}</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </section>
  );
};
