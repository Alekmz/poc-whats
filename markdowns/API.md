# 📚 Documentação da API

## Base URL
```
http://localhost:4000/api
```

## Autenticação

Todas as rotas protegidas requerem um token JWT no header:
```
Authorization: Bearer <token>
```

## Endpoints

### Autenticação

#### POST /auth/login
Autentica um usuário e retorna tokens.

**Request:**
```json
{
  "email": "admin@whatsapp-platform.com",
  "password": "admin123"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "name": "Administrador",
    "email": "admin@whatsapp-platform.com",
    "role": "ADMIN"
  }
}
```

#### POST /auth/refresh
Renova o token de acesso.

**Request:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### GET /auth/me
Retorna informações do usuário autenticado.

---

### Usuários

#### GET /users
Lista todos os usuários (requer ADMIN ou SUPERVISOR).

#### POST /users
Cria um novo usuário (requer ADMIN).

**Request:**
```json
{
  "name": "Novo Usuário",
  "email": "usuario@example.com",
  "password": "senha123",
  "role": "OPERATOR"
}
```

#### PUT /users/:id
Atualiza um usuário (requer ADMIN).

---

### Conversas

#### GET /conversations
Lista conversas. Query params opcionais:
- `inboxId`: número
- `status`: string

#### GET /conversations/:id
Busca uma conversa específica.

#### GET /conversations/:id/messages
Lista mensagens de uma conversa.

#### POST /conversations/:id/send
Envia uma mensagem.

**Request:**
```json
{
  "content": "Olá, como posso ajudar?"
}
```

#### POST /conversations/:id/transfer
Transfere uma conversa para outro agente.

**Request:**
```json
{
  "targetAgentId": 123
}
```

---

### Supervisor

#### GET /supervisor/mirror
Modo espelho - visualiza todas as conversas (requer SUPERVISOR ou ADMIN).

Query params opcionais:
- `inboxId`: número
- `agentId`: número

**Response:**
```json
{
  "conversations": [...],
  "metrics": {
    "total": 100,
    "open": 50,
    "resolved": 30,
    "pending": 20
  }
}
```

#### GET /supervisor/agents
Lista agentes do Chatwoot.

#### GET /supervisor/inboxes
Lista inboxes do Chatwoot.

---

### Logs

#### GET /logs
Lista logs de auditoria (requer SUPERVISOR ou ADMIN).

Query params opcionais:
- `userId`: string
- `conversationId`: string
- `action`: string
- `limit`: número (padrão: 100)
- `offset`: número (padrão: 0)

---

### Webhooks

#### GET /webhook/meta
Validação do webhook do Meta (GET).

#### POST /webhook/meta
Recebe webhooks do Meta WhatsApp.

---

## Swagger UI

Acesse a documentação interativa em:
```
http://localhost:4000/api-docs
```

