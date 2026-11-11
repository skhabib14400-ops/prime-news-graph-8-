import React from 'react';
import { Globe, Mail, Phone, MapPin, Facebook, Twitter, Youtube, Instagram, ShieldCheck, ArrowUp } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { WebsiteSettings, Category, AdSlot } from '../types/news';
import { AdPlacement } from './AdPlacement';

interface FooterProps {
  settings: WebsiteSettings;
  categories: Category[];
  footerAd?: AdSlot;
  onSelectCategory: (slug: string) => void;
  onOpenLegalModal: (title: string, content: string) => void;
}

export const Footer: React.FC<FooterProps> = ({
  settings,
  categories,
  footerAd,
  onSelectCategory,
  onOpenLegalModal,
}) => {
  const { lang, t } = useLanguage();

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="w-full bg-[#0B132B] text-slate-400 pt-10 pb-6 border-t border-slate-800">
      <div className="mx-auto max-w-7xl px-4">
        {/* Footer Leaderboard Ad */}
        {footerAd && (
          <div className="mb-8">
            <AdPlacement slot={footerAd} />
          </div>
        )}

        {/* Main Footer Columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 pb-10 border-b border-slate-800/80">
          {/* Brand Info */}
          <div>
            <span className="text-2xl font-black font-serif text-white tracking-tight">
              PRIME NEWS GRAPH
            </span>
            <p className="mt-2 text-xs leading-relaxed text-slate-400">
              {lang === 'bn' ? settings.site_tagline_bn : settings.site_tagline_en}
            </p>
            <div className="mt-4 flex items-center gap-3">
              <a
                href={settings.facebook_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-800 text-slate-300 hover:bg-[#246BFD] hover:text-white transition-colors"
                title="Facebook"
              >
                <Facebook className="h-4 w-4" />
              </a>
              <a
                href={settings.twitter_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-800 text-slate-300 hover:bg-[#246BFD] hover:text-white transition-colors"
                title="X (Twitter)"
              >
                <Twitter className="h-4 w-4" />
              </a>
              <a
                href={settings.youtube_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-800 text-slate-300 hover:bg-red-600 hover:text-white transition-colors"
                title="YouTube"
              >
                <Youtube className="h-4 w-4" />
              </a>
              <a
                href={settings.instagram_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-800 text-slate-300 hover:bg-pink-600 hover:text-white transition-colors"
                title="Instagram"
              >
                <Instagram className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Quick Categories Navigation */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white border-l-2 border-[#246BFD] pl-2 mb-3">
              {lang === 'bn' ? 'সংবাদ বিভাগ' : 'Editorial Desks'}
            </h4>
            <ul className="grid grid-cols-2 gap-y-1.5 text-xs">
              {categories.slice(0, 10).map(cat => (
                <li key={cat.id}>
                  <button
                    type="button"
                    onClick={() => onSelectCategory(cat.slug)}
                    className="hover:text-white hover:underline transition-colors"
                  >
                    {lang === 'bn' ? cat.name_bn : cat.name_en}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Editorial & Legal Links */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white border-l-2 border-[#246BFD] pl-2 mb-3">
              {lang === 'bn' ? 'প্রাতিষ্ঠানিক নীতি' : 'Editorial & Policies'}
            </h4>
            <ul className="space-y-1.5 text-xs">
              <li>
                <button
                  type="button"
                  onClick={() => onOpenLegalModal('Editorial Policy', 'PRIME NEWS GRAPH adheres to the highest standards of international journalism: truth, independence, accuracy, impartiality, and public accountability. Our reporters operate autonomously under international press protections.')}
                  className="hover:text-white hover:underline transition-colors"
                >
                  {lang === 'bn' ? 'সম্পাদকীয় নীতিমালা' : 'Editorial Policy'}
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onOpenLegalModal('Privacy Policy', 'PRIME NEWS GRAPH is committed to safeguarding user data in accordance with international privacy frameworks (GDPR). We never sell reader telemetry or personal email records.')}
                  className="hover:text-white hover:underline transition-colors"
                >
                  {lang === 'bn' ? 'গোপনীয়তা নীতি' : 'Privacy Policy'}
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onOpenLegalModal('Terms & Conditions', 'All published intellectual property, investigation reports, and digital assets belong to PRIME NEWS GRAPH. Unauthorized automated scraping without written licensing is strictly prohibited.')}
                  className="hover:text-white hover:underline transition-colors"
                >
                  {lang === 'bn' ? 'ব্যবহারের শর্তাবলি' : 'Terms & Conditions'}
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onOpenLegalModal('Advertise With Us', 'Reach high-intent institutional investors, policymakers, and millions of daily readers through certified IAB and Adsterra digital ad placements. Email: ads@primenewsgraph.com')}
                  className="hover:text-white hover:underline transition-colors"
                >
                  {lang === 'bn' ? 'বিজ্ঞাপন দিন' : 'Advertise With Us'}
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onOpenLegalModal('Fact-Checking Policy', 'Every numerical statistic, official quote, and investigative claim is verified across multiple primary records by our senior research editors before publishing.')}
                  className="hover:text-white hover:underline transition-colors"
                >
                  {lang === 'bn' ? 'ফ্যাক্ট-চেকিং নীতি' : 'Fact-Checking Policy'}
                </button>
              </li>
            </ul>
          </div>

          {/* Contact Details */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white border-l-2 border-[#246BFD] pl-2 mb-3">
              {lang === 'bn' ? 'যোগাযোগ ও ব্যুরো' : 'Newsroom & Contact'}
            </h4>
            <div className="space-y-2 text-xs">
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 shrink-0 text-slate-500 mt-0.5" />
                <span className="leading-snug">{settings.contact_address}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 shrink-0 text-slate-500" />
                <span>{settings.contact_phone}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 shrink-0 text-slate-500" />
                <span>{settings.contact_email}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar: Copyright and Back to Top */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div>{settings.copyright_text}</div>
          <button
            type="button"
            onClick={scrollToTop}
            className="flex items-center gap-1.5 hover:text-white transition-colors"
          >
            <span>{lang === 'bn' ? 'উপরে উঠুন' : 'Back to Top'}</span>
            <ArrowUp className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </footer>
  );
};
