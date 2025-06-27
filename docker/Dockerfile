FROM docker.io/node:lts@sha256:0c0734eb7051babbb3e95cd74e684f940552b31472152edf0bb23e54ab44a0d7 AS builder

RUN mkdir /app
WORKDIR /app
COPY ./package-lock.json ./package.json /app/

RUN npm ci

COPY ./ /app
RUN npm run build-docker

FROM docker.io/nginxinc/nginx-unprivileged:alpine-slim@sha256:111ba7c204aea8b2c8767feae04d9703a64369a82b6982a9ad21cb12bd4946f2 AS runtime
EXPOSE 8080
COPY --from=builder /app/dist/paste-perfect/browser /usr/share/nginx/html
