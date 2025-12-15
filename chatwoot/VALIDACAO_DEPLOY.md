# ✅ Validação de Configuração do Chatwoot para Railway

Este documento ajuda a validar se a configuração do Chatwoot está correta antes do deploy no Railway.

## 📋 Checklist Pré-Deploy

### 1. Estrutura de Arquivos

Verifique se os seguintes arquivos existem no diretório `chatwoot/`:

- [ ] `Dockerfile` - Deve estar presente e válido
- [ ] `entrypoint.sh` - Deve estar presente e ter permissão de execução
- [ ] `railway.toml` - Configuração do Railway (opcional, mas recomendado)
- [ ] `.dockerignore` - Para otimizar o build

**Verificação rápida:**
```bash
cd chatwoot
ls -la Dockerfile entrypoint.sh railway.toml
```

### 2. Configuração do Serviço no Railway

No dashboard do Railway, verifique:

#### 2.1 Configurações de Deploy

- [ ] **Root Directory**: `chatwoot`
- [ ] **Dockerfile Path**: `Dockerfile`
- [ ] **Build Command**: (deve estar vazio)
- [ ] **Start Command**: (deve estar vazio)

#### 2.2 Variáveis de Ambiente Obrigatórias

Verifique se todas estas variáveis estão configuradas:

**PostgreSQL:**
- [ ] `POSTGRES_HOST` - Deve usar `${{Postgres.PGHOST}}` ou valor direto
- [ ] `POSTGRES_DATABASE` - Deve ser `chatwoot_production`
- [ ] `POSTGRES_USERNAME` - Deve usar `${{Postgres.PGUSER}}` ou valor direto
- [ ] `POSTGRES_PASSWORD` - Deve usar `${{Postgres.PGPASSWORD}}` ou valor direto
- [ ] `POSTGRES_PORT` - Deve usar `${{Postgres.PGPORT}}` ou `5432`

**Redis:**
- [ ] `REDIS_URL` - Deve usar `${{Redis.REDIS_URL}}` ou URL completa

**Rails:**
- [ ] `RAILS_ENV` - Deve ser `production`
- [ ] `SECRET_KEY_BASE` - Deve ser um valor seguro (gerado com `openssl rand -hex 64`)
- [ ] `FRONTEND_URL` - Deve ser a URL pública do Chatwoot (será configurada após gerar domínio)
- [ ] `FORCE_SSL` - Deve ser `false` (ou `true` se usar HTTPS customizado)
- [ ] `INSTALLATION_NAME` - Nome da instalação (opcional)
- [ ] `PORT` - Deve ser `3000`

**Exemplo completo de variáveis:**
```env
POSTGRES_HOST=${{Postgres.PGHOST}}
POSTGRES_DATABASE=chatwoot_production
POSTGRES_USERNAME=${{Postgres.PGUSER}}
POSTGRES_PASSWORD=${{Postgres.PGPASSWORD}}
POSTGRES_PORT=${{Postgres.PGPORT}}
REDIS_URL=${{Redis.REDIS_URL}}
RAILS_ENV=production
SECRET_KEY_BASE=seu-secret-key-base-aqui
FRONTEND_URL=https://seu-chatwoot.railway.app
FORCE_SSL=false
INSTALLATION_NAME=WhatsApp Platform Chatwoot
PORT=3000
```

### 3. Banco de Dados

- [ ] O banco de dados `chatwoot_production` foi criado no PostgreSQL

**Como criar:**
```bash
# Via Railway CLI
railway run --service postgres psql $DATABASE_URL -c "CREATE DATABASE chatwoot_production;"

# Ou via dashboard do Railway
# Vá em PostgreSQL → Data → Query → Execute:
# CREATE DATABASE chatwoot_production;
```

### 4. Domínio Público

- [ ] Um domínio público foi gerado para o serviço Chatwoot
- [ ] A variável `FRONTEND_URL` foi atualizada com o domínio gerado

**Como gerar:**
1. Vá em **Settings** → **Networking**
2. Clique em **Generate Domain**
3. Copie a URL gerada
4. Atualize `FRONTEND_URL` com essa URL

## 🔍 Validação Pós-Deploy

Após fazer o deploy, verifique os logs:

### 1. Verificar Logs Iniciais

Os logs devem mostrar:

