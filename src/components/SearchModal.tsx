import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Calendar, ArrowRight, Eye } from 'lucide-react';
import { Article } from '../types/news';
import { useLanguage } from '../context/LanguageContext';
import { normalizeImageUrl, handleImageError } from '../utils/imageHelper';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  articles: Article[];
  onSelectArticle: (article: Article) => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
  articles,
  onSelectArticle,
}) => {
  const { lang, t } = useLanguage();
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const clean = query.trim().toLowerCase();
  const results = clean.length > 0
    ? articles.filter(a =>
        a.title_bn.toLowerCase().includes(clean) ||
        a.title_en.toLowerCase().includes(clean) ||
        a.summary_bn.toLowerCase().includes(clean) ||
        a.summary_en.toLowerCase().includes(clean) ||
        a.author_name.toLowerCase().includes(clean) ||
        a.tags.some(t => t.toLowerCase().includes(clean))
      )
    : [];

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 pt-16 sm:pt-24 px-4 backdrop-blur-xs">
      <div className="relative w-full max-w-2xl rounded-xl bg-white dark:bg-[#101D35] shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden transition-colors">
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 border-b border-slate-200 dark:border-slate-800 px-4 py-3.5 bg-slate-50 dark:bg-slate-900/60">
          <Search className="h-5 w-5 text-slate-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder={t('search_placeholder')}
            className="flex-1 bg-transparent text-base font-medium text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="text-xs font-semibold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 px-1 cursor-pointer"
            >
              CLEAR
            </button>
          )}
          <button
            onClick={onClose}
            className="rounded p-1 text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Results Area */}
        <div className="max-h-[60vh] overflow-y-auto p-4 divide-y divide-slate-100 dark:divide-slate-800">
          {clean.length === 0 ? (
            <div className="py-8 text-center text-sm text-slate-400">
              {lang === 'bn' ? 'শিরোনাম, লেখক বা প্রাসঙ্গিক শব্দ লিখে অনুসন্ধান করুন' : 'Type keywords, author names or topics to search articles'}
            </div>
          ) : results.length === 0 ? (
            <div className="py-8 text-center text-sm text-slate-500 dark:text-slate-400">
              {lang === 'bn' ? `"${query}" এর জন্য কোনো ফলাফল পাওয়া যায়নি` : `No results found for "${query}"`}
            </div>
          ) : (
            results.map(article => (
              <article
                key={article.id}
                onClick={() => {
                  onSelectArticle(article);
                  onClose();
                }}
                className="group cursor-pointer py-3 flex gap-3 items-center hover:bg-slate-50 dark:hover:bg-slate-800/60 px-2 rounded transition-colors"
              >
                <div className="relative h-16 w-20 shrink-0 overflow-hidden rounded bg-slate-100 dark:bg-slate-800">
                  <img
                    src={normalizeImageUrl(article.featured_image, article.title_bn, article.category_slug)}
                    alt={lang === 'bn' ? article.title_bn : article.title_en}
                    onError={handleImageError}
                    loading="lazy"
                    referrerPolicy="no-referrer"
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="flex-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#246BFD]">
                    {lang === 'bn' ? article.category_name_bn : article.category_name_en}
                  </span>
                  <h4 className="text-sm font-semibold font-serif text-[#101D35] dark:text-white group-hover:text-[#246BFD] transition-colors line-clamp-1">
                    {lang === 'bn' ? article.title_bn : article.title_en}
                  </h4>
                  <div className="mt-1 flex items-center gap-2 text-[11px] text-slate-400">
                    <span>{new Date(article.published_at).toLocaleDateString(lang === 'bn' ? 'bn-BD' : 'en-US')}</span>
                    <span aria-hidden="true">·</span>
                    <span>{article.author_name}</span>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-slate-300 dark:text-slate-600 group-hover:text-[#246BFD] group-hover:translate-x-1 transition-transform" />
              </article>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
