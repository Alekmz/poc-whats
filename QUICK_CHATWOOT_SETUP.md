# ⚡ Configuração Rápida do Chatwoot

## Problema
O backend está falhando porque `CHATWOOT_API_TOKEN` não está configurado.

## Solução Rápida

### 1. Verificar se o Chatwoot está rodando

```bash
docker-compose ps chatwoot
```

Se não estiver rodando:
```bash
docker-compose up -d chatwoot
```

### 2. Aguardar o Chatwoot iniciar (1-2 minutos)

```bash
docker-compose logs -f chatwoot
```

Aguarde até ver mensagens como "Listening on tcp://0.0.0.0:3000"

### 3. Executar setup inicial (apenas primeira vez)

```bash
docker-compose exec chatwoot bundle exec rails db:chatwoot_prepare
```

### 4. Acessar o Chatwoot

Abra no navegador: **http://localhost:3001**

### 5. Criar conta e obter API Token

1. **Criar conta de administrador** (primeira vez)
   - Acesse http://localhost:3001
   - Clique em "Sign Up"
   - Preencha os dados

2. **Criar uma Inbox**
   - Vá em **Settings > Inboxes**
   - Clique em **Add Inbox**
   - Escolha tipo "API"
   - Anote o **Inbox ID**

3. **Gerar API Token** (várias opções)

   **Opção 1: Via Settings > Applications** (se disponível)
   - Vá em **Settings > Applications**
   - Clique em **New Application**
   - Nome: "WhatsApp Platform API"
   - Clique em **Create**
   - **COPIE O TOKEN** (você só verá uma vez!)

   **Opção 2: Via Settings > Integrations** (versões mais recentes)
   - Vá em **Settings > Integrations**
   - Clique em **Panel Apps** ou **Aplicativos do painel**
   - Clique em **New Application**
   - Preencha os dados e copie o token

   **Opção 3: Usar Access Token do Usuário** (alternativa)
   - Vá em **Settings > Profile** ou **Perfil**
   - Procure por **Access Token** ou **API Token**
   - Se não aparecer, você pode gerar via API (veja abaixo)

   **Opção 4: Usar Script Automatizado** (mais fácil! ⭐)
   ```bash
   # Execute o script que faz tudo automaticamente:
   ./scripts/get-chatwoot-token.sh
   ```
   O script vai pedir seu email e senha, fazer login e gerar o token automaticamente!

   **Opção 5: Gerar via API Manual** (se o script não funcionar)
   ```bash
   # Primeiro, faça login no Chatwoot e obtenha seu session token
   # Depois, crie um application via API:
   curl -X POST http://localhost:3001/public/api/v1/platform/applications \
     -H "Content-Type: application/json" \
     -H "api_access_token: SEU_ACCESS_TOKEN" \
     -d '{
       "name": "WhatsApp Platform API",
       "description": "API para integração com a plataforma"
     }'
   ```
   
   📖 Veja mais detalhes em: [CHATWOOT_TOKEN_ALTERNATIVES.md](./CHATWOOT_TOKEN_ALTERNATIVES.md)

### 6. Configurar no backend/.env

Edite o arquivo `backend/.env` e adicione/atualize:

```env
CHATWOOT_API_BASE_URL=http://chatwoot:3000
CHATWOOT_API_TOKEN=seu-token-copiado-aqui
CHATWOOT_ACCOUNT_ID=1
```

**Importante**: 
- Use `http://chatwoot:3000` (nome do serviço Docker, não `localhost`)
- O `CHATWOOT_ACCOUNT_ID` geralmente é `1` para a primeira conta

### 7. Reiniciar o backend

```bash
docker-compose restart backend
```

### 8. Verificar se funcionou

```bash
docker-compose logs -f backend
```

Você não deve mais ver o erro "CHATWOOT_API_TOKEN não configurado".

## Verificação Rápida

Teste se o Chatwoot está acessível:

```bash
# De dentro do container do backend
docker-compose exec backend curl -H "api_access_token: SEU_TOKEN" http://chatwoot:3000/public/api/v1/accounts/1/inboxes
```

## Troubleshooting

### Erro: "CHATWOOT_API_TOKEN não configurado"
- Verifique se o arquivo `backend/.env` existe
- Verifique se a variável `CHATWOOT_API_TOKEN` está definida
- Reinicie o backend após adicionar a variável

### Erro: "Connection refused" ou "ECONNREFUSED"
- Verifique se o Chatwoot está rodando: `docker-compose ps chatwoot`
- Verifique se a URL está correta: `http://chatwoot:3000` (não `localhost`)
- Verifique os logs: `docker-compose logs chatwoot`

### Erro: "401 Unauthorized"
- Verifique se o token está correto
- Gere um novo token no Chatwoot
- Verifique se o `CHATWOOT_ACCOUNT_ID` está correto
- Se não encontrar "Applications", tente usar o Access Token do seu perfil

### Não encontro a opção "Applications"
- Verifique se você está logado como administrador
- Tente em **Settings > Integrations > Panel Apps**
- Ou use o Access Token do seu perfil de usuário
- Algumas versões do Chatwoot podem ter a opção em locais diferentes

## Próximos Passos

Após configurar o Chatwoot:
1. ✅ Testar geração de QR Code da Z-API
2. ✅ Configurar integração bidirecional Z-API ↔ Chatwoot
3. ✅ Testar envio e recebimento de mensagens

