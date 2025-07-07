FROM docker.io/node:lts@sha256:df39165022a0463c1b9e5fe5198b326847a2cb22736ca2469bc7139785431673 AS builder

RUN mkdir /app
WORKDIR /app
COPY ./package-lock.json ./package.json /app/

RUN npm ci

COPY ./ /app
RUN npm run build-docker

FROM docker.io/nginxinc/nginx-unprivileged:alpine-slim@sha256:ef0100e39ffe377a42ad99e1f644b78097a84f1ac60a90eac3b888196b2eeb00 AS runtime
EXPOSE 8080
COPY --from=builder /app/dist/paste-perfect/browser /usr/share/nginx/html
