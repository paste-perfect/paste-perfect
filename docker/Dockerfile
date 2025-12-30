FROM docker.io/node:lts@sha256:e7a6c521e0e133cb3f4d97c71a95f290fb3816dca1a3b002e49059e2095870e5 AS builder

RUN mkdir /app
WORKDIR /app
COPY ./package-lock.json ./package.json /app/

RUN --mount=type=cache,target=/root/.npm npm ci

COPY ./ /app
RUN --mount=type=cache,target=/root/.npm npm run build-docker

FROM docker.io/nginxinc/nginx-unprivileged:alpine-slim@sha256:20226090cd12205f591a6f503a5ffc9f262e3016ca9100166e1d5e4c41e3f223 AS runtime
EXPOSE 8080
COPY --from=builder /app/dist/paste-perfect/browser /usr/share/nginx/html
