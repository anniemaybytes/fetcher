FROM node:22-alpine AS base
WORKDIR /app
RUN apk --no-cache add ca-certificates mktorrent mediainfo

FROM base AS builder
RUN corepack enable
COPY package.json .
COPY pnpm-lock.yaml .
COPY pnpm-workspace.yaml .
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm build
RUN apk --no-cache add build-base python3 && pnpm --config.build-from-source rebuild utp-native # https://github.com/webtorrent/webtorrent/issues/2604
RUN pnpm prune --prod

FROM base AS release
ENV NODE_ENV production
COPY --from=builder --chown=1000:1000 /app/node_modules ./node_modules
COPY --from=builder --chown=1000:1000 /app/package.json .
COPY --from=builder --chown=1000:1000 /app/dist ./dist
USER 1000:1000
CMD [ "node", "dist/index.js" ]
