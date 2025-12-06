# 🔵 Integração Z-API

## Visão Geral

A integração com Z-API permite enviar e receber mensagens do WhatsApp através da plataforma Z-API.

## Configuração

### 1. Variáveis de Ambiente

Adicione no arquivo `backend/.env`:

```env
ZAPI_INSTANCE_ID=seu-instance-id
ZAPI_TOKEN=seu-token
ZAPI_API_BASE=https://api.z-api.io
```

### 2. Obter Credenciais

1. Acesse o painel da Z-API
2. Crie uma instância
3. Copie o **Instance ID** e o **Token**
4. Configure no `.env`

## Funcionalidades

### ✅ Enviar Mensagens

**Endpoint:** `POST /api/messages/send`

**Request:**
```json
{
  "phone": "5511999999999",
  "message": "Olá, como posso ajudar?"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Mensagem enviada com sucesso",
  "data": { ... }
}
```

### ✅ Receber Mensagens (Webhook)

**Endpoint:** `POST /webhook/zapi`

Configure este endpoint na Z-API como webhook para receber mensagens.

**Formato esperado:**
```json
{
  "event": "message",
  "message": {
    "from": "5511999999999",
    "text": "Olá"
  }
}
```

### ✅ Integração Bidirecional

1. **Z-API → Chatwoot**: Mensagens recebidas via webhook são encaminhadas para o Chatwoot
2. **Chatwoot → Z-API**: Mensagens enviadas no Chatwoot são automaticamente encaminhadas para Z-API

## Fluxo de Mensagens

### Mensagem Recebida (Z-API → Chatwoot)

1. Z-API envia webhook para `/webhook/zapi`
2. Sistema extrai telefone e texto
3. Busca conversa existente no Chatwoot pelo telefone
4. Cria mensagem no Chatwoot
5. Registra log de auditoria

### Mensagem Enviada (Chatwoot → Z-API)

1. Operador envia mensagem via Chatwoot (endpoint `/api/conversations/:id/send`)
2. Mensagem é salva no Chatwoot
3. Sistema identifica telefone do contato
4. Encaminha mensagem para Z-API automaticamente
5. Registra log de auditoria

## Configuração do Webhook na Z-API

1. Acesse o painel da Z-API
2. Vá em **Webhooks** ou **Configurações**
3. Configure a URL do webhook:
   ```
   https://seu-dominio.com/webhook/zapi
   ```
   ou para desenvolvimento local (usando ngrok):
   ```
   https://seu-ngrok-url.ngrok.io/webhook/zapi
   ```

4. Selecione os eventos:
   - ✅ Mensagens recebidas
   - ✅ Status de entrega (opcional)

## Troubleshooting

### Erro: "Z-API não configurado"

- Verifique se `ZAPI_INSTANCE_ID` e `ZAPI_TOKEN` estão configurados no `.env`
- Reinicie o backend após alterar variáveis

### Mensagens não chegam no Chatwoot

- Verifique se o webhook está configurado corretamente na Z-API
- Verifique os logs do backend: `docker-compose logs -f backend`
- Verifique se existe uma inbox no Chatwoot
- Verifique se a conversa já existe no Chatwoot (o sistema tenta encontrar, mas não cria automaticamente)

### Mensagens não são enviadas para Z-API

- Verifique se o telefone está correto na conversa do Chatwoot
- Verifique os logs do backend
- Verifique se a mensagem é do tipo "outgoing" (enviada pelo operador)

### Formato de Telefone

O sistema formata automaticamente números de telefone:
- Remove caracteres especiais
- Adiciona código do país (55 para Brasil) se necessário
- Formato esperado: `5511999999999` (sem espaços ou caracteres especiais)

## Logs e Auditoria

Todas as ações são registradas em logs:

- `ZAPI_MESSAGE_SENT`: Mensagem enviada via Z-API
- `ZAPI_MESSAGE_RECEIVED`: Mensagem recebida via Z-API
- `ZAPI_MESSAGE_ERROR`: Erro ao processar mensagem
- `ZAPI_STATUS_UPDATE`: Atualização de status de entrega

Consulte os logs em `/api/logs` ou diretamente no banco de dados.

## Testes

### Testar Envio

```bash
curl -X POST http://localhost:4000/api/messages/send \
  -H "Authorization: Bearer SEU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "5511999999999",
    "message": "Teste de mensagem"
  }'
```

### Testar Webhook (simulação)

```bash
curl -X POST http://localhost:4000/webhook/zapi \
  -H "Content-Type: application/json" \
  -d '{
    "event": "message",
    "message": {
      "from": "5511999999999",
      "text": "Mensagem de teste"
    }
  }'
```

## Próximos Passos

- [ ] Implementar criação automática de conversas no Chatwoot
- [ ] Suporte a mídias (imagens, documentos, áudio)
- [ ] Suporte a status de entrega e leitura
- [ ] Fila de mensagens para retry automático
- [ ] Dashboard de métricas de envio/recebimento

