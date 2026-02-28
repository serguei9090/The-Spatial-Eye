# --- STAGE 1: Build Next.js ---
# Use the official Bun image (Debian-based = glibc = no lightningcss issues)
FROM oven/bun:1-debian AS frontend-builder
WORKDIR /app

# Capture build-time arguments passed from CI/CD
ARG NEXT_PUBLIC_GOOGLE_API_KEY
ARG NEXT_PUBLIC_FIREBASE_API_KEY
ARG NEXT_PUBLIC_FIREBASE_PROJECT_ID
ARG NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
ARG NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
ARG NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
ARG NEXT_PUBLIC_FIREBASE_APP_ID
ARG NEXT_PUBLIC_GEMINI_LIVE_MODEL

# Set them as ENV variables so 'next build' can bake them into the client bundle
ENV NEXT_PUBLIC_GOOGLE_API_KEY=$NEXT_PUBLIC_GOOGLE_API_KEY
ENV NEXT_PUBLIC_FIREBASE_API_KEY=$NEXT_PUBLIC_FIREBASE_API_KEY
ENV NEXT_PUBLIC_FIREBASE_PROJECT_ID=$NEXT_PUBLIC_FIREBASE_PROJECT_ID
ENV NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=$NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
ENV NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=$NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
ENV NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=$NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
ENV NEXT_PUBLIC_FIREBASE_APP_ID=$NEXT_PUBLIC_FIREBASE_APP_ID
ENV NEXT_PUBLIC_GEMINI_LIVE_MODEL=$NEXT_PUBLIC_GEMINI_LIVE_MODEL
ENV NEXT_TELEMETRY_DISABLED=1

COPY package.json bun.lock* ./
# bun install re-resolves platform-specific native binaries for Linux correctly
RUN bun install
COPY . .
RUN bun run build

# --- STAGE 2: Build Python Backend ---
FROM python:3.13-slim AS backend-builder
WORKDIR /app
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1
RUN pip install uv
COPY backend/pyproject.toml backend/uv.lock ./
RUN uv sync --frozen --no-dev

# --- STAGE 3: Final Unified Runtime ---
FROM node:20-slim AS runner
WORKDIR /app

# Install Python and uv in the final image
RUN apt-get update && apt-get install -y python3 python3-pip && \
    pip3 install uv --break-system-packages && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production
ENV PORT=3000

# Copy Next.js standalone build
COPY --from=frontend-builder /app/.next/standalone ./
COPY --from=frontend-builder /app/.next/static ./.next/static
COPY --from=frontend-builder /app/public ./public

# Copy Python Backend
COPY --from=backend-builder /app/.venv ./backend/.venv
COPY backend ./backend

# Copy Proxy / Orchestrator (we'll create this next)
COPY scripts/start-unified.js ./

# Set permissions
RUN groupadd --system --gid 1001 nodejs && \
    useradd --system --create-home --uid 1001 nextjs && \
    mkdir -p /home/nextjs/.cache/uv && \
    chown -R nextjs:nodejs /app /home/nextjs

USER nextjs
ENV UV_CACHE_DIR=/home/nextjs/.cache/uv

EXPOSE 3000
CMD ["node", "start-unified.js"]
