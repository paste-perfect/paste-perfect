FROM node:lts AS builder

RUN mkdir /app
WORKDIR /app
COPY ./package-lock.json ./package.json /app/

RUN npm ci

COPY ./ /app
RUN npm run build-docker

FROM nginx:alpine-slim AS runtime

COPY --from=builder /app/dist/paste-perfect/browser /usr/share/nginx/html
