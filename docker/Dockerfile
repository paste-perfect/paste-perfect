FROM docker.io/node:lts@sha256:64121601df41f1a011c1eeb696b6f1662d670debba8fb8c89b5dea1d3d634bdb AS builder

RUN mkdir /app
WORKDIR /app
COPY ./package-lock.json ./package.json /app/

RUN --mount=type=cache,target=/root/.npm npm ci

COPY ./ /app
RUN --mount=type=cache,target=/root/.npm npm run build-docker

FROM docker.io/nginxinc/nginx-unprivileged:alpine-slim@sha256:65a7f97c299b919190e96e38e2ff8358132732000d3bc5c00c07cc8763fca53f AS runtime
EXPOSE 8080
COPY --from=builder /app/dist/paste-perfect/browser /usr/share/nginx/html
