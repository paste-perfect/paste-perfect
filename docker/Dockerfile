FROM docker.io/node:lts@sha256:50730ab0b271c750c1a29bb4a60aff470e359a60a00fe40379c4747ac1e45796 AS builder

RUN mkdir /app
WORKDIR /app
COPY ./package-lock.json ./package.json /app/

RUN npm ci

COPY ./ /app
RUN npm run build-docker

FROM docker.io/nginxinc/nginx-unprivileged:alpine-slim@sha256:bc1f7d2bfce3427245dac10022339f9450903b0705855d7b0ad345c58635d2b6 AS runtime
EXPOSE 8080
COPY --from=builder /app/dist/paste-perfect/browser /usr/share/nginx/html
