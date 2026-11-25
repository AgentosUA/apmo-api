# syntax=docker/dockerfile:1

# Node.js 26 — current Active LTS (since 2026-10-28, supported until 2029-04).
ARG NODE_VERSION=26
# pnpm version used for the lockfile (see "packageManager" in package.json).
ARG PNPM_VERSION=12.10.1

# ---------- base ----------
FROM node:${NODE_VERSION}-slim AS base
ARG PNPM_VERSION
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
# Corepack is no longer bundled with Node.js 25+, install pnpm with npm.
RUN npm install -g pnpm@${PNPM_VERSION} && pnpm --version
WORKDIR /app

# ---------- dependencies (all) ----------
FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
    pnpm config set store-dir /pnpm/store && \
    pnpm install --frozen-lockfile

# ---------- dependencies (production only) ----------
FROM base AS prod-deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
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

WORKDIR /app
ENV NODE_ENV=production

COPY package.json ./
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
# The app reads/writes missions via relative paths (public/missions/...),
# so public/ must live next to dist/ in the working directory.
COPY --from=build /app/public ./public

EXPOSE 3000

CMD ["node", "dist/main"]
