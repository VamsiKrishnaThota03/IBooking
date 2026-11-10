# syntax=docker/dockerfile:1

FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
# bcrypt ships prebuilt binaries for Alpine/arm64 and x64; build tools are
# installed only as a fallback so `npm install` cannot fail on a cache miss.
RUN apk add --no-cache --virtual .build python3 make g++ \
  && npm install --omit=dev --no-audit --no-fund \
  && apk del .build

FROM node:20-alpine AS runtime
WORKDIR /app

ENV NODE_ENV=production
# The published port is the security boundary (see docker-compose.yml); inside
# the container the listener must accept the Docker network.
ENV HOST=0.0.0.0
ENV PORT=5000

COPY --from=deps --chown=node:node /app/node_modules ./node_modules
COPY --chown=node:node package.json ./
COPY --chown=node:node index.js app.js config.js db.js seed.js ./
COPY --chown=node:node api ./api
COPY --chown=node:node models ./models
COPY --chown=node:node middleware ./middleware
COPY --chown=node:node utils ./utils

USER node
EXPOSE 5000

# Liveness, not readiness: the process should stay up through a Mongo blip.
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||5000)+'/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "index.js"]
