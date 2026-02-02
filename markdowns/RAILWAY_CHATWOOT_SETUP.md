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

**⚠️ Nota sobre extensão `pgvector`**: O Chatwoot tenta criar a extensão `vector` durante o setup. Se o PostgreSQL do Railway não tiver essa extensão, o setup continuará mesmo assim (o Dockerfile foi configurado para tratar esse erro). Funcionalidades de busca vetorial/IA podem não estar disponíveis, mas o Chatwoot funcionará normalmente.

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
ENABLE_ACCOUNT_SIGNUP=true
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

**Opção 1: Via Interface Web (Recomendado)**

1. Acesse a URL do Chatwoot
2. Se o botão "Sign Up" aparecer, clique nele
3. Crie conta de administrador
4. Crie uma Inbox (Settings → Inboxes → Add Inbox → API)
5. Gere API Token (Settings → Applications → New Application)
6. Copie o token gerado

**Opção 2: Acessar Página de Signup Diretamente**

Se o botão não aparecer, tente acessar diretamente:
- URL: `https://seu-chatwoot.railway.app/app/auth/signup`

**Opção 3: Criar Usuário via Console Rails (Se as opções acima não funcionarem)**

Se o registro ainda não estiver disponível, você pode criar o primeiro usuário administrador via console Rails no Railway:

1. No Railway, vá para o serviço Chatwoot
2. Use o Railway CLI:
   ```bash
   railway run --service chatwoot bundle exec rails console
   ```

3. No console Rails, execute:
   ```ruby
   account = Account.create!(name: 'Minha Conta')
   user = User.create!(
     name: 'Administrador',
     email: 'admin@exemplo.com',
     password: 'sua_senha_segura',
     password_confirmation: 'sua_senha_segura',
     confirmed_at: Time.current
   )
   account_user = AccountUser.create!(
     account: account,
     user: user,
     role: :administrator
   )
   puts "✅ Usuário criado: #{user.email}"
   exit
   ```

Depois disso, você poderá fazer login com o email e senha criados.

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

### Erro: extensão "vector" não disponível
**Sintoma**: Logs mostram `ERROR: extension "vector" is not available`

**Solução**: Isso é esperado se o PostgreSQL do Railway não tiver `pgvector`. O Dockerfile foi configurado para continuar mesmo sem a extensão. O Chatwoot funcionará normalmente, mas funcionalidades de busca vetorial/IA podem não estar disponíveis. Verifique os logs para confirmar que o servidor iniciou após o erro.

### Erro de conexão com banco
- Verifique se as variáveis do PostgreSQL estão corretas
- Teste a conexão manualmente

### Backend não conecta ao Chatwoot
- Verifique se a URL está correta (deve ser pública com `https://`)
- Verifique se o token está correto
- Teste a API do Chatwoot manualmente

### Botão de Registro não aparece

**Sintoma**: Apenas a tela de login aparece, sem opção de registro.

**Soluções**:

1. **Verificar variável de ambiente**:
   - No Railway, vá em **Settings** → **Variables**
   - Verifique se `ENABLE_ACCOUNT_SIGNUP=true` está configurada
   - Se não estiver, adicione e faça redeploy

2. **Acessar página de signup diretamente**:
   - Tente acessar: `https://seu-chatwoot.railway.app/app/auth/signup`

3. **Criar usuário via console Rails** (veja Opção 3 na seção "Criar Conta e Obter Token")

4. **Fazer redeploy** após adicionar a variável:
   - No Railway, vá em **Deployments** → **Redeploy**

## 📚 Documentação Completa

Para instruções detalhadas, consulte [RAILWAY_SETUP.md](./RAILWAY_SETUP.md#passo-4-configurar-chatwoot).
