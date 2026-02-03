FROM docker.io/node:lts@sha256:15af9ab54885b246f857662f1740052dfda33ede2a183b8cf4da2cb3effb27c0 AS builder

RUN mkdir /app
WORKDIR /app
COPY ./package-lock.json ./package.json /app/

RUN --mount=type=cache,target=/root/.npm npm ci

COPY ./ /app
RUN --mount=type=cache,target=/root/.npm npm run build-docker

FROM docker.io/nginxinc/nginx-unprivileged:alpine-slim@sha256:9ac6a908ed07ba7d23cbf6048090453a081abf663c53a7c3f3bf96abc16c0799 AS runtime
EXPOSE 8080
COPY --from=builder /app/dist/paste-perfect/browser /usr/share/nginx/html
