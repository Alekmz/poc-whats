# 🔑 Alternativas para Obter Token do Chatwoot

Se você não encontra a opção "Applications" no Chatwoot, aqui estão alternativas:

## Método 1: Verificar no Perfil do Usuário

1. Acesse o Chatwoot: http://localhost:3001
2. Clique no seu **perfil** (canto superior direito)
3. Vá em **Settings** ou **Configurações**
4. Procure por **Access Token** ou **API Token**
5. Se houver, copie esse token

## Método 2: Usar Token de Sessão (Temporário)

Se você tem acesso ao console do navegador:

1. Faça login no Chatwoot
2. Abra o **Console do Navegador** (F12)
3. Execute:
   ```javascript
   localStorage.getItem('authToken') || sessionStorage.getItem('authToken')
   ```
4. Use esse token temporariamente

## Método 3: Criar via API (Recomendado)

### Passo 1: Obter Access Token do Usuário

Faça login no Chatwoot e obtenha seu token de sessão. Você pode:

1. **Via Console do Navegador**:
   ```javascript
   // No console do navegador (F12) após fazer login
   localStorage.getItem('authToken')
   ```

2. **Via Login via API**:
   ```bash
   curl -X POST http://localhost:3001/public/api/v1/accounts/sign_in \
     -H "Content-Type: application/json" \
     -d '{
       "email": "seu-email@exemplo.com",
       "password": "sua-senha"
     }'
   ```
   
   Isso retornará um token. Copie o valor de `data.auth_token`.

### Passo 2: Criar Application via API

```bash
curl -X POST http://localhost:3001/public/api/v1/platform/applications \
  -H "Content-Type: application/json" \
  -H "api_access_token: SEU_ACCESS_TOKEN_AQUI" \
  -d '{
    "name": "WhatsApp Platform API",
    "description": "API para integração com a plataforma WhatsApp"
  }'
```

A resposta conterá o `access_token` que você precisa usar no backend.

## Método 4: Verificar Versão do Chatwoot

Algumas versões do Chatwoot podem ter interfaces diferentes:

```bash
# Verificar versão do Chatwoot
docker-compose exec chatwoot bundle exec rails -v
docker-compose exec chatwoot cat /app/VERSION 2>/dev/null || echo "Versão não encontrada"
```

## Método 5: Usar Token de Desenvolvimento

Se você está em desenvolvimento, pode temporariamente usar um token hardcoded:

1. No Chatwoot, vá em **Settings > Account**
2. Procure por **Developer Settings** ou **Configurações de Desenvolvimento**
3. Pode haver uma opção para gerar tokens de desenvolvimento

## Configuração no Backend

Independente do método usado, adicione o token no `backend/.env`:

```env
CHATWOOT_API_BASE_URL=http://chatwoot:3000
CHATWOOT_API_TOKEN=token-obtido-aqui
CHATWOOT_ACCOUNT_ID=1
```

## Verificar se o Token Funciona

Teste o token:

```bash
curl -H "api_access_token: SEU_TOKEN" \
  http://localhost:3001/public/api/v1/accounts/1/inboxes
```

Se retornar uma lista de inboxes, o token está funcionando!

## Nota Importante

- O token de **Application** é o ideal para produção
- Tokens de **usuário** podem expirar
- Tokens de **sessão** são temporários
- Sempre use tokens de **Application** em produção

