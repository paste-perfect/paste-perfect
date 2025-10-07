FROM docker.io/node:lts@sha256:2bb201f33898d2c0ce638505b426f4dd038cc00e5b2b4cbba17b069f0fff1496 AS builder

RUN mkdir /app
WORKDIR /app
COPY ./package-lock.json ./package.json /app/

RUN npm ci

COPY ./ /app
RUN npm run build-docker

FROM docker.io/nginxinc/nginx-unprivileged:alpine-slim@sha256:6911e788d7662d3fdec529004842a9354846f9b760e24dd24bfc69c7fbb14ee0 AS runtime
EXPOSE 8080
COPY --from=builder /app/dist/paste-perfect/browser /usr/share/nginx/html
