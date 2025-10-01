FROM docker.io/node:lts@sha256:d367fd3fce932a9d3bc3816c23f85313d9b44e58e1fed49ef90a10c4b99409e8 AS builder

RUN mkdir /app
WORKDIR /app
COPY ./package-lock.json ./package.json /app/

RUN npm ci

COPY ./ /app
RUN npm run build-docker

FROM docker.io/nginxinc/nginx-unprivileged:alpine-slim@sha256:3239fe9f214f5f27c141f7536d6266ca28a362a5ef8b4f6a46d8e946708d1baf AS runtime
EXPOSE 8080
COPY --from=builder /app/dist/paste-perfect/browser /usr/share/nginx/html
