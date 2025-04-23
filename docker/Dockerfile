FROM docker.io/node:lts@sha256:853006d5c7835ed1247944b0f221e4add0c55b365a933c2c507ce2f004e322ef AS builder

RUN mkdir /app
WORKDIR /app
COPY ./package-lock.json ./package.json /app/

RUN npm ci

COPY ./ /app
RUN npm run build-docker

FROM docker.io/nginxinc/nginx-unprivileged:alpine-slim@sha256:e9796392bfbd5d97721c1d67fa1433cb2f5658a72b9b3ef6af3f63b00a4c273e AS runtime
EXPOSE 8080
COPY --from=builder /app/dist/paste-perfect/browser /usr/share/nginx/html
