FROM docker.io/node:lts@sha256:bdc72529eb387cb3a2c0ef0c7c45192ef29600db5a3d62f0d6e62d59752df718 AS builder

RUN mkdir /app
WORKDIR /app
COPY ./package-lock.json ./package.json /app/

RUN --mount=type=cache,target=/root/.npm npm ci

COPY ./ /app
RUN --mount=type=cache,target=/root/.npm npm run build-docker

FROM docker.io/nginxinc/nginx-unprivileged:alpine-slim@sha256:9ac6a908ed07ba7d23cbf6048090453a081abf663c53a7c3f3bf96abc16c0799 AS runtime
EXPOSE 8080
COPY --from=builder /app/dist/paste-perfect/browser /usr/share/nginx/html
