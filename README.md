# PRIME NEWS GRAPH — Enterprise Netlify Deployment & Architecture Guide

**PRIME NEWS GRAPH** is an international digital news publishing platform featuring a comprehensive editorial CMS, multi-factor admin security, Adsterra advertising engine, Facebook/WhatsApp OpenGraph social sharing, and Supabase PostgreSQL persistence.

---

## 📦 Direct Source Code Download

You can download the entire complete project ZIP directly from the web server:
- **Download Link:** `/prime-news-graph-full-deployment-package.zip`
- **Full Path:** `https://your-domain/prime-news-graph-full-deployment-package.zip`

This archive includes all source files, configurations, Netlify serverless functions, database migration scripts, assets, and documentation.

---

## 🚀 Step-by-Step Netlify Deployment Guide

### Step 1: Extract the Project
Extract the downloaded ZIP package onto your local computer:
```bash
unzip prime-news-graph-full-deployment-package.zip -d prime-news-graph
cd prime-news-graph
```

### Step 2: Set Up Supabase (PostgreSQL Database)
1. Navigate to [Supabase](https://supabase.com) and create a new project.
2. Open the **SQL Editor** in your Supabase dashboard.
3. Open `supabase-schema.sql` from the project root, paste its entire contents into the SQL Editor, and click **Run**.
4. This will create:
   - Tables: `news_articles`, `news_categories`, `breaking_news`, `advertisements`, `comments`, `newsletter_subscribers`, `videos`, `website_settings`, and `authors`.
   - Complete Row Level Security (RLS) policies for public reading and admin full access.
   - Initial indexes for high-speed slug lookups and tag filtering.
5. In your Supabase Dashboard, go to **Project Settings** → **API** to copy:
   - `Project URL`
   - `anon public` key
   - `service_role` secret key

### Step 3: Push to GitHub
1. Create a new repository on [GitHub](https://github.com) named `prime-news-graph`.
2. Push your project:
```bash
git init
git add .
git commit -m "feat: complete PRIME NEWS GRAPH production release"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/prime-news-graph.git
git push -u origin main
```

### Step 4: Connect to Netlify
1. Log in to [Netlify](https://www.netlify.com).
2. Click **Add new site** → **Import an existing project** → **GitHub**.
3. Select your `prime-news-graph` repository.
4. Netlify will auto-detect settings from `netlify.toml`:
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`
   - **Functions directory:** `netlify/functions`
5. Click **Deploy Site**.

### Step 5: Configure Netlify Environment Variables
In Netlify dashboard under **Site configuration** → **Environment variables**, add:

| Key | Example Value | Description |
|---|---|---|
| `APP_URL` | `https://primenewsgraph.netlify.app` | Canonical site URL for OpenGraph and sitemap |
| `URL` | `https://primenewsgraph.netlify.app` | Netlify standard production URL |
| `NODE_VERSION` | `20` | Node.js runtime version |
| `SUPABASE_URL` | `https://xyzcompany.supabase.co` | Your Supabase project URL |
| `SUPABASE_ANON_KEY` | `eyJhbGciOi...` | Supabase anon public API key |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbGciOi...` | Supabase service-role secret key |
| `ADMIN_INITIAL_USERNAME` | `alamin11gtN` | Owner administrator username |
| `ADMIN_INITIAL_PASSWORD` | `mdalamin11gtN` | Owner administrator password |
| `CAPTCHA_SECRET` | `png_secret_key_2026` | Anti-bot challenge HMAC secret |

Trigger a redeploy after setting the variables.

---

## 🛡️ Administrative Control Panel & Credentials

- **Admin URL:** `https://your-site.com/admin` (or `/admin` on any domain)
- **Initial Super Admin Username:** `amazonshopping14264@gmail.com` (or `alamin11gtN`)
- **Initial Super Admin Password:** `mdalamin11gtN`

### Multi-Factor Authentication Flow:
1. **Step 1:** Enter Username, Password, and solve the dynamic arithmetic anti-bot challenge.
2. **Step 2:** Enter the 6-digit verification code or emergency backup recovery code.
3. The owner session token is saved in secure local storage and verified on every administrative mutation.

---

## 📢 Facebook OpenGraph & Social Sharing

The system features server-side crawler prerendering via Netlify Serverless Function:
- When crawlers (`facebookexternalhit`, `Facebot`, `Twitterbot`, `WhatsApp`, `TelegramBot`, `LinkedInBot`) request `/news/:slug`, Netlify forwards the request directly to `/.netlify/functions/api/news/:slug`.
- The function generates a dedicated HTML document containing:
  - `<meta property="og:title">`
  - `<meta property="og:description">`
  - `<meta property="og:image">` (High resolution 1200x630)
  - `<meta property="og:url">`
  - `<meta name="twitter:card" content="summary_large_image">`
  - Schema.org `NewsArticle` JSON-LD structured data.

---

## 💰 Adsterra Advertising Engine

Manage advertisement positions directly through the Admin Control Panel without editing code:
1. **Popunder Code:** Frequency-controlled background popup monetization.
2. **Social Bar:** Push/interstitial floating engagement widget.
3. **Banner Positions:**
   - Top Header Billboard (728x90)
   - Homepage In-Feed Native Card
   - Sidebar Medium Rectangle (300x250)
   - Article Top Leaderboard
   - Article In-Read Paragraph Placement
   - Article Bottom Leaderboard
   - Sticky Mobile Bottom Anchor (320x50 with dismiss option)

---

## 🔄 Updating the Website in the Future

To deploy updates without losing existing database content or settings:
1. Pull latest code locally: `git pull origin main`
2. Make your frontend or layout modifications in `src/`.
3. Commit and push:
   ```bash
   git add .
   git commit -m "Update layout and styling"
   git push origin main
   ```
4. Netlify will automatically build and publish your updates within 1 minute.
5. All published articles, ads, breaking news, comments, and settings in your Supabase database remain completely untouched and active!
