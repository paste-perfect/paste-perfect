FROM docker.io/node:lts@sha256:20988bcdc6dc76690023eb2505dd273bdeefddcd0bde4bfd1efe4ebf8707f747 AS builder

RUN mkdir /app
WORKDIR /app
COPY ./package-lock.json ./package.json /app/

RUN --mount=type=cache,target=/root/.npm npm ci

COPY ./ /app
RUN --mount=type=cache,target=/root/.npm npm run build-docker

FROM docker.io/nginxinc/nginx-unprivileged:alpine-slim@sha256:b19af7728166c4598a71a775dc08512c3ab9ff2c9627d776280546c332d0b8d9 AS runtime
EXPOSE 8080
COPY --from=builder /app/dist/paste-perfect/browser /usr/share/nginx/html
