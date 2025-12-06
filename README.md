# 📱 Plataforma Corporativa de WhatsApp

MVP de uma plataforma corporativa para gestão de WhatsApp Business, com painéis para operadores e supervisores, integração com Chatwoot e API oficial da Meta.

## 🏗️ Arquitetura

- **Backend**: Node.js + Express + Prisma + PostgreSQL
- **Frontend**: Next.js 14 (App Router) + TailwindCSS
- **Integrações**: Chatwoot + Meta WhatsApp API (360Dialog/Gupshup)
- **Infraestrutura**: Docker Compose

## 🚀 Início Rápido

### Pré-requisitos

- Node.js 18+
- Docker e Docker Compose
- PostgreSQL (ou usar via Docker)

### Setup

1. Clone o repositório
2. Execute o script de setup:
   ```bash
   bash setup.sh
   ```

3. Configure as variáveis de ambiente:
   - Copie `.env.example` para `.env` em `backend/` e `frontend/`
   - Preencha as credenciais do Chatwoot e Meta API

4. Inicie os serviços:
   ```bash
   docker-compose up -d
   npm run dev
   ```

5. Acesse:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:4000
   - Chatwoot: http://localhost:3001
   - Adminer: http://localhost:8080

## 📁 Estrutura do Projeto

```
poc_whats/
├── backend/          # API Express
├── frontend/         # Next.js App
├── docker/           # Dockerfiles
├── docker-compose.yml
└── setup.sh
```

## 🔐 Roles e Permissões

- **ADMIN**: Acesso total ao sistema
- **SUPERVISOR**: Modo espelho, visualização de todas conversas
- **OPERATOR**: Gestão de conversas atribuídas

## 📝 Próximos Passos

### 1. Configuração Inicial

1. **Configure as variáveis de ambiente:**
   ```bash
   # Backend
   cp backend/.env.example backend/.env
   # Edite backend/.env com suas credenciais
   
   # Frontend
   cp frontend/.env.example frontend/.env.local
   ```

2. **Inicie os serviços:**
   ```bash
   docker-compose up -d
   ```

3. **Execute as migrations:**
   ```bash
   cd backend
   npm install
   npx prisma migrate dev
   npm run prisma:seed
   ```

4. **Inicie o desenvolvimento:**
   ```bash
   # Na raiz do projeto
   npm install
   npm run dev
   ```

### 2. Credenciais Padrão

Após executar o seed, você pode fazer login com:

- **Admin:**
  - Email: `admin@whatsapp-platform.com`
  - Senha: `admin123`

- **Supervisor:**
  - Email: `supervisor@whatsapp-platform.com`
  - Senha: `supervisor123`

- **Operador:**
  - Email: `operador@whatsapp-platform.com`
  - Senha: `operador123`

### 3. Integração com Chatwoot

O Chatwoot já está configurado no Docker Compose e inicia automaticamente!

1. **Aguarde o Chatwoot iniciar** (pode levar 1-2 minutos na primeira vez)
   ```bash
   docker-compose logs -f chatwoot
   ```

2. **Execute o setup inicial** (apenas na primeira vez):
   ```bash
   docker-compose exec chatwoot bundle exec rails db:chatwoot_prepare
   ```

3. **Acesse o Chatwoot**: http://localhost:3001
   - Crie uma conta de administrador
   - Crie uma inbox
   - Gere um API Token em Settings > Applications

4. **Configure no `.env` do backend**:
   ```
   CHATWOOT_API_BASE_URL=http://chatwoot:3000
   CHATWOOT_API_TOKEN=seu-token-gerado
   CHATWOOT_ACCOUNT_ID=1
   ```

📖 **Guia completo**: Veja [CHATWOOT_SETUP.md](./CHATWOOT_SETUP.md) para instruções detalhadas.

### 4. Integração com Meta WhatsApp API

1. Configure uma conta no 360Dialog ou Gupshup
2. Obtenha as credenciais da API
3. Configure no `.env` do backend:
   ```
   META_API_TOKEN=seu-token
   META_PHONE_NUMBER_ID=seu-phone-id
   META_WEBHOOK_SECRET=seu-secret
   ```

### 5. Melhorias Futuras

- [ ] Implementar 2FA completo
- [ ] Adicionar bloqueio por IP
- [ ] Implementar WebSockets para atualizações em tempo real
- [ ] Adicionar mais métricas no dashboard
- [ ] Implementar exportação de logs
- [ ] Adicionar testes automatizados
- [ ] Implementar rate limiting
- [ ] Adicionar cache com Redis
- [ ] Melhorar tratamento de erros
- [ ] Adicionar internacionalização (i18n)

