# Base stage with Node.js installed
FROM node:20.11.1 as base
WORKDIR /usr/src/app

# Install stage for development environment
FROM base AS install
RUN mkdir -p /temp/dev /temp/prod

# Install packages for development
COPY frontend/package.json frontend/package-lock.json /temp/dev/
RUN cd /temp/dev && npm install

# Install packages for production
COPY frontend/package.json frontend/package-lock.json /temp/prod/
RUN cd /temp/prod && npm install --production

# Prerelease stage: build the application
FROM base AS prerelease
COPY frontend/ ./frontend/
COPY api.ts ./
COPY --from=install /temp/dev/node_modules ./frontend/node_modules
RUN cd ./frontend/ && npm run build 

# Release stage: prepare the production environment
FROM base AS release
COPY --from=install /temp/prod/node_modules ./frontend/node_modules
COPY --from=prerelease /usr/src/app/frontend/build ./frontend/build

WORKDIR /usr/src/app/frontend/build
USER node
ENTRYPOINT ["node", "index.js"]

