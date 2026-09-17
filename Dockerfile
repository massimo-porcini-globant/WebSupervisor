# flow: {phase: 5-implement, producer: agent/GLM-5.3-Flash (dockerizzazione), consumer: docker-compose, gate: gate_3_implementation}
# Immagine API WebSupervisor: build con toolchain (better-sqlite3 compila da sorgente), runtime slim.
FROM node:24 AS build
WORKDIR /app

COPY package.json package-lock.json ./
COPY shared/package.json shared/
COPY server/package.json server/
RUN npm ci

COPY tsconfig.base.json ./
COPY shared/ shared/
COPY server/ server/

FROM node:24-slim
WORKDIR /app
ENV NODE_ENV=production

COPY --from=build /app/package.json /app/package-lock.json ./
COPY --from=build /app/node_modules node_modules
COPY --from=build /app/tsconfig.base.json ./
COPY --from=build /app/shared shared/
COPY --from=build /app/server server/

EXPOSE 3000
ENV HOST=0.0.0.0 DB_PATH=/dati/app.db
VOLUME /dati

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s \
  CMD node -e "fetch('http://127.0.0.1:3000/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

# Seed idempotente (onConflictDoNothing) e avvio API
CMD ["sh", "-c", "node node_modules/tsx/dist/cli.mjs server/src/data/seed.ts && exec node node_modules/tsx/dist/cli.mjs server/src/server.ts"]
