FROM docker.io/node:lts@sha256:b52a8d1206132b36d60e51e413d9a81336e8a0206d3b648cabd6d5a49c4c0f54 AS builder

RUN mkdir /app
WORKDIR /app
COPY ./package-lock.json ./package.json /app/

RUN --mount=type=cache,target=/root/.npm npm ci

COPY ./ /app
RUN --mount=type=cache,target=/root/.npm npm run build-docker

FROM docker.io/nginxinc/nginx-unprivileged:alpine-slim@sha256:20226090cd12205f591a6f503a5ffc9f262e3016ca9100166e1d5e4c41e3f223 AS runtime
EXPOSE 8080
COPY --from=builder /app/dist/paste-perfect/browser /usr/share/nginx/html
