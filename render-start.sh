#!/bin/bash
# ============================================
# USMON SHASHLIK — Render Start Script
# ============================================

set -e

echo "🗄️ Pushing database schema..."
cd backend
npx prisma db push --accept-data-loss

echo "🌱 Seeding database..."
node prisma/seed.js

echo "🚀 Starting server..."
node src/index.js
