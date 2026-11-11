import React, { useState } from 'react';
import { ArrowLeft, Clock, Eye, Filter, Calendar } from 'lucide-react';
import { Article, Category, AdSlot } from '../types/news';
import { useLanguage } from '../context/LanguageContext';
import { AdPlacement } from '../components/AdPlacement';
import { PopularNews } from '../components/PopularNews';
import { normalizeImageUrl, handleImageError } from '../utils/imageHelper';

interface CategoryPageProps {
  category: Category;
  articles: Article[];
  allArticles: Article[];
  ads: AdSlot[];
  onSelectArticle: (article: Article) => void;
  onBackToHome: () => void;
}

export const CategoryPage: React.FC<CategoryPageProps> = ({
  category,
  articles,
  allArticles,
  ads,
  onSelectArticle,
  onBackToHome,
}) => {
  const { lang, t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');

  const categoryArticles = articles.filter(a => a.category_slug === category.slug);
  const filtered = searchTerm
    ? categoryArticles.filter(a =>
        a.title_bn.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.title_en.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.summary_bn.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : categoryArticles;

  const sidebarAd = ads.find(a => a.id === 'sidebar_banner');

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      {/* Category Header Banner */}
      <div className="rounded-xl bg-white dark:bg-[#101D35] p-6 sm:p-8 shadow-xs border border-slate-200/80 dark:border-slate-800 mb-8 border-l-4 transition-colors" style={{ borderLeftColor: category.color || '#246BFD' }}>
        <button
          onClick={onBackToHome}
          className="mb-3 inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-[#246BFD] transition-colors cursor-pointer"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>{t('back_to_home')}</span>
        </button>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold font-serif text-[#101D35] dark:text-white">
              {lang === 'bn' ? category.name_bn : category.name_en}
            </h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {category.description || `${category.name_en} category news and analysis.`}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 px-3 py-1.5 rounded-full font-semibold">
              {filtered.length} {lang === 'bn' ? 'সংবাদ' : 'Stories'}
            </span>
            <input
              type="text"
              placeholder={lang === 'bn' ? 'এই বিভাগে খুঁজুন...' : 'Filter stories...'}
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="text-xs rounded border border-slate-300 dark:border-slate-700 px-3 py-1.5 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[#246BFD]"
            />
          </div>
        </div>
      </div>

      {/* Main Grid: Articles (8 cols) + Sidebar (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8">
          {filtered.length === 0 ? (
            <div className="rounded-lg bg-white dark:bg-[#101D35] p-12 text-center text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-800">
              <p className="text-base font-semibold">{t('no_articles')}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {filtered.map(article => (
                <article
                  key={article.id}
                  onClick={() => onSelectArticle(article)}
                  className="group cursor-pointer rounded-lg bg-white dark:bg-[#101D35] p-4 shadow-2xs border border-slate-200/80 dark:border-slate-800 hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="aspect-video w-full overflow-hidden rounded bg-slate-100 dark:bg-slate-800 mb-3">
                      <img
                        src={normalizeImageUrl(article.featured_image, article.title_bn, article.category_slug)}
                        alt={lang === 'bn' ? article.title_bn : article.title_en}
                        onError={handleImageError}
                        loading="lazy"
                        referrerPolicy="no-referrer"
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#246BFD]">
                      {lang === 'bn' ? article.category_name_bn : article.category_name_en}
                    </span>
                    <h2 className="mt-1 text-base font-bold font-serif leading-snug text-[#101D35] dark:text-white group-hover:text-[#246BFD] transition-colors line-clamp-2">
                      {lang === 'bn' ? article.title_bn : article.title_en}
                    </h2>
                    <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                      {lang === 'bn' ? article.summary_bn : article.summary_en}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                    <span className="truncate max-w-[120px]">{article.author_name}</span>
                    <span>{new Date(article.published_at).toLocaleDateString(lang === 'bn' ? 'bn-BD' : 'en-US')}</span>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <aside className="lg:col-span-4 space-y-6">
          <AdPlacement slot={sidebarAd} />
          <PopularNews articles={allArticles} onSelectArticle={onSelectArticle} />
        </aside>
      </div>
    </div>
  );
};
