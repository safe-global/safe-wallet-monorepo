# ==============================================================================
# Stage 1: Build the static Next.js export
# ==============================================================================
FROM node:18-alpine AS builder

RUN apk add --no-cache libc6-compat git python3 py3-pip make g++ libusb-dev eudev-dev linux-headers

WORKDIR /app

# Copy entire monorepo (needed for workspace packages)
COPY . .

# Remove local .env files so NEXT_PUBLIC_* vars are NOT baked in at build time.
# Without these files, Next.js compiles process.env.NEXT_PUBLIC_* as runtime
# accesses on the webpack process polyfill (module that sets process.env = {}).
# The entrypoint.sh then patches that empty object with the container's env vars.
RUN rm -f apps/web/.env apps/web/.env.local apps/web/.env.development.local apps/web/.env.production.local

WORKDIR /app/apps/web

# Enable corepack and install dependencies
RUN corepack enable
RUN yarn config set httpTimeout 300000
RUN yarn install --immutable
RUN yarn after-install

# Set production environment
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# ---------------------------------------------------------------------------
# Skip the build-time chain pre-fetch so the image is gateway-agnostic.
# Chains are fetched at runtime from the injected NEXT_PUBLIC_GATEWAY_URL_*.
# Override with SKIP_FETCH_CHAINS=false and BUILD_GATEWAY_URL to pre-fetch.
# ---------------------------------------------------------------------------
ARG SKIP_FETCH_CHAINS=true
ENV SKIP_FETCH_CHAINS=${SKIP_FETCH_CHAINS}

ARG BUILD_GATEWAY_URL=https://safe-client.safe.global
ENV BUILD_GATEWAY_URL=${BUILD_GATEWAY_URL}

# Build the static export (outputs to ./out/)
RUN yarn build


# ==============================================================================
# Stage 2: Serve static files with nginx
# ==============================================================================
FROM nginx:alpine

# Copy static build output
COPY --from=builder /app/apps/web/out /usr/share/nginx/html

# Copy nginx server config (replaces the default server block)
COPY --from=builder /app/apps/web/scripts/docker/nginx.conf /etc/nginx/conf.d/default.conf

# Copy runtime environment variable injection entrypoint
COPY --from=builder /app/apps/web/scripts/docker/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 8080

ENTRYPOINT ["/entrypoint.sh"]
