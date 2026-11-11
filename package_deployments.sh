#!/usr/bin/env bash
set -e

echo "📦 Packaging deployment bundles for GitHub, Vercel & Netlify..."

# Ensure dist exists
if [ ! -d "dist" ]; then
  echo "Building dist first..."
  bash build.sh
fi

mkdir -p public/downloads
mkdir -p dist/downloads

# 1. Netlify Direct Drop ZIP (Root must contain index.html and _redirects directly)
echo "📦 Generating prime-news-graph-direct-netlify-drop.zip..."
rm -f public/downloads/prime-news-graph-direct-netlify-drop.zip dist/downloads/prime-news-graph-direct-netlify-drop.zip
(cd dist && zip -r -q ../public/downloads/prime-news-graph-direct-netlify-drop.zip . -x "downloads/*" "assets/aistudio/*")

# 2. GitHub & Vercel Clean Source ZIP (Excludes node_modules, dist, git, zip, and huge video files)
echo "📦 Generating prime-news-graph-github-vercel.zip..."
rm -f public/downloads/prime-news-graph-github-vercel.zip dist/downloads/prime-news-graph-github-vercel.zip
zip -r -q public/downloads/prime-news-graph-github-vercel.zip . \
  -x "node_modules/*" \
  -x "dist/*" \
  -x ".git/*" \
  -x ".vite/*" \
  -x ".cache/*" \
  -x "public/assets/aistudio/*" \
  -x "public/downloads/*" \
  -x "*.zip" \
  -x "*.mp4" \
  -x "*.log"

# Copy to dist so client can download directly
cp public/downloads/*.zip dist/downloads/
cp public/downloads/*.zip public/ 2>/dev/null || true
cp public/downloads/*.zip dist/ 2>/dev/null || true

echo "✅ Deployment packages created successfully:"
ls -lh public/downloads/
