FROM docker.io/node:lts@sha256:1de022d8459f896fff2e7b865823699dc7a8d5567507e8b87b14a7442e07f206 AS builder

RUN mkdir /app
WORKDIR /app
COPY ./package-lock.json ./package.json /app/

RUN --mount=type=cache,target=/root/.npm npm ci

COPY ./ /app
RUN --mount=type=cache,target=/root/.npm npm run build-docker

FROM docker.io/nginxinc/nginx-unprivileged:alpine-slim@sha256:fffab8a3a427aca0248572e53da56d98812984ceda02c44113aa4897c401e0b7 AS runtime
EXPOSE 8080
COPY --from=builder /app/dist/paste-perfect/browser /usr/share/nginx/html
