FROM oven/bun:1.1.8-alpine as base
WORKDIR /usr/src/app



FROM base AS install
RUN mkdir -p /temp/dev /temp/prod

# Install all dependencies, cannot build backend without them
COPY backend/package.json backend/bun.lockb /temp/dev/
RUN cd /temp/dev && bun install --frozen-lockfile

# Install only production dependencies
COPY backend/package.json backend/bun.lockb /temp/prod/
RUN cd /temp/prod && bun install --forzen-lockfile --production



# Create a prerelease image to build the backend
FROM base AS prerelease
COPY backend/ ./backend/
COPY api.ts ./
COPY --from=install /temp/dev/node_modules ./backend/node_modules

WORKDIR /usr/src/app/backend
RUN bun build src/index.ts --outdir build


# The release image only contains the backend build and production dependencies
FROM base AS release
COPY --from=install /temp/prod/node_modules ./backend/node_modules
COPY --from=prerelease /usr/src/app/backend/build ./backend/build

WORKDIR /usr/src/app/backend/build
USER bun
ENTRYPOINT ["bun", "run", "index.js"]
