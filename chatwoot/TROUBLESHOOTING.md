# 🔧 Troubleshooting - Chatwoot no Railway

## Problema: Healthcheck falhando

Se o healthcheck continua falhando após o deploy, siga estes passos:

### 1. Verificar Logs do Serviço

No dashboard do Railway:
1. Vá no serviço Chatwoot
2. Clique em **"View Logs"** ou **"Logs"**
3. Procure por:
   - Mensagens de erro
   - "Iniciando servidor Chatwoot"
   - Erros de conexão com PostgreSQL ou Redis
   - Erros do Rails

### 2. Verificar Variáveis de Ambiente

Certifique-se de que todas estas variáveis estão configuradas:

```env
POSTGRES_HOST=${{Postgres.PGHOST}}
POSTGRES_DATABASE=chatwoot_production
POSTGRES_USERNAME=${{Postgres.PGUSER}}
POSTGRES_PASSWORD=${{Postgres.PGPASSWORD}}
POSTGRES_PORT=${{Postgres.PGPORT}}
REDIS_URL=${{Redis.REDIS_URL}}
RAILS_ENV=production
SECRET_KEY_BASE=<seu-secret-key-base>
FRONTEND_URL=https://seu-chatwoot.railway.app
FORCE_SSL=false
PORT=3000
```

**Importante**: 
- Verifique os nomes exatos das variáveis no dashboard do Railway
- Os nomes podem variar (ex: `Postgres` vs `PostgreSQL`)
- `SECRET_KEY_BASE` deve ser gerado com `openssl rand -hex 64`

### 3. Verificar Conexão com Banco de Dados

Execute via Railway CLI:

```bash
railway run --service chatwoot psql -h $POSTGRES_HOST -U $POSTGRES_USERNAME -d $POSTGRES_DATABASE -c "SELECT 1;"
```

Se falhar, verifique:
- Se o banco `chatwoot_production` existe
- Se as credenciais estão corretas
- Se o serviço PostgreSQL está rodando

### 4. Verificar se o Servidor Rails Está Iniciando

Execute via Railway CLI:

```bash
railway run --service chatwoot bundle exec rails s -p 3000 -b 0.0.0.0
```

Se falhar, verifique os logs para ver o erro específico.

### 5. Verificar Porta

O servidor deve estar escutando na porta 3000. Verifique:

```bash
railway run --service chatwoot netstat -tlnp | grep 3000
```

Ou:

```bash
railway run --service chatwoot nc -z 127.0.0.1 3000
```

### 6. Problemas Comuns

#### Erro: "Could not connect to database"

**Causa**: Variáveis do PostgreSQL incorretas ou banco não existe

**Solução**:
1. Verifique todas as variáveis do PostgreSQL
2. Crie o banco manualmente: `CREATE DATABASE chatwoot_production;`
3. Verifique se o serviço PostgreSQL está rodando

#### Erro: "SECRET_KEY_BASE is missing"

**Causa**: Variável `SECRET_KEY_BASE` não está definida

**Solução**:
1. Gere um novo secret: `openssl rand -hex 64`
2. Adicione como variável de ambiente no Railway

#### Erro: "Redis connection failed"

**Causa**: `REDIS_URL` incorreta ou Redis não está acessível

**Solução**:
1. Verifique se `REDIS_URL` está correta
2. Verifique se o serviço Redis está rodando
3. Teste a conexão: `redis-cli -u $REDIS_URL ping`

#### Servidor não inicia

**Causa**: Setup do banco falhou ou há erros no Rails

**Solução**:
1. Verifique os logs completos
2. Execute setup manualmente:
   ```bash
   railway run --service chatwoot bundle exec rails db:chatwoot_prepare
   ```
3. Execute migrations:
   ```bash
   railway run --service chatwoot bundle exec rails db:migrate
   ```

### 7. Executar Setup Manualmente

Se o setup automático falhar, execute manualmente:

```bash
# Conectar ao container
railway run --service chatwoot bash

# Dentro do container, executar:
bundle exec rails db:chatwoot_prepare

# Ou se falhar, executar passo a passo:
bundle exec rails db:create
bundle exec rails db:migrate
bundle exec rails db:seed
```

### 8. Verificar Healthcheck Manualmente

Teste o healthcheck manualmente:

```bash
# De dentro do container ou usando curl externo
curl http://localhost:3000/

# Ou usando Railway CLI
railway run --service chatwoot curl http://127.0.0.1:3000/
```

### 9. Resetar Banco de Dados (Último Recurso)

Se nada funcionar, você pode resetar o banco:

```bash
# ⚠️ ATENÇÃO: Isso apagará todos os dados!
railway run --service postgres psql $DATABASE_URL -c "DROP DATABASE IF EXISTS chatwoot_production;"
railway run --service postgres psql $DATABASE_URL -c "CREATE DATABASE chatwoot_production;"
```

Depois, faça um novo deploy do Chatwoot.

### 10. Verificar Configuração do Railway

No dashboard do Railway, verifique:

1. **Settings → Deploy**:
   - Root Directory: `chatwoot`
   - Dockerfile Path: `Dockerfile`
   - Build Command: (vazio)
   - Start Command: (vazio)

2. **Settings → Networking**:
   - Port: `3000` (ou deixe vazio para auto-detectar)
   - Healthcheck Path: `/`
   - Healthcheck Timeout: `600` (10 minutos)

3. **Variables**:
   - Todas as variáveis necessárias estão configuradas

## Logs Úteis para Debug

Execute estes comandos para obter mais informações:

```bash
# Ver logs em tempo real
railway logs --service chatwoot --follow

# Ver últimas 100 linhas
railway logs --service chatwoot --tail 100

# Ver logs de um deployment específico
railway logs --service chatwoot --deployment <deployment-id>
```

## Contato e Suporte

Se o problema persistir:
1. Verifique os logs completos do Railway
2. Verifique a documentação do Chatwoot: https://www.chatwoot.com/docs
3. Verifique a documentação do Railway: https://docs.railway.app
