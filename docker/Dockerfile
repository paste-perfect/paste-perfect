FROM docker.io/node:lts@sha256:42ce5b9cfa5e702563763f93342b8a67de0962fe31098e0344136a95b1d21225 AS builder

RUN mkdir /app
WORKDIR /app
COPY ./package-lock.json ./package.json /app/

RUN --mount=type=cache,target=/root/.npm npm ci

COPY ./ /app
RUN --mount=type=cache,target=/root/.npm npm run build-docker

FROM docker.io/nginxinc/nginx-unprivileged:alpine-slim@sha256:e2b324ae5571b5ea49ddeb03c966b240f43e5ecbdf73adcd528b49399fe11ad6 AS runtime
EXPOSE 8080
COPY --from=builder /app/dist/paste-perfect/browser /usr/share/nginx/html
