/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Home, Search, Compass, ArrowLeft, Newspaper, ArrowRight } from 'lucide-react';
import { Article, Category } from '../types/news';
import { useLanguage } from '../context/LanguageContext';

interface NotFoundPageProps {
  onNavigateHome: () => void;
  onNavigateCategory?: (slug: string) => void;
  onNavigateArticle?: (article: Article) => void;
  categories?: Category[];
  recentArticles?: Article[];
}

export const NotFoundPage: React.FC<NotFoundPageProps> = ({
  onNavigateHome,
  onNavigateCategory,
  onNavigateArticle,
  categories = [],
  recentArticles = [],
}) => {
  const { lang } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const isBn = lang === 'bn';

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Trigger homepage search or category
      window.location.href = `/?search=${encodeURIComponent(searchQuery.trim())}`;
    }
  };

  const visibleCategories = categories.slice(0, 8);
  const featuredArticles = recentArticles.slice(0, 3);

  return (
    <div className="min-h-[75vh] flex flex-col justify-center items-center px-4 py-12 md:py-20 bg-slate-50 dark:bg-slate-950 transition-colors">
      <div className="max-w-3xl w-full text-center">
        {/* Editorial 404 Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-400 font-mono text-xs font-bold tracking-wider uppercase mb-4 border border-red-200 dark:border-red-900/50">
          <Compass className="w-3.5 h-3.5" />
          <span>{isBn ? '৪০৪ পৃষ্ঠা পাওয়া যায়নি' : '404 Page Not Found'}</span>
        </div>

        <h1 className="text-6xl sm:text-8xl font-black font-serif text-[#101D35] dark:text-slate-100 tracking-tight leading-none mb-3">
          404
        </h1>

        <h2 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-slate-200 mb-3 font-serif">
          {isBn
            ? 'দুঃখিত, আপনি যে সংবাদ বা পৃষ্ঠাটি খুঁজছেন তা সরানো হয়েছে বা বিদ্যমান নেই।'
            : 'The story or page you are looking for has moved, expired, or does not exist.'}
        </h2>

        <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base max-w-xl mx-auto mb-8">
          {isBn
            ? 'পৃষ্ঠার লিংকটি ভুল হতে পারে অথবা সংবাদটি আর্কাইভ করা হয়েছে। নিচে অনুসন্ধান করুন অথবা আমাদের প্রধান বিভাগগুলো ঘুরে দেখুন।'
            : 'The URL may be mistyped or the report has been archived. Search our editorial archives or explore prime sections below.'}
        </p>

        {/* Search Bar */}
        <form onSubmit={handleSearchSubmit} className="max-w-lg mx-auto mb-10">
          <div className="relative flex items-center shadow-md rounded-lg overflow-hidden border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900">
            <Search className="w-5 h-5 text-slate-400 absolute left-4" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isBn ? 'সংবাদ বা বিষয় অনুসন্ধান করুন...' : 'Search reports, topics, or archives...'}
              className="w-full pl-12 pr-28 py-3.5 bg-transparent text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none"
            />
            <button
              type="submit"
              className="absolute right-1.5 px-4 py-2 bg-[#246BFD] hover:bg-blue-600 text-white text-xs font-semibold rounded-md transition-colors cursor-pointer"
            >
              {isBn ? 'অনুসন্ধান' : 'Search'}
            </button>
          </div>
        </form>

        {/* Primary Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3 mb-12">
          <button
            onClick={onNavigateHome}
            className="flex items-center gap-2 px-6 py-3 bg-[#101D35] dark:bg-blue-600 hover:bg-slate-800 dark:hover:bg-blue-700 text-white font-medium text-sm rounded-lg shadow-sm transition-all cursor-pointer"
          >
            <Home className="w-4 h-4" />
            <span>{isBn ? 'মূল পাতায় ফিরে যান' : 'Back to Home'}</span>
          </button>
          <button
            onClick={() => window.history.back()}
            className="flex items-center gap-2 px-6 py-3 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 font-medium text-sm rounded-lg shadow-sm transition-all cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{isBn ? 'পূর্ববর্তী পৃষ্ঠা' : 'Go Back'}</span>
          </button>
        </div>

        {/* Popular Categories Shortcut */}
        {visibleCategories.length > 0 && (
          <div className="border-t border-slate-200 dark:border-slate-800 pt-8 mb-10">
            <div className="text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 font-semibold mb-4">
              {isBn ? 'জনপ্রিয় সংবাদ বিভাগসমূহ' : 'Explore Prime News Categories'}
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              {visibleCategories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => onNavigateCategory?.(cat.slug)}
                  className="px-3.5 py-1.5 rounded-full text-xs font-medium bg-white dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
                >
                  {isBn ? cat.name_bn : cat.name_en}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Top Stories Recommendation */}
        {featuredArticles.length > 0 && (
          <div className="border-t border-slate-200 dark:border-slate-800 pt-8 text-left">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 font-semibold flex items-center gap-1.5">
                <Newspaper className="w-4 h-4 text-blue-600" />
                {isBn ? 'আজকের আলোচিত সংবাদ' : "Today's Top Headlines"}
              </span>
              <button
                onClick={onNavigateHome}
                className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>{isBn ? 'সব দেখুন' : 'View All'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {featuredArticles.map(art => (
                <div
                  key={art.id}
                  onClick={() => onNavigateArticle?.(art)}
                  className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-3 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
                >
                  <div>
                    <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider block mb-1">
                      {isBn ? art.category_name_bn : art.category_name_en}
                    </span>
                    <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 line-clamp-2 transition-colors font-serif">
                      {isBn ? art.title_bn : art.title_en}
                    </h4>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-2">
                    {new Date(art.published_at).toLocaleDateString(isBn ? 'bn-BD' : 'en-US')}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
