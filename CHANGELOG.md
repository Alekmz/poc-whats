# Changelog

## [1.0.0] - 2024-01-XX

### Adicionado
- ✅ Backend completo com Express + TypeScript
- ✅ Frontend com Next.js 14 (App Router)
- ✅ Autenticação JWT com refresh tokens
- ✅ Sistema de roles (ADMIN, SUPERVISOR, OPERATOR)
- ✅ Integração com Chatwoot (listar conversas, enviar mensagens, transferir)
- ✅ Integração com Meta WhatsApp API (enviar mensagens, webhook)
- ✅ Sistema de logs e auditoria
- ✅ Painel do Operador (dashboard, conversas)
- ✅ Painel do Supervisor (modo espelho, métricas)
- ✅ Gestão de usuários
- ✅ Docker Compose com PostgreSQL, Redis, Adminer
- ✅ Prisma ORM com migrations
- ✅ Swagger/OpenAPI documentation
- ✅ Seed de usuários padrão
- ✅ UI moderna com TailwindCSS (tema cinza + amarelo)

### Estrutura
- Backend: `/backend`
- Frontend: `/frontend`
- Docker: `docker-compose.yml`
- Scripts: `setup.sh`

### Próximas Features
- 2FA completo
- WebSockets para tempo real
- Bloqueio por IP
- Exportação de logs
- Testes automatizados

