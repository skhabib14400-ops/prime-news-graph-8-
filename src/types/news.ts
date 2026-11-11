export interface Article {
  id: string;
  slug: string;
  title_bn: string;
  title_en: string;
  summary_bn: string;
  summary_en: string;
  content_bn: string;
  content_en: string;
  category_id: string;
  category_slug: string;
  category_name_bn: string;
  category_name_en: string;
  author_id: string;
  author_name: string;
  author_avatar?: string;
  author_role?: string;
  featured_image: string;
  image_caption_bn?: string;
  image_caption_en?: string;
  gallery_images?: string[];
  video_url?: string;
  status: 'published' | 'draft' | 'archived' | 'scheduled';
  is_featured: boolean;
  is_editors_choice: boolean;
  views_count: number;
  published_at: string;
  updated_at: string;
  seo_title?: string;
  seo_description?: string;
  reading_time_minutes: number;
  tags: string[];
}

export interface Category {
  id: string;
  name_bn: string;
  name_en: string;
  slug: string;
  color: string;
  order_index: number;
  description: string;
}

export interface BreakingNewsItem {
  id: string;
  title_bn: string;
  title_en: string;
  target_url: string;
  priority: number;
  is_active: boolean;
  label_bn: string;
  label_en: string;
  scroll_speed: number;
  created_at: string;
}

export interface AdSlot {
  id: string;
  name: string;
  format: 'banner' | 'popunder' | 'social_bar' | 'native' | 'direct_link';
  ad_code: string;
  banner_image_url?: string;
  banner_target_link?: string;
  is_active: boolean;
  device_target: 'all' | 'desktop' | 'mobile';
  impressions: number;
  clicks: number;
}

export interface VideoItem {
  id: string;
  title_bn: string;
  title_en: string;
  youtube_id: string;
  category: string;
  is_featured: boolean;
  published_at: string;
}

export interface Author {
  id: string;
  name: string;
  bio_bn: string;
  bio_en: string;
  avatar: string;
  email: string;
  role: string;
  social_twitter?: string;
  social_facebook?: string;
}

export interface CommentItem {
  id: string;
  article_id: string;
  article_title?: string;
  author_name: string;
  author_email: string;
  content: string;
  status: 'approved' | 'pending' | 'spam';
  created_at: string;
}

export interface NewsletterSubscriber {
  id: string;
  email: string;
  created_at: string;
  status: 'active' | 'unsubscribed';
}

export interface WebsiteSettings {
  site_name: string;
  site_tagline_bn: string;
  site_tagline_en: string;
  logo_text: string;
  logo_badge_text?: string;
  logo_image_url?: string;
  show_round_logo?: boolean;
  default_language: 'bn' | 'en';
  contact_email: string;
  contact_phone: string;
  contact_address: string;
  copyright_text: string;
  facebook_url: string;
  twitter_url: string;
  youtube_url: string;
  instagram_url: string;
  whatsapp_number: string;
  telegram_url: string;
  tiktok_url?: string;
  show_views_publicly?: boolean;
  homepage_sections: {
    hero: boolean;
    breaking: boolean;
    latest: boolean;
    popular: boolean;
    categories: boolean;
    editors_choice: boolean;
    videos: boolean;
    newsletter: boolean;
  };
}

export interface AdminUser {
  id: string;
  username: string;
  email: string;
  password_hash?: string;
  salt?: string;
  role: 'super_admin';
  two_factor_enabled: boolean;
  recovery_codes?: string[];
  last_login?: string;
}

export interface DatabaseState {
  articles: Article[];
  categories: Category[];
  breaking_news: BreakingNewsItem[];
  ads: AdSlot[];
  videos: VideoItem[];
  authors: Author[];
  comments: CommentItem[];
  subscribers: NewsletterSubscriber[];
  settings: WebsiteSettings;
  admin_users: AdminUser[];
}
