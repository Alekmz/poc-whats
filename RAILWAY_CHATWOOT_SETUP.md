# 🚂 Configuração Rápida do Chatwoot no Railway

Este guia fornece instruções rápidas para configurar o Chatwoot no Railway.

## 📋 Pré-requisitos

- Serviço PostgreSQL já criado no Railway
- Serviço Redis já criado no Railway
- Acesso ao dashboard do Railway

## 🚀 Passos Rápidos

### 1. Criar Serviço Chatwoot

1. No projeto Railway, clique em **"New"** → **"GitHub Repo"**
2. Selecione seu repositório
3. Configure:
   - **Root Directory**: `chatwoot`
   - **Build Command**: (deixe vazio)
   - **Start Command**: (deixe vazio)

### 2. Configurar Deploy

1. **Settings** → **"Deploy"**
2. Configure:
   - **Dockerfile Path**: `Dockerfile`
   - **Root Directory**: `chatwoot`

### 3. Criar Banco de Dados

No serviço PostgreSQL, execute:

```sql
CREATE DATABASE chatwoot_production;
```

Ou via Railway CLI:
```bash
railway run --service postgres psql $DATABASE_URL -c "CREATE DATABASE chatwoot_production;"
```

### 4. Configurar Variáveis de Ambiente

No serviço Chatwoot, adicione:

```env
# PostgreSQL
POSTGRES_HOST=${{Postgres.PGHOST}}
POSTGRES_DATABASE=chatwoot_production
POSTGRES_USERNAME=${{Postgres.PGUSER}}
POSTGRES_PASSWORD=${{Postgres.PGPASSWORD}}
POSTGRES_PORT=${{Postgres.PGPORT}}

# Redis
REDIS_URL=${{Redis.REDIS_URL}}

# Rails
RAILS_ENV=production
SECRET_KEY_BASE=GERE_UM_SECRET_AQUI
FRONTEND_URL=https://seu-chatwoot.railway.app
FORCE_SSL=false
INSTALLATION_NAME=WhatsApp Platform Chatwoot
PORT=3000
```

**Gerar SECRET_KEY_BASE:**
```bash
openssl rand -hex 64
```

### 5. Gerar Domínio

1. **Settings** → **"Networking"** → **"Generate Domain"**
2. Copie a URL gerada
3. Atualize `FRONTEND_URL` com esta URL

### 6. Aguardar Primeira Inicialização

- Aguarde 2-3 minutos para o Chatwoot iniciar
- Verifique os logs para confirmar o setup

### 7. Criar Conta e Obter Token

1. Acesse a URL do Chatwoot
2. Crie conta de administrador
3. Crie uma Inbox (Settings → Inboxes → Add Inbox → API)
4. Gere API Token (Settings → Applications → New Application)
5. Copie o token gerado

### 8. Configurar no Backend

No serviço Backend, adicione/atualize:

```env
CHATWOOT_API_BASE_URL=https://seu-chatwoot.railway.app
CHATWOOT_API_TOKEN=seu-token-copiado
CHATWOOT_ACCOUNT_ID=1
```

### 9. Reiniciar Backend

Redeploy o backend para aplicar as novas variáveis.

## ✅ Verificação

Teste a conexão:
```bash
curl -H "api_access_token: SEU_TOKEN" \
  https://seu-chatwoot.railway.app/api/v1/accounts/1/inboxes
```

## 🔍 Troubleshooting

### Chatwoot não inicia
- Verifique se o banco `chatwoot_production` existe
- Verifique se todas as variáveis estão configuradas
- Verifique os logs do serviço

### Erro de conexão com banco
- Verifique se as variáveis do PostgreSQL estão corretas
- Teste a conexão manualmente

### Backend não conecta ao Chatwoot
- Verifique se a URL está correta (deve ser pública com `https://`)
- Verifique se o token está correto
- Teste a API do Chatwoot manualmente

## 📚 Documentação Completa

Para instruções detalhadas, consulte [RAILWAY_SETUP.md](./RAILWAY_SETUP.md#passo-4-configurar-chatwoot).
