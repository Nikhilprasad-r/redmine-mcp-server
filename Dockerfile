# syntax=docker/dockerfile:1.7

FROM node:22-alpine AS base
WORKDIR /app

FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci

FROM deps AS build
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

COPY --from=deps /app/package.json /app/package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY --from=build /app/dist ./dist

LABEL org.opencontainers.image.title="redmine-mcp-server" \
      org.opencontainers.image.description="MCP stdio server for Redmine REST API" \
      org.opencontainers.image.licenses="GPL-2.0-or-later"

CMD ["node", "dist/index.js"]
