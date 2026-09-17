# ============================================
# USMON SHASHLIK — Backend Dockerfile
# ============================================

FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci
RUN npx prisma generate

COPY . .

# Production runner
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5000

COPY package*.json ./
RUN npm ci --only=production

COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/prisma ./prisma
COPY src ./src

# Create database and seed if missing on startup
EXPOSE 5000

CMD ["sh", "-c", "npx prisma db push && node prisma/seed.js && node src/index.js"]
