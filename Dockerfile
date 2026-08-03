# Build stage
FROM node:24-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Production stage
FROM node:24-alpine

# Cook CLI version and the checksum of its musl release archive.
#
# The checksum is pinned rather than taken from the .sha256 published beside
# the archive: fetching both from the same place means a re-tagged release
# would verify against its own new checksum and pass silently.
ARG COOK_CLI_VERSION=0.32.1
ARG COOK_CLI_SHA256=c8f43e475a585c96e78f32560d28368bc90a9dff5d8325c5ef5ddacd5b9f1106

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=builder /app/build ./build

# Checks the CLI behaviour the app depends on. Ships with the image so it can
# be run against the binary that is actually deployed:
#   docker compose run --rm app node scripts/smoke-cook.mjs
COPY scripts ./scripts

# Recipes are deliberately not copied in. Baking them into the image means an
# instance started without a volume serves sample data and writes the shopping
# list and pantry into a container layer, where they are lost on restart.

# Install Cook CLI binary (musl variant, for Alpine)
RUN set -eux; \
    apk add --no-cache --virtual .fetch-deps curl; \
    \
    COOK_URL="https://github.com/cooklang/cookcli/releases/download/v${COOK_CLI_VERSION}/cook-x86_64-unknown-linux-musl.tar.gz"; \
    curl -fsSL "${COOK_URL}" -o cook.tar.gz; \
    echo "${COOK_CLI_SHA256}  cook.tar.gz" | sha256sum -c -; \
    \
    tar -xzf cook.tar.gz; \
    mv cook /usr/local/bin/cook; \
    chmod +x /usr/local/bin/cook; \
    cook --version; \
    \
    rm -f cook.tar.gz; \
    apk del .fetch-deps

ENV NODE_ENV=production
ENV PORT=3000
ENV RECIPE_PATH=/app/recipes

RUN addgroup -S app && adduser -S app -G app
USER app

EXPOSE 3000
STOPSIGNAL SIGTERM

# Reports whether the recipe directory is readable and how many recipes were
# found, so a missing volume mount shows up as an unhealthy container rather
# than an empty-looking library.
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3000)+'/health').then(r=>r.ok?process.exit(0):process.exit(1)).catch(()=>process.exit(1))"

CMD ["node", "build/index.js"]
