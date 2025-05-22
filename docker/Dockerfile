FROM docker.io/node:lts@sha256:6e62aab5da3680c65b90b213bb5c9768fd745fafecf8687e87a4728c99e5c1d2 AS builder

RUN mkdir /app
WORKDIR /app
COPY ./package-lock.json ./package.json /app/

RUN npm ci

COPY ./ /app
RUN npm run build-docker

FROM docker.io/nginxinc/nginx-unprivileged:alpine-slim@sha256:bc1f7d2bfce3427245dac10022339f9450903b0705855d7b0ad345c58635d2b6 AS runtime
EXPOSE 8080
COPY --from=builder /app/dist/paste-perfect/browser /usr/share/nginx/html
