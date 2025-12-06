#!/bin/bash
set -e

# Script para criar o banco de dados do Chatwoot
# Este script é executado após o PostgreSQL estar pronto

echo "Verificando se o banco chatwoot_production existe..."

# Aguardar PostgreSQL estar pronto
until PGPASSWORD=$POSTGRES_PASSWORD psql -h "$POSTGRES_HOST" -U "$POSTGRES_USER" -d postgres -c '\q' 2>/dev/null; do
  >&2 echo "PostgreSQL está indisponível - aguardando..."
  sleep 1
done

# Verificar se o banco existe e criar se não existir
PGPASSWORD=$POSTGRES_PASSWORD psql -h "$POSTGRES_HOST" -U "$POSTGRES_USER" -d postgres -tc "SELECT 1 FROM pg_database WHERE datname = 'chatwoot_production'" | grep -q 1 || \
PGPASSWORD=$POSTGRES_PASSWORD psql -h "$POSTGRES_HOST" -U "$POSTGRES_USER" -d postgres -c "CREATE DATABASE chatwoot_production"

echo "Banco chatwoot_production verificado/criado com sucesso!"

