FROM docker.io/node:lts@sha256:37ff334612f77d8f999c10af8797727b731629c26f2e83caa6af390998bdc49c AS builder

RUN mkdir /app
WORKDIR /app
COPY ./package-lock.json ./package.json /app/

RUN npm ci

COPY ./ /app
RUN npm run build-docker

FROM docker.io/nginxinc/nginx-unprivileged:alpine-slim@sha256:e61b77b27c8f3124fad6d19e894ca5b603bcaf6a34a2df035511299dfa6fad35 AS runtime
EXPOSE 8080
COPY --from=builder /app/dist/paste-perfect/browser /usr/share/nginx/html
