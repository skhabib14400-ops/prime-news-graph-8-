import React from 'react';
import { ArrowRight, ChevronRight } from 'lucide-react';
import { Article, Category, AdSlot } from '../types/news';
import { useLanguage } from '../context/LanguageContext';
import { normalizeImageUrl, handleImageError } from '../utils/imageHelper';
import { AdPlacement } from './AdPlacement';

interface CategoryBlocksProps {
  categories: Category[];
  articles: Article[];
  onSelectCategory: (slug: string) => void;
  onSelectArticle: (article: Article) => void;
  interCategoryAd?: AdSlot;
}

export const CategoryBlocks: React.FC<CategoryBlocksProps> = ({
  categories,
  articles,
  onSelectCategory,
  onSelectArticle,
  interCategoryAd,
}) => {
  const { lang } = useLanguage();

  // Pick top 3 categories to display in dedicated blocks: National, International, Technology
  const targetCategories = categories.filter(c => ['national', 'international', 'technology', 'sports'].includes(c.slug));

  return (
    <div className="space-y-10">
      {targetCategories.map(cat => {
        const catArticles = articles.filter(a => a.category_slug === cat.slug);
        if (catArticles.length === 0) return null;

        const leadStory = catArticles[0];
        const subStories = catArticles.slice(1, 4);

        return (
          <React.Fragment key={cat.id}>
            <section className="rounded-lg bg-white dark:bg-[#101D35] p-6 shadow-sm border border-slate-200/80 dark:border-slate-800 transition-colors">
              {/* Category Header */}
              <div className="flex items-center justify-between border-b-2 pb-3 mb-5" style={{ borderColor: cat.color || '#246BFD' }}>
              <div className="flex items-center gap-2">
                <span className="h-4 w-1.5 rounded-full" style={{ backgroundColor: cat.color || '#246BFD' }}></span>
                <h3 className="text-xl font-bold font-serif text-[#101D35] dark:text-white">
                  {lang === 'bn' ? cat.name_bn : cat.name_en}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => onSelectCategory(cat.slug)}
                className="group flex items-center gap-1 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-[#246BFD] transition-colors cursor-pointer"
              >
                <span>{lang === 'bn' ? 'সব দেখুন' : 'View All'}</span>
                <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              </button>
            </div>

            {/* Layout: 1 Lead + 3 Grid Sub-stories */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Lead Card */}
              <article
                onClick={() => onSelectArticle(leadStory)}
                className="group cursor-pointer lg:col-span-6 flex flex-col justify-between"
              >
                <div className="relative aspect-video w-full overflow-hidden rounded bg-slate-100 dark:bg-slate-800">
                  <img
                    src={normalizeImageUrl(leadStory.featured_image, leadStory.title_bn, leadStory.category_slug)}
                    alt={lang === 'bn' ? leadStory.title_bn : leadStory.title_en}
                    onError={handleImageError}
                    loading="lazy"
                    referrerPolicy="no-referrer"
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <h4 className="mt-3 text-lg font-bold font-serif leading-snug text-[#101D35] dark:text-white group-hover:text-[#246BFD] transition-colors">
                  {lang === 'bn' ? leadStory.title_bn : leadStory.title_en}
                </h4>
                <p className="mt-1 text-xs text-slate-600 dark:text-slate-300 line-clamp-2">
                  {lang === 'bn' ? leadStory.summary_bn : leadStory.summary_en}
                </p>
                <div className="mt-2 text-[11px] text-slate-400">
                  {new Date(leadStory.published_at).toLocaleDateString(lang === 'bn' ? 'bn-BD' : 'en-US')}
                </div>
              </article>

              {/* Sub-cards */}
              <div className="lg:col-span-6 flex flex-col justify-between divide-y divide-slate-100 dark:divide-slate-800">
                {subStories.map(story => (
                  <article
                    key={story.id}
                    onClick={() => onSelectArticle(story)}
                    className="group cursor-pointer py-3 first:pt-0 last:pb-0 flex gap-3.5 items-center"
                  >
                    <div className="relative h-18 w-24 shrink-0 overflow-hidden rounded bg-slate-100 dark:bg-slate-800">
                      <img
                        src={normalizeImageUrl(story.featured_image, story.title_bn, story.category_slug)}
                        alt={lang === 'bn' ? story.title_bn : story.title_en}
                        onError={handleImageError}
                        loading="lazy"
                        referrerPolicy="no-referrer"
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>
                    <div className="flex-1">
                      <h5 className="text-xs sm:text-sm font-semibold font-serif text-[#101D35] dark:text-white group-hover:text-[#246BFD] transition-colors line-clamp-2 leading-snug">
                        {lang === 'bn' ? story.title_bn : story.title_en}
                      </h5>
                      <div className="mt-1 text-[10px] text-slate-400">
                        {new Date(story.published_at).toLocaleDateString(lang === 'bn' ? 'bn-BD' : 'en-US')} · {story.author_name}
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </section>
          {interCategoryAd && interCategoryAd.is_active && (
            <div className="my-6">
              <AdPlacement slot={interCategoryAd} />
            </div>
          )}
        </React.Fragment>
        );
      })}
    </div>
  );
};
