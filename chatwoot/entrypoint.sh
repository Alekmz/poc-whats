#!/bin/bash
# Não usar set -e aqui, pois queremos tratar erros manualmente

echo "=== Inicialização do Chatwoot ==="

# Aguardar um pouco para garantir que o banco está pronto
echo "Aguardando setup do banco..."
sleep 10

# Executar setup do Chatwoot
# O db:chatwoot_prepare pode falhar se a extensão vector não estiver disponível
# Nesse caso, tentamos executar migrations e seed manualmente
echo "Executando setup do Chatwoot..."
if bundle exec rails db:chatwoot_prepare 2>&1; then
  echo "Setup do Chatwoot concluído com sucesso!"
else
  SETUP_ERROR=$?
  echo "Erro no setup do Chatwoot (código: $SETUP_ERROR)"
  echo "Isso pode ser devido à extensão 'vector' não estar disponível no PostgreSQL"
  echo "Tentando executar migrations e seed manualmente..."
  
  # Tentar executar migrations
  if bundle exec rails db:migrate 2>&1; then
    echo "Migrations executadas com sucesso"
  else
    echo "Aviso: Migrations podem ter falhado, mas continuando..."
  fi
  
  # Tentar executar seed
  if bundle exec rails db:seed 2>&1; then
    echo "Seed executado com sucesso"
  else
    echo "Aviso: Seed pode ter falhado, mas continuando..."
  fi
fi

# Iniciar servidor
echo "Iniciando servidor Chatwoot..."
exec bundle exec rails s -p 3000 -b 0.0.0.0
