FROM docker.io/node:lts@sha256:4973262386dc1cb70f7d6fc48a855027d8f12d2d3b1fe559b9db9a4fcb74668f AS builder

RUN mkdir /app
WORKDIR /app
COPY ./package-lock.json ./package.json /app/

RUN npm ci

COPY ./ /app
RUN npm run build-docker

FROM docker.io/nginxinc/nginx-unprivileged:alpine-slim@sha256:bad7463dccde4b422c1f3335739383514cad0fc804c242674646a0827c8cfbae AS runtime
EXPOSE 8080
COPY --from=builder /app/dist/paste-perfect/browser /usr/share/nginx/html
