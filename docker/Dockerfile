FROM docker.io/node:lts@sha256:23c24e85395992be118734a39903e08c8f7d1abc73978c46b6bda90060091a49 AS builder

RUN mkdir /app
WORKDIR /app
COPY ./package-lock.json ./package.json /app/

RUN --mount=type=cache,target=/root/.npm npm ci

COPY ./ /app
RUN --mount=type=cache,target=/root/.npm npm run build-docker

FROM docker.io/nginxinc/nginx-unprivileged:alpine-slim@sha256:12c043e84aa45acb3cca80f466c97e6963276d0cf330cd7c22b97289e86ad60b AS runtime
EXPOSE 8080
COPY --from=builder /app/dist/paste-perfect/browser /usr/share/nginx/html
