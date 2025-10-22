FROM docker.io/node:lts@sha256:58644f218c5c29eff294d2049c4f05b16e7c70ea8f9679f51a85926e147f7a43 AS builder

RUN mkdir /app
WORKDIR /app
COPY ./package-lock.json ./package.json /app/

RUN --mount=type=cache,target=/root/.npm npm ci

COPY ./ /app
RUN --mount=type=cache,target=/root/.npm npm run build-docker

FROM docker.io/nginxinc/nginx-unprivileged:alpine-slim@sha256:0dd4fb787a1db5dc69d3dd9e21b35177ffe096591b01980a67c5a799e8ce26ed AS runtime
EXPOSE 8080
COPY --from=builder /app/dist/paste-perfect/browser /usr/share/nginx/html
