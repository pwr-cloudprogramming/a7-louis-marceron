FROM oven/bun:1.1.4 as base
WORKDIR /usr/src/app

FROM base AS install
RUN mkdir -p /temp/dev /temp/prod

COPY frontend/package.json frontend/bun.lockb /temp/dev/
RUN cd /temp/dev && bun install --frozen-lockfile

COPY frontend/package.json frontend/bun.lockb /temp/prod/
RUN cd /temp/prod && bun install --frozen-lockfile --production

FROM base AS prerelease
COPY frontend/ ./frontend/
COPY api.ts ./
COPY --from=install /temp/dev/node_modules ./frontend/node_modules

FROM base AS release
COPY --from=install /temp/prod/node_modules ./frontend/node_modules
COPY --from=prerelease /usr/src/app/api.ts ./
COPY --from=prerelease /usr/src/app/frontend/build ./frontend/build

WORKDIR /usr/src/app/frontend/build
COPY --from=prerelease /usr/src/app/api.ts ./
USER bun
ENTRYPOINT ["bun", "run", "index.js"]
