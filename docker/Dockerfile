FROM docker.io/node:lts@sha256:7f80506b8225bcce2ce8202b1026fcde8f0bfb716b1b833f20250d79d4463276 AS builder

RUN mkdir /app
WORKDIR /app
COPY ./package-lock.json ./package.json /app/

RUN --mount=type=cache,target=/root/.npm npm ci

COPY ./ /app
RUN --mount=type=cache,target=/root/.npm npm run build-docker

FROM docker.io/nginxinc/nginx-unprivileged:alpine-slim@sha256:33a248b39dc73c7bde3ffe802d651c098cbbdee68e333ded42c357f230524dfb AS runtime
EXPOSE 8080
COPY --from=builder /app/dist/paste-perfect/browser /usr/share/nginx/html
