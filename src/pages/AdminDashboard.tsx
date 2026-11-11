import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Newspaper,
  PlusCircle,
  FolderTree,
  Flame,
  Star,
  Megaphone,
  Image as ImageIcon,
  Video,
  Users,
  MessageSquare,
  Mail,
  Search,
  Share2,
  Sliders,
  Menu as MenuIcon,
  Settings,
  UserCheck,
  ShieldAlert,
  Database,
  CloudUpload,
  LogOut,
  Edit,
  Trash2,
  Check,
  X,
  ExternalLink,
  Upload,
  Copy,
  Eye,
  RefreshCw,
  Save,
  Download,
  AlertCircle,
  Lock,
  ArrowRight,
  TrendingUp,
  BarChart2,
  CheckCircle2,
  HelpCircle,
  Camera,
  Bell,
  Send
} from 'lucide-react';
import {
  Article,
  Category,
  BreakingNewsItem,
  AdSlot,
  VideoItem,
  Author,
  CommentItem,
  NewsletterSubscriber,
  WebsiteSettings,
  AdminUser,
  DatabaseState
} from '../types/news';
import { api } from '../services/api';
import { notificationService } from '../services/notifications';
import { normalizeImageUrl, handleImageError, PRESET_NEWS_IMAGES, DEFAULT_FALLBACK_IMAGE, compressImage } from '../utils/imageHelper';
import { AdPlacement } from '../components/AdPlacement';
import { firebaseAuthService, AUTHORIZED_OWNER_EMAIL } from '../services/firebaseAuth';

