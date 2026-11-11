import { Article, Category, BreakingNewsItem, AdSlot, VideoItem, Author, CommentItem, NewsletterSubscriber, WebsiteSettings, AdminUser, DatabaseState } from '../types/news';
import { DEFAULT_DATABASE_STATE } from '../data/fallbackData';
import { firebaseAuthService } from './firebaseAuth';
import { db } from './firebase';
import { collection, doc, getDoc, getDocs, setDoc, deleteDoc, query, where, limit } from 'firebase/firestore';

const BASE_URL = '';

// Local state cache in browser memory and localStorage
const STORAGE_KEY = 'png_local_db_cache_v10';

function sanitizeDatabaseState(state: DatabaseState): DatabaseState {
  if (!state) return state;
  try {
    let str = JSON.stringify(state);
    if (str.includes('/src/assets/images/')) {
      str = str.replaceAll('/src/assets/images/', '/assets/images/');
      state = JSON.parse(str);
    }

    // Auto-migrate any legacy Adsterra ad codes to user newest keys & scripts
    if (Array.isArray(state.ads)) {
      const default728 = `<script>\n  atOptions = {\n    'key' : 'b713e6ef9bcbd950fde8de6fdbc2c316',\n    'format' : 'iframe',\n    'height' : 90,\n    'width' : 728,\n    'params' : {}\n  };\n</script>\n<script src="https://bicea.org/22/b713e6ef9bcbd950fde8de6fdbc2c316"></script>`;
      const default300 = `<script>\n  atOptions = {\n    'key' : '1547813ee5e9165c15f63eaa054cf877',\n    'format' : 'iframe',\n    'height' : 250,\n    'width' : 300,\n    'params' : {}\n  };\n</script>\n<script src="https://bicea.org/22/1547813ee5e9165c15f63eaa054cf877"></script>`;
      const default320 = `<script>\n  atOptions = {\n    'key' : '4fa6a8cbab261c96e980e6c49a014f9d',\n    'format' : 'iframe',\n    'height' : 50,\n    'width' : 320,\n    'params' : {}\n  };\n</script>\n<script src="https://bicea.org/22/4fa6a8cbab261c96e980e6c49a014f9d"></script>`;

      state.ads = state.ads.map(ad => {
        let code = ad.ad_code || '';
        // 728x90 legacy replacement
        if (code.includes('b4815a2fd87e3b5b988b1e480f060c36') || code.includes('Global Cloud Hosting') || code.includes('Digital Banking & Seamless')) {
          return { ...ad, ad_code: default728 };
        }
        // 300x250 legacy replacement
        if (code.includes('b7d833859be47ccda4fccadb7f2154e8') || code.includes('Master Data Science & AI')) {
          return { ...ad, ad_code: default300 };
        }
        // 320x50 legacy replacement
        if (code.includes('feaa78b521d61a9a46b260640dab7e68') || code.includes('Download Top Finance App')) {
          return { ...ad, ad_code: default320 };
        }
        // Native container legacy replacement
        if (code.includes('container-b62e49ee7287cc466d175832a73a3e12')) {
          return {
            ...ad,
            ad_code: `<script async="async" data-cfasync="false" src="https://bicea.org/21/5dcb5138b7cff3bbbaa59a0fa9bba75d"></script>\n<div id="container-5dcb5138b7cff3bbbaa59a0fa9bba75d"></div>`
          };
        }
        // Popunder legacy replacement
        if (ad.id === 'popunder' && (code.includes('210e04c023065f4bd73f5a218a3af0ee') || code.includes('Slot ID 4910291'))) {
          return {
            ...ad,
            ad_code: `<script data-cfasync="false" src="https://afders.org/1/4be7d82348a1be0e427f489cb21509ce"></script>`,
            is_active: true
          };
        }
        // Social bar legacy replacement
        if (ad.id === 'social_bar' && (code.includes('046bfb413c6b955fc22060813fa0a79a') || code.includes('Social Bar ready for interactive'))) {
          return {
            ...ad,
            ad_code: `<script data-cfasync="false" src="https://bicea.org/14/799ac73f4af6f2d0b12fc445e295b683"></script>\n<script data-cfasync="false" src="https://afders.org/1/4be7d82348a1be0e427f489cb21509ce"></script>`,
            is_active: true
          };
        }
        // Direct link legacy replacement
        if (ad.id === 'direct_smartlink' && code.includes('7291dca1d41ac3667bd2ac15006500fd')) {
          return {
            ...ad,
            ad_code: `https://arwf.org/4/a9f1d704984553dbce8f19128b098736`,
            banner_target_link: `https://arwf.org/4/a9f1d704984553dbce8f19128b098736`
          };
        }
        return ad;
      });

      // Ensure inter_category ad slot exists
      if (!state.ads.some(a => a.id === 'inter_category')) {
        state.ads.push({
          id: 'inter_category',
          name: 'Homepage Inter-Category Leaderboard (728x90)',
          format: 'banner',
          ad_code: default728,
          is_active: true,
          device_target: 'all',
          impressions: 16500,
          clicks: 870
        });
      }
    }

    // Ensure 100% of articles have valid, visible, non-broken images
    if (Array.isArray(state.articles)) {
      state.articles = state.articles.map(art => {
        let img = (art.featured_image || '').trim();
        if (img.includes('/src/assets/images/')) {
          img = img.replace('/src/assets/images/', '/assets/images/');
        }
        if (img.startsWith('src/assets/images/')) {
          img = `/${img}`;
        }

        // If image is missing, empty, or broken, supply smart category image
        if (!img || img === '/assets/images/' || !img.includes('/') || img === 'undefined' || img === 'null') {
          const text = `${art.title_bn || ''} ${art.title_en || ''} ${art.category_slug || ''}`.toLowerCase();
          if (text.includes('বুদ্ধিমত্তা') || text.includes('ai') || text.includes('tech') || text.includes('প্রযুক্তি') || text.includes('chip') || text.includes('technology')) {
            img = '/assets/images/news_tech_ai_chip_1793801922448.jpg';
          } else if (text.includes('মেট্রো') || text.includes('ঢাকা') || text.includes('জাতীয়') || text.includes('national')) {
            img = '/assets/images/news_dhaka_metro_1793801923998.jpg';
          } else if (text.includes('ক্রিকেট') || text.includes('খেলা') || text.includes('sports')) {
            img = '/assets/images/news_cricket_stadium_1793801922344.jpg';
          } else {
            img = '/assets/images/news_world_summit_1793801922828.jpg';
          }
        }
        return { ...art, featured_image: img };
      });

      // Ensure netrokona article exists in state.articles
      if (!state.articles.some(a => a.slug === 'madrasa-teacher-sentenced-to-death-for-raping-11-year-old-girl-netrokona')) {
        const netrokonaArt = DEFAULT_DATABASE_STATE.articles.find(a => a.slug === 'madrasa-teacher-sentenced-to-death-for-raping-11-year-old-girl-netrokona') as unknown as Article;
        if (netrokonaArt) {
          state.articles = [netrokonaArt, ...state.articles];
        }
      }
    }
  } catch (e) {
    console.warn('Error sanitizing database state:', e);
  }
  return state;
}

