# 🔑 Configuração do Client-Token Z-API

## ❌ Problema
A Z-API está retornando o erro: `"your client-token is not configured"`

Isso significa que a Z-API requer um **Client-Token** adicional nas requisições, que é diferente do token da instância.

## 🔍 Como configurar o Client-Token (Token de Segurança da Conta)

### Passo a Passo:

1. **Acesse o painel Z-API:**
   - Faça login em: https://app.z-api.io

2. **Navegue até a seção Segurança:**
   - No menu lateral esquerdo, clique em **"Segurança"**

3. **Configure o Token de Segurança da Conta:**
   - Procure pelo módulo **"Token de Segurança da Conta"**
   - Clique em **"Configurar Agora"** ou **"Gerar Token"**
   - Um token será gerado (mas inicialmente estará **desativado**)

4. **IMPORTANTE - Configure seu código ANTES de ativar:**
   - Antes de ativar o token, você DEVE configurar seu backend para incluir o Client-Token em todas as requisições
   - Se você ativar o token antes de configurar o código, todas as requisições serão bloqueadas!

5. **Copie o token gerado:**
   - Copie o Client-Token que foi gerado
   - Adicione no arquivo `backend/.env` (veja instruções abaixo)

6. **Ative o Token:**
   - Após configurar o código, volte ao painel e clique em **"Ativar Token"**
   - A partir desse momento, todas as requisições precisarão do Client-Token no header

## ⚙️ Configuração no Backend

Após encontrar o Client-Token, adicione no arquivo `backend/.env`:

```env
ZAPI_CLIENT_TOKEN=seu_client_token_aqui
```

**Importante:** Se você não encontrar um Client-Token separado, pode ser que:
- A Z-API tenha mudado a forma de autenticação
- O Client-Token precise ser gerado/ativado primeiro
- A conta precise de um plano específico

## ⚠️ IMPORTANTE: Ativar o Client-Token

**O Client-Token precisa ser ATIVADO no painel Z-API!**

Após gerar o token e configurar no `.env`:

1. **Volte ao painel Z-API** → Seção **"Segurança"**
2. **Procure pelo botão "Ativar Token"** ou **"Ativar Client-Token"**
3. **Clique para ativar**
4. **A partir desse momento**, todas as requisições precisarão do Client-Token

**Se você não ativar o token**, receberá o erro:
```
'Client-Token ... not allowed'
```

## 🔄 Após Configurar e Ativar

1. Reinicie o backend:
   ```bash
   cd backend
   npm run dev
   ```

2. Tente gerar o QR Code novamente

## 📞 Suporte

Se não encontrar o Client-Token:
1. Entre em contato com o suporte da Z-API
2. Verifique a documentação oficial: https://developer.z-api.io
3. Consulte o Discord da Z-API (link no menu lateral do painel)

## ✅ Código Atualizado

O código já foi atualizado para usar o Client-Token. Ele:
- Usa `ZAPI_CLIENT_TOKEN` do `.env` se configurado
- Usa o token da instância como fallback (mas isso não está funcionando)
- Adiciona o header `Client-Token` em todas as requisições

