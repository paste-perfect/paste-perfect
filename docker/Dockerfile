FROM docker.io/node:lts@sha256:7b3ae9038659749edc255f2f98c49c3df81da7ef6bc4e3a5165f1d4ba04c1e5d AS builder

RUN mkdir /app
WORKDIR /app
COPY ./package-lock.json ./package.json /app/

RUN --mount=type=cache,target=/root/.npm npm ci

COPY ./ /app
RUN --mount=type=cache,target=/root/.npm npm run build-docker

FROM docker.io/nginxinc/nginx-unprivileged:alpine-slim@sha256:67e84141b0c84bdb1e2ed03b73c7345d678a0faecce9f5de2c1120b800ea7b94 AS runtime
EXPOSE 8080
COPY --from=builder /app/dist/paste-perfect/browser /usr/share/nginx/html