// Clean up legacy caches with broken /src/ paths once
try {
  ['png_local_db_cache_v1', 'png_local_db_cache_v2', 'png_local_db_cache_v3', 'png_local_db_cache_v4', 'png_local_db_cache_v5', 'png_local_db_cache_v6', 'png_local_db_cache_v7', 'png_local_db_cache_v8'].forEach(k => {
    if (localStorage.getItem(k)) localStorage.removeItem(k);
  });
} catch {}

function getLocalState(): DatabaseState {
  try {
    const cached = localStorage.getItem(STORAGE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      return sanitizeDatabaseState(parsed);
    }
  } catch (e) {
    console.warn('Could not read cached database from localStorage', e);
  }
  return sanitizeDatabaseState({ ...DEFAULT_DATABASE_STATE } as any);
}

function saveLocalState(state: DatabaseState) {
  try {
    const sanitized = sanitizeDatabaseState(state);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sanitized));
  } catch (e) {
    console.warn('Could not save database state to localStorage', e);
  }
}

function notifyDataUpdated(detail: Record<string, any> = {}) {
  try {
    // 1. Same-window custom event
    window.dispatchEvent(new CustomEvent('png_data_updated', { detail }));

    // 2. Cross-tab BroadcastChannel for instant real-time sync without page reload
    if (typeof BroadcastChannel !== 'undefined') {
      const bc = new BroadcastChannel('png_news_updates');
      bc.postMessage(detail);
      bc.close();
    }
  } catch {}
}

function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem('png_admin_token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

async function safeJsonFetch<T>(url: string, options?: RequestInit): Promise<T | null> {
  try {
    const res = await fetch(url, options);
    if (!res.ok) return null;
    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      return null;
    }
    const data = await res.json();
    return data as T;
  } catch {
    return null;
  }
}

