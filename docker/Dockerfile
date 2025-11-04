FROM docker.io/node:lts@sha256:69698ef3aab175793435b78d835d317a9f594559666213c96f7f6c694f9d52b7 AS builder

RUN mkdir /app
WORKDIR /app
COPY ./package-lock.json ./package.json /app/

RUN --mount=type=cache,target=/root/.npm npm ci

COPY ./ /app
RUN --mount=type=cache,target=/root/.npm npm run build-docker

FROM docker.io/nginxinc/nginx-unprivileged:alpine-slim@sha256:67e84141b0c84bdb1e2ed03b73c7345d678a0faecce9f5de2c1120b800ea7b94 AS runtime
EXPOSE 8080
COPY --from=builder /app/dist/paste-perfect/browser /usr/share/nginx/html
