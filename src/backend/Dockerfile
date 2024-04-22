FROM oven/bun:1.0.34 as base
WORKDIR /usr/src/app

FROM base AS install
RUN mkdir -p /temp/dev /temp/prod

COPY backend/package.json backend/bun.lockb /temp/dev/
RUN cd /temp/dev && bun install --frozen-lockfile

COPY backend/package.json backend/bun.lockb /temp/prod/
RUN cd /temp/prod && bun install --frozen-lockfile --production

FROM base AS prerelease
COPY backend/ ./backend/
COPY api.ts ./
COPY --from=install /temp/dev/node_modules ./backend/node_modules

FROM base AS release
COPY --from=install /temp/prod/node_modules ./backend/node_modules
COPY --from=prerelease /usr/src/app/api.ts ./
COPY --from=prerelease /usr/src/app/backend ./backend

WORKDIR /usr/src/app/backend/src
USER bun
ENTRYPOINT ["bun", "run", "index.ts"]
