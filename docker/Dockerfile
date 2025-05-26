FROM docker.io/node:lts@sha256:0b5b940c21ab03353de9042f9166c75bcfc53c4cd0508c7fd88576646adbf875 AS builder

RUN mkdir /app
WORKDIR /app
COPY ./package-lock.json ./package.json /app/

RUN npm ci

COPY ./ /app
RUN npm run build-docker

FROM docker.io/nginxinc/nginx-unprivileged:alpine-slim@sha256:2acffd86b1bdefb8fa6b48b6e9aadf75430e8ab9c43c54c515ea7df77897f987 AS runtime
EXPOSE 8080
COPY --from=builder /app/dist/paste-perfect/browser /usr/share/nginx/html
