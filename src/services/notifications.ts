// ==============================================================================
// PRIME NEWS GRAPH — Push Notification & Web Alert Service
// Modeled after Prothom Alo's Instant News Alert & Notification Architecture
// ==============================================================================

import { Article } from '../types/news';

export interface NotificationPayload {
  title: string;
  body: string;
  url: string;
  icon?: string;
  image?: string;
  tag?: string;
}

const STORAGE_KEY_SUBSCRIBED = 'png_news_notifications_enabled';
const STORAGE_KEY_DISMISSED = 'png_notification_prompt_dismissed';
const BROADCAST_CHANNEL_NAME = 'png_news_alerts_channel';

// Dedicated BroadcastChannel for instant multi-tab & cross-device notification sync
let broadcastChannel: BroadcastChannel | null = null;
try {
  if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    broadcastChannel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
  }
} catch (e) {
  console.warn('BroadcastChannel not supported in this environment');
}

export const notificationService = {
  // Check if browser supports Web Notifications
  isSupported(): boolean {
    return typeof window !== 'undefined' && 'Notification' in window && 'serviceWorker' in navigator;
  },

  // Get current permission status
  getPermission(): NotificationPermission {
    if (!this.isSupported()) return 'denied';
    return Notification.permission;
  },

  // Check if user has explicitly subscribed
  isSubscribed(): boolean {
    if (!this.isSupported()) return false;
    return Notification.permission === 'granted' && localStorage.getItem(STORAGE_KEY_SUBSCRIBED) === 'true';
  },

  // Check if notification prompt should be displayed (Prothom Alo style bottom card)
  shouldShowPrompt(): boolean {
    if (!this.isSupported()) return false;
    if (Notification.permission === 'granted' || Notification.permission === 'denied') {
      return false;
    }
    const dismissedAt = localStorage.getItem(STORAGE_KEY_DISMISSED);
    if (dismissedAt) {
      // Re-prompt after 3 days if dismissed with 'না'
      const threeDaysMs = 3 * 24 * 60 * 60 * 1000;
      if (Date.now() - parseInt(dismissedAt, 10) < threeDaysMs) {
        return false;
      }
    }
    return true;
  },

  // Dismiss prompt when user taps 'না'
  dismissPrompt(): void {
    try {
      localStorage.setItem(STORAGE_KEY_DISMISSED, String(Date.now()));
    } catch {}
  },

  // Register Service Worker
  async registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return null;
    try {
      const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
      await navigator.serviceWorker.ready;
      return reg;
    } catch (e) {
      console.warn('Service Worker registration notice:', e);
      return null;
    }
  },

  // Request user permission when user taps 'হ্যাঁ'
  async requestPermission(): Promise<{ granted: boolean; permission: NotificationPermission }> {
    if (!this.isSupported()) {
      return { granted: false, permission: 'denied' };
    }

    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        localStorage.setItem(STORAGE_KEY_SUBSCRIBED, 'true');
        localStorage.removeItem(STORAGE_KEY_DISMISSED);

        // Register Service Worker
        const reg = await this.registerServiceWorker();

        // Send registration to server backend
        this.registerSubscriberWithServer().catch(() => {});

        // Display instant welcome confirmation notification
        this.showLocalNotification({
          title: 'প্রাইম নিউজ গ্রাফে স্বাগতম!',
          body: 'ধন্যবাদ! আপনি সফলভাবে ব্রেকিং নিউজ এলার্ট চালু করেছেন। যেকোনো তাজা খবর সাথে সাথে পাবেন।',
          url: '/',
          icon: '/assets/images/news_world_summit_1793801922828.jpg'
        }, reg);

        return { granted: true, permission };
      }
      return { granted: false, permission };
    } catch (error) {
      console.warn('Notification permission error:', error);
      return { granted: false, permission: 'denied' };
    }
  },

  // Send subscriber registration to backend
  async registerSubscriberWithServer(): Promise<void> {
    try {
      const endpoint = {
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
        locale: navigator.language || 'bn'
      };
      await fetch('/api/notifications/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(endpoint)
      });
    } catch {
      // Local fallback continues without interruption
    }
  },

  // Display notification on device
  async showLocalNotification(payload: NotificationPayload, customReg?: ServiceWorkerRegistration | null): Promise<void> {
    if (!this.isSupported() || Notification.permission !== 'granted') return;

    try {
      const reg = customReg || (await navigator.serviceWorker.getRegistration());
      if (reg && reg.active) {
        reg.active.postMessage({
          type: 'SHOW_NOTIFICATION',
          payload
        });
      } else {
        // Fallback to desktop Notification API
        const opts: NotificationOptions & { image?: string } = {
          body: payload.body,
          icon: payload.icon || '/assets/images/news_world_summit_1793801922828.jpg',
          data: { url: payload.url }
        };
        if (payload.image) {
          opts.image = payload.image;
        }
        new Notification(payload.title, opts as NotificationOptions);
      }
    } catch (e) {
      console.warn('Failed to display local notification:', e);
    }
  },

  // Trigger push alert when an article is published by the admin
  async broadcastArticleAlert(article: Article): Promise<void> {
    const title = `ব্রেকিং নিউজ: ${article.title_bn || article.title_en}`;
    const rawSummary = article.summary_bn || article.summary_en || 'সম্পূর্ণ সংবাদটি বিস্তারিত পড়তে ট্যাপ করুন।';
    const body = rawSummary.length > 120 ? `${rawSummary.slice(0, 117)}...` : rawSummary;
    const url = `/news/${article.slug}`;
    const image = article.featured_image || '/assets/images/news_world_summit_1793801922828.jpg';

    const payload: NotificationPayload = {
      title,
      body,
      url,
      icon: '/assets/images/news_world_summit_1793801922828.jpg',
      image,
      tag: `article-${article.id}`
    };

    // 1. Broadcast to open tabs via BroadcastChannel
    if (broadcastChannel) {
      try {
        broadcastChannel.postMessage({ type: 'NEW_ARTICLE_NOTIFICATION', payload });
      } catch {}
    }

    // 2. Local notification if subscribed
    if (this.isSubscribed()) {
      await this.showLocalNotification(payload);
    }

    // 3. Post to backend broadcast endpoint
    try {
      const token = localStorage.getItem('png_admin_token');
      await fetch('/api/notifications/broadcast', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          articleId: article.id,
          title,
          body,
          url,
          image
        })
      });
    } catch {
      // Local broadcast completed
    }
  },

  // Subscribe to BroadcastChannel messages across tabs
  onMessage(callback: (payload: NotificationPayload) => void): () => void {
    if (!broadcastChannel) return () => {};
    const handler = (event: MessageEvent) => {
      if (event.data && event.data.type === 'NEW_ARTICLE_NOTIFICATION') {
        callback(event.data.payload);
      }
    };
    broadcastChannel.addEventListener('message', handler);
    return () => {
      if (broadcastChannel) broadcastChannel.removeEventListener('message', handler);
    };
  }
};
