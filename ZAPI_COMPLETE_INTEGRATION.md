# 🔵 Integração Completa Z-API - Documentação

## ✅ O que foi implementado

### 1. **Prisma Schema - Tabela WhatsAppNumber**
- ✅ Modelo criado com todos os campos necessários
- ✅ Relacionamento com inbox do Chatwoot (inboxId)
- ✅ Campos: instanceId, token, phoneNumber, name, isConnected, lastSeen, qrCode

### 2. **ZapiService Melhorado**
- ✅ Suporta múltiplos números (instanceId e token como parâmetros)
- ✅ Métodos estáticos para usar com credenciais específicas
- ✅ Métodos: `getStatus()`, `getQRCode()`, `sendTextMessage()`, `sendMediaMessage()`, `sendFileMessage()`
- ✅ Mantém compatibilidade com código existente

### 3. **ChatwootService - Método Relay**
- ✅ `relayOutgoingMessageToZapi()` melhorado
- ✅ Busca WhatsAppNumber associado ao inbox
- ✅ Usa credenciais corretas para cada número
- ✅ Não altera funcionalidades existentes

### 4. **Webhook Z-API Melhorado**
- ✅ Identifica instanceId do evento
- ✅ Busca WhatsAppNumber correto
- ✅ Atualiza status de conexão automaticamente
- ✅ Processa QR Code quando recebido
- ✅ Encaminha mensagens para Chatwoot usando inbox correto

### 5. **Rotas Backend - Gerenciamento de Números**
- ✅ `GET /api/whatsapp/numbers` - Lista números
- ✅ `POST /api/whatsapp/numbers` - Cadastra número
- ✅ `PUT /api/whatsapp/numbers/:id` - Atualiza número
- ✅ `DELETE /api/whatsapp/numbers/:id` - Remove número
- ✅ `GET /api/whatsapp/numbers/:id/status` - Verifica status
- ✅ `POST /api/whatsapp/numbers/:id/refresh-qr` - Gera QR Code

### 6. **Frontend - Painel de Gerenciamento**
- ✅ Página `/whatsapp-numbers` criada
- ✅ Lista números cadastrados
- ✅ Formulário de cadastro
- ✅ Exibe status (online/offline)
- ✅ Exibe QR Code quando disponível
- ✅ Botões para verificar status e gerar QR Code
- ✅ Botão para deletar números
- ✅ Menu lateral atualizado

### 7. **Logs e Auditoria**
- ✅ Logs para criação/atualização/deleção de números
- ✅ Logs para recebimento de mensagens Z-API
- ✅ Logs para envio de mensagens via Z-API
- ✅ Logs para atualização de status
- ✅ Logs para geração de QR Code
- ✅ Usuário "system" criado automaticamente para logs do sistema

## 🚀 Como usar

### 1. Executar Migration

```bash
cd backend
npx prisma migrate dev --name add_whatsapp_numbers
npx prisma generate
```

### 2. Cadastrar Número WhatsApp

1. Acesse: http://localhost:3000/whatsapp-numbers
2. Clique em "Cadastrar Número"
3. Preencha:
   - **Nome**: Nome descritivo (ex: "WhatsApp Vendas")
   - **Instance ID**: ID da instância na Z-API
   - **Token**: Token da Z-API
   - **Inbox ID**: (Opcional) ID do inbox do Chatwoot

### 3. Conectar WhatsApp

1. Após cadastrar, clique em "QR Code"
2. Escaneie o QR Code com o WhatsApp
3. Aguarde conexão (status mudará para "Online")

### 4. Verificar Status

- Clique em "Verificar Status" para atualizar status do número
- O sistema atualiza automaticamente via webhook

### 5. Configurar Webhook na Z-API

Configure o webhook na Z-API para:
```
https://seu-dominio.com/webhook/zapi
```

**Headers opcionais:**
- `X-Instance-Id`: ID da instância (ajuda a identificar qual número recebeu)

## 📋 Fluxo Completo

### Mensagem Recebida (Z-API → Chatwoot)

1. Z-API envia webhook para `/webhook/zapi`
2. Sistema identifica instanceId
3. Busca WhatsAppNumber no banco
4. Identifica inbox associado
5. Busca/cria conversa no Chatwoot
6. Cria mensagem no Chatwoot
7. Registra log

### Mensagem Enviada (Chatwoot → Z-API)

1. Operador envia mensagem via Chatwoot
2. Sistema identifica inbox da conversa
3. Busca WhatsAppNumber associado ao inbox
4. Extrai telefone do contato
5. Envia via Z-API usando credenciais corretas
6. Registra log

## 🔧 Estrutura de Dados

### WhatsAppNumber

```typescript
{
  id: string;
  instanceId: string;      // ID único da instância Z-API
  token: string;           // Token de autenticação
  phoneNumber?: string;    // Número do WhatsApp (preenchido após conexão)
  name?: string;           // Nome descritivo
  isConnected: boolean;    // Status de conexão
  lastSeen?: DateTime;     // Última verificação
  qrCode?: string;         // QR Code base64
  inboxId?: number;        // ID do inbox do Chatwoot
  createdAt: DateTime;
  updatedAt: DateTime;
}
```

## 📝 Logs de Auditoria

Todas as ações são registradas:

- `WHATSAPP_NUMBER_CREATED` - Número cadastrado
- `WHATSAPP_NUMBER_UPDATED` - Número atualizado
- `WHATSAPP_NUMBER_DELETED` - Número removido
- `WHATSAPP_QR_REFRESHED` - QR Code gerado
- `ZAPI_MESSAGE_RECEIVED` - Mensagem recebida
- `ZAPI_MESSAGE_ERROR` - Erro ao processar mensagem
- `ZAPI_STATUS_UPDATE` - Status atualizado

## 🎯 Próximos Passos

Após implementar:

1. ✅ Execute a migration do Prisma
2. ✅ Cadastre seus números WhatsApp
3. ✅ Configure webhooks na Z-API
4. ✅ Teste envio e recebimento
5. ✅ Verifique logs de auditoria

## ⚠️ Importante

- **Nada foi removido** do código existente
- **Todas as funcionalidades anteriores** continuam funcionando
- **Compatibilidade total** mantida
- **Apenas incrementos** foram adicionados

## 🐛 Troubleshooting

### Erro: "Model WhatsAppNumber not found"
- Execute: `npx prisma generate`

### QR Code não aparece
- Verifique se o instanceId e token estão corretos
- Verifique logs do backend
- Tente gerar QR Code novamente

### Mensagens não chegam no Chatwoot
- Verifique se o webhook está configurado na Z-API
- Verifique se o inboxId está correto
- Verifique logs do backend

### Mensagens não são enviadas para Z-API
- Verifique se o número está conectado (isConnected = true)
- Verifique se o inboxId está associado ao número
- Verifique logs do backend

