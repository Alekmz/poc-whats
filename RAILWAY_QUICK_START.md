# 🚀 Railway Quick Start

Guia rápido para deploy no Railway.

## 📦 Serviços Necessários

1. **PostgreSQL** - Banco de dados
2. **Backend** - API Express (porta 4000)
3. **Frontend** - Next.js (porta 3000)

## ⚡ Setup Rápido

### 1. Criar Serviços

No Railway Dashboard:
- **New Project** → **Add PostgreSQL**
- **New** → **GitHub Repo** → Selecionar repositório → Configurar como **Backend**
- **New** → **GitHub Repo** → Selecionar repositório → Configurar como **Frontend**

### 2. Configurar Backend

**Settings → Deploy:**
- Root Directory: `backend`
- Dockerfile Path: `backend/Dockerfile`

**Variables:**
```env
DATABASE_URL=${{Postgres.DATABASE_URL}}
NODE_ENV=production
PORT=4000
JWT_SECRET=seu-secret-aqui
JWT_REFRESH_SECRET=seu-refresh-secret-aqui
FRONTEND_URL=${{Frontend.RAILWAY_PUBLIC_DOMAIN}}
# ... outras variáveis (ver RAILWAY_SETUP.md)
```

**Após primeiro deploy:**
```bash
railway run --service backend npx prisma migrate deploy
railway run --service backend npm run prisma:seed
```

### 3. Configurar Frontend

**Settings → Deploy:**
- Root Directory: `frontend`
- Dockerfile Path: `frontend/Dockerfile`

**Variables:**
```env
NEXT_PUBLIC_API_URL=${{Backend.RAILWAY_PUBLIC_DOMAIN}}
NODE_ENV=production
```

### 4. Gerar Domínios

- Backend: **Settings → Networking → Generate Domain**
- Frontend: **Settings → Networking → Generate Domain**

### 5. Atualizar URLs

Após gerar os domínios, atualize:
- `FRONTEND_URL` no backend
- `NEXT_PUBLIC_API_URL` no frontend

## 🔍 Verificar Deploy

- Backend: `https://seu-backend.railway.app/health`
- Frontend: `https://seu-frontend.railway.app`

## 📚 Documentação Completa

Veja [RAILWAY_SETUP.md](./RAILWAY_SETUP.md) para instruções detalhadas.
