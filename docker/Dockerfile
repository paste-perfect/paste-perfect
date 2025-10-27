FROM docker.io/node:lts@sha256:23c24e85395992be118734a39903e08c8f7d1abc73978c46b6bda90060091a49 AS builder

RUN mkdir /app
WORKDIR /app
COPY ./package-lock.json ./package.json /app/

RUN --mount=type=cache,target=/root/.npm npm ci

COPY ./ /app
RUN --mount=type=cache,target=/root/.npm npm run build-docker

FROM docker.io/nginxinc/nginx-unprivileged:alpine-slim@sha256:369201a09c71d8e97df50f9a1f173e5a4c9f152bf644d18479119b730c161841 AS runtime
EXPOSE 8080
COPY --from=builder /app/dist/paste-perfect/browser /usr/share/nginx/html
