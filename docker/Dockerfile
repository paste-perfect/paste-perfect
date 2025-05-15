FROM docker.io/node:lts@sha256:909d2840362f35b605ebf4176952b06d02fdcf32971213e5d5ea1090a41097c8 AS builder

RUN mkdir /app
WORKDIR /app
COPY ./package-lock.json ./package.json /app/

RUN npm ci

COPY ./ /app
RUN npm run build-docker

FROM docker.io/nginxinc/nginx-unprivileged:alpine-slim@sha256:0a49675e3e35cc2f89ce831f00f767af9c32df04f5a80167739fd32346f1fe99 AS runtime
EXPOSE 8080
COPY --from=builder /app/dist/paste-perfect/browser /usr/share/nginx/html
