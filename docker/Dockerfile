FROM docker.io/node:lts@sha256:3266bc9e8bee1acc8a77386eefaf574987d2729b8c5ec35b0dbd6ddbc40b0ce2 AS builder

RUN mkdir /app
WORKDIR /app
COPY ./package-lock.json ./package.json /app/

RUN npm ci

COPY ./ /app
RUN npm run build-docker

FROM docker.io/nginxinc/nginx-unprivileged:alpine-slim@sha256:ea6c4b8b568824ea94cd1fabd47e1c4e7c0c04744f344a3793f7e9c8ac3a3636 AS runtime
EXPOSE 8080
COPY --from=builder /app/dist/paste-perfect/browser /usr/share/nginx/html
