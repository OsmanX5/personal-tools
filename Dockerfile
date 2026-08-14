# syntax=docker/dockerfile:1

# ---- deps: install node_modules from the lockfile ----
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# ---- builder: produce the standalone Next.js build ----
FROM node:22-alpine AS builder
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
# src/lib/db.ts throws at import time when MONGODB_URI is missing, and `next build`
# imports every route module to collect page data. This placeholder only satisfies
# that check — it lives in the build stage and never reaches the runtime image,
# where the real value comes from --env-file.
ENV MONGODB_URI="mongodb://placeholder-unused-at-build-time"
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# public/ is empty and therefore untracked by git, so a fresh clone has no such
# directory and the runtime COPY below would fail. Guarantee it exists.
RUN mkdir -p public
RUN npm run build

# ---- runner: minimal runtime image ----
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000

CMD ["node", "server.js"]
