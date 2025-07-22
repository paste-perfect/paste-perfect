FROM docker.io/node:lts@sha256:079b6a683dc47a87673a6159c9e9b22b0687d04533087cf144c96fac8c26ecd3 AS builder

RUN mkdir /app
WORKDIR /app
COPY ./package-lock.json ./package.json /app/

RUN npm ci

COPY ./ /app
RUN npm run build-docker

FROM docker.io/nginxinc/nginx-unprivileged:alpine-slim@sha256:86df552d36eb24c45d3f5becf6423bd056a3fd235d7085fe3d5ea28ba89a8232 AS runtime
EXPOSE 8080
COPY --from=builder /app/dist/paste-perfect/browser /usr/share/nginx/html
