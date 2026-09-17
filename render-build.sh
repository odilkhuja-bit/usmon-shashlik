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
npm install
echo "🔨 Building client..."
npm run build
cd ..

echo "📦 Installing admin dependencies..."
cd admin
npm install
echo "🔨 Building admin..."
npm run build
cd ..

echo "✅ Build completed successfully!"
