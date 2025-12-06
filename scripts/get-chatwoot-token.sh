#!/bin/bash

# Script para obter token do Chatwoot via API
# Uso: ./scripts/get-chatwoot-token.sh

CHATWOOT_URL="${CHATWOOT_URL:-http://localhost:3001}"

echo "🔑 Gerador de Token do Chatwoot"
echo "================================"
echo ""

# Solicitar credenciais
read -p "Email do Chatwoot: " EMAIL
read -sp "Senha: " PASSWORD
echo ""

echo ""
echo "📡 Fazendo login no Chatwoot..."

# Fazer login
LOGIN_RESPONSE=$(curl -s -X POST "${CHATWOOT_URL}/public/api/v1/accounts/sign_in" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"${EMAIL}\",
    \"password\": \"${PASSWORD}\"
  }")

# Verificar se o login foi bem-sucedido
if echo "$LOGIN_RESPONSE" | grep -q "auth_token"; then
  AUTH_TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"auth_token":"[^"]*' | cut -d'"' -f4)
  echo "✅ Login realizado com sucesso!"
  echo ""
  
  echo "📝 Criando Application..."
  
  # Criar application
  APP_RESPONSE=$(curl -s -X POST "${CHATWOOT_URL}/public/api/v1/platform/applications" \
    -H "Content-Type: application/json" \
    -H "api_access_token: ${AUTH_TOKEN}" \
    -d '{
      "name": "WhatsApp Platform API",
      "description": "API para integração com a plataforma WhatsApp"
    }')
  
  # Extrair access_token
  if echo "$APP_RESPONSE" | grep -q "access_token"; then
    ACCESS_TOKEN=$(echo "$APP_RESPONSE" | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)
    echo "✅ Application criada com sucesso!"
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "🎉 TOKEN GERADO COM SUCESSO!"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "Adicione este token no arquivo backend/.env:"
    echo ""
    echo "CHATWOOT_API_TOKEN=${ACCESS_TOKEN}"
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  else
    echo "❌ Erro ao criar application:"
    echo "$APP_RESPONSE" | jq '.' 2>/dev/null || echo "$APP_RESPONSE"
    echo ""
    echo "💡 Você pode usar o AUTH_TOKEN temporariamente:"
    echo "CHATWOOT_API_TOKEN=${AUTH_TOKEN}"
  fi
else
  echo "❌ Erro ao fazer login:"
  echo "$LOGIN_RESPONSE" | jq '.' 2>/dev/null || echo "$LOGIN_RESPONSE"
  echo ""
  echo "💡 Verifique suas credenciais e tente novamente."
  exit 1
fi

