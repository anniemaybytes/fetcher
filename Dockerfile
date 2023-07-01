FROM node:18-alpine AS base
WORKDIR /app
RUN apk --no-cache add ca-certificates mktorrent mediainfo

FROM base AS builder
COPY package.json .
COPY yarn.lock .
RUN yarn --frozen-lockfile --non-interactive
COPY . .
# Build and trim node_modules dependencies
RUN yarn build && mv yarnclean .yarnclean && yarn --frozen-lockfile --non-interactive --production
# Rebuild native runtime dependencies to ensure musl compatibility (ref. https://github.com/webtorrent/webtorrent/issues/2604)
RUN apk --no-cache add build-base python3 && npm rebuild utp-native --build-from-source

FROM base AS release
ENV NODE_ENV production
COPY --from=builder --chown=1000:1000 /app/node_modules ./node_modules
COPY --from=builder --chown=1000:1000 /app/package.json .
COPY --from=builder --chown=1000:1000 /app/dist ./dist
USER 1000:1000
CMD [ "node", "dist/index.js" ]
