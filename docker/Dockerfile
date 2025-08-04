FROM docker.io/node:lts@sha256:263acfc82e6c90dc5f80a937868a7ede7f205f1e0a1eecd94b254e3497829dbb AS builder

RUN mkdir /app
WORKDIR /app
COPY ./package-lock.json ./package.json /app/

RUN npm ci

COPY ./ /app
RUN npm run build-docker

FROM docker.io/nginxinc/nginx-unprivileged:alpine-slim@sha256:e61b77b27c8f3124fad6d19e894ca5b603bcaf6a34a2df035511299dfa6fad35 AS runtime
EXPOSE 8080
COPY --from=builder /app/dist/paste-perfect/browser /usr/share/nginx/html
