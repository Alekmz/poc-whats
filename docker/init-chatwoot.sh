#!/bin/bash

# Script para inicializar o Chatwoot após o primeiro start
# Este script deve ser executado manualmente após o Chatwoot iniciar pela primeira vez

echo "🚀 Inicializando Chatwoot..."

# Aguardar o Chatwoot estar pronto
echo "⏳ Aguardando Chatwoot estar pronto..."
sleep 30

# Executar setup do Chatwoot
echo "📦 Executando setup do Chatwoot..."
docker-compose exec chatwoot bundle exec rails db:chatwoot_prepare

echo "✅ Chatwoot inicializado!"
echo ""
echo "📝 Próximos passos:"
echo "1. Acesse http://localhost:3001"
echo "2. Crie uma conta de administrador"
echo "3. Crie uma inbox"
echo "4. Gere um API Token em Settings > Applications"
echo "5. Configure o token no backend/.env como CHATWOOT_API_TOKEN"
echo "6. Configure o Account ID no backend/.env como CHATWOOT_ACCOUNT_ID"

