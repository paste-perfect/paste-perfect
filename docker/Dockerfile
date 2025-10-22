FROM docker.io/node:lts@sha256:a2a7dccd1160275ea1aa1b4dddd1f2886f2092d502877eb84682d2b88c3915c4 AS builder

RUN mkdir /app
WORKDIR /app
COPY ./package-lock.json ./package.json /app/

RUN --mount=type=cache,target=/root/.npm npm ci

COPY ./ /app
RUN --mount=type=cache,target=/root/.npm npm run build-docker

FROM docker.io/nginxinc/nginx-unprivileged:alpine-slim@sha256:0dd4fb787a1db5dc69d3dd9e21b35177ffe096591b01980a67c5a799e8ce26ed AS runtime
EXPOSE 8080
COPY --from=builder /app/dist/paste-perfect/browser /usr/share/nginx/html