interface AdminDashboardProps {
  onBackToSite: () => void;
  onRefreshData: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onBackToSite, onRefreshData }) => {
  // Authentication State - Defaults to false, requiring active validated session
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isVerifyingSession, setIsVerifyingSession] = useState<boolean>(true);
  const [currentUser, setCurrentUser] = useState<AdminUser | null>(null);

  // Firebase Authentication States (Dedicated Owner Access)
  const [fbEmail, setFbEmail] = useState(AUTHORIZED_OWNER_EMAIL);
  const [fbPassword, setFbPassword] = useState('');
  const [fbLoading, setFbLoading] = useState(false);
  const [fbError, setFbError] = useState('');
  const [fbResetSent, setFbResetSent] = useState(false);
  const [fbResetMsg, setFbResetMsg] = useState('');

  // Firebase Password Management States in Settings Tab
  const [fbCurrentPassword, setFbCurrentPassword] = useState('');
  const [fbNewPassword, setFbNewPassword] = useState('');
  const [fbConfirmNewPassword, setFbConfirmNewPassword] = useState('');
  const [fbChangeLoading, setFbChangeLoading] = useState(false);
  const [fbResetLinkLoading, setFbResetLinkLoading] = useState(false);

  // Password Change in Admin Settings
  const [changeCurrPassword, setChangeCurrPassword] = useState('');
  const [changeNewPassword, setChangeNewPassword] = useState('');
  const [changeConfirmPassword, setChangeConfirmPassword] = useState('');
  const [changeLoading, setChangeLoading] = useState(false);

  // Active Tab: 1 to 21
  const [activeTab, setActiveTab] = useState<string>('overview');

  // Main Data States - pre-populated instantly from local database state
  const [articles, setArticles] = useState<Article[]>(() => api.getLocalDatabaseState().articles || []);
  const [categories, setCategories] = useState<Category[]>(() => api.getLocalDatabaseState().categories || []);
  const [breakingNews, setBreakingNews] = useState<BreakingNewsItem[]>(() => api.getLocalDatabaseState().breaking_news || []);
  const [ads, setAds] = useState<AdSlot[]>(() => api.getLocalDatabaseState().ads || []);
  const [videos, setVideos] = useState<VideoItem[]>(() => api.getLocalDatabaseState().videos || []);
  const [authors, setAuthors] = useState<Author[]>(() => api.getLocalDatabaseState().authors || []);
  const [comments, setComments] = useState<CommentItem[]>(() => api.getLocalDatabaseState().comments || []);
  const [subscribers, setSubscribers] = useState<NewsletterSubscriber[]>(() => api.getLocalDatabaseState().subscribers || []);
  const [settings, setSettings] = useState<WebsiteSettings | null>(() => api.getLocalDatabaseState().settings || null);
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>(() => (api.getLocalDatabaseState().admin_users as any) || []);
  const [mediaFiles, setMediaFiles] = useState<any[]>(() => [
    { id: '1', name: 'news_world_summit_1793801922828.jpg', url: '/assets/images/news_world_summit_1793801922828.jpg', size: 245000, created_at: new Date().toISOString() },
    { id: '2', name: 'news_tech_ai_chip_1793801922448.jpg', url: '/assets/images/news_tech_ai_chip_1793801922448.jpg', size: 185000, created_at: new Date().toISOString() },
    { id: '3', name: 'news_dhaka_metro_1793801923998.jpg', url: '/assets/images/news_dhaka_metro_1793801923998.jpg', size: 215000, created_at: new Date().toISOString() },
    { id: '4', name: 'news_cricket_stadium_1793801922344.jpg', url: '/assets/images/news_cricket_stadium_1793801922344.jpg', size: 198000, created_at: new Date().toISOString() },
  ]);

  // Real-time Audit Logs from server
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

  // Feedback Notification Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Search and filter inside tables
  const [articleSearch, setArticleSearch] = useState('');
  const [articleCategoryFilter, setArticleCategoryFilter] = useState('all');

  // Push Notification Center States
  const [customPushTitle, setCustomPushTitle] = useState('');
  const [customPushBody, setCustomPushBody] = useState('');
  const [customPushUrl, setCustomPushUrl] = useState('/');
  const [sendingPush, setSendingPush] = useState(false);
  const [pushStats, setPushStats] = useState<{ totalSubscribers: number; activeToday: number }>({ totalSubscribers: 1842, activeToday: 1620 });
  const [pushHistory, setPushHistory] = useState<any[]>([
    {
      id: 'alert-init-1',
      title: 'ব্রেকিং নিউজ: জাতিসংঘের ঐতিহাসিক শীর্ষ সম্মেলন শুরু',
      body: 'বিশ্ব জলবায়ু ও শান্তি চুক্তিতে ১৯৮ দেশের শীর্ষ নেতৃত্বের ঐতিহাসিক স্বাক্ষর।',
      url: '/news/historic-global-diplomatic-summit-un-accord',
      sentAt: new Date(Date.now() - 3600000 * 4).toISOString(),
      deliveredCount: 1842
    }
  ]);

  // Edit / Add Article Form State
  const [editingArticle, setEditingArticle] = useState<Partial<Article> | null>(null);

  // Category Edit Form State
  const [editingCategory, setEditingCategory] = useState<Partial<Category> | null>(null);

  // Breaking News Edit Form State
  const [editingBreaking, setEditingBreaking] = useState<Partial<BreakingNewsItem> | null>(null);

  // Ad Slot Edit Form State
  const [editingAd, setEditingAd] = useState<AdSlot | null>(null);

  // Author Edit Form State
  const [editingAuthor, setEditingAuthor] = useState<Partial<Author> | null>(null);

  // Video Edit Form State
  const [editingVideo, setEditingVideo] = useState<Partial<VideoItem> | null>(null);

  // Media Upload State
  const [uploadingImage, setUploadingImage] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const loadAuditLogs = async () => {
    try {
      const logs = await api.getAuditLogs();
      setAuditLogs(logs);
    } catch (e) {
      console.warn('Failed to load audit logs:', e);
    }
  };

  const loadAllData = async () => {
    // 1. Immediately ensure state matches latest local database cache
    const local = api.getLocalDatabaseState();
    if (local) {
      if (local.articles?.length) setArticles(local.articles);
      if (local.categories?.length) setCategories(local.categories);
      if (local.breaking_news?.length) setBreakingNews(local.breaking_news);
      if (local.ads?.length) setAds(local.ads);
      if (local.videos?.length) setVideos(local.videos);
      if (local.authors?.length) setAuthors(local.authors);
      if (local.comments?.length) setComments(local.comments);
      if (local.subscribers?.length) setSubscribers(local.subscribers);
      if (local.settings) setSettings(local.settings);
      if (local.admin_users?.length) setAdminUsers(local.admin_users as any);
    }

    // 2. Safely sync in background using Promise.allSettled
    try {
      const results = await Promise.allSettled([
        api.getArticles({ limit: 100 }),
        api.getCategories(),
        api.getBreakingNews(true),
        api.getAds(),
        api.getVideos(),
        api.getAuthors(),
        api.getComments(),
        api.getSubscribers(),
        api.getSettings(),
        api.getAdminUsers(),
        api.getMedia(),
      ]);

      if (results[0].status === 'fulfilled' && results[0].value?.items?.length) setArticles(results[0].value.items);
      if (results[1].status === 'fulfilled' && results[1].value?.length) setCategories(results[1].value);
      if (results[2].status === 'fulfilled' && results[2].value?.length) setBreakingNews(results[2].value);
      if (results[3].status === 'fulfilled' && results[3].value?.length) setAds(results[3].value);
      if (results[4].status === 'fulfilled' && results[4].value?.length) setVideos(results[4].value);
      if (results[5].status === 'fulfilled' && results[5].value?.length) setAuthors(results[5].value);
      if (results[6].status === 'fulfilled' && results[6].value?.length) setComments(results[6].value);
      if (results[7].status === 'fulfilled' && results[7].value?.length) setSubscribers(results[7].value);
      if (results[8].status === 'fulfilled' && results[8].value) setSettings(results[8].value);
      if (results[9].status === 'fulfilled' && results[9].value?.length) setAdminUsers(results[9].value);
      if (results[10].status === 'fulfilled' && results[10].value?.length) setMediaFiles(results[10].value);
      loadAuditLogs();
    } catch (e) {
      console.warn('Background sync completed with local state active:', e);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadAllData();
    }
  }, [isAuthenticated]);

  // Verify Active Session on Mount - strictly require email & password authentication
  useEffect(() => {
    const activeSession = sessionStorage.getItem('png_active_admin_session');
    const token = localStorage.getItem('png_admin_token');
    
    // If not actively authenticated in this session, demand credentials
    if (!activeSession || !token) {
      setIsAuthenticated(false);
      setIsVerifyingSession(false);
      return;
    }

    api.verifySession().then(res => {
      if (res && res.valid && res.user) {
        setIsAuthenticated(true);
        setCurrentUser(res.user);
        loadAllData();
      } else {
        setIsAuthenticated(false);
        setCurrentUser(null);
        sessionStorage.removeItem('png_active_admin_session');
        localStorage.removeItem('png_admin_token');
        localStorage.removeItem('png_admin_user');
        localStorage.removeItem('png_admin_expires');
      }
      setIsVerifyingSession(false);
    }).catch(() => {
      setIsAuthenticated(false);
      setIsVerifyingSession(false);
    });
  }, []);

  const handleLogout = async () => {
    await api.logout();
    setIsAuthenticated(false);
    setCurrentUser(null);
    setFbPassword('');
    setFbError('');
    setFbResetMsg('');
  };

  // Firebase Owner Sign In
  const handleFirebaseLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fbEmail.trim() || !fbPassword) {
      setFbError('Please enter both your Firebase admin email and password.');
      return;
    }
    setFbLoading(true);
    setFbError('');
    setFbResetMsg('');
    try {
      const res = await firebaseAuthService.loginWithFirebase(fbEmail.trim(), fbPassword);
      if (res.success && res.user) {
        setIsAuthenticated(true);
        setCurrentUser(res.user);
        loadAllData();
        showToast('Firebase Authentication confirmed. Welcome, Newsroom Owner.');
      } else {
        setFbError(res.message || 'Firebase Authentication failed.');
      }
    } catch (err: any) {
      setFbError(err.message || 'Authentication error occurred.');
    } finally {
      setFbLoading(false);
    }
  };

  // Firebase Send Password Reset Link
  const handleFirebaseSendPasswordReset = async () => {
    setFbLoading(true);
    setFbError('');
    setFbResetMsg('');
    try {
      const targetEmail = fbEmail.trim() || AUTHORIZED_OWNER_EMAIL;
      const res = await firebaseAuthService.sendPasswordReset(targetEmail);
      if (res.success) {
        setFbResetSent(true);
        setFbResetMsg(res.message);
        showToast('Password reset link sent to ' + targetEmail);
      } else {
        setFbError(res.message);
      }
    } catch (err: any) {
      setFbError(err.message || 'Failed to send password reset email.');
    } finally {
      setFbLoading(false);
    }
  };

  // Firebase Update Password from Settings Tab
  const handleFirebaseUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fbNewPassword) {
      alert('Please enter a new password.');
      return;
    }
    if (fbNewPassword.length < 8) {
      alert('New password must be at least 8 characters long.');
      return;
    }
    if (fbNewPassword !== fbConfirmNewPassword) {
      alert('New password and confirmation do not match.');
      return;
    }

    setFbChangeLoading(true);
    try {
      const res = await firebaseAuthService.changePassword(fbNewPassword, fbCurrentPassword);
      if (res.success) {
        showToast('Firebase Administrator password successfully updated!');
        setFbNewPassword('');
        setFbConfirmNewPassword('');
        setFbCurrentPassword('');
      } else {
        alert(res.message);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to update Firebase password');
    } finally {
      setFbChangeLoading(false);
    }
  };

  // Direct Send Password Reset from Settings Tab
  const handleSendFirebaseResetFromSettings = async () => {
    setFbResetLinkLoading(true);
    try {
      const res = await firebaseAuthService.sendPasswordReset(AUTHORIZED_OWNER_EMAIL);
      if (res.success) {
        showToast(`Password reset link dispatched to ${AUTHORIZED_OWNER_EMAIL}`);
      } else {
        alert(res.message);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to send reset link');
    } finally {
      setFbResetLinkLoading(false);
    }
  };

  // Change Admin Password Form
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!changeCurrPassword || !changeNewPassword) {
      alert('Please fill in current and new password.');
      return;
    }
    if (changeNewPassword.length < 8) {
      alert('New password must be at least 8 characters long.');
      return;
    }
    if (changeNewPassword !== changeConfirmPassword) {
      alert('New password and confirmation do not match.');
      return;
    }

    setChangeLoading(true);
    try {
      const res = await api.changePassword(changeCurrPassword, changeNewPassword);
      if (res.success) {
        showToast('Password updated successfully. Other active sessions revoked.');
        setChangeCurrPassword('');
        setChangeNewPassword('');
        setChangeConfirmPassword('');
        loadAuditLogs();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to update password');
    } finally {
      setChangeLoading(false);
    }
  };

  // Revoke All Other Sessions
  const handleRevokeSessions = async () => {
    if (!confirm('Are you sure you want to revoke all other active administrative sessions?')) return;
    try {
      const res = await api.revokeAllSessions();
      if (res.success) {
        showToast('All other sessions revoked successfully.');
        loadAuditLogs();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to revoke sessions');
    }
  };

  // Regenerate Recovery Codes
  const handleRegenerateRecoveryCodes = async () => {
    if (!confirm('Regenerating recovery codes will invalidate all previous backup codes. Proceed?')) return;
    try {
      const res = await api.regenerateRecoveryCodes();
      if (res.success) {
        showToast('New backup recovery codes generated.');
        loadAllData();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to regenerate codes');
    }
  };

  // Direct device / mobile photo upload handler for news articles
  const handleArticlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const maxDim = 1200;
          let width = img.width;
          let height = img.height;
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const compressed = canvas.toDataURL('image/jpeg', 0.85);
            setEditingArticle(prev => ({ ...prev!, featured_image: compressed }));
            showToast('ছবি সফলভাবে যুক্ত হয়েছে! (Photo attached)');
          }
        };
      };
      reader.readAsDataURL(file);
    } catch (err) {
      alert('ছবি প্রসেস করতে ব্যর্থ হয়েছে। অন্য ছবি নির্বাচন করুন।');
    }
  };

  // --- Article Actions ---
  const handleCreateNewArticle = () => {
    setEditingArticle({
      title_bn: '',
      title_en: '',
      summary_bn: '',
      summary_en: '',
      content_bn: '',
      content_en: '',
      category_id: categories[0]?.id || 'cat-1',
      category_slug: categories[0]?.slug || 'national',
      category_name_bn: categories[0]?.name_bn || 'জাতীয়',
      category_name_en: categories[0]?.name_en || 'National',
      author_id: authors[0]?.id || 'auth-1',
      author_name: authors[0]?.name || 'Editorial Team',
      featured_image: '/assets/images/news_world_summit_1793801922828.jpg',
      image_caption_bn: '',
      image_caption_en: '',
      status: 'published',
      is_featured: false,
      is_editors_choice: false,
      views_count: 0,
      reading_time_minutes: 4,
      tags: ['News'],
    });
    setActiveTab('add_article');
  };

  const handleSaveArticle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingArticle || !editingArticle.title_bn) {
      alert('Bengali headline is required.');
      return;
    }

    try {
      const selectedCat = categories.find(c => c.id === editingArticle.category_id || c.slug === editingArticle.category_slug);
      const selectedAuth = authors.find(a => a.id === editingArticle.author_id);

      let photo = (editingArticle.featured_image || '').trim();
      if (!photo || photo.includes('/src/')) {
        photo = normalizeImageUrl(photo, editingArticle.title_bn, editingArticle.category_slug);
      }

      const toSave: Partial<Article> = {
        ...editingArticle,
        featured_image: photo,
        category_name_bn: selectedCat ? selectedCat.name_bn : editingArticle.category_name_bn,
        category_name_en: selectedCat ? selectedCat.name_en : editingArticle.category_name_en,
        category_slug: selectedCat ? selectedCat.slug : editingArticle.category_slug,
        author_name: selectedAuth ? selectedAuth.name : editingArticle.author_name,
        author_role: selectedAuth ? selectedAuth.role : editingArticle.author_role,
        author_avatar: selectedAuth ? selectedAuth.avatar : editingArticle.author_avatar,
      };

      const savedArticle = await api.saveArticle(toSave);
      
      // Automatic Instant Web Push Broadcast on new post publish
      if (toSave.status === 'published') {
        notificationService.broadcastArticleAlert(savedArticle).catch((err) => {
          console.warn('Broadcast notice:', err);
        });
        showToast('পোস্ট সংরক্ষিত হয়েছে এবং সকল ইউজারের মোবাইলে পুশ নোটিফিকেশন পাঠানো হয়েছে!');
      } else {
        showToast('Article saved successfully.');
      }

      setEditingArticle(null);
      setActiveTab('articles');
      loadAllData();
      onRefreshData();
    } catch (err: any) {
      alert(err.message || 'Error saving article');
    }
  };

  const handleDeleteArticle = async (id: string) => {
    if (confirm('Are you sure you want to delete this article? This action is irreversible.')) {
      await api.deleteArticle(id);
      showToast('Article deleted.');
      loadAllData();
      onRefreshData();
    }
  };

  const handleToggleArticleFeatured = async (art: Article) => {
    await api.saveArticle({ id: art.id, is_featured: !art.is_featured });
    showToast(art.is_featured ? 'Removed from featured.' : 'Marked as featured.');
    loadAllData();
    onRefreshData();
  };

  // --- Category Actions ---
  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory || !editingCategory.name_bn || !editingCategory.slug) return;
    const saved = await api.saveCategory(editingCategory);
    setCategories(prev => {
      const idx = prev.findIndex(c => c.id === saved.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = saved;
        return copy;
      }
      return [...prev, saved];
    });
    showToast('Category saved.');
    setEditingCategory(null);
    loadAllData();
    onRefreshData();
  };

  const handleDeleteCategory = async (id: string) => {
    if (confirm('Delete this category?')) {
      await api.deleteCategory(id);
      setCategories(prev => prev.filter(c => c.id !== id));
      showToast('Category removed.');
      loadAllData();
      onRefreshData();
    }
  };

  // --- Breaking News Actions ---
  const handleSaveBreaking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBreaking || !editingBreaking.title_bn) return;
    const saved = await api.saveBreakingNews(editingBreaking);
    setBreakingNews(prev => {
      const idx = prev.findIndex(b => b.id === saved.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = saved;
        return copy;
      }
      return [saved, ...prev];
    });
    showToast('Breaking news headline updated.');
    setEditingBreaking(null);
    loadAllData();
    onRefreshData();
  };

  const handleDeleteBreaking = async (id: string) => {
    if (confirm('Delete this breaking headline?')) {
      await api.deleteBreakingNews(id);
      setBreakingNews(prev => prev.filter(b => b.id !== id));
      showToast('Breaking news deleted.');
      loadAllData();
      onRefreshData();
    }
  };

  // --- Adsterra Actions ---
  const handleSaveAd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAd) return;
    const saved = await api.saveAd(editingAd);
    setAds(prev => {
      const idx = prev.findIndex(a => a.id === saved.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = saved;
        return copy;
      }
      return [...prev, saved];
    });
    showToast(`Ad slot "${editingAd.name}" updated successfully.`);
    setEditingAd(null);
    loadAllData();
    onRefreshData();
  };

  // --- Author Actions ---
  const handleSaveAuthor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAuthor || !editingAuthor.name) return;
    const saved = await api.saveAuthor(editingAuthor);
    showToast('লেখক প্রোফাইল সফলভাবে সংরক্ষিত হয়েছে!');
    setEditingAuthor(null);
    setAuthors(prev => {
      const idx = prev.findIndex(a => a.id === saved.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = saved;
        return copy;
      }
      return [...prev, saved];
    });
    loadAllData();
    onRefreshData();
  };

  const handleDeleteAuthor = async (id: string) => {
    if (confirm('এই লেখকের প্রোফাইল মুছে ফেলতে চান?')) {
      await api.deleteAuthor(id);
      showToast('লেখক প্রোফাইল মুছে ফেলা হয়েছে।');
      setAuthors(prev => prev.filter(a => a.id !== id));
      loadAllData();
      onRefreshData();
    }
  };

  // --- Video Actions ---
  const handleSaveVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingVideo || !editingVideo.title_bn || !editingVideo.youtube_id) return;
    const saved = await api.saveVideo(editingVideo);
    setVideos(prev => {
      const idx = prev.findIndex(v => v.id === saved.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = saved;
        return copy;
      }
      return [saved, ...prev];
    });
    showToast('Video news updated.');
    setEditingVideo(null);
    loadAllData();
    onRefreshData();
  };

  const handleDeleteVideo = async (id: string) => {
    if (confirm('Delete video item?')) {
      await api.deleteVideo(id);
      setVideos(prev => prev.filter(v => v.id !== id));
      showToast('Video deleted.');
      loadAllData();
      onRefreshData();
    }
  };

  // --- Comments Actions ---
  const handleUpdateCommentStatus = async (id: string, status: 'approved' | 'pending' | 'spam') => {
    await api.updateCommentStatus(id, status);
    setComments(prev => prev.map(c => c.id === id ? { ...c, status } : c));
    showToast(`Comment status set to ${status}.`);
    loadAllData();
    onRefreshData();
  };

  const handleDeleteComment = async (id: string) => {
    if (confirm('Delete comment?')) {
      await api.deleteComment(id);
      setComments(prev => prev.filter(c => c.id !== id));
      showToast('Comment deleted.');
      loadAllData();
      onRefreshData();
    }
  };

  // --- Subscribers Actions ---
  const handleDeleteSubscriber = async (id: string) => {
    if (confirm('Unsubscribe this email?')) {
      await api.deleteSubscriber(id);
      setSubscribers(prev => prev.filter(s => s.id !== id));
      showToast('Subscriber removed.');
      loadAllData();
      onRefreshData();
    }
  };

  // --- Push Notification Actions ---
  const handleSendCustomPush = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customPushTitle.trim()) {
      alert('নোটিফিকেশনের শিরোনাম প্রয়োজন (Title is required)');
      return;
    }
    setSendingPush(true);
    try {
      const payload = {
        title: customPushTitle.trim(),
        body: customPushBody.trim() || 'ব্রেকিং নিউজ পড়তে ক্লিক করুন।',
        url: customPushUrl.trim() || '/',
        icon: '/assets/images/news_world_summit_1793801922828.jpg'
      };

      await notificationService.showLocalNotification(payload);

      const token = localStorage.getItem('png_admin_token');
      await fetch('/api/notifications/broadcast', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify(payload)
      });

      const newRecord = {
        id: `alert-${Date.now()}`,
        title: customPushTitle.trim(),
        body: customPushBody.trim() || 'ব্রেকিং নিউজ পড়তে ক্লিক করুন।',
        url: customPushUrl.trim() || '/',
        sentAt: new Date().toISOString(),
        deliveredCount: pushStats.totalSubscribers
      };

      setPushHistory(prev => [newRecord, ...prev]);
      showToast('সকল ইউজারের ডিভাইসে পুশ নোটিফিকেশন পাঠানো হয়েছে!');
      setCustomPushTitle('');
      setCustomPushBody('');
      setCustomPushUrl('/');
    } catch (err: any) {
      alert(err.message || 'Error sending push alert');
    } finally {
      setSendingPush(false);
    }
  };

  const handleExportSubscribersCSV = () => {
    const csvContent = 'data:text/csv;charset=utf-8,ID,Email,Created At,Status\n' +
      subscribers.map(s => `${s.id},"${s.email}",${s.created_at},${s.status}`).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `prime-subscribers-${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Subscribers CSV exported.');
  };

  // --- Website Settings Actions ---
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    const saved = await api.updateSettings(settings);
    setSettings(saved);
    showToast('Website global settings updated.');
    loadAllData();
    onRefreshData();
  };

  // --- Media Library Upload Action ---
  const handleMediaFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const base64 = reader.result as string;
        await api.uploadMedia(file.name, base64);
        showToast('Image uploaded successfully to Media Library.');
        loadAllData();
      } catch (err: any) {
        alert(err.message || 'Upload failed');
      } finally {
        setUploadingImage(false);
      }
    };
    reader.readAsDataURL(file);
  };

  // --- Database Backup Import ---
  const handleImportBackupFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const json = JSON.parse(reader.result as string);
        const res = await api.importBackup(json);
        if (res.success) {
          showToast('Database restored successfully.');
          loadAllData();
          onRefreshData();
        } else {
          alert('Import failed: ' + res.message);
        }
      } catch (err) {
        alert('Invalid JSON backup file.');
      }
    };
    reader.readAsText(file);
  };

  // Total Views Calculation
  const totalViews = articles.reduce((acc, a) => acc + (a.views_count || 0), 0);

  // If Session Verification is pending, show security verification loader
  if (isVerifyingSession) {
    return (
      <div className="min-h-screen bg-[#070D18] flex flex-col items-center justify-center p-4 text-white">
        <div className="flex flex-col items-center space-y-4">
          <div className="h-10 w-10 border-4 border-[#246BFD] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs font-semibold tracking-wider text-slate-400 uppercase">
            নিরাপদ এডমিন সেশন যাচাই করা হচ্ছে...
          </p>
        </div>
      </div>
    );
  }

  // If Not Authenticated, Show Dedicated Firebase Authentication Login Screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#070D18] flex items-center justify-center p-4">
        <div className="w-full max-w-md rounded-2xl bg-[#0F1A2E] p-8 shadow-2xl border border-slate-700/80 text-white relative">
          
          {/* Header */}
          <div className="text-center mb-6">
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[#246BFD]/20 text-[#246BFD] mb-3 shadow-inner border border-[#246BFD]/30">
              <Lock className="h-7 w-7 text-[#246BFD]" />
            </div>
            <h1 className="text-2xl font-bold font-serif tracking-tight text-white">
              PRIME NEWS GRAPH
            </h1>
            <p className="mt-1 text-[11px] text-slate-400 uppercase tracking-widest font-semibold">
              Authorized Newsroom Administrator Control
            </p>
          </div>

          <div className="space-y-4">
            <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-xs text-blue-300">
              <div className="flex items-center gap-1.5 font-bold">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                <span>Cloud Firestore &amp; Firebase Auth</span>
              </div>
              <p className="mt-1 text-[11px] text-slate-300 leading-relaxed">
                Only the verified owner account (<code className="font-mono text-emerald-400">{AUTHORIZED_OWNER_EMAIL}</code>) has administrative access.
              </p>
            </div>

            {fbError && (
              <div className="rounded-lg bg-red-500/10 border border-red-500/30 p-3 text-xs text-red-300 flex items-start gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 text-red-400 mt-0.5" />
                <span className="leading-relaxed">{fbError}</span>
              </div>
            )}

            {fbResetMsg && (
              <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/30 p-3 text-xs text-emerald-300 flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400 mt-0.5" />
                <span className="leading-relaxed">{fbResetMsg}</span>
              </div>
            )}

            <form onSubmit={handleFirebaseLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Authorized Owner Email
                </label>
                <input
                  type="email"
                  value={fbEmail}
                  onChange={e => setFbEmail(e.target.value)}
                  placeholder="amazonshopping14264@gmail.com"
                  required
                  autoComplete="email"
                  className="w-full rounded-lg bg-slate-900 border border-slate-700 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#246BFD] focus:ring-1 focus:ring-[#246BFD]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Firebase Account Password
                </label>
                <input
                  type="password"
                  value={fbPassword}
                  onChange={e => setFbPassword(e.target.value)}
                  placeholder="Enter Firebase password"
                  required
                  autoComplete="current-password"
                  className="w-full rounded-lg bg-slate-900 border border-slate-700 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#246BFD] focus:ring-1 focus:ring-[#246BFD]"
                />
              </div>

              <button
                type="submit"
                disabled={fbLoading}
                className="w-full rounded-lg bg-[#246BFD] hover:bg-blue-600 py-3 text-sm font-bold text-white shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {fbLoading ? (
                  <>
                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Verifying with Firebase...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In with Firebase</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>

              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                <button
                  type="button"
                  onClick={handleFirebaseSendPasswordReset}
                  disabled={fbLoading}
                  className="text-slate-400 hover:text-amber-400 transition-colors cursor-pointer"
                >
                  Forgot Password? Send Reset Link
                </button>
                <button
                  type="button"
                  onClick={onBackToSite}
                  className="text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  &larr; Back to Portal
                </button>
              </div>
            </form>
          </div>

        </div>
      </div>
    );
  }

  // Navigation Items list for the 22 sections
  const NAV_ITEMS = [
    { id: 'overview', label: '1. Dashboard Overview', icon: LayoutDashboard },
    { id: 'articles', label: '2. News Management', icon: Newspaper },
    { id: 'add_article', label: '3. Add New News', icon: PlusCircle },
    { id: 'categories', label: '4. Categories', icon: FolderTree },
    { id: 'breaking_news', label: '5. Breaking News', icon: Flame },
    { id: 'featured_news', label: '6. Featured News', icon: Star },
    { id: 'advertisements', label: '7. Adsterra Ads Management', icon: Megaphone },
    { id: 'media_library', label: '8. Media Library', icon: ImageIcon },
    { id: 'videos', label: '9. Video Management', icon: Video },
    { id: 'authors', label: '10. Authors Management', icon: Users },
    { id: 'comments', label: '11. Comments Moderation', icon: MessageSquare },
    { id: 'subscribers', label: '12. Newsletter Subscribers', icon: Mail },
    { id: 'push_notifications', label: '13. Push Alerts (নিউজ এলার্ট)', icon: Bell },
    { id: 'seo', label: '14. SEO Settings', icon: Search },
    { id: 'social', label: '15. Social Media Settings', icon: Share2 },
    { id: 'homepage', label: '16. Homepage Settings', icon: Sliders },
    { id: 'menus', label: '17. Menu Management', icon: MenuIcon },
    { id: 'website_settings', label: '18. Website Settings', icon: Settings },
    { id: 'admin_users', label: '19. Admin Users', icon: UserCheck },
    { id: 'security', label: '20. Security Settings', icon: ShieldAlert },
    { id: 'backup_export', label: '21. Backup & Export', icon: Database },
    { id: 'netlify_deploy', label: '22. Netlify Deployment Info', icon: CloudUpload },
  ];

  return (
    <div className="min-h-screen bg-[#F1F5F9] flex flex-col">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-lg bg-[#101D35] text-white px-4 py-3 shadow-xl border border-slate-700 animate-fade-in text-xs font-semibold">
          <CheckCircle2 className="h-4 w-4 text-[#246BFD]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Admin Top Navbar */}
      <header className="h-16 bg-[#101D35] text-white flex items-center justify-between px-6 border-b border-slate-800 shrink-0">
        <div className="flex items-center gap-4">
          <span className="font-serif text-lg font-bold tracking-tight text-white">
            PRIME NEWS GRAPH <span className="text-xs font-mono font-normal text-amber-400 ml-1">ADMIN CMS v1.0</span>
          </span>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={onBackToSite}
            className="flex items-center gap-1.5 rounded bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-700 transition-colors"
          >
            <ExternalLink className="h-3.5 w-3.5 text-[#246BFD]" />
            <span>View Public Portal</span>
          </button>

          <div className="flex items-center gap-2 border-l border-slate-700 pl-4">
            <div className="text-right hidden sm:block">
              <div className="text-xs font-bold text-white">{currentUser?.username || 'admin'}</div>
              <div className="text-[10px] text-amber-400 capitalize">{currentUser?.role || 'super_admin'}</div>
            </div>
            <button
              onClick={handleLogout}
              className="rounded p-2 text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-colors"
              title="Logout"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Admin Content: Sidebar + Active Panel */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-64 bg-[#0F172A] text-slate-300 flex flex-col shrink-0 border-r border-slate-800 overflow-y-auto">
          <div className="p-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Control Navigation
          </div>
          <nav className="flex-1 space-y-0.5 px-2 pb-6">
            {NAV_ITEMS.map(item => {
              const Icon = item.icon;
              const isSelected = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    if (item.id === 'add_article' && !editingArticle) {
                      handleCreateNewArticle();
                    }
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2 text-xs font-medium rounded-md transition-colors text-left ${
                    isSelected
                      ? 'bg-[#246BFD] text-white font-semibold'
                      : 'text-slate-400 hover:bg-slate-800/80 hover:text-slate-200'
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Workspace Area */}
        <main className="flex-1 overflow-y-auto p-6 lg:p-8">
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold font-serif text-slate-900">Dashboard Overview</h2>
                  <p className="text-xs text-slate-500">Live operational telemetry, article traffic, and newsroom metrics.</p>
                </div>
                <button
                  onClick={handleCreateNewArticle}
                  className="flex items-center gap-2 bg-[#246BFD] hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-xs font-bold transition-all"
                >
                  <PlusCircle className="h-4 w-4" />
                  <span>Publish New Article</span>
                </button>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="rounded-xl bg-white p-5 border border-slate-200/80 shadow-xs">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="text-xs font-bold uppercase tracking-wider">Total Articles</span>
                    <Newspaper className="h-5 w-5 text-[#246BFD]" />
                  </div>
                  <div className="mt-2 text-2xl font-bold font-serif text-slate-900 tabular-nums">
                    {articles.length}
                  </div>
                  <div className="mt-1 text-[11px] text-emerald-600 font-medium">
                    {articles.filter(a => a.status === 'published').length} active & published
                  </div>
                </div>

                <div className="rounded-xl bg-white p-5 border border-slate-200/80 shadow-xs">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="text-xs font-bold uppercase tracking-wider">Total Page Views</span>
                    <Eye className="h-5 w-5 text-indigo-500" />
                  </div>
                  <div className="mt-2 text-2xl font-bold font-serif text-slate-900 tabular-nums">
                    {totalViews.toLocaleString()}
                  </div>
                  <div className="mt-1 text-[11px] text-slate-500">
                    Live database tracking
                  </div>
                </div>

                <div className="rounded-xl bg-white p-5 border border-slate-200/80 shadow-xs">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="text-xs font-bold uppercase tracking-wider">Subscribers</span>
                    <Mail className="h-5 w-5 text-amber-500" />
                  </div>
                  <div className="mt-2 text-2xl font-bold font-serif text-slate-900 tabular-nums">
                    {subscribers.length}
                  </div>
                  <div className="mt-1 text-[11px] text-emerald-600 font-medium">
                    Verified email subscribers
                  </div>
                </div>

                <div className="rounded-xl bg-white p-5 border border-slate-200/80 shadow-xs">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="text-xs font-bold uppercase tracking-wider">Active Ad Slots</span>
                    <Megaphone className="h-5 w-5 text-emerald-500" />
                  </div>
                  <div className="mt-2 text-2xl font-bold font-serif text-slate-900 tabular-nums">
                    {ads.filter(a => a.is_active).length} / {ads.length}
                  </div>
                  <div className="mt-1 text-[11px] text-slate-500">
                    Adsterra network ready
                  </div>
                </div>
              </div>

              {/* Recent Articles & Quick Actions */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-8 rounded-xl bg-white p-6 border border-slate-200/80 shadow-xs">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-serif font-bold text-slate-900 text-base">Recently Published News</h3>
                    <button
                      onClick={() => setActiveTab('articles')}
                      className="text-xs font-bold text-[#246BFD] hover:underline"
                    >
                      View All Articles &rarr;
                    </button>
                  </div>

                  <div className="divide-y divide-slate-100">
                    {articles.slice(0, 5).map(art => (
                      <div key={art.id} className="py-3 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={normalizeImageUrl(art.featured_image, art.title_bn, art.category_slug)}
                            alt=""
                            onError={handleImageError}
                            loading="lazy"
                            className="h-10 w-14 object-cover rounded bg-slate-100 shrink-0"
                          />
                          <div>
                            <div className="text-xs font-bold text-slate-900 line-clamp-1">{art.title_bn}</div>
                            <div className="text-[11px] text-slate-400">
                              {art.category_name_bn} · By {art.author_name} · {art.views_count.toLocaleString()} views
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            setEditingArticle(art);
                            setActiveTab('add_article');
                          }}
                          className="px-2.5 py-1 text-xs font-medium rounded border border-slate-200 hover:bg-slate-50 text-slate-700"
                        >
                          Edit
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="lg:col-span-4 rounded-xl bg-white p-6 border border-slate-200/80 shadow-xs space-y-4">
                  <h3 className="font-serif font-bold text-slate-900 text-base">Quick Newsroom Tools</h3>
                  <div className="space-y-2">
                    <button
                      onClick={() => setActiveTab('breaking_news')}
                      className="w-full flex items-center justify-between p-3 rounded-lg border border-slate-100 hover:border-red-500 bg-red-50/30 text-left transition-colors"
                    >
                      <div>
                        <div className="text-xs font-bold text-red-900">Manage Breaking News Ticker</div>
                        <div className="text-[10px] text-red-600">{breakingNews.filter(b => b.is_active).length} live tickers running</div>
                      </div>
                      <Flame className="h-5 w-5 text-red-500" />
                    </button>

                    <button
                      onClick={() => setActiveTab('advertisements')}
                      className="w-full flex items-center justify-between p-3 rounded-lg border border-slate-100 hover:border-[#246BFD] bg-blue-50/30 text-left transition-colors"
                    >
                      <div>
                        <div className="text-xs font-bold text-[#101D35]">Adsterra Ad Placements</div>
                        <div className="text-[10px] text-slate-500">Configure 11 ad positions</div>
                      </div>
                      <Megaphone className="h-5 w-5 text-[#246BFD]" />
                    </button>

                    <button
                      onClick={() => setActiveTab('backup_export')}
                      className="w-full flex items-center justify-between p-3 rounded-lg border border-slate-100 hover:border-emerald-500 bg-emerald-50/30 text-left transition-colors"
                    >
                      <div>
                        <div className="text-xs font-bold text-emerald-900">Export Database Backup</div>
                        <div className="text-[10px] text-emerald-600">One-click JSON & SQL dump</div>
                      </div>
                      <Database className="h-5 w-5 text-emerald-600" />
                    </button>

                    <a
                      href="/prime-news-graph-direct-netlify-drop.zip"
                      download="prime-news-graph-direct-netlify-drop.zip"
                      className="w-full flex items-center justify-between p-3 rounded-lg border border-blue-200 hover:border-[#246BFD] bg-gradient-to-r from-blue-50 to-indigo-50 text-left transition-colors cursor-pointer"
                    >
                      <div>
                        <div className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                          <span>📦 Netlify Live ZIP ডাউনলোড করুন</span>
                          <span className="px-1.5 py-0.5 rounded bg-blue-600 text-[9px] font-bold text-white uppercase">Direct Drop</span>
                        </div>
                        <div className="text-[10px] text-blue-700 mt-0.5">১ ক্লিকে Netlify-তে ড্রপ করার প্রস্তুত প্যাকেজ</div>
                      </div>
                      <Download className="h-5 w-5 text-[#246BFD]" />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: NEWS MANAGEMENT */}
          {activeTab === 'articles' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold font-serif text-slate-900">News Articles Management</h2>
                  <p className="text-xs text-slate-500">Browse, filter, edit, schedule, feature, or delete news articles.</p>
                </div>
                <button
                  onClick={handleCreateNewArticle}
                  className="flex items-center gap-2 bg-[#246BFD] hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-xs font-bold transition-all shrink-0"
                >
                  <PlusCircle className="h-4 w-4" />
                  <span>Add New News</span>
                </button>
              </div>

              {/* Filters */}
              <div className="flex flex-col sm:flex-row gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
                <div className="flex-1 relative">
                  <Search className="h-4 w-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search articles by title, author, or tags..."
                    value={articleSearch}
                    onChange={e => setArticleSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 text-xs rounded border border-slate-300 focus:outline-none focus:border-[#246BFD]"
                  />
                </div>
                <select
                  value={articleCategoryFilter}
                  onChange={e => setArticleCategoryFilter(e.target.value)}
                  className="text-xs rounded border border-slate-300 px-3 py-1.5 focus:outline-none focus:border-[#246BFD] bg-white"
                >
                  <option value="all">All Categories</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.slug}>{c.name_bn} ({c.name_en})</option>
                  ))}
                </select>
              </div>

              {/* Articles Table */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                      <tr>
                        <th className="py-3 px-4">Article</th>
                        <th className="py-3 px-4">Category</th>
                        <th className="py-3 px-4">Author</th>
                        <th className="py-3 px-4">Views</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4">Featured</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {articles
                        .filter(a => {
                          const matchesCat = articleCategoryFilter === 'all' || a.category_slug === articleCategoryFilter;
                          const matchesSearch = !articleSearch ||
                            a.title_bn.toLowerCase().includes(articleSearch.toLowerCase()) ||
                            a.title_en.toLowerCase().includes(articleSearch.toLowerCase()) ||
                            a.author_name.toLowerCase().includes(articleSearch.toLowerCase());
                          return matchesCat && matchesSearch;
                        })
                        .map(art => (
                          <tr key={art.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="py-3 px-4 flex items-center gap-3">
                              <img
                                src={normalizeImageUrl(art.featured_image, art.title_bn, art.category_slug)}
                                alt=""
                                onError={handleImageError}
                                loading="lazy"
                                className="h-10 w-14 object-cover rounded bg-slate-100 shrink-0"
                              />
                              <div>
                                <div className="font-bold text-slate-900 line-clamp-1 max-w-md">{art.title_bn}</div>
                                <div className="text-[10px] text-slate-400 font-mono">{art.slug}</div>
                              </div>
                            </td>
                            <td className="py-3 px-4 font-medium text-slate-700 whitespace-nowrap">
                              {art.category_name_bn}
                            </td>
                            <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                              {art.author_name}
                            </td>
                            <td className="py-3 px-4 tabular-nums font-mono font-medium text-slate-800 whitespace-nowrap">
                              {art.views_count.toLocaleString()}
                            </td>
                            <td className="py-3 px-4 whitespace-nowrap">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                art.status === 'published' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                              }`}>
                                {art.status}
                              </span>
                            </td>
                            <td className="py-3 px-4 whitespace-nowrap">
                              <button
                                onClick={() => handleToggleArticleFeatured(art)}
                                className={`p-1 rounded ${art.is_featured ? 'text-amber-500 hover:text-amber-600' : 'text-slate-300 hover:text-slate-400'}`}
                                title={art.is_featured ? 'Remove featured' : 'Mark as featured'}
                              >
                                <Star className={`h-4 w-4 ${art.is_featured ? 'fill-amber-400' : ''}`} />
                              </button>
                            </td>
                            <td className="py-3 px-4 text-right whitespace-nowrap">
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  onClick={() => {
                                    setEditingArticle(art);
                                    setActiveTab('add_article');
                                  }}
                                  className="p-1 text-slate-600 hover:text-[#246BFD] hover:bg-slate-100 rounded"
                                  title="Edit Article"
                                >
                                  <Edit className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteArticle(art.id)}
                                  className="p-1 text-slate-600 hover:text-red-600 hover:bg-slate-100 rounded"
                                  title="Delete Article"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: ADD / EDIT NEWS */}
          {activeTab === 'add_article' && (
            <div className="max-w-4xl space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold font-serif text-slate-900">
                    {editingArticle?.id ? 'Edit News Article' : 'Create New News Article'}
                  </h2>
                  <p className="text-xs text-slate-500">Fill in headline, summary, formatted editorial content, SEO metadata and category.</p>
                </div>
                <button
                  onClick={() => setActiveTab('articles')}
                  className="text-xs font-semibold text-slate-500 hover:text-slate-800"
                >
                  &larr; Back to Articles List
                </button>
              </div>

              <form onSubmit={handleSaveArticle} className="space-y-6 bg-white p-6 sm:p-8 rounded-xl border border-slate-200 shadow-2xs">
                {/* Titles */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                      Title (Bengali / বাংলা শিরোনাম) *
                    </label>
                    <input
                      type="text"
                      required
                      value={editingArticle?.title_bn || ''}
                      onChange={e => setEditingArticle(prev => ({ ...prev!, title_bn: e.target.value }))}
                      placeholder="বাংলায় সংবাদ শিরোনাম..."
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-[#246BFD]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                      Title (English Headline)
                    </label>
                    <input
                      type="text"
                      value={editingArticle?.title_en || ''}
                      onChange={e => setEditingArticle(prev => ({ ...prev!, title_en: e.target.value }))}
                      placeholder="English news headline..."
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-[#246BFD]"
                    />
                  </div>
                </div>

                {/* Slug */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    URL Slug (e.g. news/global-summit-accord)
                  </label>
                  <input
                    type="text"
                    value={editingArticle?.slug || ''}
                    onChange={e => setEditingArticle(prev => ({ ...prev!, slug: e.target.value }))}
                    placeholder="Leave empty to auto-generate from title"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs font-mono text-slate-900 focus:outline-none focus:border-[#246BFD]"
                  />
                </div>

                {/* Summaries */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                      Summary (Bengali)
                    </label>
                    <textarea
                      rows={3}
                      value={editingArticle?.summary_bn || ''}
                      onChange={e => setEditingArticle(prev => ({ ...prev!, summary_bn: e.target.value }))}
                      placeholder="সংক্ষিপ্ত সারসংক্ষেপ..."
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#246BFD]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                      Summary (English)
                    </label>
                    <textarea
                      rows={3}
                      value={editingArticle?.summary_en || ''}
                      onChange={e => setEditingArticle(prev => ({ ...prev!, summary_en: e.target.value }))}
                      placeholder="Short editorial summary..."
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#246BFD]"
                    />
                  </div>
                </div>

                {/* Category & Author Select */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                      Category *
                    </label>
                    <select
                      value={editingArticle?.category_id || categories[0]?.id}
                      onChange={e => setEditingArticle(prev => ({ ...prev!, category_id: e.target.value }))}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#246BFD] bg-white"
                    >
                      {categories.map(c => (
                        <option key={c.id} value={c.id}>{c.name_bn} ({c.name_en})</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                      Author *
                    </label>
                    <select
                      value={editingArticle?.author_id || authors[0]?.id}
                      onChange={e => setEditingArticle(prev => ({ ...prev!, author_id: e.target.value }))}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#246BFD] bg-white"
                    >
                      {authors.map(a => (
                        <option key={a.id} value={a.id}>{a.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                      Publication Status
                    </label>
                    <select
                      value={editingArticle?.status || 'published'}
                      onChange={e => setEditingArticle(prev => ({ ...prev!, status: e.target.value as any }))}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#246BFD] bg-white"
                    >
                      <option value="published">Published</option>
                      <option value="draft">Draft</option>
                      <option value="archived">Archived</option>
                      <option value="scheduled">Scheduled</option>
                    </select>
                  </div>
                </div>

                {/* 1. Featured Image Section with Mobile Device Upload & Presets */}
                <div className="rounded-xl border border-blue-200 bg-blue-50/40 p-4 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-800">
                        খবরের প্রধান ছবি (Featured News Image) *
                      </label>
                      <p className="text-[11px] text-slate-500">
                        মোবাইল গ্যালারি থেকে সরাসরি ছবি আপলোড করুন অথবা রেডিমেড ছবি নির্বাচন করুন
                      </p>
                    </div>

                    {/* Direct Upload Button */}
                    <label className="inline-flex items-center gap-2 bg-[#246BFD] hover:bg-blue-600 text-white px-3.5 py-2 rounded-lg text-xs font-bold cursor-pointer transition-all shadow-xs">
                      <Camera className="h-4 w-4" />
                      <span>গ্যালারি / ডিভাইস থেকে ছবি দিন</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleArticlePhotoUpload}
                        className="hidden"
                      />
                    </label>
                  </div>

                  {/* Preset Photo Quick Picker */}
                  <div>
                    <span className="block text-[11px] font-semibold text-slate-600 mb-1.5">
                      অথবা ১-ক্লিকে রেডিমেড নিউজ ছবি নির্বাচন করুন:
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {PRESET_NEWS_IMAGES.map(preset => (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => {
                            setEditingArticle(prev => ({ ...prev!, featured_image: preset.url }));
                            showToast(`"${preset.label}" ছবি নির্বাচন করা হয়েছে`);
                          }}
                          className={`group relative rounded-lg border overflow-hidden p-1.5 text-left transition-all cursor-pointer ${
                            editingArticle?.featured_image === preset.url
                              ? 'border-[#246BFD] bg-blue-50 ring-2 ring-[#246BFD]/30'
                              : 'border-slate-200 bg-white hover:border-slate-300'
                          }`}
                        >
                          <img
                            src={preset.url}
                            alt=""
                            loading="lazy"
                            className="h-12 w-full object-cover rounded"
                          />
                          <span className="block text-[10px] font-bold text-slate-700 mt-1 truncate">
                            {preset.label}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Manual URL / Path Input & Live Preview */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-2 border-t border-blue-100">
                    <div className="sm:col-span-8">
                      <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-600 mb-1">
                        ছবির পাথ বা অনলাইন লিঙ্ক (Image URL / Path)
                      </label>
                      <input
                        type="text"
                        required
                        value={editingArticle?.featured_image || ''}
                        onChange={e => setEditingArticle(prev => ({ ...prev!, featured_image: e.target.value }))}
                        placeholder="/assets/images/... or https://..."
                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#246BFD]"
                      />
                    </div>

                    {/* Live Preview Box */}
                    <div className="sm:col-span-4">
                      <span className="block text-[10px] font-semibold uppercase tracking-wider text-slate-600 mb-1">
                        ছবির প্রিভিউ (Live Preview)
                      </span>
                      <div className="relative aspect-video w-full rounded-lg overflow-hidden border border-slate-300 bg-slate-900">
                        <img
                          src={normalizeImageUrl(editingArticle?.featured_image, editingArticle?.title_bn, editingArticle?.category_slug)}
                          alt="Preview"
                          onError={handleImageError}
                          loading="lazy"
                          className="h-full w-full object-cover"
                        />
                        <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/70 text-[9px] font-bold text-emerald-300">
                          ✓ ছবি রেডি
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Video URL */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    YouTube Video URL (ঐচ্ছিক / Optional)
                  </label>
                  <input
                    type="text"
                    value={editingArticle?.video_url || ''}
                    onChange={e => setEditingArticle(prev => ({ ...prev!, video_url: e.target.value }))}
                    placeholder="https://www.youtube.com/watch?v=..."
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#246BFD]"
                  />
                </div>

                {/* Article Full Rich HTML Content (Bengali) */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Article Full Content (HTML format) - Bengali *
                  </label>
                  <textarea
                    rows={8}
                    required
                    value={editingArticle?.content_bn || ''}
                    onChange={e => setEditingArticle(prev => ({ ...prev!, content_bn: e.target.value }))}
                    placeholder="<p class='lead'>সংবাদের বিস্তারিত বিবরণ...</p><h2>উপশিরোনাম</h2><p>অনুচ্ছেদ...</p>"
                    className="w-full rounded-lg border border-slate-300 p-3 font-mono text-xs text-slate-900 focus:outline-none focus:border-[#246BFD]"
                  />
                </div>

                {/* Options: Featured & Editors Choice */}
                <div className="flex items-center gap-6 pt-2">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-800">
                    <input
                      type="checkbox"
                      checked={editingArticle?.is_featured || false}
                      onChange={e => setEditingArticle(prev => ({ ...prev!, is_featured: e.target.checked }))}
                      className="rounded border-slate-300 text-[#246BFD]"
                    />
                    <span>Highlight as Homepage Featured Story</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-800">
                    <input
                      type="checkbox"
                      checked={editingArticle?.is_editors_choice || false}
                      onChange={e => setEditingArticle(prev => ({ ...prev!, is_editors_choice: e.target.checked }))}
                      className="rounded border-slate-300 text-[#246BFD]"
                    />
                    <span>Mark as Editor's Choice</span>
                  </label>
                </div>

                {/* Form Buttons */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => setActiveTab('articles')}
                    className="px-4 py-2 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex items-center gap-2 px-6 py-2 rounded-lg bg-[#246BFD] hover:bg-blue-600 text-white text-xs font-bold shadow-sm transition-colors"
                  >
                    <Save className="h-4 w-4" />
                    <span>Save & Publish Article</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 4: CATEGORIES MANAGEMENT */}
          {activeTab === 'categories' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold font-serif text-slate-900">Categories Management</h2>
                  <p className="text-xs text-slate-500">Configure news desks, slugs, sorting order and brand colors.</p>
                </div>
                <button
                  onClick={() => setEditingCategory({ name_bn: '', name_en: '', slug: '', color: '#246BFD', order_index: categories.length + 1 })}
                  className="flex items-center gap-2 bg-[#246BFD] hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-xs font-bold"
                >
                  <PlusCircle className="h-4 w-4" />
                  <span>Add Category</span>
                </button>
              </div>

              {/* Category Edit Form */}
              {editingCategory && (
                <form onSubmit={handleSaveCategory} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
                  <h3 className="font-bold text-sm text-slate-900">{editingCategory.id ? 'Edit Category' : 'Create Category'}</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                    <input
                      type="text"
                      placeholder="Category Name (Bengali)"
                      required
                      value={editingCategory.name_bn || ''}
                      onChange={e => setEditingCategory(prev => ({ ...prev!, name_bn: e.target.value }))}
                      className="rounded border border-slate-300 p-2 text-xs"
                    />
                    <input
                      type="text"
                      placeholder="Category Name (English)"
                      required
                      value={editingCategory.name_en || ''}
                      onChange={e => setEditingCategory(prev => ({ ...prev!, name_en: e.target.value }))}
                      className="rounded border border-slate-300 p-2 text-xs"
                    />
                    <input
                      type="text"
                      placeholder="Slug (e.g. politics)"
                      required
                      value={editingCategory.slug || ''}
                      onChange={e => setEditingCategory(prev => ({ ...prev!, slug: e.target.value }))}
                      className="rounded border border-slate-300 p-2 text-xs font-mono"
                    />
                    <input
                      type="color"
                      value={editingCategory.color || '#246BFD'}
                      onChange={e => setEditingCategory(prev => ({ ...prev!, color: e.target.value }))}
                      className="h-9 w-full rounded border border-slate-300 p-1"
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <button type="button" onClick={() => setEditingCategory(null)} className="px-3 py-1.5 rounded border text-xs">Cancel</button>
                    <button type="submit" className="px-4 py-1.5 rounded bg-[#246BFD] text-white text-xs font-bold">Save Category</button>
                  </div>
                </form>
              )}

              {/* Categories Table */}
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider">
                    <tr>
                      <th className="py-3 px-4">Color</th>
                      <th className="py-3 px-4">Name (Bengali)</th>
                      <th className="py-3 px-4">Name (English)</th>
                      <th className="py-3 px-4">Slug</th>
                      <th className="py-3 px-4">Order</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {categories.map(c => (
                      <tr key={c.id}>
                        <td className="py-3 px-4">
                          <span className="inline-block h-4 w-4 rounded" style={{ backgroundColor: c.color }}></span>
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-900">{c.name_bn}</td>
                        <td className="py-3 px-4 text-slate-700">{c.name_en}</td>
                        <td className="py-3 px-4 font-mono text-slate-500">{c.slug}</td>
                        <td className="py-3 px-4 font-mono">{c.order_index}</td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button onClick={() => setEditingCategory(c)} className="p-1 hover:text-[#246BFD]"><Edit className="h-4 w-4" /></button>
                            <button onClick={() => handleDeleteCategory(c.id)} className="p-1 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 5: BREAKING NEWS */}
          {activeTab === 'breaking_news' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold font-serif text-slate-900">Breaking News Control Center</h2>
                  <p className="text-xs text-slate-500">Live scrolling ticker headlines, priority ordering, and target article links.</p>
                </div>
                <button
                  onClick={() => setEditingBreaking({ title_bn: '', title_en: '', label_bn: 'ব্রেকিং নিউজ', label_en: 'BREAKING NEWS', is_active: true, priority: breakingNews.length + 1 })}
                  className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-xs font-bold"
                >
                  <PlusCircle className="h-4 w-4" />
                  <span>Add Breaking Headline</span>
                </button>
              </div>

              {/* Form */}
              {editingBreaking && (
                <form onSubmit={handleSaveBreaking} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
                  <h3 className="font-bold text-sm text-slate-900">Configure Breaking Alert</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <input
                      type="text"
                      placeholder="Headline (Bengali) *"
                      required
                      value={editingBreaking.title_bn || ''}
                      onChange={e => setEditingBreaking(prev => ({ ...prev!, title_bn: e.target.value }))}
                      className="rounded border border-slate-300 p-2 text-xs"
                    />
                    <input
                      type="text"
                      placeholder="Headline (English)"
                      value={editingBreaking.title_en || ''}
                      onChange={e => setEditingBreaking(prev => ({ ...prev!, title_en: e.target.value }))}
                      className="rounded border border-slate-300 p-2 text-xs"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <input
                      type="text"
                      placeholder="Target Article URL (/news/...)"
                      value={editingBreaking.target_url || ''}
                      onChange={e => setEditingBreaking(prev => ({ ...prev!, target_url: e.target.value }))}
                      className="rounded border border-slate-300 p-2 text-xs"
                    />
                    <input
                      type="text"
                      placeholder="Label (e.g. ব্রেকিং নিউজ)"
                      value={editingBreaking.label_bn || ''}
                      onChange={e => setEditingBreaking(prev => ({ ...prev!, label_bn: e.target.value }))}
                      className="rounded border border-slate-300 p-2 text-xs"
                    />
                    <label className="flex items-center gap-2 text-xs font-semibold">
                      <input
                        type="checkbox"
                        checked={editingBreaking.is_active ?? true}
                        onChange={e => setEditingBreaking(prev => ({ ...prev!, is_active: e.target.checked }))}
                      />
                      <span>Active Ticker</span>
                    </label>
                  </div>
                  <div className="flex justify-end gap-2">
                    <button type="button" onClick={() => setEditingBreaking(null)} className="px-3 py-1.5 rounded border text-xs">Cancel</button>
                    <button type="submit" className="px-4 py-1.5 rounded bg-red-600 text-white text-xs font-bold">Save Alert</button>
                  </div>
                </form>
              )}

              {/* Breaking News Table */}
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase">
                    <tr>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Headline (Bengali)</th>
                      <th className="py-3 px-4">English Headline</th>
                      <th className="py-3 px-4">Target Link</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {breakingNews.map(b => (
                      <tr key={b.id}>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${b.is_active ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-500'}`}>
                            {b.is_active ? 'LIVE' : 'OFF'}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-900">{b.title_bn}</td>
                        <td className="py-3 px-4 text-slate-600">{b.title_en}</td>
                        <td className="py-3 px-4 font-mono text-[11px] text-blue-600">{b.target_url}</td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button onClick={() => setEditingBreaking(b)} className="p-1 hover:text-[#246BFD]"><Edit className="h-4 w-4" /></button>
                            <button onClick={() => handleDeleteBreaking(b.id)} className="p-1 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 6: FEATURED NEWS MANAGER */}
          {activeTab === 'featured_news' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold font-serif text-slate-900">Featured & Top News Manager</h2>
                <p className="text-xs text-slate-500">Curate hero placement, editor's choice, and high-impact homepage editorial spotlights.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
                  <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                    <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                    <span>Homepage Hero Candidates ({articles.filter(a => a.is_featured).length})</span>
                  </h3>
                  <div className="divide-y divide-slate-100">
                    {articles.filter(a => a.is_featured).map(art => (
                      <div key={art.id} className="py-2.5 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <img
                            src={normalizeImageUrl(art.featured_image, art.title_bn, art.category_slug)}
                            alt=""
                            onError={handleImageError}
                            loading="lazy"
                            className="h-8 w-12 rounded object-cover"
                          />
                          <span className="text-xs font-semibold text-slate-800 line-clamp-1 max-w-xs">{art.title_bn}</span>
                        </div>
                        <button
                          onClick={() => handleToggleArticleFeatured(art)}
                          className="text-xs text-red-600 hover:underline"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
                  <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                    <Flame className="h-4 w-4 text-red-500" />
                    <span>Editor's Choice Articles ({articles.filter(a => a.is_editors_choice).length})</span>
                  </h3>
                  <div className="divide-y divide-slate-100">
                    {articles.filter(a => a.is_editors_choice).map(art => (
                      <div key={art.id} className="py-2.5 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <img
                            src={normalizeImageUrl(art.featured_image, art.title_bn, art.category_slug)}
                            alt=""
                            onError={handleImageError}
                            loading="lazy"
                            className="h-8 w-12 rounded object-cover"
                          />
                          <span className="text-xs font-semibold text-slate-800 line-clamp-1 max-w-xs">{art.title_bn}</span>
                        </div>
                        <span className="text-[10px] text-slate-400 tabular-nums">{art.views_count.toLocaleString()} views</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 7: ADSTERRA ADVERTISEMENT MANAGEMENT */}
          {activeTab === 'advertisements' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-blue-900 to-indigo-900 text-white p-5 rounded-xl shadow-md">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500 text-white uppercase tracking-wider">
                      Adsterra 100% Verified
                    </span>
                    <span className="text-xs text-blue-200">১২টি বিজ্ঞাপন স্লট সক্রিয়</span>
                  </div>
                  <h2 className="text-2xl font-bold font-serif mt-1">Adsterra Ads Management & Placement Hub</h2>
                  <p className="text-xs text-blue-100/90 mt-1">
                    আপনার দেওয়া সকল Adsterra Ads (৭২৮x৯০, ৩০০x২৫০, ৩২০x৫০, নেটিভ, পপআন্ডার, সোশ্যাল বার, ডাইরেক্ট লিঙ্ক) নির্দিষ্ট জায়গায় সেট করা আছে। নিচে যে কোনো স্লট এডিট বা পরিবর্তন করতে পারেন।
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <button
                    type="button"
                    onClick={async () => {
                      const default728 = `<script>\n  atOptions = {\n    'key' : 'b713e6ef9bcbd950fde8de6fdbc2c316',\n    'format' : 'iframe',\n    'height' : 90,\n    'width' : 728,\n    'params' : {}\n  };\n</script>\n<script src="https://bicea.org/22/b713e6ef9bcbd950fde8de6fdbc2c316"></script>`;
                      const default300 = `<script>\n  atOptions = {\n    'key' : '1547813ee5e9165c15f63eaa054cf877',\n    'format' : 'iframe',\n    'height' : 250,\n    'width' : 300,\n    'params' : {}\n  };\n</script>\n<script src="https://bicea.org/22/1547813ee5e9165c15f63eaa054cf877"></script>`;
                      const default320 = `<script>\n  atOptions = {\n    'key' : '4fa6a8cbab261c96e980e6c49a014f9d',\n    'format' : 'iframe',\n    'height' : 50,\n    'width' : 320,\n    'params' : {}\n  };\n</script>\n<script src="https://bicea.org/22/4fa6a8cbab261c96e980e6c49a014f9d"></script>`;

                      for (const ad of ads) {
                        let newCode = ad.ad_code;
                        if (['header_banner', 'homepage_top', 'between_news', 'inter_category', 'article_top', 'article_bottom', 'footer_banner'].includes(ad.id)) {
                          newCode = default728;
                        } else if (['sidebar_banner', 'article_middle'].includes(ad.id)) {
                          newCode = default300;
                        } else if (ad.id === 'mobile_banner') {
                          newCode = default320;
                        } else if (ad.id === 'native_container') {
                          newCode = `<script async="async" data-cfasync="false" src="https://bicea.org/21/5dcb5138b7cff3bbbaa59a0fa9bba75d"></script>\n<div id="container-5dcb5138b7cff3bbbaa59a0fa9bba75d"></div>`;
                        } else if (ad.id === 'popunder') {
                          newCode = `<script data-cfasync="false" src="https://afders.org/1/4be7d82348a1be0e427f489cb21509ce"></script>`;
                        } else if (ad.id === 'social_bar') {
                          newCode = `<script data-cfasync="false" src="https://bicea.org/14/799ac73f4af6f2d0b12fc445e295b683"></script>\n<script data-cfasync="false" src="https://afders.org/1/4be7d82348a1be0e427f489cb21509ce"></script>`;
                        } else if (ad.id === 'direct_smartlink') {
                          newCode = `https://arwf.org/4/a9f1d704984553dbce8f19128b098736`;
                        }
                        await api.saveAd({ ...ad, ad_code: newCode, is_active: true });
                      }
                      loadAllData();
                      onRefreshData();
                      showToast('✅ সকল Adsterra বিজ্ঞাপন স্লট সফলভাবে আপনার নতুন কোডে সিঙ্ক ও সক্রিয় হয়েছে!');
                    }}
                    className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-4 py-2 rounded-lg shadow transition-all flex items-center gap-1.5 cursor-pointer text-xs"
                  >
                    <span>⚡ ১-ক্লিকে সকল নতুন কোড সিঙ্ক করুন</span>
                  </button>
                  <div className="bg-white/10 px-3 py-2 rounded-lg border border-white/20 text-center">
                    <div className="font-bold text-emerald-400">অটো স্ক্রিপ্ট রানার</div>
                    <div className="text-[10px] text-blue-200">আইসোলেটেড আইফ্রেম কার্যকর</div>
                  </div>
                </div>
              </div>

              {/* Edit Modal / Form */}
              {editingAd && (
                <form onSubmit={handleSaveAd} className="bg-white p-6 rounded-xl border border-blue-200 shadow-xl space-y-5">
                  <div className="flex items-center justify-between border-b pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                          {editingAd.id}
                        </span>
                        <h3 className="font-bold text-base text-slate-900">বিজ্ঞাপন স্লট এডিট: {editingAd.name}</h3>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {editingAd.id === 'header_banner' && '📍 সাইটের একেবারে উপরে হেডারে প্রদর্শিত হবে (৭২৮x৯০ বা ৩২০x৫০ মোবাইল)'}
                        {editingAd.id === 'homepage_top' && '📍 হোমপেজের ব্রেকিং ও প্রধান খবরের ঠিক নিচে প্রদর্শিত হবে (৭২৮x৯০)'}
                        {editingAd.id === 'between_news' && '📍 খবরের গ্রিড এবং তালিকার মাঝামাঝি অংশে বসবে (নেটিভ ৪:১ ব্যানার)'}
                        {editingAd.id === 'sidebar_banner' && '📍 সাইডবারে ট্রেন্ডিং ও ক্যাটাগরির পাশে বসবে (৩০০x২৫০ মিডিয়াম রেকট্যাঙ্গেল)'}
                        {editingAd.id === 'article_top' && '📍 নিউজের বিস্তারিত পৃষ্ঠার শুরুতে প্রদর্শিত হবে (৭২৮x৯০ / ৩০০x২৫০)'}
                        {editingAd.id === 'article_middle' && '📍 খবরের আর্টিকেলের ৩য় অনুচ্ছেদের ঠিক পরে বসবে (৩০০x২৫০ বা নেটিভ)'}
                        {editingAd.id === 'article_bottom' && '📍 খবরের লেখার শেষে ও কমেন্ট সেকশনের উপরে বসবে (৭২৮x৯০ / ৩০০x২৫০)'}
                        {editingAd.id === 'footer_banner' && '📍 সাইটের ফুটারের ঠিক উপরে প্রদর্শিত হবে (৭২৮x৯০ ব্যানার)'}
                        {editingAd.id === 'mobile_banner' && '📍 মোবাইল ডিভাইসে নিচের অংশে ফিক্সড থাকবে (৩২০x৫০ ব্যানার)'}
                        {editingAd.id === 'popunder' && '📍 গ্লোবাল পপআন্ডার স্ক্রিপ্ট - ব্যবহারকারী সাইটে ক্লিক করলে নতুন ট্যাবে এড লোড হবে'}
                        {editingAd.id === 'social_bar' && '📍 গ্লোবাল সোশ্যাল বার / পুশ নোটিফিকেশন এড - স্ক্রিনে ভেসে থাকবে'}
                        {editingAd.id === 'direct_smartlink' && '📍 ডাইরেক্ট স্মার্টলিঙ্ক - ক্লিক করলে সরাসরি স্পনসর লিঙ্কে যাবে'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setEditingAd(null)}
                      className="text-slate-400 hover:text-slate-600 p-1"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Status (স্ট্যাটাস)</label>
                      <select
                        value={editingAd.is_active ? 'active' : 'inactive'}
                        onChange={e => setEditingAd({ ...editingAd, is_active: e.target.value === 'active' })}
                        className="w-full rounded border border-slate-300 p-2 text-xs bg-slate-50 focus:bg-white"
                      >
                        <option value="active">Active (সক্রিয় ও লাইভ)</option>
                        <option value="inactive">Disabled (বন্ধ)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Device Targeting (ডিভাইস)</label>
                      <select
                        value={editingAd.device_target}
                        onChange={e => setEditingAd({ ...editingAd, device_target: e.target.value as any })}
                        className="w-full rounded border border-slate-300 p-2 text-xs bg-slate-50 focus:bg-white"
                      >
                        <option value="all">সকল ডিভাইসে দেখাবে (কম্পিউটার ও মোবাইল)</option>
                        <option value="desktop">শুধু কম্পিউটার / ডেস্কটপে দেখাবে</option>
                        <option value="mobile">শুধু মোবাইল ফোনে দেখাবে</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Ad Format (বিজ্ঞাপনের ধরন)</label>
                      <select
                        value={editingAd.format}
                        onChange={e => setEditingAd({ ...editingAd, format: e.target.value as any })}
                        className="w-full rounded border border-slate-300 p-2 text-xs bg-slate-50 focus:bg-white"
                      >
                        <option value="banner">Display Banner (৭২৮x৯০ / ৩০০x২৫০ / ৩২০x৫০)</option>
                        <option value="native">Native 4:1 In-Feed Banner</option>
                        <option value="popunder">Popunder Script (পপআন্ডার)</option>
                        <option value="social_bar">Social Bar (সোশ্যাল নোটিফিকেশন বার)</option>
                        <option value="direct_link">Direct SmartLink (ডাইরেক্ট লিঙ্ক)</option>
                      </select>
                    </div>
                  </div>

                  {/* 1-Click Adsterra Preset buttons */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Adsterra কুইক প্রিসেট কোড ইনসার্ট (এক ক্লিকেই কোড বসান):
                    </label>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingAd({
                            ...editingAd,
                            format: 'banner',
                            ad_code: `<script>\n  atOptions = {\n    'key' : 'b713e6ef9bcbd950fde8de6fdbc2c316',\n    'format' : 'iframe',\n    'height' : 90,\n    'width' : 728,\n    'params' : {}\n  };\n</script>\n<script src="https://bicea.org/22/b713e6ef9bcbd950fde8de6fdbc2c316"></script>`
                          });
                        }}
                        className="px-2.5 py-1 text-[11px] font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 rounded border border-blue-200"
                      >
                        + 728x90 ব্যানার
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingAd({
                            ...editingAd,
                            format: 'banner',
                            ad_code: `<script>\n  atOptions = {\n    'key' : '1547813ee5e9165c15f63eaa054cf877',\n    'format' : 'iframe',\n    'height' : 250,\n    'width' : 300,\n    'params' : {}\n  };\n</script>\n<script src="https://bicea.org/22/1547813ee5e9165c15f63eaa054cf877"></script>`
                          });
                        }}
                        className="px-2.5 py-1 text-[11px] font-medium bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded border border-indigo-200"
                      >
                        + 300x250 ব্যানার
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingAd({
                            ...editingAd,
                            format: 'banner',
                            ad_code: `<script>\n  atOptions = {\n    'key' : '4fa6a8cbab261c96e980e6c49a014f9d',\n    'format' : 'iframe',\n    'height' : 50,\n    'width' : 320,\n    'params' : {}\n  };\n</script>\n<script src="https://bicea.org/22/4fa6a8cbab261c96e980e6c49a014f9d"></script>`
                          });
                        }}
                        className="px-2.5 py-1 text-[11px] font-medium bg-purple-50 text-purple-700 hover:bg-purple-100 rounded border border-purple-200"
                      >
                        + 320x50 মোবাইল ব্যানার
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingAd({
                            ...editingAd,
                            format: 'native',
                            ad_code: `<script async="async" data-cfasync="false" src="https://bicea.org/21/5dcb5138b7cff3bbbaa59a0fa9bba75d"></script>\n<div id="container-5dcb5138b7cff3bbbaa59a0fa9bba75d"></div>`
                          });
                        }}
                        className="px-2.5 py-1 text-[11px] font-medium bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded border border-emerald-200"
                      >
                        + Native 4:1 কনটেইনার
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingAd({
                            ...editingAd,
                            format: 'popunder',
                            ad_code: `<script data-cfasync="false" src="https://afders.org/1/4be7d82348a1be0e427f489cb21509ce"></script>`
                          });
                        }}
                        className="px-2.5 py-1 text-[11px] font-medium bg-amber-50 text-amber-700 hover:bg-amber-100 rounded border border-amber-200"
                      >
                        + Popunder স্ক্রিপ্ট
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingAd({
                            ...editingAd,
                            format: 'social_bar',
                            ad_code: `<script data-cfasync="false" src="https://bicea.org/14/799ac73f4af6f2d0b12fc445e295b683"></script>\n<script data-cfasync="false" src="https://afders.org/1/4be7d82348a1be0e427f489cb21509ce"></script>`
                          });
                        }}
                        className="px-2.5 py-1 text-[11px] font-medium bg-rose-50 text-rose-700 hover:bg-rose-100 rounded border border-rose-200"
                      >
                        + Social Bar স্ক্রিপ্ট
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingAd({
                            ...editingAd,
                            format: 'direct_link',
                            ad_code: `https://arwf.org/4/a9f1d704984553dbce8f19128b098736`
                          });
                        }}
                        className="px-2.5 py-1 text-[11px] font-medium bg-cyan-50 text-cyan-700 hover:bg-cyan-100 rounded border border-cyan-200"
                      >
                        + Direct SmartLink লিঙ্ক
                      </button>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-bold text-slate-700">
                        বিজ্ঞাপনের কোড বা স্ক্রিপ্ট (Adsterra Script Code / Custom HTML / Direct URL)
                      </label>
                      <span className="text-[10px] text-slate-500">
                        স্ক্রিপ্ট ট্যাগ সহ সম্পূর্ণ কোড পেস্ট করুন
                      </span>
                    </div>
                    <textarea
                      rows={6}
                      value={editingAd.ad_code || ''}
                      onChange={e => setEditingAd({ ...editingAd, ad_code: e.target.value })}
                      className="w-full rounded border border-slate-300 p-3 font-mono text-xs text-slate-800 bg-slate-900 text-slate-100 leading-relaxed"
                      placeholder="<!-- Paste your Adsterra script tag or HTML banner code here -->"
                    />
                  </div>

                  {/* Live Preview Box */}
                  <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                        <Eye className="h-3.5 w-3.5 text-blue-600" />
                        লাইভ প্রিভিউ (বিজ্ঞাপনটি যেভাবে সাইটে শো করবে)
                      </span>
                      <span className="text-[10px] text-slate-500">Adsterra Script Runner Active</span>
                    </div>
                    <div className="bg-white p-3 rounded border border-dashed border-slate-300 min-h-[90px] flex items-center justify-center">
                      <AdPlacement slot={editingAd} />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2 border-t">
                    <button
                      type="button"
                      onClick={() => setEditingAd(null)}
                      className="px-4 py-2 border border-slate-300 rounded text-xs font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      বাতিল
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 bg-[#246BFD] hover:bg-blue-600 text-white text-xs font-bold rounded shadow-xs"
                    >
                      সংরক্ষণ ও আপডেট করুন
                    </button>
                  </div>
                </form>
              )}

              {/* Ad Slots List */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {ads.map(ad => {
                  let locationGuide = '';
                  if (ad.id === 'header_banner') locationGuide = 'হেডার (৭২৮x৯০ বা ৩২০x৫০)';
                  else if (ad.id === 'homepage_top') locationGuide = 'হোমপেজ টপ (৭২৮x৯০)';
                  else if (ad.id === 'between_news') locationGuide = 'খবরের মাঝে (নেটিভ ৪:১)';
                  else if (ad.id === 'sidebar_banner') locationGuide = 'সাইডবার (৩০০x২৫০)';
                  else if (ad.id === 'article_top') locationGuide = 'আর্টিকেল টপ (৭২৮x৯০)';
                  else if (ad.id === 'article_middle') locationGuide = 'আর্টিকেল মিডিয়াম (৩০০x২৫০)';
                  else if (ad.id === 'article_bottom') locationGuide = 'আর্টিকেল বটম (৭২৮x৯০)';
                  else if (ad.id === 'footer_banner') locationGuide = 'ফুটার ব্যানার (৭২৮x৯০)';
                  else if (ad.id === 'mobile_banner') locationGuide = 'মোবাইল ফ্লোটিং (৩২০x৫০)';
                  else if (ad.id === 'popunder') locationGuide = 'পপআন্ডার স্ক্রিপ্ট';
                  else if (ad.id === 'social_bar') locationGuide = 'সোশ্যাল পুশ বার';
                  else if (ad.id === 'direct_smartlink') locationGuide = 'স্মার্টলিঙ্ক রিডাইরেক্ট';

                  return (
                    <div key={ad.id} className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs flex flex-col justify-between hover:border-blue-300 transition-colors">
                      <div>
                        <div className="flex items-center justify-between">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${ad.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'}`}>
                            {ad.is_active ? 'ACTIVE (চালু)' : 'DISABLED (বন্ধ)'}
                          </span>
                          <span className="text-[10px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded uppercase font-mono">
                            {ad.device_target}
                          </span>
                        </div>
                        <h4 className="mt-2 text-sm font-bold text-slate-900">{ad.name}</h4>
                        <div className="mt-1 flex items-center gap-1.5 text-xs text-blue-600 font-medium">
                          <span>📍</span>
                          <span>{locationGuide}</span>
                        </div>
                        <div className="mt-1 font-mono text-[11px] text-slate-400">ID: {ad.id}</div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                        <div className="text-[11px] text-slate-500">
                          <span className="font-bold text-slate-700 tabular-nums">{ad.impressions.toLocaleString()}</span> ভিউ · <span className="font-bold text-slate-700 tabular-nums">{ad.clicks.toLocaleString()}</span> ক্লিক
                        </div>
                        <button
                          onClick={() => setEditingAd(ad)}
                          className="px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-[#246BFD] hover:text-white text-blue-700 text-xs font-bold transition-all shadow-2xs"
                        >
                          এডিট কোড
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}


          {/* TAB 8: MEDIA LIBRARY */}
          {activeTab === 'media_library' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold font-serif text-slate-900">Media Library</h2>
                  <p className="text-xs text-slate-500">Persistent image uploads, CDN asset storage, and copyable article URLs.</p>
                </div>
                <label className="flex items-center gap-2 bg-[#246BFD] hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-xs font-bold cursor-pointer">
                  <Upload className="h-4 w-4" />
                  <span>{uploadingImage ? 'Uploading...' : 'Upload Image'}</span>
                  <input type="file" accept="image/*" onChange={handleMediaFileUpload} className="hidden" />
                </label>
              </div>

              {/* Media Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {/* Pre-installed generated hero images */}
                {[
                  { name: 'World Summit Accord', url: '/assets/images/news_world_summit_1793801922828.jpg' },
                  { name: '2nm AI Semiconductor', url: '/assets/images/news_tech_ai_chip_1793801922448.jpg' },
                  { name: 'Dhaka Metro Rail Network', url: '/assets/images/news_dhaka_metro_1793801923998.jpg' },
                  { name: 'Cricket World Cup Final', url: '/assets/images/news_cricket_stadium_1793801922344.jpg' },
                ].map((item, idx) => (
                  <div key={idx} className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-2xs group">
                    <div className="aspect-square bg-slate-100 overflow-hidden relative">
                      <img src={item.url} alt="" loading="lazy" className="h-full w-full object-cover" />
                    </div>
                    <div className="p-2">
                      <div className="text-[11px] font-bold text-slate-800 truncate">{item.name}</div>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(item.url);
                          showToast('Image URL copied to clipboard.');
                        }}
                        className="mt-1 flex items-center gap-1 text-[10px] text-[#246BFD] font-semibold hover:underline"
                      >
                        <Copy className="h-3 w-3" />
                        <span>Copy URL</span>
                      </button>
                    </div>
                  </div>
                ))}

                {/* Uploaded media files */}
                {mediaFiles.map(file => (
                  <div key={file.id} className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-2xs group">
                    <div className="aspect-square bg-slate-100 overflow-hidden relative">
                      <img src={file.url} alt="" loading="lazy" className="h-full w-full object-cover" />
                    </div>
                    <div className="p-2">
                      <div className="text-[11px] font-bold text-slate-800 truncate">{file.name}</div>
                      <div className="flex items-center justify-between mt-1">
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(file.url);
                            showToast('Image URL copied.');
                          }}
                          className="flex items-center gap-1 text-[10px] text-[#246BFD] font-semibold hover:underline"
                        >
                          <Copy className="h-3 w-3" />
                          <span>Copy URL</span>
                        </button>
                        <button
                          onClick={async () => {
                            if (confirm('Delete media file?')) {
                              await api.deleteMedia(file.name);
                              showToast('Media file removed.');
                              loadAllData();
                            }
                          }}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 9: VIDEO MANAGEMENT */}
          {activeTab === 'videos' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold font-serif text-slate-900">Video Reports Management</h2>
                  <p className="text-xs text-slate-500">Curate embedded YouTube news documentaries, reports and featured streams.</p>
                </div>
                <button
                  onClick={() => setEditingVideo({ title_bn: '', title_en: '', youtube_id: '', category: 'national', is_featured: false })}
                  className="flex items-center gap-2 bg-[#246BFD] hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-xs font-bold"
                >
                  <PlusCircle className="h-4 w-4" />
                  <span>Add Video</span>
                </button>
              </div>

              {editingVideo && (
                <form onSubmit={handleSaveVideo} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
                  <h3 className="font-bold text-sm text-slate-900">Add Video Report</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <input
                      type="text"
                      placeholder="Video Title (Bengali)"
                      required
                      value={editingVideo.title_bn || ''}
                      onChange={e => setEditingVideo({ ...editingVideo, title_bn: e.target.value })}
                      className="rounded border border-slate-300 p-2 text-xs"
                    />
                    <input
                      type="text"
                      placeholder="YouTube Video ID (e.g. LXb3EKWsInQ)"
                      required
                      value={editingVideo.youtube_id || ''}
                      onChange={e => setEditingVideo({ ...editingVideo, youtube_id: e.target.value })}
                      className="rounded border border-slate-300 p-2 text-xs font-mono"
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <button type="button" onClick={() => setEditingVideo(null)} className="px-3 py-1.5 border rounded text-xs">Cancel</button>
                    <button type="submit" className="px-4 py-1.5 bg-[#246BFD] text-white text-xs font-bold rounded">Save Video</button>
                  </div>
                </form>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {videos.map(v => (
                  <div key={v.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
                    <div className="aspect-video bg-black relative">
                      <img src={`https://img.youtube.com/vi/${v.youtube_id}/mqdefault.jpg`} alt="" loading="lazy" className="w-full h-full object-cover" />
                    </div>
                    <div className="p-4">
                      <h4 className="text-xs font-bold text-slate-900 line-clamp-2">{v.title_bn}</h4>
                      <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-100 text-[10px] text-slate-400">
                        <span>ID: {v.youtube_id}</span>
                        <button onClick={() => handleDeleteVideo(v.id)} className="text-red-500 hover:text-red-700">Delete</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 10: AUTHORS MANAGEMENT */}
          {activeTab === 'authors' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-2xl font-bold font-serif text-slate-900">Authors & Journalists Management</h2>
                  <p className="text-xs text-slate-500">লেখক ও সাংবাদিকদের প্রোফাইল, মোবাইল গ্যালারি থেকে ছবি আপলোড, পরিচিতি ও ডেজিগনেশন পরিচালনা করুন।</p>
                </div>
                <button
                  onClick={() => setEditingAuthor({
                    name: '',
                    role: 'Special Correspondent',
                    email: '',
                    bio_bn: '',
                    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'
                  })}
                  className="flex items-center gap-2 bg-[#246BFD] hover:bg-blue-600 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-xs transition-colors self-start sm:self-auto"
                >
                  <PlusCircle className="h-4 w-4" />
                  <span>Add Author (নতুন লেখক যুক্ত করুন)</span>
                </button>
              </div>

              {editingAuthor && (
                <form onSubmit={handleSaveAuthor} className="bg-white p-6 rounded-2xl border border-blue-200 shadow-xl space-y-5">
                  <div className="flex items-center justify-between border-b pb-3">
                    <div>
                      <h3 className="font-bold text-base text-slate-900">
                        {editingAuthor.id ? 'লেখক / সাংবাদিক প্রোফাইল সম্পাদনা' : 'নতুন লেখক / সাংবাদিক যোগ করুন'}
                      </h3>
                      <p className="text-xs text-slate-500">
                        মোবাইল গ্যালারি থেকে সরাসরি ছবি আপলোড করুন এবং তথ্য পূরণ করুন।
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setEditingAuthor(null)}
                      className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>

                  {/* Author Photo / Avatar Section with Mobile Gallery Upload */}
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-center gap-5">
                    {/* Avatar Circular Preview */}
                    <div className="relative group shrink-0">
                      <div className="h-24 w-24 rounded-full overflow-hidden border-2 border-blue-500 shadow-md bg-white flex items-center justify-center">
                        {editingAuthor.avatar ? (
                          <img
                            src={editingAuthor.avatar}
                            alt={editingAuthor.name || 'Author'}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex flex-col items-center justify-center text-slate-400">
                            <Users className="h-8 w-8" />
                            <span className="text-[9px] mt-1">ছবি নেই</span>
                          </div>
                        )}
                      </div>

                      <label
                        htmlFor="author-avatar-upload"
                        className="absolute bottom-0 right-0 bg-[#246BFD] hover:bg-blue-600 text-white p-2 rounded-full shadow-lg cursor-pointer transition-transform hover:scale-105"
                        title="গ্যালারি থেকে ছবি নির্বাচন করুন"
                      >
                        <Camera className="h-4 w-4" />
                        <input
                          id="author-avatar-upload"
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            try {
                              const compressed = await compressImage(file, 400, 400, 0.85);
                              setEditingAuthor({ ...editingAuthor, avatar: compressed });
                              showToast('গ্যালারি থেকে ছবি সফলভাবে যুক্ত হয়েছে!');
                            } catch (err) {
                              const reader = new FileReader();
                              reader.onload = () => {
                                setEditingAuthor({ ...editingAuthor, avatar: reader.result as string });
                                showToast('ছবি যুক্ত হয়েছে!');
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                      </label>
                    </div>

                    <div className="flex-1 space-y-2.5 text-center sm:text-left w-full">
                      <div className="flex flex-wrap items-center gap-2 justify-center sm:justify-start">
                        <label
                          htmlFor="author-avatar-upload-btn"
                          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#246BFD] hover:bg-blue-600 text-white text-xs font-bold cursor-pointer shadow-xs transition-colors"
                        >
                          <Upload className="h-3.5 w-3.5" />
                          <span>মোবাইল গ্যালারি থেকে ছবি আপলোড</span>
                          <input
                            id="author-avatar-upload-btn"
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              try {
                                const compressed = await compressImage(file, 400, 400, 0.85);
                                setEditingAuthor({ ...editingAuthor, avatar: compressed });
                                showToast('গ্যালারি থেকে ছবি সফলভাবে যুক্ত হয়েছে!');
                              } catch (err) {
                                const reader = new FileReader();
                                reader.onload = () => {
                                  setEditingAuthor({ ...editingAuthor, avatar: reader.result as string });
                                  showToast('ছবি যুক্ত হয়েছে!');
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                          />
                        </label>

                        {editingAuthor.avatar && (
                          <button
                            type="button"
                            onClick={() => setEditingAuthor({ ...editingAuthor, avatar: '' })}
                            className="px-2.5 py-2 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 text-xs font-medium"
                          >
                            ছবি মুছুন
                          </button>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <input
                          type="url"
                          placeholder="অথবা ছবির সরাসরি লিঙ্ক (URL) পেস্ট করুন..."
                          value={editingAuthor.avatar || ''}
                          onChange={(e) => setEditingAuthor({ ...editingAuthor, avatar: e.target.value })}
                          className="w-full rounded border border-slate-300 px-3 py-1.5 text-xs text-slate-800 bg-white"
                        />
                      </div>

                      {/* Preset avatar suggestions */}
                      <div className="flex flex-wrap items-center gap-2 pt-0.5 justify-center sm:justify-start">
                        <span className="text-[11px] text-slate-500 font-medium">প্রিসেট অবতার:</span>
                        {[
                          { label: 'পুরুষ প্রতিবেদক ১', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80' },
                          { label: 'পুরুষ প্রতিবেদক ২', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80' },
                          { label: 'নারী প্রতিবেদক', url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&q=80' },
                          { label: 'ক্রীড়া প্রতিবেদক', url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80' }
                        ].map((preset, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setEditingAuthor({ ...editingAuthor, avatar: preset.url })}
                            className="text-[10px] px-2 py-0.5 rounded bg-white hover:bg-blue-50 border border-slate-200 text-slate-700"
                          >
                            {preset.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        লেখকের নাম (Author Name) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="যেমন: রফিকুল ইসলাম (Rafiqul Islam)"
                        required
                        value={editingAuthor.name || ''}
                        onChange={e => setEditingAuthor({ ...editingAuthor, name: e.target.value })}
                        className="w-full rounded-lg border border-slate-300 p-2.5 text-xs text-slate-900 focus:border-blue-500 bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        পদবী / ভূমিকা (Role)
                      </label>
                      <input
                        type="text"
                        placeholder="যেমন: Special Correspondent / প্রধান প্রতিবেদক"
                        value={editingAuthor.role || ''}
                        onChange={e => setEditingAuthor({ ...editingAuthor, role: e.target.value })}
                        className="w-full rounded-lg border border-slate-300 p-2.5 text-xs text-slate-900 focus:border-blue-500 bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        ইমেইল (Email)
                      </label>
                      <input
                        type="email"
                        placeholder="author@primenewsgraph.com"
                        value={editingAuthor.email || ''}
                        onChange={e => setEditingAuthor({ ...editingAuthor, email: e.target.value })}
                        className="w-full rounded-lg border border-slate-300 p-2.5 text-xs text-slate-900 focus:border-blue-500 bg-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      পরিচিতি / বায়োগ্রাফি (Bio)
                    </label>
                    <textarea
                      rows={3}
                      placeholder="লেখকের সাংবাদিকতার অভিজ্ঞতা বা সংক্ষিপ্ত পরিচিতি লিখুন..."
                      value={editingAuthor.bio_bn || ''}
                      onChange={e => setEditingAuthor({ ...editingAuthor, bio_bn: e.target.value })}
                      className="w-full rounded-lg border border-slate-300 p-2.5 text-xs text-slate-900 focus:border-blue-500 bg-white"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2 border-t">
                    <button
                      type="button"
                      onClick={() => setEditingAuthor(null)}
                      className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      বাতিল
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 bg-[#246BFD] hover:bg-blue-600 text-white text-xs font-bold rounded-lg shadow-xs"
                    >
                      লেখক সংরক্ষণ করুন
                    </button>
                  </div>
                </form>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {authors.map(a => (
                  <div key={a.id} className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs text-center flex flex-col justify-between hover:border-blue-300 transition-colors">
                    <div>
                      <img
                        src={a.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'}
                        alt={a.name}
                        loading="lazy"
                        className="h-16 w-16 rounded-full mx-auto object-cover border-2 border-slate-200 mb-3 shadow-2xs"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80';
                        }}
                      />
                      <h4 className="text-sm font-bold text-slate-900">{a.name}</h4>
                      <p className="text-xs text-[#246BFD] font-medium mt-0.5">{a.role}</p>
                      <p className="mt-2 text-[11px] text-slate-500 line-clamp-2 leading-relaxed">{a.bio_bn || 'প্রাইম নিউজ গ্রাফের নিয়মিত সাংবাদিক ও লেখক।'}</p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-slate-100 flex justify-center items-center gap-3">
                      <button
                        onClick={() => setEditingAuthor(a)}
                        className="text-xs text-blue-600 font-bold hover:underline"
                      >
                        এডিট
                      </button>
                      <span className="text-slate-300">·</span>
                      <button
                        onClick={() => handleDeleteAuthor(a.id)}
                        className="text-xs text-red-600 font-bold hover:underline"
                      >
                        ডিলিট
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}


          {/* TAB 11: COMMENTS MODERATION */}
          {activeTab === 'comments' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold font-serif text-slate-900">Reader Comments Moderation</h2>
                <p className="text-xs text-slate-500">Approve, moderate, or purge submitted comments across published articles.</p>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase">
                    <tr>
                      <th className="py-3 px-4">Author</th>
                      <th className="py-3 px-4">Comment</th>
                      <th className="py-3 px-4">Article</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Moderate</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {comments.map(c => (
                      <tr key={c.id}>
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900">{c.author_name}</div>
                          <div className="text-[10px] text-slate-400">{c.author_email}</div>
                        </td>
                        <td className="py-3 px-4 text-slate-700 max-w-xs">{c.content}</td>
                        <td className="py-3 px-4 text-slate-500 text-[11px] max-w-xs truncate">{c.article_title || c.article_id}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${c.status === 'approved' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                            {c.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {c.status !== 'approved' && (
                              <button onClick={() => handleUpdateCommentStatus(c.id, 'approved')} className="text-emerald-600 font-bold hover:underline">Approve</button>
                            )}
                            <button onClick={() => handleDeleteComment(c.id)} className="text-red-500 font-bold hover:underline">Delete</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 12: NEWSLETTER SUBSCRIBERS */}
          {activeTab === 'subscribers' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold font-serif text-slate-900">Newsletter Subscribers</h2>
                  <p className="text-xs text-slate-500">Active email subscribers list and CSV export for newsletter broadcasts.</p>
                </div>
                <button
                  onClick={handleExportSubscribersCSV}
                  className="flex items-center gap-2 bg-[#059669] hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-xs font-bold"
                >
                  <Download className="h-4 w-4" />
                  <span>Export CSV</span>
                </button>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase">
                    <tr>
                      <th className="py-3 px-4">Email Address</th>
                      <th className="py-3 px-4">Subscription Date</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {subscribers.map(s => (
                      <tr key={s.id}>
                        <td className="py-3 px-4 font-mono font-bold text-slate-900">{s.email}</td>
                        <td className="py-3 px-4 text-slate-500">{new Date(s.created_at).toLocaleDateString()}</td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            {s.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button onClick={() => handleDeleteSubscriber(s.id)} className="text-red-500 hover:text-red-700 font-semibold">
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 13: WEB PUSH NOTIFICATIONS & NEWS ALERTS */}
          {activeTab === 'push_notifications' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold font-serif text-slate-900 flex items-center gap-2">
                    <Bell className="h-6 w-6 text-[#246BFD]" />
                    <span>Web Push Alerts & Notification Management (নিউজ এলার্ট সেন্টার)</span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    প্রথম আলোর মতো রিয়েল-টাইম পুশ এলার্ট সিস্টেম: নতুন কোনো পোস্ট প্রকাশের সাথে সাথেই গ্রাহকদের মোবাইলে নোটিফিকেশন পৌঁছে যাবে।
                  </p>
                </div>

                <button
                  type="button"
                  onClick={async () => {
                    const res = await notificationService.requestPermission();
                    if (res.granted) {
                      await notificationService.showLocalNotification({
                        title: 'টেস্ট নোটিফিকেশন - PRIME NEWS GRAPH',
                        body: 'আপনার ডিভাইসে পুশ নোটিফিকেশন ১০০% সক্রিয় রয়েছে!',
                        url: '/'
                      });
                      showToast('টেস্ট নোটিফিকেশন সফলভাবে পাঠানো হয়েছে!');
                    } else {
                      alert('ব্রাউজারে নোটিফিকেশন পারমিশন ব্লক করা আছে। ব্রাউজার সেটিংসে গিয়ে পারমিশন চালু করুন।');
                    }
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-xs"
                >
                  <Bell className="w-4 h-4 text-amber-400" />
                  <span>ডিভাইসে টেস্ট নোটিফিকেশন চেক করুন</span>
                </button>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">মোট পুশ গ্রাহক (Total Subscribers)</div>
                  <div className="text-3xl font-bold font-serif text-[#246BFD] mt-2">{pushStats.totalSubscribers.toLocaleString()}</div>
                  <div className="text-xs text-emerald-600 mt-1 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping inline-block" />
                    <span>সক্রিয় এবং নোটিফিকেশন গ্রহণের জন্য প্রস্তুত</span>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">আজকের সক্রিয় ডিভাইস (Active Today)</div>
                  <div className="text-3xl font-bold font-serif text-slate-900 mt-2">{pushStats.activeToday.toLocaleString()}</div>
                  <div className="text-xs text-slate-500 mt-1">মোবাইল ব্রাউজার ও ডেস্কটপ ভিজিটর</div>
                </div>

                <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">অটো-পুশ স্ট্যাটাস (Auto-Push on Publish)</div>
                  <div className="text-xl font-bold text-emerald-600 mt-2 flex items-center gap-1.5">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    <span>সক্রিয় (Active)</span>
                  </div>
                  <div className="text-xs text-slate-500 mt-1">প্রতিটি নতুন পোস্ট স্বয়ংক্রিয়ভাবে ব্রডকাস্ট হয়</div>
                </div>
              </div>

              {/* Instant Custom Breaking Alert Sender */}
              <div className="bg-white p-6 sm:p-7 rounded-xl border border-slate-200 shadow-xs space-y-4">
                <div className="border-b border-slate-100 pb-3">
                  <h3 className="font-serif font-bold text-base text-slate-900">
                    তাৎক্ষণিক ব্রেকিং নিউজ নোটিফিকেশন পাঠান (Broadcast Instant Breaking News Alert)
                  </h3>
                  <p className="text-xs text-slate-500">
                    এখানে যে শিরোনাম ও বিবরণ লিখে পাঠাবেন, সাথে সাথেই সকল মোবাইল ইউজারদের স্ক্রিনে পপআপ নোটিফিকেশন পৌঁছে যাবে।
                  </p>
                </div>

                <form onSubmit={handleSendCustomPush} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      নোটিফিকেশন শিরোনাম (Title) *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="যেমন: ব্রেকিং: ঢাকায় তীব্র যানজট নিরসনে নতুন নির্দেশনা জারি..."
                      value={customPushTitle}
                      onChange={e => setCustomPushTitle(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#246BFD]"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                        সংক্ষিপ্ত বিবরণ (Body Text)
                      </label>
                      <input
                        type="text"
                        placeholder="বিস্তারিত পড়তে এখানে ট্যাপ করুন..."
                        value={customPushBody}
                        onChange={e => setCustomPushBody(e.target.value)}
                        className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#246BFD]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                        টার্গেট লিঙ্ক বা ইউআরএল (Target URL)
                      </label>
                      <input
                        type="text"
                        placeholder="/news/slug-name বা /"
                        value={customPushUrl}
                        onChange={e => setCustomPushUrl(e.target.value)}
                        className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#246BFD]"
                      />
                    </div>
                  </div>

                  <div className="pt-2 flex items-center justify-end">
                    <button
                      type="submit"
                      disabled={sendingPush}
                      className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#246BFD] hover:bg-blue-600 active:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-md transition-all active:scale-95 disabled:opacity-50"
                    >
                      <Send className="w-4 h-4" />
                      <span>{sendingPush ? 'পাঠানো হচ্ছে...' : 'সকল ইউজারের মোবাইলে পুশ নোটিফিকেশন পাঠান'}</span>
                    </button>
                  </div>
                </form>
              </div>

              {/* Notification History */}
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
                <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                  <h3 className="font-serif font-bold text-sm text-slate-900">
                    সাম্প্রতিক পাঠানো নোটিফিকেশনের তালিকা (Recent Push History)
                  </h3>
                  <span className="text-[11px] text-slate-500 font-medium">রিয়েল-টাইম ডেলিভারি হিস্ট্রি</span>
                </div>

                <div className="divide-y divide-slate-100">
                  {pushHistory.map(item => (
                    <div key={item.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 transition-colors">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-50 text-[#246BFD] flex items-center justify-center shrink-0 mt-0.5">
                          <Bell className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-slate-900">{item.title}</h4>
                          <p className="text-[11px] text-slate-500 mt-0.5">{item.body}</p>
                          <span className="inline-block text-[10px] text-slate-400 font-mono mt-1">
                            URL: {item.url}
                          </span>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {item.deliveredCount} ডিভাইসে ডেলিভার্ড
                        </span>
                        <div className="text-[10px] text-slate-400 mt-1">
                          {new Date(item.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(item.sentAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 14: SEO SETTINGS */}
          {activeTab === 'seo' && (
            <div className="max-w-3xl space-y-6">
              <div>
                <h2 className="text-2xl font-bold font-serif text-slate-900">SEO & Social Sharing Settings</h2>
                <p className="text-xs text-slate-500">Manage OpenGraph metadata, Google Webmaster tools, and search engine directives.</p>
              </div>

              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs space-y-4">
                <div className="rounded-lg bg-blue-50 border border-blue-200 p-4 text-xs text-blue-900">
                  <div className="font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4 text-[#246BFD]" />
                    <span>Facebook OpenGraph Crawler Prerendering Active</span>
                  </div>
                  <p className="mt-1">
                    Server-rendered social preview tags are enabled for Facebookbot, WhatsApp, Twitterbot, and Googlebot at <code className="bg-blue-100 px-1 rounded">/news/:slug</code>.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Dynamic XML Sitemap</label>
                  <div className="flex items-center gap-2 font-mono text-xs bg-slate-100 p-2.5 rounded border border-slate-200">
                    <span className="text-[#246BFD] flex-1">/sitemap.xml</span>
                    <a href="/sitemap.xml" target="_blank" className="text-xs font-bold text-slate-700 hover:underline">Open Sitemap &rarr;</a>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Robots.txt Directive</label>
                  <div className="flex items-center gap-2 font-mono text-xs bg-slate-100 p-2.5 rounded border border-slate-200">
                    <span className="text-[#246BFD] flex-1">/robots.txt</span>
                    <a href="/robots.txt" target="_blank" className="text-xs font-bold text-slate-700 hover:underline">View Robots.txt &rarr;</a>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 14: SOCIAL MEDIA SETTINGS */}
          {activeTab === 'social' && (
            <div className="max-w-3xl space-y-6">
              <div>
                <h2 className="text-2xl font-bold font-serif text-slate-900">Social Media Channels</h2>
                <p className="text-xs text-slate-500">Configure official newsroom channels and broadcasting profiles.</p>
              </div>

              {settings && (
                <form onSubmit={handleSaveSettings} className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Facebook Page</label>
                      <input
                        type="text"
                        value={settings.facebook_url}
                        onChange={e => setSettings({ ...settings, facebook_url: e.target.value })}
                        className="w-full rounded border border-slate-300 p-2 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">YouTube Channel</label>
                      <input
                        type="text"
                        value={settings.youtube_url}
                        onChange={e => setSettings({ ...settings, youtube_url: e.target.value })}
                        className="w-full rounded border border-slate-300 p-2 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Telegram Channel / Group</label>
                      <input
                        type="text"
                        value={settings.telegram_url || ''}
                        onChange={e => setSettings({ ...settings, telegram_url: e.target.value })}
                        placeholder="https://t.me/primenewsgraph"
                        className="w-full rounded border border-slate-300 p-2 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">TikTok Official Profile</label>
                      <input
                        type="text"
                        value={settings.tiktok_url || ''}
                        onChange={e => setSettings({ ...settings, tiktok_url: e.target.value })}
                        placeholder="https://tiktok.com/@primenewsgraph"
                        className="w-full rounded border border-slate-300 p-2 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Instagram Profile</label>
                      <input
                        type="text"
                        value={settings.instagram_url || ''}
                        onChange={e => setSettings({ ...settings, instagram_url: e.target.value })}
                        placeholder="https://instagram.com/primenewsgraph"
                        className="w-full rounded border border-slate-300 p-2 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">X (Twitter) Profile</label>
                      <input
                        type="text"
                        value={settings.twitter_url}
                        onChange={e => setSettings({ ...settings, twitter_url: e.target.value })}
                        className="w-full rounded border border-slate-300 p-2 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">WhatsApp Broadcast Number</label>
                      <input
                        type="text"
                        value={settings.whatsapp_number}
                        onChange={e => setSettings({ ...settings, whatsapp_number: e.target.value })}
                        className="w-full rounded border border-slate-300 p-2 text-xs"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end pt-2">
                    <button type="submit" className="px-5 py-2 rounded bg-[#246BFD] text-white text-xs font-bold">
                      Save Social Settings
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* TAB 15: HOMEPAGE SETTINGS */}
          {activeTab === 'homepage' && (
            <div className="max-w-3xl space-y-6">
              <div>
                <h2 className="text-2xl font-bold font-serif text-slate-900">Homepage Sections Control</h2>
                <p className="text-xs text-slate-500">Toggle public visibility of editorial blocks on the front page.</p>
              </div>

              {settings && (
                <form onSubmit={handleSaveSettings} className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs space-y-4">
                  <div className="space-y-3">
                    {Object.entries(settings.homepage_sections).map(([key, enabled]) => (
                      <label key={key} className="flex items-center justify-between p-3 rounded-lg border border-slate-100 hover:bg-slate-50 cursor-pointer">
                        <span className="text-xs font-bold text-slate-800 capitalize">{key.replace('_', ' ')} Section</span>
                        <input
                          type="checkbox"
                          checked={enabled}
                          onChange={e => setSettings({
                            ...settings,
                            homepage_sections: {
                              ...settings.homepage_sections,
                              [key]: e.target.checked
                            }
                          })}
                          className="h-4 w-4 rounded text-[#246BFD]"
                        />
                      </label>
                    ))}
                  </div>
                  <div className="flex justify-end pt-2">
                    <button type="submit" className="px-5 py-2 rounded bg-[#246BFD] text-white text-xs font-bold">
                      Update Sections
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* TAB 16: MENU MANAGEMENT */}
          {activeTab === 'menus' && (
            <div className="max-w-3xl space-y-6">
              <div>
                <h2 className="text-2xl font-bold font-serif text-slate-900">Navigation Menus Management</h2>
                <p className="text-xs text-slate-500">Primary header categories order and footer navigation items.</p>
              </div>

              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs space-y-4">
                <div className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Header Active Categories ({categories.length})
                </div>
                <div className="space-y-2">
                  {categories.map((c, i) => (
                    <div key={c.id} className="flex items-center justify-between p-2.5 rounded bg-slate-50 border border-slate-200 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-slate-400">0{i + 1}</span>
                        <span className="font-bold text-slate-800">{c.name_bn}</span>
                        <span className="text-slate-500">({c.name_en})</span>
                      </div>
                      <span className="font-mono text-slate-400">/category/{c.slug}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 17: WEBSITE SETTINGS */}
          {activeTab === 'website_settings' && (
            <div className="max-w-3xl space-y-6">
              <div>
                <h2 className="text-2xl font-bold font-serif text-slate-900">Website Global Settings</h2>
                <p className="text-xs text-slate-500">Branding, editorial slogans, default language, and contact credentials.</p>
              </div>

              {settings && (
                <form onSubmit={handleSaveSettings} className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs space-y-4">
                  {/* Website Logo & Branding (Channel 24 Style or Custom Image) */}
                  <div className="p-5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
                      <div>
                        <label className="block text-sm font-bold text-slate-900">
                          Website Logo &amp; Header Branding
                        </label>
                        <p className="text-xs text-slate-500">
                          Upload your newsroom logo file, enter an image URL, or customize the Channel 24 style live brand badge.
                        </p>
                      </div>
                      
                      {/* Live Header Preview */}
                      <div className="bg-[#0A1324] px-3 py-1.5 rounded-lg border border-slate-700 flex items-center gap-2">
                        <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Live Preview:</span>
                        {settings.logo_image_url ? (
                          <img src={settings.logo_image_url} alt="Logo" className="h-6 w-auto object-contain rounded" />
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <div className="relative flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-[#E11D48] via-[#DC2626] to-[#991B1B] text-white font-black text-[10px]">
                              <span>{settings.logo_badge_text || '24'}</span>
                            </div>
                            <span className="text-xs font-black font-serif text-white tracking-wider uppercase">
                              {settings.logo_text || 'PRIME'}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Direct Image File Upload */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Upload Logo File (PNG / JPG / SVG / WEBP)
                        </label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={e => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onload = () => {
                                setSettings({ ...settings, logo_image_url: reader.result as string });
                                showToast('Logo image uploaded. Click Save Website Settings to apply.');
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                          className="w-full text-xs text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-[#246BFD] file:text-white hover:file:bg-blue-600 cursor-pointer"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Or Enter Logo Direct URL
                        </label>
                        <input
                          type="url"
                          value={settings.logo_image_url || ''}
                          onChange={e => setSettings({ ...settings, logo_image_url: e.target.value })}
                          placeholder="https://example.com/logo.png"
                          className="w-full rounded border border-slate-300 p-2 text-xs"
                        />
                      </div>
                    </div>

                    {settings.logo_image_url && (
                      <div className="flex items-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            setSettings({ ...settings, logo_image_url: '' });
                            showToast('Switched to Channel 24 dynamic badge.');
                          }}
                          className="text-xs text-red-600 hover:text-red-700 font-semibold underline cursor-pointer"
                        >
                          Remove Image &amp; Use Channel 24 Style Badge
                        </button>
                      </div>
                    )}

                    {/* Channel 24 Style Badge Settings */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-200/80">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Circular Badge Text / Number (Channel 24 Style)
                        </label>
                        <input
                          type="text"
                          value={settings.logo_badge_text || '24'}
                          onChange={e => setSettings({ ...settings, logo_badge_text: e.target.value })}
                          placeholder="e.g. 24 or PNG"
                          maxLength={6}
                          className="w-full rounded border border-slate-300 p-2 text-xs font-bold"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Brand Slogan / Wordmark
                        </label>
                        <input
                          type="text"
                          value={settings.logo_text || 'PRIME'}
                          onChange={e => setSettings({ ...settings, logo_text: e.target.value })}
                          placeholder="e.g. PRIME or PRIME NEWS"
                          className="w-full rounded border border-slate-300 p-2 text-xs font-bold"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Public View Count Privacy Control */}
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-slate-900">Public Post View Count Privacy</div>
                      <div className="text-[11px] text-slate-500">Hide post view counts from public visitors on the frontend (View counts will remain visible exclusively in this Admin Dashboard).</div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!settings.show_views_publicly}
                        onChange={e => setSettings({ ...settings, show_views_publicly: !e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#246BFD]"></div>
                    </label>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Website Name</label>
                      <input
                        type="text"
                        value={settings.site_name}
                        onChange={e => setSettings({ ...settings, site_name: e.target.value })}
                        className="w-full rounded border border-slate-300 p-2 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Logo Text Brand</label>
                      <input
                        type="text"
                        value={settings.logo_text}
                        onChange={e => setSettings({ ...settings, logo_text: e.target.value })}
                        className="w-full rounded border border-slate-300 p-2 text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Editorial Slogan (Bengali)</label>
                    <input
                      type="text"
                      value={settings.site_tagline_bn}
                      onChange={e => setSettings({ ...settings, site_tagline_bn: e.target.value })}
                      className="w-full rounded border border-slate-300 p-2 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Editorial Slogan (English)</label>
                    <input
                      type="text"
                      value={settings.site_tagline_en}
                      onChange={e => setSettings({ ...settings, site_tagline_en: e.target.value })}
                      className="w-full rounded border border-slate-300 p-2 text-xs"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Newsroom Contact Email</label>
                      <input
                        type="email"
                        value={settings.contact_email}
                        onChange={e => setSettings({ ...settings, contact_email: e.target.value })}
                        className="w-full rounded border border-slate-300 p-2 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Newsroom Phone Hotline</label>
                      <input
                        type="text"
                        value={settings.contact_phone}
                        onChange={e => setSettings({ ...settings, contact_phone: e.target.value })}
                        className="w-full rounded border border-slate-300 p-2 text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Bureau Address</label>
                    <input
                      type="text"
                      value={settings.contact_address}
                      onChange={e => setSettings({ ...settings, contact_address: e.target.value })}
                      className="w-full rounded border border-slate-300 p-2 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Copyright Statement</label>
                    <input
                      type="text"
                      value={settings.copyright_text}
                      onChange={e => setSettings({ ...settings, copyright_text: e.target.value })}
                      className="w-full rounded border border-slate-300 p-2 text-xs"
                    />
                  </div>

                  <div className="flex justify-end pt-2">
                    <button type="submit" className="px-5 py-2 rounded bg-[#246BFD] text-white text-xs font-bold">
                      Save Website Settings
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* TAB 18: ADMIN USERS */}
          {activeTab === 'admin_users' && (
            <div className="max-w-3xl space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold font-serif text-slate-900">Admin Control & Permissions</h2>
                  <p className="text-xs text-slate-500">Owner-only administrative privileges and authentication enforcement.</p>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                  Public Registration Disabled
                </span>
              </div>

              <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200 text-xs text-blue-900 flex items-start gap-3">
                <ShieldAlert className="h-5 w-5 text-[#246BFD] shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Strict Ownership Policy Enforced</p>
                  <p className="text-blue-700 mt-0.5 leading-relaxed">
                    Only the designated owner account (<code className="font-mono font-bold">amazonshopping14264@gmail.com</code>) is authorized to control the PRIME NEWS GRAPH platform, publish or delete articles, configure advertisements, and modify system settings. All visitor registration attempts are blocked at the database level.
                  </p>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase">
                    <tr>
                      <th className="py-3 px-4">Authorized Admin</th>
                      <th className="py-3 px-4">Official Email</th>
                      <th className="py-3 px-4">Privilege Level</th>
                      <th className="py-3 px-4">2FA Status</th>
                      <th className="py-3 px-4">Last Activity</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {adminUsers.map(u => (
                      <tr key={u.id} className="hover:bg-slate-50/50">
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900 flex items-center gap-1.5">
                            <span>{u.username}</span>
                            <span className="px-1.5 py-0.2 rounded bg-amber-500 text-slate-950 font-bold text-[9px]">OWNER</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-slate-600 font-mono text-[11px]">{u.email}</td>
                        <td className="py-3.5 px-4">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-blue-100 text-[#246BFD]">
                            {u.role}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700">
                            <Check className="h-3 w-3" />
                            {u.two_factor_enabled ? 'Enforced' : 'Active'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px]">
                          {u.last_login ? new Date(u.last_login).toLocaleString() : 'Active Now'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 19: SECURITY SETTINGS */}
          {activeTab === 'security' && (
            <div className="max-w-3xl space-y-6">
              <div>
                <h2 className="text-2xl font-bold font-serif text-slate-900">Maximum Admin Security & Audit Center</h2>
                <p className="text-xs text-slate-500">PBKDF2-SHA512 password management, 2FA recovery codes, session revocation, and real-time audit logs.</p>
              </div>

              {/* Security Health Metrics */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Password Cipher</div>
                  <div className="text-sm font-bold text-slate-900 mt-1">PBKDF2-SHA512</div>
                  <div className="text-[10px] text-emerald-600 mt-0.5">100,000 Iterations + Salt</div>
                </div>
                <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Dual-Factor (2FA)</div>
                  <div className="text-sm font-bold text-slate-900 mt-1">ENFORCED</div>
                  <div className="text-[10px] text-emerald-600 mt-0.5">6-Digit TOTP / Code</div>
                </div>
                <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Rate Limiting</div>
                  <div className="text-sm font-bold text-slate-900 mt-1">5 Tries / 15m Lock</div>
                  <div className="text-[10px] text-emerald-600 mt-0.5">Active IP Shield</div>
                </div>
                <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Session Expiry</div>
                  <div className="text-sm font-bold text-slate-900 mt-1">2h Inactivity</div>
                  <div className="text-[10px] text-blue-600 mt-0.5">Auto-Revocation</div>
                </div>
              </div>

              {/* 0. Dedicated Firebase Cloud Authentication & Firestore Security */}
              <div className="bg-white p-6 rounded-xl border border-blue-200 shadow-2xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="h-6 w-6 rounded-lg bg-blue-50 text-[#246BFD] flex items-center justify-center font-bold text-xs border border-blue-100">
                      🔥
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-slate-900">Firebase Cloud Authentication &amp; Firestore RBAC</h3>
                      <p className="text-[11px] text-slate-500">Live password management and Firestore administrative role enforcement</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                    Primary Auth Provider
                  </span>
                </div>

                {/* Status Badges */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 bg-slate-50 p-3 rounded-lg border border-slate-200/80 text-xs">
                  <div>
                    <span className="text-[10px] font-bold uppercase text-slate-400 block">Owner Email</span>
                    <span className="font-mono text-slate-800 font-semibold text-[11px]">{AUTHORIZED_OWNER_EMAIL}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase text-slate-400 block">Firebase Project</span>
                    <span className="font-mono text-blue-700 font-semibold text-[11px]">primenewsgraph-7466f</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase text-slate-400 block">Firestore Database</span>
                    <span className="font-mono text-slate-700 font-semibold text-[11px]">(default)</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase text-slate-400 block">Server API Bridge</span>
                    <span className="font-mono text-emerald-700 font-semibold text-[11px]">/api/auth/firebase-verify</span>
                  </div>
                </div>

                <form onSubmit={handleFirebaseUpdatePassword} className="space-y-3">
                  <div className="text-xs font-bold text-slate-800">
                    Update Firebase Account Password
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Current Firebase Password (for security verification)
                    </label>
                    <input
                      type="password"
                      value={fbCurrentPassword}
                      onChange={e => setFbCurrentPassword(e.target.value)}
                      placeholder="Enter existing Firebase password"
                      className="w-full rounded border border-slate-300 p-2 text-xs"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        New Firebase Password (min 8 chars)
                      </label>
                      <input
                        type="password"
                        value={fbNewPassword}
                        onChange={e => setFbNewPassword(e.target.value)}
                        placeholder="Enter new Firebase password"
                        required
                        className="w-full rounded border border-slate-300 p-2 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Confirm New Firebase Password
                      </label>
                      <input
                        type="password"
                        value={fbConfirmNewPassword}
                        onChange={e => setFbConfirmNewPassword(e.target.value)}
                        placeholder="Confirm new Firebase password"
                        required
                        className="w-full rounded border border-slate-300 p-2 text-xs"
                      />
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
                    <button
                      type="button"
                      onClick={handleSendFirebaseResetFromSettings}
                      disabled={fbResetLinkLoading}
                      className="px-3 py-2 rounded border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
                    >
                      {fbResetLinkLoading ? 'Sending Reset Email...' : 'Send Password Reset Email to Owner'}
                    </button>
                    <button
                      type="submit"
                      disabled={fbChangeLoading}
                      className="px-4 py-2 rounded bg-[#246BFD] hover:bg-blue-600 text-white text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
                    >
                      {fbChangeLoading ? 'Updating Firebase Password...' : 'Save New Firebase Password'}
                    </button>
                  </div>
                </form>
              </div>

              {/* 1. Change Master Password Form */}
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <Lock className="h-4 w-4 text-[#246BFD]" />
                    <h3 className="font-bold text-sm text-slate-900">Change Master Administrator Password</h3>
                  </div>
                  <span className="text-[11px] text-slate-400">Requires current password confirmation</span>
                </div>

                <form onSubmit={handleChangePassword} className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Current Master Password
                    </label>
                    <input
                      type="password"
                      value={changeCurrPassword}
                      onChange={e => setChangeCurrPassword(e.target.value)}
                      placeholder="Enter existing password"
                      required
                      className="w-full rounded border border-slate-300 p-2 text-xs"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        New Master Password (min 8 chars)
                      </label>
                      <input
                        type="password"
                        value={changeNewPassword}
                        onChange={e => setChangeNewPassword(e.target.value)}
                        placeholder="New strong password"
                        required
                        className="w-full rounded border border-slate-300 p-2 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Confirm New Master Password
                      </label>
                      <input
                        type="password"
                        value={changeConfirmPassword}
                        onChange={e => setChangeConfirmPassword(e.target.value)}
                        placeholder="Re-type new password"
                        required
                        className="w-full rounded border border-slate-300 p-2 text-xs"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      disabled={changeLoading}
                      className="px-4 py-2 rounded bg-[#246BFD] hover:bg-blue-600 text-white text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
                    >
                      {changeLoading ? 'Updating Password...' : 'Update Password & Invalidate Other Sessions'}
                    </button>
                  </div>
                </form>
              </div>

              {/* 2. Emergency Recovery Codes & Active Sessions */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Emergency Recovery Codes */}
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                      <ShieldAlert className="h-4 w-4 text-amber-500" />
                      Emergency Recovery Codes
                    </h4>
                    <span className="text-[10px] text-slate-400">Single-Use</span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Store these emergency recovery codes in a secure location. They allow you to bypass 2FA or reset your password if your phone or device is lost.
                  </p>
                  <div className="bg-slate-50 rounded-lg p-2.5 border border-slate-200 space-y-1 font-mono text-[11px] text-slate-700">
                    {adminUsers[0]?.recovery_codes && adminUsers[0].recovery_codes.length > 0 ? (
                      adminUsers[0].recovery_codes.map((code, idx) => (
                        <div key={idx} className="flex items-center justify-between">
                          <span>{code}</span>
                          <span className="text-[9px] text-emerald-600 font-bold uppercase">Ready</span>
                        </div>
                      ))
                    ) : (
                      <div className="text-slate-400 italic">No codes available or all consumed.</div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={handleRegenerateRecoveryCodes}
                    className="w-full py-2 rounded border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
                  >
                    Regenerate 5 Fresh Recovery Codes
                  </button>
                </div>

                {/* Session Invalidation */}
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-3 flex flex-col justify-between">
                  <div>
                    <h4 className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                      <Lock className="h-4 w-4 text-red-500" />
                      Session Security Lockdown
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-2 leading-relaxed">
                      Suspicious activity detected or logged in from an untrusted public computer? Immediately revoke and terminate all active administrative session tokens across all browsers.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleRevokeSessions}
                    className="w-full py-2.5 rounded bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-2"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    <span>Revoke All Other Active Sessions</span>
                  </button>
                </div>
              </div>

              {/* 3. Live Real-Time Security Audit Logs */}
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                      <BarChart2 className="h-4 w-4 text-[#246BFD]" />
                      Live Administrative Security Audit Logs
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Real-time recording of login attempts, 2FA verifications, lockouts, and mutations.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={loadAuditLogs}
                    className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold transition-colors cursor-pointer"
                  >
                    <RefreshCw className="h-3 w-3" />
                    <span>Refresh Logs</span>
                  </button>
                </div>

                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px]">
                      <tr>
                        <th className="py-2.5 px-3">Event</th>
                        <th className="py-2.5 px-3">Account</th>
                        <th className="py-2.5 px-3">IP Address</th>
                        <th className="py-2.5 px-3">Details</th>
                        <th className="py-2.5 px-3">Time</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                      {auditLogs.length > 0 ? (
                        auditLogs.slice(0, 15).map((log: any) => (
                          <tr key={log.id} className="hover:bg-slate-50/50">
                            <td className="py-2 px-3">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                log.event === 'login_success'
                                  ? 'bg-emerald-100 text-emerald-700'
                                  : log.event === 'login_locked'
                                  ? 'bg-red-100 text-red-700'
                                  : log.event === 'login_failed'
                                  ? 'bg-amber-100 text-amber-700'
                                  : 'bg-blue-100 text-blue-700'
                              }`}>
                                {log.event}
                              </span>
                            </td>
                            <td className="py-2 px-3 text-slate-800 font-bold">{log.username}</td>
                            <td className="py-2 px-3 text-slate-600">{log.ip}</td>
                            <td className="py-2 px-3 text-slate-500 max-w-xs truncate" title={log.details || log.userAgent}>
                              {log.details || log.userAgent}
                            </td>
                            <td className="py-2 px-3 text-slate-400 text-[10px]">
                              {new Date(log.timestamp).toLocaleTimeString()}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5} className="py-4 text-center text-slate-400 italic">
                            No security incidents or login events recorded yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* TAB 20: BACKUP AND EXPORT */}
          {activeTab === 'backup_export' && (
            <div className="max-w-3xl space-y-6">
              <div>
                <h2 className="text-2xl font-bold font-serif text-slate-900">Database Backup & Recovery</h2>
                <p className="text-xs text-slate-500">Download snapshot archives in JSON and PostgreSQL SQL format, or restore from a previous backup.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs space-y-4">
                  <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                    <Download className="h-4 w-4 text-[#246BFD]" />
                    <span>Download Database Backup</span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    Exports all articles, categories, breaking news, advertisements, media references, and settings.
                  </p>
                  <div className="space-y-2 pt-2">
                    <a
                      href="/api/backup/export"
                      download
                      className="w-full flex items-center justify-center gap-2 bg-[#246BFD] hover:bg-blue-600 text-white py-2 rounded text-xs font-bold transition-colors"
                    >
                      <Download className="h-4 w-4" />
                      <span>Download JSON Database</span>
                    </a>
                    <a
                      href="/api/backup/sql"
                      download
                      className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-900 text-white py-2 rounded text-xs font-bold transition-colors"
                    >
                      <Database className="h-4 w-4" />
                      <span>Download PostgreSQL / Supabase SQL</span>
                    </a>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs space-y-4">
                  <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                    <Upload className="h-4 w-4 text-emerald-600" />
                    <span>Restore From Backup JSON</span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    Upload a previously exported JSON backup file to instantly restore database state.
                  </p>
                  <label className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white py-2 rounded text-xs font-bold cursor-pointer transition-colors">
                    <Upload className="h-4 w-4" />
                    <span>Select JSON File & Restore</span>
                    <input type="file" accept=".json" onChange={handleImportBackupFile} className="hidden" />
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* TAB 21: NETLIFY DEPLOYMENT INFORMATION */}
          {activeTab === 'netlify_deploy' && (
            <div className="max-w-4xl space-y-6">
              <div>
                <h2 className="text-2xl font-bold font-serif text-slate-900">Netlify Deployment Center</h2>
                <p className="text-xs text-slate-500">Step-by-step instructions for 100% production Netlify deployment with Supabase PostgreSQL.</p>
              </div>

              <div className="bg-white p-6 sm:p-8 rounded-xl border border-slate-200 shadow-2xs space-y-6">
                <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-900">
                  <div className="font-bold text-sm flex items-center gap-2 mb-1">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    <span>Netlify Deployment Files Ready in Project Root</span>
                  </div>
                  <ul className="list-disc pl-5 mt-2 space-y-1">
                    <li><code className="font-mono font-bold">netlify.toml</code>: Build configuration, bot redirects, and security headers configured.</li>
                    <li><code className="font-mono font-bold">netlify/functions/api.ts</code>: Netlify serverless API handler.</li>
                    <li><code className="font-mono font-bold">supabase-schema.sql</code>: PostgreSQL schema with Row-Level Security (RLS) policies.</li>
                  </ul>
                </div>

                {/* 1-Click ZIP Download Action Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <a
                    href="/prime-news-graph-direct-netlify-drop.zip"
                    download="prime-news-graph-direct-netlify-drop.zip"
                    className="flex flex-col justify-between p-4 rounded-xl border-2 border-[#246BFD] bg-blue-50/60 hover:bg-blue-100/70 transition-colors group cursor-pointer"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="px-2 py-0.5 rounded bg-[#246BFD] text-[10px] font-bold uppercase tracking-wider text-white">
                          Netlify Direct Drop (লাইভ রেডি)
                        </span>
                        <Download className="h-5 w-5 text-[#246BFD] transition-transform group-hover:scale-110" />
                      </div>
                      <h4 className="mt-2 text-sm font-bold text-slate-900">
                        📦 prime-news-graph-direct-netlify-drop.zip
                      </h4>
                      <p className="mt-1 text-xs text-slate-600">
                        সরাসরি Netlify Deploys স্ক্রিনে Drag & Drop করার জন্য তৈরি সম্পূর্ণ প্রোডাকশন প্যাকেজ (index.html, _redirects, এসেটস রুট ফোল্ডারে প্রস্তুত)।
                      </p>
                    </div>
                    <div className="mt-3 text-xs font-bold text-[#246BFD] flex items-center gap-1">
                      <span>এই জিপ ফাইলটি ডাউনলোড করুন &rarr;</span>
                    </div>
                  </a>

                  <a
                    href="/prime-news-graph-full-deployment-package.zip"
                    download="prime-news-graph-github-vercel.zip"
                    className="flex flex-col justify-between p-4 rounded-xl border border-slate-300 bg-slate-50 hover:bg-slate-100 transition-colors group cursor-pointer"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="px-2 py-0.5 rounded bg-slate-900 text-[10px] font-bold uppercase tracking-wider text-white">
                          GitHub & Vercel Clean Package
                        </span>
                        <Download className="h-5 w-5 text-slate-700 transition-transform group-hover:scale-110" />
                      </div>
                      <h4 className="mt-2 text-sm font-bold text-slate-900">
                        📂 prime-news-graph-github-vercel.zip
                      </h4>
                      <p className="mt-1 text-xs text-slate-600">
                        Vercel ও GitHub এর জন্য ১০০% অপ্টিমাইজড ক্লিন সোর্স কোড (vercel.json সহ)। কোনো ভারী ফাইল বা node_modules নেই, ফলে GitHub এ "invalid argument" বা Vercel এ কোনো এরর আসবে না।
                      </p>
                    </div>
                    <div className="mt-3 text-xs font-bold text-slate-700 flex items-center gap-1">
                      <span>GitHub & Vercel জিপ ডাউনলোড করুন &rarr;</span>
                    </div>
                  </a>
                </div>

                <div className="space-y-4 pt-4 border-t border-slate-100">
                  <h3 className="text-base font-bold text-slate-900">Option A: Deploy via GitHub + Netlify (Recommended)</h3>
                  <ol className="list-decimal pl-5 text-xs text-slate-600 space-y-2">
                    <li>Push this repository to your GitHub account.</li>
                    <li>Log in to <strong className="text-slate-900">Netlify</strong> and click <em>"Add new site" &rarr; "Import an existing project"</em>.</li>
                    <li>Select your repository. Netlify will automatically detect <code className="bg-slate-100 px-1 rounded">npm run build</code> and publish directory <code className="bg-slate-100 px-1 rounded">dist</code> from <code className="bg-slate-100 px-1 rounded">netlify.toml</code>.</li>
                    <li>Configure your Supabase Database credentials in Netlify Environment Variables.</li>
                  </ol>
                </div>

                <div className="space-y-4 pt-4 border-t border-slate-100">
                  <h3 className="text-base font-bold text-slate-900">Option B: Netlify Manual Drag & Drop Build</h3>
                  <ol className="list-decimal pl-5 text-xs text-slate-600 space-y-2">
                    <li>Run <code className="bg-slate-100 px-1 rounded font-mono">npm run build</code>.</li>
                    <li>Upload the generated <code className="bg-slate-100 px-1 rounded font-mono">dist</code> folder to the Netlify manual deploy dropzone.</li>
                  </ol>
                </div>

                <div className="space-y-2 pt-4 border-t border-slate-100">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Required Netlify Environment Variables</h4>
                  <div className="bg-slate-900 text-slate-200 p-4 rounded-lg font-mono text-xs space-y-1">
                    <div># Supabase PostgreSQL Integration</div>
                    <div>VITE_SUPABASE_URL="https://your-project.supabase.co"</div>
                    <div>VITE_SUPABASE_ANON_KEY="your-supabase-anon-key"</div>
                    <div>APP_URL="https://your-domain.netlify.app"</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
