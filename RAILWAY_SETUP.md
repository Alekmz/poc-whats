# 🚂 Configuração Railway - Plataforma WhatsApp

Este guia explica como fazer o deploy do backend e frontend no Railway.

## 📋 Pré-requisitos

1. Conta no [Railway](https://railway.app)
2. Serviços criados no Railway:
   - PostgreSQL (banco de dados)
   - Backend (serviço Node.js)
   - Frontend (serviço Next.js)

## 🏗️ Estrutura de Serviços no Railway

Você precisará criar 3 serviços no Railway:

1. **PostgreSQL** - Banco de dados
2. **Backend** - API Express
3. **Frontend** - Next.js App

## 📦 Passo 1: Criar Serviço PostgreSQL

1. No dashboard do Railway, clique em **"New Project"**
2. Selecione **"Database"** → **"Add PostgreSQL"**
3. Anote as variáveis de ambiente geradas (especialmente `DATABASE_URL`)

## 🔧 Passo 2: Configurar Backend

### 2.1 Criar Serviço Backend

1. No mesmo projeto, clique em **"New"** → **"GitHub Repo"**
2. Selecione seu repositório
3. Configure o serviço:
   - **Root Directory**: `backend`
   - **Build Command**: (deixe vazio, o Dockerfile cuida disso)
   - **Start Command**: (deixe vazio, o Dockerfile cuida disso)

### 2.2 Configurar Variáveis de Ambiente do Backend

No serviço do backend, adicione as seguintes variáveis de ambiente:

```env
# Banco de Dados (use a variável do serviço PostgreSQL)
DATABASE_URL=${{Postgres.DATABASE_URL}}

# Node
NODE_ENV=production
PORT=4000

# JWT
JWT_SECRET=seu-jwt-secret-super-seguro-aqui
JWT_REFRESH_SECRET=seu-jwt-refresh-secret-super-seguro-aqui
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d

# Frontend URL (será configurado após criar o frontend)
FRONTEND_URL=https://seu-frontend.railway.app

# Chatwoot (se estiver usando)
CHATWOOT_API_BASE_URL=https://seu-chatwoot.com
CHATWOOT_API_TOKEN=seu-token-chatwoot
CHATWOOT_ACCOUNT_ID=1

# Meta WhatsApp API (se estiver usando)
META_API_BASE_URL=https://graph.facebook.com/v18.0
META_API_TOKEN=seu-token-meta
META_PHONE_NUMBER_ID=seu-phone-number-id
META_WEBHOOK_SECRET=seu-webhook-secret
META_WEBHOOK_VERIFY_TOKEN=seu-verify-token

# Z-API (se estiver usando)
ZAPI_API_BASE=https://api.z-api.io
ZAPI_INSTANCE_ID=seu-instance-id
ZAPI_TOKEN=seu-token-zapi
ZAPI_CLIENT_TOKEN=seu-client-token
```

### 2.3 Configurar Deploy do Backend

1. No serviço do backend, vá em **"Settings"** → **"Deploy"**
2. Configure:
   - **Dockerfile Path**: `Dockerfile` (usa o Dockerfile de produção, não o `.dev`)
   - **Root Directory**: `backend`
3. Salve as configurações

**Importante**: O Railway usa automaticamente o `Dockerfile` (produção), não o `Dockerfile.dev` (desenvolvimento).

### 2.4 Executar Migrations

Após o primeiro deploy, você precisará executar as migrations do Prisma:

1. No serviço do backend, vá em **"Deployments"**
2. Clique no deployment mais recente
3. Abra o terminal (ou use Railway CLI):
   ```bash
   railway run --service backend npx prisma migrate deploy
   railway run --service backend npm run prisma:seed
   ```

**Alternativa usando Railway CLI:**
```bash
# Instalar Railway CLI
npm i -g @railway/cli

# Login
railway login

# Link ao projeto
railway link

# Executar migrations
railway run --service backend npx prisma migrate deploy
railway run --service backend npm run prisma:seed
```

## 🎨 Passo 3: Configurar Frontend

### 3.1 Criar Serviço Frontend

1. No mesmo projeto, clique em **"New"** → **"GitHub Repo"**
2. Selecione o mesmo repositório
3. Configure o serviço:
   - **Root Directory**: `frontend`
   - **Build Command**: (deixe vazio, o Dockerfile cuida disso)
   - **Start Command**: (deixe vazio, o Dockerfile cuida disso)

### 3.2 Configurar Variáveis de Ambiente do Frontend

No serviço do frontend, adicione:

```env
# API URL (use a URL pública do backend)
NEXT_PUBLIC_API_URL=https://seu-backend.railway.app

# Node
NODE_ENV=production
```

### 3.3 Configurar Deploy do Frontend

1. No serviço do frontend, vá em **"Settings"** → **"Deploy"**
2. Configure:
   - **Dockerfile Path**: `Dockerfile` (usa o Dockerfile de produção, não o `.dev`)
   - **Root Directory**: `frontend`
3. Salve as configurações

**Importante**: O Railway usa automaticamente o `Dockerfile` (produção), não o `Dockerfile.dev` (desenvolvimento).

### 3.4 Atualizar FRONTEND_URL no Backend

Após o frontend ser deployado, atualize a variável `FRONTEND_URL` no backend com a URL pública do frontend.

## 🔗 Passo 4: Configurar Domínios Customizados (Opcional)

### Backend

1. No serviço do backend, vá em **"Settings"** → **"Networking"**
2. Clique em **"Generate Domain"** ou adicione um domínio customizado
3. Anote a URL gerada

### Frontend

1. No serviço do frontend, vá em **"Settings"** → **"Networking"**
2. Clique em **"Generate Domain"** ou adicione um domínio customizado
3. Atualize `NEXT_PUBLIC_API_URL` no frontend com a URL do backend
4. Atualize `FRONTEND_URL` no backend com a URL do frontend

## 🔄 Passo 5: Configurar Health Checks

Os health checks já estão configurados nos Dockerfiles:

- **Backend**: `/health`
- **Frontend**: `/` (raiz)

O Railway detectará automaticamente esses endpoints.

## 📝 Passo 6: Variáveis de Ambiente Referenciadas

O Railway permite referenciar variáveis de outros serviços usando a sintaxe `${{ServiceName.VARIABLE_NAME}}`.

### Exemplo no Backend:

```env
# Referenciar DATABASE_URL do serviço PostgreSQL
DATABASE_URL=${{Postgres.DATABASE_URL}}

# Referenciar URL do frontend (após criar o serviço)
FRONTEND_URL=${{Frontend.RAILWAY_PUBLIC_DOMAIN}}
```

### Exemplo no Frontend:

```env
# Referenciar URL do backend
NEXT_PUBLIC_API_URL=${{Backend.RAILWAY_PUBLIC_DOMAIN}}
```

## 🚀 Deploy Automático

O Railway faz deploy automático quando você faz push para a branch principal do repositório conectado.

Para configurar:

1. Vá em **"Settings"** → **"Source"**
2. Selecione a branch (geralmente `main` ou `master`)
3. O deploy será automático a cada push

## 🔍 Troubleshooting

### Backend não inicia

1. Verifique os logs: **"Deployments"** → Selecione o deployment → **"View Logs"**
2. Verifique se todas as variáveis de ambiente estão configuradas
3. Verifique se as migrations foram executadas:
   ```bash
   railway run --service backend npx prisma migrate status
   ```

### Frontend não conecta ao backend

1. Verifique se `NEXT_PUBLIC_API_URL` está correto no frontend
2. Verifique se `FRONTEND_URL` está correto no backend (para CORS)
3. Verifique os logs do backend para erros de CORS

### Erro de Prisma

1. Certifique-se de que `DATABASE_URL` está configurado corretamente
2. Execute as migrations:
   ```bash
   railway run --service backend npx prisma migrate deploy
   ```
3. Gere o Prisma Client:
   ```bash
   railway run --service backend npx prisma generate
   ```

### Build falha

1. Verifique os logs de build
2. Certifique-se de que os Dockerfiles estão corretos
3. Verifique se todas as dependências estão no `package.json`

## 📚 Recursos Adicionais

- [Documentação Railway](https://docs.railway.app)
- [Railway CLI](https://docs.railway.app/develop/cli)
- [Variáveis de Ambiente Railway](https://docs.railway.app/develop/variables)

## ✅ Checklist de Deploy

- [ ] Serviço PostgreSQL criado
- [ ] Serviço Backend criado e configurado
- [ ] Variáveis de ambiente do backend configuradas
- [ ] Migrations executadas
- [ ] Seed executado (se necessário)
- [ ] Serviço Frontend criado e configurado
- [ ] Variáveis de ambiente do frontend configuradas
- [ ] Domínios gerados/configurados
- [ ] `FRONTEND_URL` atualizado no backend
- [ ] `NEXT_PUBLIC_API_URL` atualizado no frontend
- [ ] Health checks funcionando
- [ ] Testes de integração realizados

## 🎯 Próximos Passos

Após o deploy bem-sucedido:

1. Configure webhooks externos (Meta, Z-API) para apontar para a URL do backend
2. Configure domínios customizados (se necessário)
3. Configure SSL/HTTPS (automático no Railway)
4. Configure monitoramento e alertas
5. Configure backups do banco de dados
