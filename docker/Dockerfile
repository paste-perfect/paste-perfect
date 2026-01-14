FROM docker.io/node:lts@sha256:0ab63cafa05b4c1db52959b40b7ea1f52753fe65f27a1b84f3991c296b1c16e6 AS builder

RUN mkdir /app
WORKDIR /app
COPY ./package-lock.json ./package.json /app/

RUN --mount=type=cache,target=/root/.npm npm ci

COPY ./ /app
RUN --mount=type=cache,target=/root/.npm npm run build-docker

FROM docker.io/nginxinc/nginx-unprivileged:alpine-slim@sha256:48bee27950e3b4e2099a62111161d3dbe2604b9aa8fe966a9356c0297898096a AS runtime
EXPOSE 8080
COPY --from=builder /app/dist/paste-perfect/browser /usr/share/nginx/html
