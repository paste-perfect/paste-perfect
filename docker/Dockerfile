FROM docker.io/node:lts@sha256:120a74c2ae5bf7f51ab253caef82e7ec3491ac85ef5b1c25751e6c3b55f49cf8 AS builder

RUN mkdir /app
WORKDIR /app
COPY ./package-lock.json ./package.json /app/

RUN npm ci

COPY ./ /app
RUN npm run build-docker

FROM docker.io/nginxinc/nginx-unprivileged:alpine-slim@sha256:858590381e9f6d96eeb196c1116146afa8d0b7b4eadd1333a97537d6ddd2aba2 AS runtime
EXPOSE 8080
COPY --from=builder /app/dist/paste-perfect/browser /usr/share/nginx/html
