FROM docker.io/node:lts@sha256:b2b2184ba9b78c022e1d6a7924ec6fba577adf28f15c9d9c457730cc4ad3807a AS builder

RUN mkdir /app
WORKDIR /app
COPY ./package-lock.json ./package.json /app/

RUN --mount=type=cache,target=/root/.npm npm ci

COPY ./ /app
RUN --mount=type=cache,target=/root/.npm npm run build-docker

FROM docker.io/nginxinc/nginx-unprivileged:alpine-slim@sha256:a75b70e1479178becce46b2028076899e648665b88fd685472469b34316356ec AS runtime
EXPOSE 8080
COPY --from=builder /app/dist/paste-perfect/browser /usr/share/nginx/html
