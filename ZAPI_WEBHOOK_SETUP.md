# 🔗 Configuração de Webhook Z-API

## 📋 Por que configurar o Webhook?

O webhook é necessário para que a Z-API **notifique seu sistema** quando:
- Uma mensagem é recebida no WhatsApp
- O status da conexão muda
- Um novo QR Code é gerado

**Sem o webhook configurado, as mensagens recebidas não aparecerão no dashboard!**

## 🔧 Como Configurar

### 1. Obter a URL do Webhook

A URL do webhook do seu backend é:
```
http://seu-ip-ou-dominio:4000/webhook/zapi
```

**Para desenvolvimento local:**
- Se estiver testando localmente, você precisará usar um túnel (ngrok, localtunnel, etc.)
- Exemplo com ngrok: `https://seu-tunel.ngrok.io/webhook/zapi`

### 2. Configurar no Painel Z-API

1. **Acesse o painel Z-API:**
   - https://app.z-api.io

2. **Vá até a instância:**
   - Clique em "Instâncias Web"
   - Selecione sua instância (Meu número)

3. **Acesse a aba de Webhooks:**
   - Clique na aba "Webhooks e configurações gerais"

4. **Configure o Webhook "Ao receber" (OBRIGATÓRIO):**
   - No campo **"Ao receber" (On receive)**, adicione a URL:
     - Para desenvolvimento local com ngrok: `https://seu-tunel.ngrok.io/webhook/zapi`
     - Para produção: `https://seu-dominio.com/webhook/zapi`
   
   **⚠️ IMPORTANTE:** Este é o campo mais importante! É ele que recebe as mensagens.

5. **Campos Opcionais (pode deixar vazio):**
   - "Ao enviar" (On send) - opcional
   - "Presença do chat" (Chat presence) - opcional
   - "Ao desconectar" (On disconnect) - opcional
   - "Receber status da mensagem" (Receive message status) - opcional
   - "Ao conectar" (On connect) - opcional

6. **Toggle "Notificar as enviadas por mim também":**
   - Pode deixar **desativado (OFF)** - não é necessário

7. **Salve as configurações:**
   - Clique no botão verde **"Salvar"** no final da página

### 3. Eventos para Configurar

Configure os seguintes eventos no webhook:
- ✅ **Mensagens recebidas** (`message`)
- ✅ **Status de conexão** (`status`)
- ✅ **QR Code** (`qr-code`)

## 🧪 Testar o Webhook

### Opção 1: Usar ngrok (Recomendado para desenvolvimento)

1. **Instale o ngrok:**
   ```bash
   # macOS
   brew install ngrok
   
   # Ou baixe de: https://ngrok.com/download
   ```

2. **Inicie o túnel:**
   ```bash
   ngrok http 4000
   ```

3. **Copie a URL HTTPS gerada:**
   ```
   https://abc123.ngrok.io
   ```

4. **Configure no Z-API:**
   ```
   https://abc123.ngrok.io/webhook/zapi
   ```

### Opção 2: Usar localtunnel

1. **Instale o localtunnel:**
   ```bash
   npm install -g localtunnel
   ```

2. **Inicie o túnel:**
   ```bash
   lt --port 4000
   ```

3. **Use a URL gerada no Z-API**

## ✅ Verificar se está Funcionando

1. **Envie uma mensagem de teste:**
   - Envie uma mensagem do WhatsApp para o número conectado
   - Verifique os logs do backend:
     ```bash
     # Você deve ver:
     Webhook Z-API recebido: {...}
     Mensagem Z-API encaminhada para Chatwoot: ...
     ```

2. **Verifique no Chatwoot:**
   - Acesse o Chatwoot: http://localhost:3001
   - A mensagem deve aparecer na conversa

3. **Verifique no Dashboard:**
   - Acesse o dashboard do seu sistema
   - A conversa deve aparecer na lista

## 🔍 Troubleshooting

### Webhook não está recebendo mensagens

1. **Verifique se o backend está rodando:**
   ```bash
   curl http://localhost:4000/health
   ```

2. **Verifique os logs do backend:**
   - Procure por "Webhook Z-API recebido"

3. **Teste o webhook manualmente:**
   ```bash
   curl -X POST http://localhost:4000/webhook/zapi \
     -H "Content-Type: application/json" \
     -d '{
       "event": "message",
       "message": {
         "from": "5511999999999",
         "text": "Teste"
       }
     }'
   ```

### Mensagens não aparecem no Chatwoot

1. **Verifique se o inbox está vinculado:**
   - No painel de gerenciamento de números WhatsApp
   - Verifique se o `inboxId` está configurado

2. **Verifique os logs:**
   - Procure por erros ao encaminhar para Chatwoot

3. **Verifique se o Chatwoot está acessível:**
   ```bash
   curl http://localhost:3001/api/v1/accounts/2/inboxes
   ```

## 📝 Próximos Passos

Após configurar o webhook:
1. ✅ Envie uma mensagem de teste
2. ✅ Verifique se aparece no Chatwoot
3. ✅ Verifique se aparece no dashboard
4. ✅ Teste enviar uma resposta pelo dashboard

