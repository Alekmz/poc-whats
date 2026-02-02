# 🚀 Quick Start Guide

## Setup Rápido (5 minutos)

### 1. Instalar Dependências
```bash
# Na raiz do projeto
npm install

# Backend
cd backend && npm install && cd ..

# Frontend
cd frontend && npm install && cd ..
```

### 2. Configurar Variáveis de Ambiente

**Backend:**
```bash
cp backend/.env.example backend/.env
# Edite backend/.env com suas configurações
```

**Frontend:**
```bash
cp frontend/.env.example frontend/.env.local
# Geralmente não precisa alterar
```

### 3. Iniciar Banco de Dados
```bash
docker-compose up -d postgres redis
```

### 4. Configurar Banco de Dados
```bash
cd backend
npx prisma migrate dev
npm run prisma:seed
cd ..
```

### 5. Iniciar Aplicação
```bash
# Opção 1: Usando Docker Compose (recomendado)
docker-compose up

# Opção 2: Desenvolvimento local
npm run dev
```

### 6. Configurar Chatwoot (Primeira Vez)

```bash
# Aguardar Chatwoot estar pronto (1-2 minutos)
docker-compose logs -f chatwoot

# Executar setup inicial
docker-compose exec chatwoot bundle exec rails db:chatwoot_prepare
```

Depois:
1. Acesse http://localhost:3001
2. Crie conta de administrador
3. Crie uma inbox
4. Gere API Token (Settings > Applications)
5. Configure no `backend/.env`:
   ```
   CHATWOOT_API_TOKEN=seu-token
   CHATWOOT_ACCOUNT_ID=1
   ```

### 7. Acessar Aplicação
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:4000
- **Chatwoot**: http://localhost:3001
- **Swagger Docs**: http://localhost:4000/api-docs
- **Adminer (DB)**: http://localhost:8080

### 8. Login Inicial
Use as credenciais criadas pelo seed:
- **Admin**: `admin@whatsapp-platform.com` / `admin123`
- **Supervisor**: `supervisor@whatsapp-platform.com` / `supervisor123`
- **Operador**: `operador@whatsapp-platform.com` / `operador123`

## Troubleshooting

### Erro de conexão com banco
```bash
# Verificar se PostgreSQL está rodando
docker-compose ps

# Ver logs
docker-compose logs postgres
```

### Erro de Prisma
```bash
cd backend
npx prisma generate
npx prisma migrate reset  # CUIDADO: apaga dados
```

### Porta já em uso
Altere as portas no `docker-compose.yml` ou `.env`

## Próximos Passos

1. Configure integração com Chatwoot (veja README.md)
2. Configure integração com Meta WhatsApp API
3. Personalize o tema (cores em `tailwind.config.js`)
4. Adicione mais funcionalidades conforme necessário

