# Quran Learning App — production image
# Build: docker build -t quran-learning-app .
# Run:   docker run --env-file .env.local -p 3000:3000 quran-learning-app

FROM node:22-bookworm-slim AS deps
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@9.15.4 --activate
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

FROM node:22-bookworm-slim AS builder
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@9.15.4 --activate
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
# Build-time placeholders so Next can compile; real secrets at runtime.
ENV DATABASE_URL="postgresql://postgres:postgres@localhost:5432/postgres"
ENV SUPABASE_URL="https://example.supabase.co"
ENV SUPABASE_ANON_KEY="build-placeholder"
ENV NEXT_PUBLIC_SUPABASE_URL="https://example.supabase.co"
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY="build-placeholder"
RUN pnpm db:generate && pnpm build

FROM node:22-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
# Cap V8 heap so the process fits ~1GB hosts (leave room for OS + buffers).
ENV NODE_OPTIONS="--max-old-space-size=512 --max-semi-space-size=64"

RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder /app/data ./data
# Learner runtime needs curriculum JSON under data/, not OCR page scans.
COPY --from=builder /app/knowledge/books/original ./knowledge/books/original
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/api/v1/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "server.js"]