```
=== Inicialização do Chatwoot ===
Verificando variáveis de ambiente...
✓ Variáveis de ambiente essenciais estão definidas
Verificando conexão com PostgreSQL...
✓ PostgreSQL está acessível
Verificando conexão com Redis...
✓ Redis está acessível
Verificando se o banco de dados existe...
✓ Banco de dados já existe
Executando setup do Chatwoot...
✓ Setup do Chatwoot concluído com sucesso!
=== Iniciando servidor Chatwoot ===
```

### 2. Erros Comuns e Soluções

#### Erro: "Variáveis do PostgreSQL não estão todas definidas"

**Solução:**
- Verifique se todas as variáveis do PostgreSQL estão configuradas
- Verifique se os nomes das variáveis estão corretos (podem variar dependendo do nome do serviço no Railway)

#### Erro: "Não foi possível conectar ao PostgreSQL"

**Solução:**
- Verifique se o serviço PostgreSQL está rodando
- Verifique se as credenciais estão corretas
- Verifique se o serviço Chatwoot tem acesso ao serviço PostgreSQL (mesmo projeto Railway)

#### Erro: "SECRET_KEY_BASE não está definida"

**Solução:**
- Gere um novo secret: `openssl rand -hex 64`
- Adicione como variável de ambiente `SECRET_KEY_BASE`

#### Erro: "Banco de dados não existe"

**Solução:**
- Crie o banco manualmente (veja seção 3 acima)
- Ou aguarde - o entrypoint tentará criar automaticamente

#### Erro relacionado à extensão "vector"

**Sintoma:** Logs mostram erro sobre extensão `vector` ou `pgvector`

**Solução:**
- Isso é esperado se o PostgreSQL não tiver pgvector
- O entrypoint deve continuar automaticamente
- O Chatwoot funcionará normalmente, mas funcionalidades de IA podem não estar disponíveis

### 3. Verificar Health Check

Após alguns minutos, o health check deve passar:

- [ ] O serviço mostra status "Healthy" no Railway
- [ ] A URL pública responde com código 200

**Teste manual:**
```bash
curl -I https://seu-chatwoot.railway.app
```

Deve retornar `HTTP/2 200` ou similar.

### 4. Acessar Interface Web

- [ ] Acesse a URL pública do Chatwoot no navegador
- [ ] Você deve ver a tela de login/cadastro do Chatwoot
- [ ] Crie uma conta de administrador

## 🛠️ Comandos Úteis para Debug

### Ver logs em tempo real
```bash
railway logs --service chatwoot --follow
```

### Executar comando no container
```bash
railway run --service chatwoot bash
```

### Verificar conexão com PostgreSQL
```bash
railway run --service chatwoot psql -h $POSTGRES_HOST -U $POSTGRES_USERNAME -d $POSTGRES_DATABASE -c "SELECT 1;"
```

### Verificar variáveis de ambiente
```bash
railway variables --service chatwoot
```

### Executar setup manualmente (se necessário)
```bash
railway run --service chatwoot bundle exec rails db:chatwoot_prepare
```

## ✅ Checklist Final

Antes de considerar o deploy bem-sucedido:

- [ ] Todos os arquivos estão presentes
- [ ] Todas as variáveis de ambiente estão configuradas
- [ ] Banco de dados foi criado
- [ ] Domínio público foi gerado e configurado
- [ ] Deploy foi iniciado sem erros de build
- [ ] Logs mostram inicialização bem-sucedida
- [ ] Health check está passando
- [ ] Interface web está acessível
- [ ] Conta de administrador foi criada

## 📞 Próximos Passos

Após validar que tudo está funcionando:

1. Criar uma Inbox no Chatwoot
2. Gerar API Token
3. Configurar variáveis no Backend:
   - `CHATWOOT_API_BASE_URL`
   - `CHATWOOT_API_TOKEN`
   - `CHATWOOT_ACCOUNT_ID`
4. Testar integração entre Backend e Chatwoot

## 🔗 Referências

- [RAILWAY_CHATWOOT_SETUP.md](../RAILWAY_CHATWOOT_SETUP.md) - Guia rápido de setup
- [RAILWAY_SETUP.md](../RAILWAY_SETUP.md) - Documentação completa
- [Documentação Railway](https://docs.railway.app)
- [Documentação Chatwoot](https://www.chatwoot.com/docs)
