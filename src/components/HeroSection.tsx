import React from 'react';
import { Clock, Eye, User, ArrowRight } from 'lucide-react';
import { Article } from '../types/news';
import { useLanguage } from '../context/LanguageContext';
import { normalizeImageUrl, handleImageError } from '../utils/imageHelper';

interface HeroSectionProps {
  leadStory: Article | undefined;
  secondaryStories: Article[];
  onSelectArticle: (article: Article) => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  leadStory,
  secondaryStories,
  onSelectArticle,
}) => {
  const { lang, t } = useLanguage();

  if (!leadStory) return null;

  return (
    <section className="mx-auto max-w-7xl px-4 py-6">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* 1. Primary Lead Story (7 cols on lg) */}
        <article
          onClick={() => onSelectArticle(leadStory)}
          className="group cursor-pointer lg:col-span-7 flex flex-col justify-between"
        >
          <div>
            {/* Primary Visual */}
            <div className="relative aspect-video w-full overflow-hidden rounded bg-slate-100 dark:bg-slate-800 shadow-sm">
              <img
                src={normalizeImageUrl(leadStory.featured_image, leadStory.title_bn, leadStory.category_slug)}
                alt={lang === 'bn' ? leadStory.title_bn : leadStory.title_en}
                onError={handleImageError}
                loading="lazy"
                referrerPolicy="no-referrer"
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-80" />
              
              {/* Category Kicker Overlay */}
              <div className="absolute bottom-3 left-4">
                <span className="text-xs font-bold uppercase tracking-wider text-white bg-[#246BFD] px-2.5 py-1 rounded">
                  {lang === 'bn' ? leadStory.category_name_bn : leadStory.category_name_en}
                </span>
              </div>
            </div>

            {/* Headline */}
            <h1 className="mt-4 text-2xl font-bold font-serif leading-tight text-[#101D35] dark:text-white group-hover:text-[#246BFD] transition-colors sm:text-3xl lg:text-4xl">
              {lang === 'bn' ? leadStory.title_bn : leadStory.title_en}
            </h1>

            {/* Summary */}
            <p className="mt-2 text-base text-slate-600 dark:text-slate-300 line-clamp-3 leading-relaxed">
              {lang === 'bn' ? leadStory.summary_bn : leadStory.summary_en}
            </p>
          </div>

          {/* Unboxed Metadata (Zero-Pill Discipline) */}
          <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-200 dark:border-slate-800 pt-3 text-xs text-slate-500 dark:text-slate-400">
            <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1">
              <User className="h-3.5 w-3.5 text-slate-400" />
              {leadStory.author_name}
            </span>
            <span aria-hidden="true">·</span>
            <span>{new Date(leadStory.published_at).toLocaleDateString(lang === 'bn' ? 'bn-BD' : 'en-US')}</span>
            <span aria-hidden="true">·</span>
            <span>{leadStory.reading_time_minutes} {t('minutes_read')}</span>
          </div>
        </article>

        {/* 2. Secondary Editorial Stories (5 cols on lg) */}
        <div className="lg:col-span-5 flex flex-col justify-between divide-y divide-slate-200 dark:divide-slate-800">
          {secondaryStories.slice(0, 3).map((article, index) => (
            <article
              key={article.id}
              onClick={() => onSelectArticle(article)}
              className="group cursor-pointer py-4 first:pt-0 last:pb-0"
            >
              <div className="flex gap-4">
                {/* Secondary Thumbnail */}
                <div className="relative h-24 w-32 shrink-0 overflow-hidden rounded bg-slate-100 dark:bg-slate-800 sm:h-28 sm:w-40">
                  <img
                    src={normalizeImageUrl(article.featured_image, article.title_bn, article.category_slug)}
                    alt={lang === 'bn' ? article.title_bn : article.title_en}
                    onError={handleImageError}
                    loading="lazy"
                    referrerPolicy="no-referrer"
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>

                {/* Content */}
                <div className="flex flex-1 flex-col justify-between">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#246BFD]">
                      {lang === 'bn' ? article.category_name_bn : article.category_name_en}
                    </span>
                    <h2 className="mt-1 text-sm font-bold font-serif leading-snug text-[#101D35] dark:text-white group-hover:text-[#246BFD] transition-colors line-clamp-2 sm:text-base">
                      {lang === 'bn' ? article.title_bn : article.title_en}
                    </h2>
                  </div>

                  {/* Metadata */}
                  <div className="mt-2 flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                    <span className="truncate max-w-[120px]">{article.author_name}</span>
                    <span aria-hidden="true">·</span>
                    <span className="tabular-nums">{article.reading_time_minutes}m</span>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};
