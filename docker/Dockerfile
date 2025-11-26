FROM docker.io/node:lts@sha256:aa648b387728c25f81ff811799bbf8de39df66d7e2d9b3ab55cc6300cb9175d9 AS builder

RUN mkdir /app
WORKDIR /app
COPY ./package-lock.json ./package.json /app/

RUN --mount=type=cache,target=/root/.npm npm ci

COPY ./ /app
RUN --mount=type=cache,target=/root/.npm npm run build-docker

FROM docker.io/nginxinc/nginx-unprivileged:alpine-slim@sha256:13d13f63d80772e27637e4077d95a89d59a92ee461b4d13eefa60423f8855089 AS runtime
EXPOSE 8080
COPY --from=builder /app/dist/paste-perfect/browser /usr/share/nginx/html
