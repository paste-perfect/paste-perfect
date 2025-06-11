FROM docker.io/node:lts@sha256:6a2972b55a5032ed961f5239c7a829c439fb54fc1d99ca5dccb2094860a47b97 AS builder

RUN mkdir /app
WORKDIR /app
COPY ./package-lock.json ./package.json /app/

RUN npm ci

COPY ./ /app
RUN npm run build-docker

FROM docker.io/nginxinc/nginx-unprivileged:alpine-slim@sha256:66e34aa81c2faf290ea4e4c28a490f2b35a07478265a2d5994c8637506045eee AS runtime
EXPOSE 8080
COPY --from=builder /app/dist/paste-perfect/browser /usr/share/nginx/html
