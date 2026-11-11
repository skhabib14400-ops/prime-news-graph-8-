import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'bn' | 'en';

interface LanguageContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (key: string) => string;
}

const translations: Record<Language, Record<string, string>> = {
  bn: {
    site_title: 'PRIME NEWS GRAPH',
    site_tagline: 'আন্তর্জাতিক ডিজিটাল সংবাদ মাধ্যম',
    breaking_news: 'ব্রেকিং নিউজ',
    latest_news: 'তাজা সংবাদ',
    popular_news: 'জনপ্রিয় খবর',
    editors_choice: 'সম্পাদকীয় পছন্দ',
    video_news: 'ভিডিও সংবাদ',
    read_more: 'বিস্তারিত পড়ুন',
    published_on: 'প্রকাশিত',
    updated_on: 'আপডেট',
    minutes_read: 'মিনিট পাঠ',
    views: 'বার পঠিত',
    share_article: 'শেয়ার করুন',
    related_news: 'সম্পর্কিত সংবাদ',
    leave_comment: 'মন্তব্য লিখুন',
    comments: 'পাঠকের মন্তব্য',
    submit_comment: 'মন্তব্য প্রকাশ করুন',
    newsletter_title: 'দৈনিক সংবাদ বুলেটিন সাবস্ক্রাইব করুন',
    newsletter_desc: 'গুরুত্বপূর্ণ জাতীয় ও আন্তর্জাতিক খবরের সারসংক্ষেপ সরাসরি আপনার ইনবক্সে পেতে সাবস্ক্রাইব করুন।',
    subscribe_btn: 'সাবস্ক্রাইব',
    search_placeholder: 'সংবাদ অনুসন্ধান করুন...',
    all_rights_reserved: 'সর্বস্বত্ব সংরক্ষিত।',
    admin_dashboard: 'এডমিন প্যানেল',
    home: 'প্রচ্ছদ',
    national: 'জাতীয়',
    international: 'আন্তর্জাতিক',
    politics: 'রাজনীতি',
    business: 'অর্থনীতি',
    technology: 'তথ্যপ্রযুক্তি',
    sports: 'খেলা',
    entertainment: 'বিনোদন',
    education: 'শিক্ষা',
    health: 'স্বাস্থ্য',
    lifestyle: 'জীবনযাপন',
    opinion: 'মতামত',
    print_article: 'প্রিন্ট করুন',
    copy_link: 'লিঙ্ক কপি',
    link_copied: 'লিঙ্ক কপি করা হয়েছে!',
    name_label: 'আপনার নাম',
    email_label: 'ইমেইল ঠিকানা',
    comment_label: 'আপনার মূল্যবান মতামত...',
    no_articles: 'এই বিভাগে কোনো সংবাদ পাওয়া যায়নি।',
    sponsored: 'বিজ্ঞাপন',
    back_to_home: 'মূল পাতায় ফিরে যান'
  },
  en: {
    site_title: 'PRIME NEWS GRAPH',
    site_tagline: 'International Digital News Portal',
    breaking_news: 'BREAKING NEWS',
    latest_news: 'Latest Stories',
    popular_news: 'Most Read',
    editors_choice: "Editor's Choice",
    video_news: 'Video Reports',
    read_more: 'Read Full Story',
    published_on: 'Published',
    updated_on: 'Updated',
    minutes_read: 'min read',
    views: 'views',
    share_article: 'Share Story',
    related_news: 'Related Coverage',
    leave_comment: 'Join the Discussion',
    comments: 'Reader Comments',
    submit_comment: 'Post Comment',
    newsletter_title: 'Subscribe to Prime News Dispatch',
    newsletter_desc: 'Get curated morning intelligence, breaking international alerts, and exclusive editorial analysis delivered daily.',
    subscribe_btn: 'Subscribe',
    search_placeholder: 'Search news, topics, authors...',
    all_rights_reserved: 'All rights reserved.',
    admin_dashboard: 'Admin Portal',
    home: 'Home',
    national: 'National',
    international: 'International',
    politics: 'Politics',
    business: 'Business',
    technology: 'Technology',
    sports: 'Sports',
    entertainment: 'Entertainment',
    education: 'Education',
    health: 'Health',
    lifestyle: 'Lifestyle',
    opinion: 'Opinion',
    print_article: 'Print Story',
    copy_link: 'Copy Link',
    link_copied: 'Link copied to clipboard!',
    name_label: 'Your Name',
    email_label: 'Email Address',
    comment_label: 'Your constructive thoughts...',
    no_articles: 'No articles found in this category.',
    sponsored: 'Sponsored',
    back_to_home: 'Back to Homepage'
  }
};

const LanguageContext = createContext<LanguageContextType>({
  lang: 'bn',
  setLang: () => {},
  t: (key: string) => key,
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLangState] = useState<Language>(() => {
    return (localStorage.getItem('png_lang') as Language) || 'bn';
  });

  const setLang = (newLang: Language) => {
    setLangState(newLang);
    localStorage.setItem('png_lang', newLang);
    document.documentElement.lang = newLang;
  };

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const t = (key: string): string => {
    return translations[lang][key] || translations['en'][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
