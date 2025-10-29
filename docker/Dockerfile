FROM docker.io/node:lts@sha256:34af25027ee1b8bffd482ba995ec1e577fbd398db87beb4c60b80c2c9c025127 AS builder

RUN mkdir /app
WORKDIR /app
COPY ./package-lock.json ./package.json /app/

RUN --mount=type=cache,target=/root/.npm npm ci

COPY ./ /app
RUN --mount=type=cache,target=/root/.npm npm run build-docker

FROM docker.io/nginxinc/nginx-unprivileged:alpine-slim@sha256:65a7f97c299b919190e96e38e2ff8358132732000d3bc5c00c07cc8763fca53f AS runtime
EXPOSE 8080
COPY --from=builder /app/dist/paste-perfect/browser /usr/share/nginx/html
