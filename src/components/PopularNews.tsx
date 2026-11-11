import React from 'react';
import { TrendingUp, Eye } from 'lucide-react';
import { Article } from '../types/news';
import { useLanguage } from '../context/LanguageContext';

interface PopularNewsProps {
  articles: Article[];
  onSelectArticle: (article: Article) => void;
}

export const PopularNews: React.FC<PopularNewsProps> = ({ articles, onSelectArticle }) => {
  const { lang, t } = useLanguage();

  // Sort by views count descending
  const sorted = [...articles].sort((a, b) => (b.views_count || 0) - (a.views_count || 0)).slice(0, 5);

  return (
    <div className="rounded-lg bg-white dark:bg-[#101D35] p-5 shadow-sm border border-slate-200/80 dark:border-slate-800 transition-colors">
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
        <TrendingUp className="h-5 w-5 text-[#246BFD]" />
        <h3 className="text-base font-bold font-serif text-[#101D35] dark:text-white uppercase tracking-wide">
          {t('popular_news')}
        </h3>
      </div>

      <div className="divide-y divide-slate-100 dark:divide-slate-800">
        {sorted.map((art, idx) => (
          <article
            key={art.id}
            onClick={() => onSelectArticle(art)}
            className="group cursor-pointer py-3.5 first:pt-3 last:pb-0 flex items-start gap-3.5"
          >
            {/* Rank Number */}
            <span className="font-serif text-2xl font-bold text-slate-300 dark:text-slate-600 group-hover:text-[#246BFD] transition-colors tabular-nums shrink-0 w-6">
              0{idx + 1}
            </span>

            <div className="flex-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#246BFD]">
                {lang === 'bn' ? art.category_name_bn : art.category_name_en}
              </span>
              <h4 className="mt-0.5 text-xs sm:text-sm font-semibold font-serif text-slate-900 dark:text-slate-100 group-hover:text-[#246BFD] transition-colors line-clamp-2 leading-snug">
                {lang === 'bn' ? art.title_bn : art.title_en}
              </h4>
              <div className="mt-1 flex items-center gap-2 text-[11px] text-slate-400">
                <span>{new Date(art.published_at).toLocaleDateString(lang === 'bn' ? 'bn-BD' : 'en-US')}</span>
                <span aria-hidden="true">·</span>
                <span>{art.reading_time_minutes}m</span>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
};
