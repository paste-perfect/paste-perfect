FROM docker.io/node:lts@sha256:7b3ae9038659749edc255f2f98c49c3df81da7ef6bc4e3a5165f1d4ba04c1e5d AS builder

RUN mkdir /app
WORKDIR /app
COPY ./package-lock.json ./package.json /app/

RUN --mount=type=cache,target=/root/.npm npm ci

COPY ./ /app
RUN --mount=type=cache,target=/root/.npm npm run build-docker

FROM docker.io/nginxinc/nginx-unprivileged:alpine-slim@sha256:1632c26ddb3249ef8fe939f871f2020dbc00e65f02121a80c66f1dd0cdca9235 AS runtime
EXPOSE 8080
COPY --from=builder /app/dist/paste-perfect/browser /usr/share/nginx/html
