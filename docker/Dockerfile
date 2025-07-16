FROM docker.io/node:lts@sha256:2ff27bf5505de4b7dd9b92f079c995a1863fb16db7e462ceec0b96782f07e350 AS builder

RUN mkdir /app
WORKDIR /app
COPY ./package-lock.json ./package.json /app/

RUN npm ci

COPY ./ /app
RUN npm run build-docker

FROM docker.io/nginxinc/nginx-unprivileged:alpine-slim@sha256:77b01fcb2a887ffdffafad6d050f8df3c2810041a31955fddb0fb45f7fcf52be AS runtime
EXPOSE 8080
COPY --from=builder /app/dist/paste-perfect/browser /usr/share/nginx/html
