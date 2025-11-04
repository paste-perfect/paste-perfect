FROM docker.io/node:lts@sha256:55b6bbed4323ccaf9287d7e0578bf0af393bd2c9521f6fb99e0b3ce2b00d914b AS builder

RUN mkdir /app
WORKDIR /app
COPY ./package-lock.json ./package.json /app/

RUN --mount=type=cache,target=/root/.npm npm ci

COPY ./ /app
RUN --mount=type=cache,target=/root/.npm npm run build-docker

FROM docker.io/nginxinc/nginx-unprivileged:alpine-slim@sha256:1632c26ddb3249ef8fe939f871f2020dbc00e65f02121a80c66f1dd0cdca9235 AS runtime
EXPOSE 8080
COPY --from=builder /app/dist/paste-perfect/browser /usr/share/nginx/html
