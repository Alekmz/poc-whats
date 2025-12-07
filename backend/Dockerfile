FROM node:20-slim AS base

# Instalar dependências necessárias para produção (incluindo OpenSSL para Prisma)
RUN apt-get update && apt-get install -y \
    openssl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Dependências (todas, incluindo devDependencies para build)
FROM base AS deps
COPY package*.json ./
COPY prisma ./prisma/
# Usar npm install já que estamos em um workspace (sem package-lock.json local)
RUN npm install && npm cache clean --force

# Build
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY package*.json ./
COPY prisma ./prisma/
COPY . .
RUN npx prisma generate
RUN npm run build

# Dependências de produção apenas
FROM base AS prod-deps
COPY package*.json ./
# Usar npm install já que estamos em um workspace (sem package-lock.json local)
RUN npm install --omit=dev && npm cache clean --force

# Produção
FROM base AS runner
ENV NODE_ENV=production

# Instalar Prisma CLI globalmente para executar migrations
RUN npm install -g prisma@latest

# Criar usuário não-root
RUN groupadd --system --gid 1001 nodejs && \
    useradd --system --uid 1001 --gid nodejs nodejs

WORKDIR /app

# Copiar dependências de produção e build
COPY --from=prod-deps --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nodejs:nodejs /app/package*.json ./

# Copiar Prisma Client gerado do builder (necessário para o Prisma funcionar)
COPY --from=builder --chown=nodejs:nodejs /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=nodejs:nodejs /app/node_modules/@prisma ./node_modules/@prisma

USER nodejs

EXPOSE 4000

ENV PORT=4000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:4000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Executar migrations e depois iniciar o servidor
CMD sh -c "prisma migrate deploy && node dist/index.js"

