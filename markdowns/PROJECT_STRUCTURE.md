# 📁 Estrutura do Projeto

## Visão Geral

```
poc_whats/
├── backend/                 # API Backend (Express + TypeScript)
│   ├── src/
│   │   ├── config/         # Configurações (database, swagger)
│   │   ├── middleware/     # Middlewares (auth, logger, errorHandler)
│   │   ├── routes/         # Rotas da API
│   │   ├── services/       # Serviços (Chatwoot, Meta WhatsApp)
│   │   └── index.ts        # Entry point
│   ├── prisma/
│   │   ├── schema.prisma   # Schema do banco
│   │   └── seed.ts         # Seed de dados iniciais
│   ├── Dockerfile
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/                # Frontend (Next.js 14)
│   ├── app/                # App Router (Next.js 14)
│   │   ├── login/          # Página de login
│   │   ├── dashboard/      # Dashboard do operador
│   │   ├── supervisor/     # Painel do supervisor
│   │   ├── logs/           # Página de logs
│   │   ├── users/          # Gestão de usuários
│   │   ├── conversations/  # Visualização de conversas
│   │   ├── layout.tsx      # Layout principal
│   │   └── globals.css     # Estilos globais
│   ├── components/         # Componentes React
│   │   ├── Layout.tsx      # Layout com sidebar
│   │   └── Sidebar.tsx     # Menu lateral
│   ├── lib/                # Utilitários
│   │   ├── api.ts          # Cliente API
│   │   └── auth.ts         # Funções de autenticação
│   ├── middleware.ts       # Middleware Next.js
│   ├── Dockerfile
│   ├── package.json
│   └── tailwind.config.js
│
├── docker-compose.yml      # Orquestração Docker
├── setup.sh                # Script de setup
├── README.md               # Documentação principal
├── API.md                  # Documentação da API
└── CHANGELOG.md            # Histórico de mudanças
```

## Backend

### Tecnologias
- **Node.js** + **Express**
- **TypeScript**
- **Prisma ORM** + **PostgreSQL**
- **JWT** para autenticação
- **Swagger** para documentação

### Estrutura de Rotas
- `/api/auth` - Autenticação
- `/api/users` - Gestão de usuários
- `/api/conversations` - Conversas e mensagens
- `/api/supervisor` - Painel supervisor
- `/api/logs` - Logs e auditoria
- `/webhook/meta` - Webhook Meta WhatsApp

### Serviços
- **ChatwootService**: Integração com Chatwoot
- **MetaWhatsAppService**: Integração com Meta API

## Frontend

### Tecnologias
- **Next.js 14** (App Router)
- **React 18**
- **TypeScript**
- **TailwindCSS**
- **Axios** para requisições
- **React Hot Toast** para notificações

### Páginas
- `/login` - Autenticação
- `/dashboard` - Dashboard do operador
- `/supervisor` - Modo espelho supervisor
- `/logs` - Logs e auditoria
- `/users` - Gestão de usuários (admin)
- `/conversations/[id]` - Visualização de conversa

## Banco de Dados

### Tabelas (Prisma)
- **User**: Usuários do sistema
- **Log**: Logs de auditoria
- **Setting**: Configurações do sistema

## Docker

### Serviços
- **postgres**: Banco de dados PostgreSQL
- **redis**: Cache Redis
- **backend**: API Backend
- **frontend**: Frontend Next.js
- **adminer**: Interface web para PostgreSQL

## Segurança

- Autenticação JWT com refresh tokens
- Middleware de autorização por role
- Hash de senhas com bcrypt
- Validação de entrada com express-validator
- CORS configurado

## Integrações

### Chatwoot
- Listar inboxes
- Listar conversas
- Enviar mensagens
- Transferir conversas
- Listar agentes

### Meta WhatsApp API
- Enviar mensagens
- Receber webhooks
- Validação de assinatura

