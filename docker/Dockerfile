FROM docker.io/node:lts@sha256:71bcbb3b215b3fa84b5b167585675072f4c270855e37a599803f1a58141a0716 AS builder

RUN mkdir /app
WORKDIR /app
COPY ./package-lock.json ./package.json /app/

RUN npm ci

COPY ./ /app
RUN npm run build-docker

FROM docker.io/nginxinc/nginx-unprivileged:alpine-slim@sha256:47e5438ca53b7ea2a63830805aa646a5ea9fde4b68092d72840f2143aba77ac6 AS runtime
EXPOSE 8080
COPY --from=builder /app/dist/paste-perfect/browser /usr/share/nginx/html
