FROM docker.io/node:lts@sha256:50113f9d3a239ce9e523550e46363d3a8ca7b58f6af70fd9ecb4698b2ad89ccb AS builder

RUN mkdir /app
WORKDIR /app
COPY ./package-lock.json ./package.json /app/

RUN --mount=type=cache,target=/root/.npm npm ci

COPY ./ /app
RUN --mount=type=cache,target=/root/.npm npm run build-docker

FROM docker.io/nginxinc/nginx-unprivileged:alpine-slim@sha256:48bee27950e3b4e2099a62111161d3dbe2604b9aa8fe966a9356c0297898096a AS runtime
EXPOSE 8080
COPY --from=builder /app/dist/paste-perfect/browser /usr/share/nginx/html
