# flow: {phase: 5-implement, producer: agent/GLM-5.3-Flash (dockerizzazione), consumer: docker-compose, gate: gate_3_implementation}
# Fase 1: build SPA (Vite). Fase 2: nginx serve il bundle e fa da proxy /api → server.
FROM node:24-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
COPY shared/package.json shared/
COPY client/package.json client/
RUN npm ci
COPY tsconfig.base.json ./
COPY shared/ shared/
COPY client/ client/
RUN npm run build -w @ws/client

FROM nginx:1.27-alpine
COPY client/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/client/dist /usr/share/nginx/html
EXPOSE 80
