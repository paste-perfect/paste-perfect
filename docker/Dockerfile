FROM docker.io/node:lts@sha256:978e96850e9e828eda68610829a01f70317e353dcd3d146f2fff93880f13dcb4 AS builder

RUN mkdir /app
WORKDIR /app
COPY ./package-lock.json ./package.json /app/

RUN npm ci

COPY ./ /app
RUN npm run build-docker

FROM docker.io/nginxinc/nginx-unprivileged:alpine-slim@sha256:ed77455750aab87bfbd1fa741582c36ad2a3c28db68d46cc74ecc7bf63e09769 AS runtime
EXPOSE 8080
COPY --from=builder /app/dist/paste-perfect/browser /usr/share/nginx/html
