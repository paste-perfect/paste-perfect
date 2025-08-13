FROM docker.io/node:lts@sha256:5cc527147c43e671934c3530e9f66863162db5f57ce1ed0f227a3bb57b93cfab AS builder

RUN mkdir /app
WORKDIR /app
COPY ./package-lock.json ./package.json /app/

RUN npm ci

COPY ./ /app
RUN npm run build-docker

FROM docker.io/nginxinc/nginx-unprivileged:alpine-slim@sha256:a910bc3b8e3d28493ab397a42e882e00346da7a4b7e40f62b281cdc150cbda99 AS runtime
EXPOSE 8080
COPY --from=builder /app/dist/paste-perfect/browser /usr/share/nginx/html
