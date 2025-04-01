FROM docker.io/node:lts@sha256:c7fd844945a76eeaa83cb372e4d289b4a30b478a1c80e16c685b62c54156285b AS builder

RUN mkdir /app
WORKDIR /app
COPY ./package-lock.json ./package.json /app/

RUN npm ci

COPY ./ /app
RUN npm run build-docker

FROM docker.io/nginxinc/nginx-unprivileged:alpine-slim@sha256:154d7db418e13bcb29375cfa1f05d77496e986c717b9ba8a831e11077c880358 AS runtime
EXPOSE 8080
COPY --from=builder /app/dist/paste-perfect/browser /usr/share/nginx/html
