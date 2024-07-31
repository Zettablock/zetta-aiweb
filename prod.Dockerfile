FROM node:20-alpine AS base

# Step 1. Rebuild the source code only when needed
FROM base AS builder

WORKDIR /app

COPY . .

# Omit --production flag for TypeScript devDependencies
RUN \
    if [ -f yarn.lock ]; then yarn --frozen-lockfile; \
    elif [ -f package-lock.json ]; then npm ci; \
    elif [ -f pnpm-lock.yaml ]; then corepack enable pnpm && pnpm i; \
    # Allow install without lockfile, so example works even without Node.js installed locally
    else echo "Warning: Lockfile not found. It is recommended to commit lockfiles to version control." && yarn install; \
    fi

# Environment variables must be present at build time
# https://github.com/vercel/next.js/discussions/14030
ARG AI_API_KEY
ENV AI_API_KEY=${AI_API_KEY}
ARG AUTH_CLIENT_ID
ENV AUTH_CLIENT_ID=${AUTH_CLIENT_ID}
ARG KV_REST_API_URL
ENV KV_REST_API_URL=${KV_REST_API_URL}
ARG KV_REST_API_TOKEN
ENV KV_REST_API_TOKEN=${KV_REST_API_TOKEN}
ARG NEXT_PUBLIC_SEGMENT_WRITE_KEY
ENV NEXT_PUBLIC_SEGMENT_WRITE_KEY=${NEXT_PUBLIC_SEGMENT_WRITE_KEY}

# Next.js collects completely anonymous telemetry data about general usage. Learn more here: https://nextjs.org/telemetry
# Uncomment the following line to disable telemetry at build time
# ENV NEXT_TELEMETRY_DISABLED 1

# Build Next.js based on the preferred package manager
RUN \
    if [ -f yarn.lock ]; then yarn build; \
    elif [ -f package-lock.json ]; then npm run build; \
    elif [ -f pnpm-lock.yaml ]; then pnpm build; \
    else npm run build; \
    fi

# Don't run production as root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
USER nextjs

# install pm2
RUN npm install -g pm2
# web application access log
RUN mkdir -p /var/log/aiweb
# Start the app
RUN pm2 start npm --name aiweb --interpreter bash -- start -o /var/log/aiweb/out.log -e /var/log/aiweb/err.log