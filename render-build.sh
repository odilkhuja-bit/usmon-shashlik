#!/bin/bash
# ============================================
# USMON SHASHLIK — Render Build Script
# ============================================

set -e

echo "📦 Installing backend dependencies..."
cd backend
npm install
npx prisma generate
cd ..

echo "📦 Installing client dependencies..."
cd client
npm install --include=dev
echo "🔨 Building client..."
npx vite build
cd ..

echo "📦 Installing admin dependencies..."
cd admin
npm install --include=dev
echo "🔨 Building admin..."
npx vite build
cd ..

echo "✅ Build completed successfully!"
