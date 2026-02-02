# 🐳 Configuração Docker - Desenvolvimento Local e Produção

Este guia explica como usar Docker para desenvolvimento local e produção (Railway).

## 📁 Estrutura de Dockerfiles

O projeto possui Dockerfiles separados para desenvolvimento e produção:

### Desenvolvimento Local (docker-compose)
- `backend/Dockerfile.dev` - Backend para desenvolvimento
- `frontend/Dockerfile.dev` - Frontend para desenvolvimento

### Produção (Railway)
- `backend/Dockerfile` - Backend otimizado para produção
- `frontend/Dockerfile` - Frontend otimizado para produção

## 🏠 Desenvolvimento Local

### Pré-requisitos
- Docker e Docker Compose instalados
- Arquivo `.env` na raiz do projeto (veja `.env.example`)

### Iniciar Serviços

```bash
# Iniciar todos os serviços
docker compose up -d

# Ver logs
docker compose logs -f

# Parar serviços
docker compose down
```

### Serviços Disponíveis

- **Backend**: http://localhost:4000
- **Frontend**: http://localhost:3000
- **PostgreSQL**: localhost:5432
- **Redis**: localhost:6379
- **Chatwoot**: http://localhost:3001
- **Adminer**: http://localhost:8080

### Executar Migrations (Primeira Vez)

```bash
# Executar migrations do Prisma
docker compose exec backend npx prisma migrate deploy

# Executar seed
docker compose exec backend npm run prisma:seed
```

### Rebuild dos Containers

```bash
# Rebuild forçado
docker compose up -d --build

# Rebuild apenas backend
docker compose up -d --build backend

# Rebuild apenas frontend
docker compose up -d --build frontend
```

## 🚂 Produção (Railway)

Os Dockerfiles de produção (`Dockerfile` sem `.dev`) são usados automaticamente no Railway.

### Configuração no Railway

1. **Backend**: Use `backend/Dockerfile` (padrão)
2. **Frontend**: Use `frontend/Dockerfile` (padrão)

O Railway detecta automaticamente os Dockerfiles na raiz de cada serviço.

### Diferenças entre Dev e Prod

#### Desenvolvimento (Dockerfile.dev)
- Instala todas as dependências (incluindo devDependencies)
- Usa volumes para hot-reload
- Roda em modo desenvolvimento
- Não otimiza builds

#### Produção (Dockerfile)
- Multi-stage build otimizado
- Apenas dependências de produção
- Build otimizado (TypeScript compilado, Next.js standalone)
- Executa migrations automaticamente no startup
- Imagens menores e mais seguras

## 🔧 Troubleshooting

### Backend não inicia

```bash
# Ver logs
docker compose logs backend

# Entrar no container
docker compose exec backend sh

# Verificar variáveis de ambiente
docker compose exec backend env
```

### Frontend não inicia

```bash
# Ver logs
docker compose logs frontend

# Reinstalar dependências
docker compose exec frontend npm install

# Limpar cache do Next.js
docker compose exec frontend rm -rf .next
```

### Problemas com Prisma

```bash
# Regenerar Prisma Client
docker compose exec backend npx prisma generate

# Ver status das migrations
docker compose exec backend npx prisma migrate status

# Resetar banco (CUIDADO: apaga todos os dados)
docker compose exec backend npx prisma migrate reset
```

### Limpar Tudo

```bash
# Parar e remover containers, volumes e imagens
docker compose down -v --rmi all

# Limpar sistema Docker (CUIDADO: remove tudo)
docker system prune -a --volumes
```

## 📝 Variáveis de Ambiente

### Desenvolvimento Local

Crie um arquivo `.env` na raiz do projeto:

```env
# JWT
JWT_SECRET=seu-secret-local
JWT_REFRESH_SECRET=seu-refresh-secret-local

# Chatwoot
CHATWOOT_API_TOKEN=seu-token
CHATWOOT_ACCOUNT_ID=1

# Outras variáveis...
```

### Produção (Railway)

Configure as variáveis de ambiente no dashboard do Railway (veja `RAILWAY_SETUP.md`).

## 🎯 Comandos Úteis

```bash
# Ver status dos containers
docker compose ps

# Ver logs em tempo real
docker compose logs -f [service]

# Executar comando em um container
docker compose exec [service] [command]

# Rebuild sem cache
docker compose build --no-cache

# Ver uso de recursos
docker stats
```

## 📚 Documentação Adicional

- [RAILWAY_SETUP.md](./RAILWAY_SETUP.md) - Configuração completa do Railway
- [RAILWAY_QUICK_START.md](./RAILWAY_QUICK_START.md) - Guia rápido do Railway
- [README.md](./README.md) - Documentação geral do projeto
