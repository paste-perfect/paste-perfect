FROM docker.io/node:lts@sha256:8530f76a96d88820d288761f022e318970dda93d01536919fbc16076b7983e63 AS builder

RUN mkdir /app
WORKDIR /app
COPY ./package-lock.json ./package.json /app/

RUN --mount=type=cache,target=/root/.npm npm ci

COPY ./ /app
RUN --mount=type=cache,target=/root/.npm npm run build-docker

FROM docker.io/nginxinc/nginx-unprivileged:alpine-slim@sha256:01cb6604af2fd0dce17f7aab60759e47ad288bec0425ad4b43e749369d2eecca AS runtime
EXPOSE 8080
COPY --from=builder /app/dist/paste-perfect/browser /usr/share/nginx/html
