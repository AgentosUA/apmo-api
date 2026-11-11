# syntax=docker/dockerfile:1

# Node.js 26 — current Active LTS (since 2026-10-28, supported until 2029-04).
ARG NODE_VERSION=26
# pnpm version used for the lockfile (see "packageManager" in package.json).
ARG PNPM_VERSION=12.10.1

# ---------- base ----------
# Debian (glibc) image: the DePbo tools in linux/ and public/parse2json are glibc binaries.
FROM node:${NODE_VERSION}-slim AS base
ARG PNPM_VERSION
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
# Corepack is no longer bundled with Node.js 25+, install pnpm with npm.
RUN npm install -g pnpm@${PNPM_VERSION} && pnpm --version
WORKDIR /app

# ---------- dependencies (all) ----------
FROM base AS deps
COPY package.json pnpm-lock.yaml ./
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
    pnpm config set store-dir /pnpm/store && \
    pnpm install --frozen-lockfile

# ---------- dependencies (production only) ----------
FROM base AS prod-deps
COPY package.json pnpm-lock.yaml ./
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
    pnpm config set store-dir /pnpm/store && \
    pnpm install --frozen-lockfile --prod

# ---------- build ----------
FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm build

# ---------- runtime ----------
FROM node:${NODE_VERSION}-slim AS runner

# Shared libraries required by the DePbo tools (extractpbo etc.)
RUN apt-get update && apt-get install -y --no-install-recommends \
    liblzo2-2 \
    libvorbis0a \
    libvorbisfile3 \
    libvorbisenc2 \
    libogg0 \
    libuchardet0 \
    && rm -rf /var/lib/apt/lists/*

# DePbo tools
COPY linux/bin/ /usr/local/bin/
COPY linux/lib/ /usr/local/lib/
ENV LD_LIBRARY_PATH="/usr/local/lib"
RUN chmod +x /usr/local/bin/*

WORKDIR /app
ENV NODE_ENV=production

COPY package.json ./
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
# The app reads/writes missions via relative paths (public/missions/...),
# so public/ must live next to dist/ in the working directory.
COPY --from=build /app/public ./public
RUN chmod +x public/parse2json

EXPOSE 3000

CMD ["node", "dist/main"]
