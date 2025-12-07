# 🚂 Configuração Railway - Plataforma WhatsApp

Este guia explica como fazer o deploy completo da plataforma WhatsApp no Railway, incluindo:
- Backend (API Express)
- Frontend (Next.js)
- Chatwoot (Plataforma de atendimento)
- PostgreSQL (Banco de dados)
- Redis (Cache e filas)

## 📋 Pré-requisitos

1. Conta no [Railway](https://railway.app)
2. Serviços criados no Railway:
   - PostgreSQL (banco de dados)
   - Backend (serviço Node.js)
   - Frontend (serviço Next.js)

## 🏗️ Estrutura de Serviços no Railway

Você precisará criar os seguintes serviços no Railway:

1. **PostgreSQL** - Banco de dados
2. **Redis** - Cache e filas (necessário para Chatwoot)
3. **Backend** - API Express
4. **Frontend** - Next.js App
5. **Chatwoot** - Plataforma de atendimento (opcional, mas recomendado)

## 📦 Passo 1: Criar Serviços de Infraestrutura

### 1.1 Criar Serviço PostgreSQL

1. No dashboard do Railway, clique em **"New Project"**
2. Selecione **"Database"** → **"Add PostgreSQL"**
3. Anote as variáveis de ambiente geradas (especialmente `DATABASE_URL`)

### 1.2 Criar Serviço Redis

1. No mesmo projeto, clique em **"New"** → **"Database"** → **"Add Redis"**
2. Anote a variável `REDIS_URL` gerada (será usada pelo Chatwoot)

**Nota**: O Redis é necessário para o Chatwoot funcionar corretamente (cache e filas de jobs).

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

## 💬 Passo 4: Configurar Chatwoot

O Chatwoot é uma plataforma de atendimento que permite gerenciar conversas do WhatsApp de forma centralizada.

### 4.1 Criar Serviço Chatwoot

1. No mesmo projeto, clique em **"New"** → **"GitHub Repo"**
2. Selecione o mesmo repositório
3. Configure o serviço:
   - **Root Directory**: `chatwoot`
   - **Build Command**: (deixe vazio, o Dockerfile cuida disso)
   - **Start Command**: (deixe vazio, o Dockerfile cuida disso)

### 4.2 Configurar Deploy do Chatwoot

1. No serviço do Chatwoot, vá em **"Settings"** → **"Deploy"**
2. Configure:
   - **Dockerfile Path**: `Dockerfile`
   - **Root Directory**: `chatwoot`
3. Salve as configurações

### 4.3 Preparar Banco de Dados para Chatwoot

Antes de iniciar o Chatwoot, você precisa criar o banco de dados `chatwoot_production` no PostgreSQL:

1. No serviço PostgreSQL, vá em **"Data"** → **"Query"**
2. Execute o seguinte SQL:
   ```sql
   CREATE DATABASE chatwoot_production;
   ```
3. Ou use o Railway CLI:
   ```bash
   railway run --service postgres psql $DATABASE_URL -c "CREATE DATABASE chatwoot_production;"
   ```

**Alternativa**: O Chatwoot tentará criar o banco automaticamente na primeira inicialização, mas é recomendado criar manualmente.

### 4.4 Configurar Variáveis de Ambiente do Chatwoot

No serviço do Chatwoot, adicione as seguintes variáveis de ambiente:

**Nota**: Para encontrar os nomes corretos das variáveis do PostgreSQL e Redis:
1. Vá no serviço PostgreSQL → **"Variables"** → Veja os nomes das variáveis disponíveis
2. Vá no serviço Redis → **"Variables"** → Veja os nomes das variáveis disponíveis
3. Use a sintaxe `${{ServiceName.VARIABLE_NAME}}` para referenciar

**Exemplo de variáveis do Chatwoot:**

```env
# PostgreSQL (use as variáveis do serviço PostgreSQL)
# Nota: Os nomes podem variar. Verifique no dashboard do Railway
POSTGRES_HOST=${{Postgres.PGHOST}}
POSTGRES_DATABASE=chatwoot_production
POSTGRES_USERNAME=${{Postgres.PGUSER}}
POSTGRES_PASSWORD=${{Postgres.PGPASSWORD}}
POSTGRES_PORT=${{Postgres.PGPORT}}

# Alternativa: Se o Railway não expor variáveis individuais, você pode usar DATABASE_URL
# e extrair os valores, ou configurar manualmente

# Redis (use a variável do serviço Redis)
REDIS_URL=${{Redis.REDIS_URL}}
# Ou se o nome do serviço for diferente:
# REDIS_URL=${{Redis.REDISCLOUD_URL}}

# Rails
RAILS_ENV=production
SECRET_KEY_BASE=seu-secret-key-base-super-seguro-aqui-gerar-com-rails-secret

# Frontend URL (será configurado após gerar domínio)
FRONTEND_URL=https://seu-chatwoot.railway.app

# Configurações
FORCE_SSL=false
INSTALLATION_NAME=WhatsApp Platform Chatwoot
INSTALLATION_VERSION=1.0.0

# Porta
PORT=3000
```

**Importante**: 
- Gere um `SECRET_KEY_BASE` seguro. Você pode usar:
  ```bash
  openssl rand -hex 64
  ```
- O `FRONTEND_URL` será atualizado após gerar o domínio do Chatwoot.

### 4.5 Primeira Inicialização do Chatwoot

Após o primeiro deploy do Chatwoot:

1. Aguarde o serviço iniciar (pode levar 2-3 minutos)
2. Verifique os logs para confirmar que o setup foi executado
3. O Chatwoot executará automaticamente `rails db:chatwoot_prepare` na primeira inicialização

**Se o setup automático falhar**, execute manualmente via Railway CLI:
```bash
railway run --service chatwoot bundle exec rails db:chatwoot_prepare
```

### 4.6 Gerar Domínio do Chatwoot

1. No serviço do Chatwoot, vá em **"Settings"** → **"Networking"**
2. Clique em **"Generate Domain"**
3. Anote a URL gerada (ex: `https://chatwoot-production-xxxx.up.railway.app`)
4. Atualize a variável `FRONTEND_URL` no serviço Chatwoot com esta URL

### 4.7 Criar Conta de Administrador

1. Acesse a URL do Chatwoot (ex: `https://chatwoot-production-xxxx.up.railway.app`)
2. Clique em **"Sign Up"** ou **"Create Account"**
3. Preencha os dados do primeiro administrador
4. Faça login

### 4.8 Criar uma Inbox

1. No Chatwoot, vá em **Settings** → **Inboxes**
2. Clique em **Add Inbox**
3. Escolha o tipo **"API"**
4. Preencha:
   - **Name**: WhatsApp Platform
   - **Description**: Inbox para integração com WhatsApp
5. Clique em **Create**
6. **Anote o Inbox ID** (você precisará dele)

### 4.9 Gerar API Token

1. No Chatwoot, vá em **Settings** → **Applications**
2. Clique em **New Application**
3. Preencha:
   - **Name**: WhatsApp Platform API
   - **Description**: API para integração com a plataforma WhatsApp
4. Clique em **Create**
5. **Copie o API Token** gerado (você só verá uma vez!)

**Importante**: Salve este token em um local seguro. Você precisará dele para configurar o backend.

### 4.10 Obter Account ID

1. No Chatwoot, vá em **Settings** → **Account**
2. O **Account ID** está visível na URL ou no topo da página
3. Geralmente é `1` para a primeira conta

### 4.11 Configurar Chatwoot no Backend

Atualize as variáveis de ambiente do backend com as informações do Chatwoot:

```env
# Chatwoot (use a URL pública do serviço Chatwoot)
CHATWOOT_API_BASE_URL=https://seu-chatwoot.railway.app
CHATWOOT_API_TOKEN=seu-token-gerado-no-passo-4.9
CHATWOOT_ACCOUNT_ID=1
```

**Importante**: 
- Use a URL pública do Chatwoot (com `https://`), não a URL interna
- O backend precisa conseguir acessar o Chatwoot pela internet

### 4.12 Reiniciar o Backend

Após configurar as variáveis do Chatwoot no backend:

1. Vá no serviço do backend
2. Clique em **"Deployments"** → **"Redeploy"** (ou faça um novo deploy)
3. Verifique os logs para confirmar que a conexão com o Chatwoot está funcionando

## 🔗 Passo 5: Configurar Domínios Customizados (Opcional)

### Backend

1. No serviço do backend, vá em **"Settings"** → **"Networking"**
2. Clique em **"Generate Domain"** ou adicione um domínio customizado
3. Anote a URL gerada

### Frontend

1. No serviço do frontend, vá em **"Settings"** → **"Networking"**
2. Clique em **"Generate Domain"** ou adicione um domínio customizado
3. Atualize `NEXT_PUBLIC_API_URL` no frontend com a URL do backend
4. Atualize `FRONTEND_URL` no backend com a URL do frontend

## 🔄 Passo 6: Configurar Health Checks

Os health checks já estão configurados nos Dockerfiles:

- **Backend**: `/health`
- **Frontend**: `/` (raiz)

O Railway detectará automaticamente esses endpoints.

**Health Checks configurados:**
- **Backend**: `/health`
- **Frontend**: `/` (raiz)
- **Chatwoot**: `/` (raiz) - verifica se o servidor Rails está respondendo

## 📝 Passo 7: Variáveis de Ambiente Referenciadas

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

### Chatwoot não inicia

1. Verifique os logs: **"Deployments"** → Selecione o deployment → **"View Logs"**
2. Verifique se o banco `chatwoot_production` foi criado:
   ```bash
   railway run --service postgres psql $DATABASE_URL -c "\l"
   ```
3. Verifique se todas as variáveis de ambiente estão configuradas
4. Verifique se o Redis está acessível
5. Execute o setup manualmente se necessário:
   ```bash
   railway run --service chatwoot bundle exec rails db:chatwoot_prepare
   ```

### Backend não consegue conectar ao Chatwoot

1. Verifique se o Chatwoot está rodando e acessível pela URL pública
2. Verifique se `CHATWOOT_API_BASE_URL` está correto (deve ser a URL pública com `https://`)
3. Verifique se `CHATWOOT_API_TOKEN` está correto
4. Teste a conexão manualmente:
   ```bash
   curl -H "api_access_token: SEU_TOKEN" https://seu-chatwoot.railway.app/api/v1/accounts/1/inboxes
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

### Infraestrutura
- [ ] Serviço PostgreSQL criado
- [ ] Serviço Redis criado
- [ ] Banco `chatwoot_production` criado no PostgreSQL

### Backend
- [ ] Serviço Backend criado e configurado
- [ ] Variáveis de ambiente do backend configuradas
- [ ] Migrations executadas
- [ ] Seed executado (se necessário)
- [ ] Domínio gerado/configurado

### Frontend
- [ ] Serviço Frontend criado e configurado
- [ ] Variáveis de ambiente do frontend configuradas
- [ ] Domínio gerado/configurado
- [ ] `NEXT_PUBLIC_API_URL` atualizado com URL do backend

### Chatwoot
- [ ] Serviço Chatwoot criado e configurado
- [ ] Variáveis de ambiente do Chatwoot configuradas
- [ ] Setup inicial executado (`rails db:chatwoot_prepare`)
- [ ] Domínio gerado/configurado
- [ ] Conta de administrador criada
- [ ] Inbox criada
- [ ] API Token gerado
- [ ] Account ID obtido
- [ ] Variáveis do Chatwoot configuradas no backend

### Integração
- [ ] `FRONTEND_URL` atualizado no backend
- [ ] `CHATWOOT_API_BASE_URL` configurado no backend
- [ ] `CHATWOOT_API_TOKEN` configurado no backend
- [ ] Health checks funcionando
- [ ] Testes de integração realizados

## 🎯 Próximos Passos

Após o deploy bem-sucedido:

1. ✅ Configure webhooks externos (Meta, Z-API) para apontar para a URL do backend
2. ✅ Configure domínios customizados (se necessário)
3. ✅ Configure SSL/HTTPS (automático no Railway)
4. ✅ Teste a integração Chatwoot ↔ Backend
5. ✅ Configure monitoramento e alertas
6. ✅ Configure backups do banco de dados
7. ✅ Configure integração WhatsApp (Meta API ou Z-API) no Chatwoot

## 📚 Documentação Adicional

- [Guia de Configuração do Chatwoot](./CHATWOOT_SETUP.md) - Para desenvolvimento local
- [Documentação Railway](https://docs.railway.app)
- [Railway CLI](https://docs.railway.app/develop/cli)
- [Variáveis de Ambiente Railway](https://docs.railway.app/develop/variables)
- [Documentação do Chatwoot](https://www.chatwoot.com/docs)
