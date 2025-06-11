FROM docker.io/node:lts@sha256:f627d0e594bbc713de73c2c50d18033c89e114cb1645c3b520b201426cfe1975 AS builder

RUN mkdir /app
WORKDIR /app
COPY ./package-lock.json ./package.json /app/

RUN npm ci

COPY ./ /app
RUN npm run build-docker

FROM docker.io/nginxinc/nginx-unprivileged:alpine-slim@sha256:66e34aa81c2faf290ea4e4c28a490f2b35a07478265a2d5994c8637506045eee AS runtime
EXPOSE 8080
COPY --from=builder /app/dist/paste-perfect/browser /usr/share/nginx/html
