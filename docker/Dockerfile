FROM docker.io/node:lts@sha256:f466376b5f5ca8327da5914fddbcb5eee21c1c8482bed548a5ee84750d0b1b69 AS builder

RUN mkdir /app
WORKDIR /app
COPY ./package-lock.json ./package.json /app/

RUN npm ci

COPY ./ /app
RUN npm run build-docker

FROM docker.io/nginxinc/nginx-unprivileged:alpine-slim@sha256:bc1f7d2bfce3427245dac10022339f9450903b0705855d7b0ad345c58635d2b6 AS runtime
EXPOSE 8080
COPY --from=builder /app/dist/paste-perfect/browser /usr/share/nginx/html