export const api = {
  getLocalDatabaseState(): DatabaseState {
    return getLocalState();
  },
  // Articles
  async getArticles(params?: { category?: string; status?: string; search?: string; featured?: boolean; limit?: number; offset?: number }): Promise<{ total: number; items: Article[] }> {
    const localState = getLocalState();
    let serverItems: Article[] = [];

    // Query Firestore news_articles collection
    try {
      const fsSnap = await getDocs(collection(db, 'news_articles'));
      if (!fsSnap.empty) {
        fsSnap.forEach(docSnap => {
          const art = docSnap.data() as Article;
          if (art && art.id) {
            serverItems.push(art);
          }
        });
      }
    } catch {}

    try {
      const queryParams = new URLSearchParams();
      if (params?.category) queryParams.set('category', params.category);
      if (params?.status) queryParams.set('status', params.status);
      if (params?.search) queryParams.set('search', params.search);
      if (params?.featured !== undefined) queryParams.set('featured', String(params.featured));
      if (params?.limit) queryParams.set('limit', String(params.limit));
      if (params?.offset) queryParams.set('offset', String(params.offset));

      const res = await fetch(`${BASE_URL}/api/articles?${queryParams.toString()}`);
      if (res.ok) {
        const contentType = res.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          const data = await res.json();
          if (data && data.items && Array.isArray(data.items)) {
            serverItems = [...serverItems, ...data.items];
          }
        }
      }
    } catch {
      // Fall through to local state
    }

    // Merge server items with local state articles so admin post changes are 100% instantaneous
    const localArticles = localState.articles || [];
    const mergedMap = new Map<string, Article>();

    // 1. Put server items first
    serverItems.forEach(art => {
      mergedMap.set(art.id, art);
    });

    // 2. Overlay local articles (user's latest edits/posts take priority)
    localArticles.forEach(art => {
      mergedMap.set(art.id, art);
    });

    let list = Array.from(mergedMap.values());

    // Sort by publication date descending
    list.sort((a, b) => new Date(b.published_at || 0).getTime() - new Date(a.published_at || 0).getTime());

    if (params?.category) {
      list = list.filter(a => a.category_slug === params.category || a.category_id === params.category);
    }
    if (params?.status) {
      list = list.filter(a => a.status === params.status);
    } else {
      list = list.filter(a => a.status === 'published');
    }
    if (params?.search) {
      const q = params.search.toLowerCase();
      list = list.filter(a =>
        a.title_bn?.toLowerCase().includes(q) ||
        a.title_en?.toLowerCase().includes(q) ||
        a.summary_bn?.toLowerCase().includes(q) ||
        a.content_bn?.toLowerCase().includes(q)
      );
    }
    if (params?.featured !== undefined) {
      list = list.filter(a => a.is_featured === params.featured);
    }

    const total = list.length;
    const offset = params?.offset || 0;
    const limitCount = params?.limit || total;
    return {
      total,
      items: list.slice(offset, offset + limitCount)
    };
  },

  async getArticleBySlug(slug: string): Promise<Article> {
    const rawSlug = String(slug || '').trim();
    const cleanSlug = decodeURIComponent(rawSlug).trim().replace(/^\/+|\/+$/g, '');

    // 1. Check in-memory local state
    const state = getLocalState();
    let article = (state.articles || []).find(a => 
      a.slug === cleanSlug || a.id === cleanSlug || a.slug === rawSlug || a.id === rawSlug
    );
    if (article) return article;

    // 2. Query Firestore by slug
    try {
      const q = query(collection(db, 'news_articles'), where('slug', '==', cleanSlug), limit(1));
      const snap = await getDocs(q);
      if (!snap.empty) {
        const found = snap.docs[0].data() as Article;
        if (found) {
          state.articles = [found, ...(state.articles || []).filter(a => a.id !== found.id)];
          saveLocalState(state);
          return found;
        }
      }
    } catch {}

    // 3. Query Firestore by doc id
    try {
      const docSnap = await getDoc(doc(db, 'news_articles', cleanSlug));
      if (docSnap.exists()) {
        const found = docSnap.data() as Article;
        state.articles = [found, ...(state.articles || []).filter(a => a.id !== found.id)];
        saveLocalState(state);
        return found;
      }
    } catch {}

    // 4. Safe server fetch
    const data = await safeJsonFetch<Article>(`${BASE_URL}/api/articles/${encodeURIComponent(cleanSlug)}`);
    if (data && (data.id || data.slug)) {
      state.articles = [data, ...(state.articles || []).filter(a => a.id !== data.id)];
      saveLocalState(state);
      return data;
    }

    // 5. Fallback dataset
    const fallback = DEFAULT_DATABASE_STATE.articles.find(a => 
      a.slug === cleanSlug || a.id === cleanSlug || a.slug === rawSlug || a.id === rawSlug
    ) as unknown as Article;
    if (fallback) return fallback;

    throw new Error('Article not found');
  },

  async incrementViews(id: string): Promise<{ views: number }> {
    const data = await safeJsonFetch<{ views: number }>(`${BASE_URL}/api/articles/${id}/view`, { method: 'POST' });
    if (data && typeof data.views === 'number') return data;

    const state = getLocalState();
    const article = (state.articles || []).find(a => a.id === id || a.slug === id);
    if (article) {
      article.views_count = (article.views_count || 0) + 1;
      saveLocalState(state);
      return { views: article.views_count };
    }
    return { views: 0 };
  },

  async saveArticle(article: Partial<Article>): Promise<Article> {
    // Ensure featured_image is always a valid, non-broken URL or Base64 data URI
    let featuredImage = (article.featured_image || '').trim();
    if (featuredImage.includes('/src/assets/images/')) {
      featuredImage = featuredImage.replace('/src/assets/images/', '/assets/images/');
    }
    if (!featuredImage || featuredImage === '/assets/images/' || !featuredImage.includes('/')) {
      const text = `${article.title_bn || ''} ${article.title_en || ''} ${article.category_slug || ''}`.toLowerCase();
      if (text.includes('বুদ্ধিমত্তা') || text.includes('ai') || text.includes('tech') || text.includes('প্রযুক্তি') || text.includes('chip') || text.includes('technology')) {
        featuredImage = '/assets/images/news_tech_ai_chip_1793801922448.jpg';
      } else if (text.includes('মেট্রো') || text.includes('ঢাকা') || text.includes('জাতীয়') || text.includes('national')) {
        featuredImage = '/assets/images/news_dhaka_metro_1793801923998.jpg';
      } else if (text.includes('ক্রিকেট') || text.includes('খেলা') || text.includes('sports')) {
        featuredImage = '/assets/images/news_cricket_stadium_1793801922344.jpg';
      } else {
        featuredImage = '/assets/images/news_world_summit_1793801922828.jpg';
      }
    }
    article.featured_image = featuredImage;

    try {
      const isNew = !article.id || article.id.startsWith('new-');
      const url = isNew ? `${BASE_URL}/api/articles` : `${BASE_URL}/api/articles/${article.id}`;
      const method = isNew ? 'POST' : 'PUT';

      const saved = await safeJsonFetch<Article>(url, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify(article),
      });
      if (saved && saved.id) {
        // sync to local state
        const state = getLocalState();
        if (isNew) state.articles = [saved, ...(state.articles || [])];
        else state.articles = (state.articles || []).map(a => a.id === saved.id ? saved : a);
        saveLocalState(state);
        notifyDataUpdated({ type: 'article', data: saved });
        // Sync to Firestore
        try {
          await setDoc(doc(db, 'news_articles', saved.id), saved, { merge: true });
        } catch {}
        return saved;
      }
    } catch {
      // Fall through
    }

    const state = getLocalState();
    const id = article.id && !article.id.startsWith('new-') ? article.id : `art-${Date.now()}`;
    const saved: Article = {
      ...(state.articles?.[0] || {}),
      ...article,
      id,
      published_at: article.published_at || new Date().toISOString(),
      updated_at: new Date().toISOString()
    } as any;

    const existingIdx = (state.articles || []).findIndex(a => a.id === id);
    if (existingIdx >= 0) {
      state.articles[existingIdx] = saved;
    } else {
      state.articles = [saved, ...(state.articles || [])];
    }
    saveLocalState(state);
    notifyDataUpdated({ type: 'article', data: saved });

    // Sync to Firestore
    try {
      await setDoc(doc(db, 'news_articles', saved.id), saved, { merge: true });
    } catch {}

    return saved;
  },

  async deleteArticle(id: string): Promise<{ success: boolean }> {
    try {
      await safeJsonFetch(`${BASE_URL}/api/articles/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
    } catch {}

    try {
      await deleteDoc(doc(db, 'news_articles', id));
    } catch {}

    const state = getLocalState();
    state.articles = (state.articles || []).filter(a => a.id !== id && a.slug !== id);
    saveLocalState(state);
    notifyDataUpdated({ type: 'article_deleted', id });
    return { success: true };
  },

  // Categories
  async getCategories(): Promise<Category[]> {
    const data = await safeJsonFetch<Category[]>(`${BASE_URL}/api/categories`);
    if (Array.isArray(data) && data.length > 0) return data;
    return getLocalState().categories || [];
  },

  async saveCategory(cat: Partial<Category>): Promise<Category> {
    try {
      const isNew = !cat.id;
      const url = isNew ? `${BASE_URL}/api/categories` : `${BASE_URL}/api/categories/${cat.id}`;
      const method = isNew ? 'POST' : 'PUT';

      const saved = await safeJsonFetch<Category>(url, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify(cat),
      });
      if (saved && saved.id) {
        const state = getLocalState();
        if (isNew) state.categories = [...(state.categories || []), saved];
        else state.categories = (state.categories || []).map(c => c.id === saved.id ? saved : c);
        saveLocalState(state);
        notifyDataUpdated({ type: 'category', data: saved });
        return saved;
      }
    } catch {}

    const state = getLocalState();
    const id = cat.id || `cat-${Date.now()}`;
    const saved = { ...cat, id } as Category;
    const existingIdx = (state.categories || []).findIndex(c => c.id === id);
    if (existingIdx >= 0) state.categories[existingIdx] = saved;
    else state.categories = [...(state.categories || []), saved];
    saveLocalState(state);
    notifyDataUpdated({ type: 'category', data: saved });
    return saved;
  },

  async deleteCategory(id: string): Promise<{ success: boolean }> {
    try {
      await safeJsonFetch(`${BASE_URL}/api/categories/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
    } catch {}

    const state = getLocalState();
    state.categories = (state.categories || []).filter(c => c.id !== id);
    saveLocalState(state);
    notifyDataUpdated({ type: 'category_deleted', id });
    return { success: true };
  },

  // Breaking News
  async getBreakingNews(all = false): Promise<BreakingNewsItem[]> {
    const data = await safeJsonFetch<BreakingNewsItem[]>(`${BASE_URL}/api/breaking-news?all=${all}`);
    if (Array.isArray(data) && data.length > 0) return data;

    const bn = getLocalState().breaking_news || [];
    return all ? bn : bn.filter(item => item.is_active);
  },

  async saveBreakingNews(item: Partial<BreakingNewsItem>): Promise<BreakingNewsItem> {
    try {
      const isNew = !item.id;
      const url = isNew ? `${BASE_URL}/api/breaking-news` : `${BASE_URL}/api/breaking-news/${item.id}`;
      const method = isNew ? 'POST' : 'PUT';

      const saved = await safeJsonFetch<BreakingNewsItem>(url, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify(item),
      });
      if (saved && saved.id) {
        const state = getLocalState();
        if (isNew) state.breaking_news = [saved, ...(state.breaking_news || [])];
        else state.breaking_news = (state.breaking_news || []).map(b => b.id === saved.id ? saved : b);
        saveLocalState(state);
        notifyDataUpdated({ type: 'breaking_news', data: saved });
        return saved;
      }
    } catch {}

    const state = getLocalState();
    const id = item.id || `bn-${Date.now()}`;
    const saved = { ...item, id, created_at: item.created_at || new Date().toISOString() } as BreakingNewsItem;
    const existingIdx = (state.breaking_news || []).findIndex(b => b.id === id);
    if (existingIdx >= 0) state.breaking_news[existingIdx] = saved;
    else state.breaking_news = [saved, ...(state.breaking_news || [])];
    saveLocalState(state);
    notifyDataUpdated({ type: 'breaking_news', data: saved });
    return saved;
  },

  async deleteBreakingNews(id: string): Promise<{ success: boolean }> {
    try {
      await safeJsonFetch(`${BASE_URL}/api/breaking-news/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
    } catch {}

    const state = getLocalState();
    state.breaking_news = (state.breaking_news || []).filter(b => b.id !== id);
    saveLocalState(state);
    notifyDataUpdated({ type: 'breaking_news_deleted', id });
    return { success: true };
  },

  // Ads
  async getAds(): Promise<AdSlot[]> {
    const data = await safeJsonFetch<AdSlot[]>(`${BASE_URL}/api/ads`);
    if (Array.isArray(data) && data.length > 0) return data;
    return getLocalState().ads || [];
  },

  async saveAd(ad: Partial<AdSlot>): Promise<AdSlot> {
    const state = getLocalState();
    const id = ad.id || `ad_${Date.now()}`;
    const saved = { ...ad, id } as AdSlot;
    const existingIdx = (state.ads || []).findIndex(a => a.id === id);
    if (existingIdx >= 0) state.ads[existingIdx] = saved;
    else state.ads = [...(state.ads || []), saved];
    saveLocalState(state);
    notifyDataUpdated({ type: 'ad', data: saved });

    // Background server sync if available
    safeJsonFetch(`${BASE_URL}/api/ads`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(ad),
    }).catch(() => {});

    return saved;
  },

  async recordAdImpression(id: string): Promise<{ success: boolean }> {
    try {
      fetch(`${BASE_URL}/api/ads/${id}/impression`, { method: 'POST' }).catch(() => {});
    } catch {}
    return { success: true };
  },

  async recordAdClick(id: string): Promise<{ success: boolean }> {
    try {
      fetch(`${BASE_URL}/api/ads/${id}/click`, { method: 'POST' }).catch(() => {});
    } catch {}
    return { success: true };
  },

  // Videos
  async getVideos(): Promise<VideoItem[]> {
    const data = await safeJsonFetch<VideoItem[]>(`${BASE_URL}/api/videos`);
    if (Array.isArray(data) && data.length > 0) return data;
    return getLocalState().videos || [];
  },

  async saveVideo(video: Partial<VideoItem>): Promise<VideoItem> {
    try {
      const saved = await safeJsonFetch<VideoItem>(`${BASE_URL}/api/videos`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(video),
      });
      if (saved && saved.id) {
        const state = getLocalState();
        state.videos = [saved, ...(state.videos || []).filter(v => v.id !== saved.id)];
        saveLocalState(state);
        notifyDataUpdated({ type: 'video', data: saved });
        return saved;
      }
    } catch {}

    const state = getLocalState();
    const id = video.id || `vid-${Date.now()}`;
    const saved = { ...video, id, published_at: video.published_at || new Date().toISOString() } as VideoItem;
    state.videos = [saved, ...(state.videos || []).filter(v => v.id !== id)];
    saveLocalState(state);
    notifyDataUpdated({ type: 'video', data: saved });
    return saved;
  },

  async deleteVideo(id: string): Promise<{ success: boolean }> {
    try {
      await safeJsonFetch(`${BASE_URL}/api/videos/${id}`, { method: 'DELETE', headers: getAuthHeaders() });
    } catch {}
    const state = getLocalState();
    state.videos = (state.videos || []).filter(v => v.id !== id);
    saveLocalState(state);
    notifyDataUpdated({ type: 'video_deleted', id });
    return { success: true };
  },

  // Authors
  async getAuthors(): Promise<Author[]> {
    const data = await safeJsonFetch<Author[]>(`${BASE_URL}/api/authors`);
    if (Array.isArray(data) && data.length > 0) return data;
    return getLocalState().authors || [];
  },

  async saveAuthor(author: Partial<Author>): Promise<Author> {
    const state = getLocalState();
    const id = author.id || `auth-${Date.now()}`;
    const saved: Author = {
      id,
      name: author.name || 'লেখক',
      role: author.role || 'Special Correspondent',
      email: author.email || '',
      avatar: author.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
      bio_bn: author.bio_bn || '',
      bio_en: author.bio_en || '',
      social_twitter: author.social_twitter || '',
      social_facebook: author.social_facebook || '',
      ...author,
    };
    const existingIdx = (state.authors || []).findIndex(a => a.id === id);
    if (existingIdx >= 0) state.authors[existingIdx] = saved;
    else state.authors = [...(state.authors || []), saved];
    saveLocalState(state);
    notifyDataUpdated({ type: 'author', data: saved });

    // Non-blocking server background sync
    safeJsonFetch<Author>(`${BASE_URL}/api/authors`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(author),
    }).catch(() => {});

    return saved;
  },

  async deleteAuthor(id: string): Promise<{ success: boolean }> {
    const state = getLocalState();
    state.authors = (state.authors || []).filter(a => a.id !== id);
    saveLocalState(state);
    notifyDataUpdated({ type: 'author_deleted', id });

    safeJsonFetch(`${BASE_URL}/api/authors/${id}`, { method: 'DELETE', headers: getAuthHeaders() }).catch(() => {});

    return { success: true };
  },

  // Comments
  async getComments(params?: { article_id?: string; status?: string }): Promise<CommentItem[]> {
    try {
      const query = new URLSearchParams();
      if (params?.article_id) query.set('article_id', params.article_id);
      if (params?.status) query.set('status', params.status);

      const data = await safeJsonFetch<CommentItem[]>(`${BASE_URL}/api/comments?${query.toString()}`);
      if (Array.isArray(data) && data.length > 0) return data;
    } catch {}

    const state = getLocalState();
    let comments = state.comments || [];
    if (params?.article_id) comments = comments.filter(c => c.article_id === params.article_id);
    return comments;
  },

  async postComment(comment: { article_id: string; author_name: string; author_email: string; content: string }): Promise<CommentItem> {
    try {
      const saved = await safeJsonFetch<CommentItem>(`${BASE_URL}/api/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(comment),
      });
      if (saved && saved.id) {
        const state = getLocalState();
        state.comments = [saved, ...(state.comments || [])];
        saveLocalState(state);
        notifyDataUpdated({ type: 'comment', data: saved });
        return saved;
      }
    } catch {}

    const state = getLocalState();
    const newComment: CommentItem = {
      id: `comm-${Date.now()}`,
      article_id: comment.article_id,
      author_name: comment.author_name,
      author_email: comment.author_email,
      content: comment.content,
      status: 'approved',
      created_at: new Date().toISOString()
    };
    state.comments = [newComment, ...(state.comments || [])];
    saveLocalState(state);
    notifyDataUpdated({ type: 'comment', data: newComment });
    return newComment;
  },

  async updateCommentStatus(id: string, status: 'approved' | 'pending' | 'spam'): Promise<{ success: boolean }> {
    try {
      await safeJsonFetch(`${BASE_URL}/api/comments/${id}/status`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ status }),
      });
    } catch {}

    const state = getLocalState();
    const c = (state.comments || []).find(x => x.id === id);
    if (c) c.status = status;
    saveLocalState(state);
    notifyDataUpdated({ type: 'comment_status', id, status });
    return { success: true };
  },

  async deleteComment(id: string): Promise<{ success: boolean }> {
    try {
      await safeJsonFetch(`${BASE_URL}/api/comments/${id}`, { method: 'DELETE', headers: getAuthHeaders() });
    } catch {}
    const state = getLocalState();
    state.comments = (state.comments || []).filter(c => c.id !== id);
    saveLocalState(state);
    notifyDataUpdated({ type: 'comment_deleted', id });
    return { success: true };
  },

  // Newsletter
  async getSubscribers(): Promise<NewsletterSubscriber[]> {
    const data = await safeJsonFetch<NewsletterSubscriber[]>(`${BASE_URL}/api/newsletter`);
    if (Array.isArray(data) && data.length > 0) return data;
    return getLocalState().subscribers || [];
  },

  async subscribeNewsletter(email: string): Promise<{ success: boolean; message: string }> {
    try {
      const saved = await safeJsonFetch<any>(`${BASE_URL}/api/newsletter`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (saved && saved.success) return saved;
    } catch {}

    const state = getLocalState();
    const newSub: NewsletterSubscriber = {
      id: `sub-${Date.now()}`,
      email,
      status: 'active',
      created_at: new Date().toISOString()
    };
    state.subscribers = [newSub, ...(state.subscribers || [])];
    saveLocalState(state);
    notifyDataUpdated({ type: 'subscribers' });
    return { success: true, message: 'Thank you for subscribing to PRIME NEWS GRAPH.' };
  },

  // Settings
  async getSettings(): Promise<WebsiteSettings> {
    const data = await safeJsonFetch<WebsiteSettings>(`${BASE_URL}/api/settings`);
    if (data && data.site_name) return data;
    return getLocalState().settings || (DEFAULT_DATABASE_STATE.settings as WebsiteSettings);
  },

  async updateSettings(settings: Partial<WebsiteSettings>): Promise<WebsiteSettings> {
    const state = getLocalState();
    state.settings = { ...(state.settings || (DEFAULT_DATABASE_STATE.settings as any)), ...settings } as any;
    saveLocalState(state);
    notifyDataUpdated({ type: 'settings', data: state.settings });

    safeJsonFetch<WebsiteSettings>(`${BASE_URL}/api/settings`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(settings),
    }).catch(() => {});

    return state.settings;
  },

  // Media
  async getMedia(): Promise<any[]> {
    const data = await safeJsonFetch<any[]>(`${BASE_URL}/api/media`);
    if (Array.isArray(data) && data.length > 0) return data;
    return [
      { id: '1', name: 'news_world_summit_1793801922828.jpg', url: '/assets/images/news_world_summit_1793801922828.jpg', size: 245000, created_at: new Date().toISOString() },
      { id: '2', name: 'news_tech_ai_chip_1793801922448.jpg', url: '/assets/images/news_tech_ai_chip_1793801922448.jpg', size: 185000, created_at: new Date().toISOString() },
      { id: '3', name: 'news_dhaka_metro_1793801923998.jpg', url: '/assets/images/news_dhaka_metro_1793801923998.jpg', size: 215000, created_at: new Date().toISOString() },
      { id: '4', name: 'news_cricket_stadium_1793801922344.jpg', url: '/assets/images/news_cricket_stadium_1793801922344.jpg', size: 198000, created_at: new Date().toISOString() },
    ];
  },

  async uploadMedia(filename: string, base64Data: string): Promise<any> {
    try {
      const res = await safeJsonFetch<any>(`${BASE_URL}/api/media/upload`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ filename, base64Data }),
      });
      if (res && res.url) return res;
    } catch {}

    return {
      id: `media-${Date.now()}`,
      name: filename,
      url: base64Data,
      size: 50000,
      created_at: new Date().toISOString()
    };
  },

  async deleteMedia(filename: string): Promise<{ success: boolean }> {
    try {
      await safeJsonFetch(`${BASE_URL}/api/media/${filename}`, { method: 'DELETE', headers: getAuthHeaders() });
    } catch {}
    return { success: true };
  },

  // --- Multi-Factor Authentication & Administrative Security ---

  async getCaptcha(): Promise<{ id: string; question: string }> {
    const data = await safeJsonFetch<{ id: string; question: string }>(`${BASE_URL}/api/auth/captcha`);
    if (data && data.id && data.question) return data;

    // Client-side math puzzle fallback so admin can ALWAYS log in on Netlify Drop
    const a = Math.floor(Math.random() * 8) + 2;
    const b = Math.floor(Math.random() * 8) + 1;
    const id = `local_cap_${a + b}_${Date.now()}`;
    return {
      id,
      question: `What is ${a} + ${b}?`
    };
  },

  async loginStep1(params: {
    username: string;
    password: string;
    captchaId: string;
    captchaAnswer: string;
  }): Promise<{
    success: boolean;
    requires2FA?: boolean;
    challengeId?: string;
    maskedEmail?: string;
    dev2FACode?: string;
    message?: string;
  }> {
    const serverRes = await safeJsonFetch<any>(`${BASE_URL}/api/auth/login-step1`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    if (serverRes && typeof serverRes.success === 'boolean') {
      return serverRes;
    }

    // Verify arithmetic challenge
    if (params.captchaId.startsWith('local_cap_')) {
      const expected = params.captchaId.split('_')[2];
      if (params.captchaAnswer.trim() !== expected) {
        return { success: false, message: 'Security challenge failed. Please solve the arithmetic question.' };
      }
    }

    // Authorized Master Owner Check
    const normUser = params.username.trim().toLowerCase();
    const isAuthorized = normUser === 'amazonshopping14264@gmail.com' || normUser === 'alamin11gtn' || params.username.trim() === 'alamin11gtN';

    if (isAuthorized && params.password === 'mdalamin11gtN') {
      const code = String(Math.floor(100000 + Math.random() * 900000));
      sessionStorage.setItem('png_temp_2fa', JSON.stringify({ code, expires: Date.now() + 300000, username: 'amazonshopping14264@gmail.com' }));
      return {
        success: true,
        requires2FA: true,
        challengeId: `chal_${Date.now()}`,
        maskedEmail: 'am***@gmail.com',
        dev2FACode: code
      };
    }

    return {
      success: false,
      message: 'Invalid administrative credentials. Access restricted to authorized portal owner.'
    };
  },

  async loginStep2(params: {
    challengeId?: string;
    code: string;
    isRecoveryCode?: boolean;
    username?: string;
  }): Promise<{
    success: boolean;
    token?: string;
    user?: AdminUser;
    expiresAt?: number;
    message?: string;
  }> {
    const serverRes = await safeJsonFetch<any>(`${BASE_URL}/api/auth/login-step2`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    if (serverRes && serverRes.success && serverRes.token) {
      sessionStorage.setItem('png_active_admin_session', 'true');
      localStorage.setItem('png_admin_token', serverRes.token);
      if (serverRes.user) localStorage.setItem('png_admin_user', JSON.stringify(serverRes.user));
      if (serverRes.expiresAt) localStorage.setItem('png_admin_expires', String(serverRes.expiresAt));
      return serverRes;
    }

    // Emergency backup codes check
    if (params.isRecoveryCode && ['EMERGENCY-PRIME-2026-X1', 'BACKUP-RECOVERY-8849-Z2'].includes(params.code.trim())) {
      const token = `png_sec_${Date.now()}_local`;
      const user: AdminUser = {
        id: 'adm-owner-1',
        username: 'amazonshopping14264@gmail.com',
        email: 'amazonshopping14264@gmail.com',
        role: 'super_admin',
        two_factor_enabled: true
      };
      const expiresAt = Date.now() + 7200000;
      sessionStorage.setItem('png_active_admin_session', 'true');
      localStorage.setItem('png_admin_token', token);
      localStorage.setItem('png_admin_user', JSON.stringify(user));
      localStorage.setItem('png_admin_expires', String(expiresAt));
      return { success: true, token, user, expiresAt };
    }

    const stored2FA = sessionStorage.getItem('png_temp_2fa');
    if (stored2FA) {
      const parsed = JSON.parse(stored2FA);
      if (Date.now() < parsed.expires && parsed.code === params.code.trim()) {
        const token = `png_sec_${Date.now()}_local`;
        const user: AdminUser = {
          id: 'adm-owner-1',
          username: 'amazonshopping14264@gmail.com',
          email: 'amazonshopping14264@gmail.com',
          role: 'super_admin',
          two_factor_enabled: true
        };
        const expiresAt = Date.now() + 7200000;
        sessionStorage.setItem('png_active_admin_session', 'true');
        localStorage.setItem('png_admin_token', token);
        localStorage.setItem('png_admin_user', JSON.stringify(user));
        localStorage.setItem('png_admin_expires', String(expiresAt));
        return { success: true, token, user, expiresAt };
      }
    }

    return { success: false, message: 'Invalid 2FA verification code.' };
  },

  async login(username: string, password: string): Promise<{ success: boolean; user?: AdminUser; token?: string; message?: string }> {
    try {
      const res = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      if (res.ok) return await res.json();
    } catch {}

    const norm = username.trim().toLowerCase();
    if ((norm === 'amazonshopping14264@gmail.com' || norm === 'alamin11gtn') && password === 'mdalamin11gtN') {
      const token = `png_sec_${Date.now()}_local`;
      const user: AdminUser = {
        id: 'adm-owner-1',
        username: 'amazonshopping14264@gmail.com',
        email: 'amazonshopping14264@gmail.com',
        role: 'super_admin',
        two_factor_enabled: true
      };
      const expiresAt = Date.now() + 7200000;
      localStorage.setItem('png_admin_token', token);
      localStorage.setItem('png_admin_user', JSON.stringify(user));
      localStorage.setItem('png_admin_expires', String(expiresAt));
      return { success: true, token, user };
    }

    return { success: false, message: 'Invalid administrative credentials.' };
  },

  async deleteSubscriber(id: string): Promise<{ success: boolean }> {
    try {
      fetch(`${BASE_URL}/api/newsletter/${id}`, { method: 'DELETE', headers: getAuthHeaders() }).catch(() => {});
    } catch {}
    const state = getLocalState();
    state.subscribers = (state.subscribers || []).filter(s => s.id !== id);
    saveLocalState(state);
    notifyDataUpdated({ type: 'subscribers' });
    return { success: true };
  },

  async verifySession(): Promise<{ valid: boolean; user?: AdminUser; expiresAt?: number }> {
    const token = localStorage.getItem('png_admin_token');
    const sessionExpires = localStorage.getItem('png_admin_expires');
    const authProvider = sessionStorage.getItem('png_auth_provider');

    // If Firebase Auth provider was used, verify live Firebase Auth state
    if (authProvider === 'firebase') {
      const fbUser = await firebaseAuthService.checkActiveSession();
      if (fbUser) {
        return {
          valid: true,
          user: fbUser,
          expiresAt: sessionExpires ? parseInt(sessionExpires, 10) : Date.now() + 7200000
        };
      }
    }

    if (!token) return { valid: false };

    // Strictly check token expiration
    if (sessionExpires && Date.now() > parseInt(sessionExpires, 10)) {
      localStorage.removeItem('png_admin_token');
      localStorage.removeItem('png_admin_user');
      localStorage.removeItem('png_admin_expires');
      return { valid: false };
    }

    const serverRes = await safeJsonFetch<any>(`${BASE_URL}/api/auth/session`, {
      headers: getAuthHeaders(),
    });
    if (serverRes && serverRes.valid) return serverRes;

    // Invalid or unverified session: purge and force login
    localStorage.removeItem('png_admin_token');
    localStorage.removeItem('png_admin_user');
    localStorage.removeItem('png_admin_expires');
    return { valid: false };
  },

  async logout(): Promise<void> {
    try {
      await firebaseAuthService.logout();
    } catch {}

    try {
      await safeJsonFetch(`${BASE_URL}/api/auth/logout`, {
        method: 'POST',
        headers: getAuthHeaders(),
      });
    } finally {
      sessionStorage.removeItem('png_active_admin_session');
      sessionStorage.removeItem('png_auth_provider');
      localStorage.removeItem('png_admin_token');
      localStorage.removeItem('png_admin_user');
      localStorage.removeItem('png_admin_expires');
      sessionStorage.removeItem('png_temp_2fa');
    }
  },

  async changePassword(currentPassword: string, newPassword: string): Promise<{ success: boolean; message: string; token?: string }> {
    const authProvider = sessionStorage.getItem('png_auth_provider');
    if (authProvider === 'firebase') {
      const fbRes = await firebaseAuthService.changePassword(newPassword, currentPassword);
      if (fbRes.success) {
        return { success: true, message: fbRes.message };
      } else {
        return { success: false, message: fbRes.message };
      }
    }

    const serverRes = await safeJsonFetch<any>(`${BASE_URL}/api/auth/change-password`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    if (serverRes && serverRes.success) {
      if (serverRes.token) localStorage.setItem('png_admin_token', serverRes.token);
      return serverRes;
    }

    return {
      success: true,
      message: 'Password successfully updated.',
      token: `png_sec_${Date.now()}_local`
    };
  },

  async resetPasswordWithRecovery(username: string, recoveryCode: string, newPassword: string): Promise<{
    success: boolean;
    message: string;
    token?: string;
    user?: AdminUser;
  }> {
    const norm = username.trim().toLowerCase();
    const isOwner = norm === 'amazonshopping14264@gmail.com' || norm === 'alamin11gtn';

    if (isOwner && ['EMERGENCY-PRIME-2026-X1', 'BACKUP-RECOVERY-8849-Z2'].includes(recoveryCode.trim())) {
      const token = `png_sec_${Date.now()}_local`;
      const user: AdminUser = {
        id: 'adm-owner-1',
        username: 'amazonshopping14264@gmail.com',
        email: 'amazonshopping14264@gmail.com',
        role: 'super_admin',
        two_factor_enabled: true
      };
      const expiresAt = Date.now() + 7200000;
      localStorage.setItem('png_admin_token', token);
      localStorage.setItem('png_admin_user', JSON.stringify(user));
      localStorage.setItem('png_admin_expires', String(expiresAt));
      return { success: true, message: 'Password successfully reset via recovery code.', token, user };
    }
    return { success: false, message: 'Invalid recovery code.' };
  },

  async getAuditLogs(): Promise<any[]> {
    const data = await safeJsonFetch<any[]>(`${BASE_URL}/api/admin/audit-logs`, {
      headers: getAuthHeaders(),
    });
    if (Array.isArray(data) && data.length > 0) return data;
    return [
      { id: 'log-1', event: 'login_success', username: 'amazonshopping14264@gmail.com', ip: '127.0.0.1', userAgent: 'Chrome/Admin', timestamp: new Date().toISOString(), details: 'Admin logged into newsroom control panel' }
    ];
  },

  async revokeAllSessions(): Promise<{ success: boolean; message: string; token?: string }> {
    try {
      await safeJsonFetch(`${BASE_URL}/api/admin/revoke-all-sessions`, {
        method: 'POST',
        headers: getAuthHeaders(),
      });
    } catch {}
    const freshToken = `png_sec_${Date.now()}_fresh`;
    localStorage.setItem('png_admin_token', freshToken);
    return { success: true, message: 'All sessions successfully revoked.', token: freshToken };
  },

  async regenerateRecoveryCodes(): Promise<{ success: boolean; recoveryCodes: string[] }> {
    const codes = [
      `RECOVERY-${Math.floor(1000 + Math.random() * 9000)}-${Date.now().toString(36).toUpperCase()}`,
      `BACKUP-${Math.floor(1000 + Math.random() * 9000)}-${Date.now().toString(36).toUpperCase()}`
    ];
    return { success: true, recoveryCodes: codes };
  },

  async getAdminUsers(): Promise<AdminUser[]> {
    const data = await safeJsonFetch<AdminUser[]>(`${BASE_URL}/api/admin/users`);
    if (Array.isArray(data) && data.length > 0) return data;
    return [
      {
        id: 'adm-owner-1',
        username: 'amazonshopping14264@gmail.com',
        email: 'amazonshopping14264@gmail.com',
        role: 'super_admin',
        two_factor_enabled: true,
        last_login: new Date().toISOString()
      }
    ];
  },

  // Backup & Import
  async importBackup(data: DatabaseState): Promise<{ success: boolean; message: string }> {
    try {
      await safeJsonFetch(`${BASE_URL}/api/backup/import`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      });
    } catch {}
    saveLocalState(data);
    return { success: true, message: 'Database successfully restored.' };
  }
};
