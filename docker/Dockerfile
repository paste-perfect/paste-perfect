FROM docker.io/node:lts@sha256:74066d050011dd18c56390523cb255b38bce09b332221a4ec15ab0d8e1ac61fe AS builder

RUN mkdir /app
WORKDIR /app
COPY ./package-lock.json ./package.json /app/

RUN npm ci

COPY ./ /app
RUN npm run build-docker

FROM docker.io/nginxinc/nginx-unprivileged:alpine-slim@sha256:bc1f7d2bfce3427245dac10022339f9450903b0705855d7b0ad345c58635d2b6 AS runtime
EXPOSE 8080
COPY --from=builder /app/dist/paste-perfect/browser /usr/share/nginx/html
