#!/usr/bin/env bash
# ==============================================================================
# PRIME NEWS GRAPH — Production Netlify Build & Asset Pipeline Script
# Resolves cache-collision issues, ensures public asset sync, and verifies build.
# ==============================================================================

set -e

echo "🚀 [PRIME NEWS GRAPH] Starting production build pipeline..."

# 1. Clean previous build artifacts and cache to prevent cache-collision
echo "🧹 Cleaning previous build directories..."
rm -rf dist .vite .cache

# 2. Ensure public assets directory integrity
echo "📁 Syncing static public assets..."
mkdir -p public/assets/images
mkdir -p public/uploads

if [ -d "src/assets/images" ]; then
  cp -r src/assets/images/* public/assets/images/ 2>/dev/null || true
fi

# 3. Execute Vite Production Build
echo "⚡ Executing React production bundle with Vite..."
npx vite build

# 4. Guarantee Netlify redirects, sitemap, and robots.txt in dist/
echo "🛡️ Verifying Netlify routing and SEO files in dist/..."

if [ -f "public/_redirects" ]; then
  cp public/_redirects dist/_redirects
else
  cat << 'EOF' > dist/_redirects
# Netlify SPA routing & serverless proxy
/api/*  /.netlify/functions/api/:splat  200
/*      /index.html                     200
EOF
fi

if [ -f "public/robots.txt" ]; then
  cp public/robots.txt dist/robots.txt
fi

if [ -f "public/sitemap.xml" ]; then
  cp public/sitemap.xml dist/sitemap.xml
fi

if [ -f "public/.htaccess" ]; then
  cp public/.htaccess dist/.htaccess
fi

if [ -f "vercel.json" ]; then
  cp vercel.json dist/vercel.json
fi

if [ -f "netlify.toml" ]; then
  cp netlify.toml dist/netlify.toml
fi

# Ensure uploads directory is present in dist
mkdir -p dist/uploads

# Remove heavy user screenrecordings/videos from dist to keep package well under 15MB
rm -rf dist/assets/aistudio
rm -f dist/*.mp4 dist/**/*.mp4 2>/dev/null || true
rm -f dist/*.zip dist/**/*.zip 2>/dev/null || true

echo "✅ [PRIME NEWS GRAPH] Production build finished successfully!"
echo "📦 Output directory 'dist' is ready for Netlify deployment."
