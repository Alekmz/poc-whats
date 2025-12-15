#!/bin/bash
# Script de inicialização do Chatwoot para Railway
# Não usar set -e aqui, pois queremos tratar erros manualmente

set -o pipefail

echo "=== Inicialização do Chatwoot ==="
echo "Timestamp: $(date)"

# Função para verificar conexão com PostgreSQL
wait_for_postgres() {
  echo "Verificando conexão com PostgreSQL..."
  local max_attempts=30
  local attempt=0
  
  # Tentar usar psql se disponível, senão usar Ruby
  local use_ruby=false
  if ! command -v psql > /dev/null 2>&1; then
    use_ruby=true
  fi
  
  while [ $attempt -lt $max_attempts ]; do
    if [ "$use_ruby" = true ]; then
      # Usar Ruby para verificar conexão
      if ruby -e "
        require 'pg'
        begin
          conn = PG.connect(
            host: '${POSTGRES_HOST}',
            port: ${POSTGRES_PORT:-5432},
            dbname: '${POSTGRES_DATABASE}',
            user: '${POSTGRES_USERNAME}',
            password: '${POSTGRES_PASSWORD}',
            connect_timeout: 2
          )
          conn.exec('SELECT 1')
          conn.close
          exit 0
        rescue
          exit 1
        end
      " 2>/dev/null; then
        echo "✓ PostgreSQL está acessível"
        return 0
      fi
    else
      # Usar psql
      if PGPASSWORD="${POSTGRES_PASSWORD}" psql -h "${POSTGRES_HOST}" -p "${POSTGRES_PORT:-5432}" -U "${POSTGRES_USERNAME}" -d "${POSTGRES_DATABASE}" -c "SELECT 1" > /dev/null 2>&1; then
        echo "✓ PostgreSQL está acessível"
        return 0
      fi
    fi
    attempt=$((attempt + 1))
    echo "Tentativa $attempt/$max_attempts: Aguardando PostgreSQL..."
    sleep 2
  done
  
  echo "✗ Não foi possível conectar ao PostgreSQL após $max_attempts tentativas"
  return 1
}

# Função para verificar conexão com Redis
wait_for_redis() {
  echo "Verificando conexão com Redis..."
  if [ -z "$REDIS_URL" ]; then
    echo "⚠ REDIS_URL não está definida, pulando verificação"
    return 0
  fi
  
  # Extrair host e porta do REDIS_URL
  local redis_host=$(echo "$REDIS_URL" | sed -E 's|redis://([^:]+):([0-9]+).*|\1|')
  local redis_port=$(echo "$REDIS_URL" | sed -E 's|redis://([^:]+):([0-9]+).*|\2|')
  
  if [ -z "$redis_host" ] || [ -z "$redis_port" ]; then
    echo "⚠ Não foi possível extrair host/porta do Redis, pulando verificação"
    return 0
  fi
  
  local max_attempts=30
  local attempt=0
  
  # Tentar usar nc se disponível, senão usar Ruby
  local use_ruby=false
  if ! command -v nc > /dev/null 2>&1; then
    use_ruby=true
  fi
  
  while [ $attempt -lt $max_attempts ]; do
    if [ "$use_ruby" = true ]; then
      # Usar Ruby para verificar conexão
      if ruby -e "
        require 'socket'
        begin
          socket = TCPSocket.new('${redis_host}', ${redis_port})
          socket.close
          exit 0
        rescue
          exit 1
        end
      " 2>/dev/null; then
        echo "✓ Redis está acessível"
        return 0
      fi
    else
      # Usar nc
      if nc -z "$redis_host" "$redis_port" 2>/dev/null; then
        echo "✓ Redis está acessível"
        return 0
      fi
    fi
    attempt=$((attempt + 1))
    echo "Tentativa $attempt/$max_attempts: Aguardando Redis..."
    sleep 2
  done
  
  echo "✗ Não foi possível conectar ao Redis após $max_attempts tentativas"
  return 1
}

# Verificar variáveis de ambiente essenciais
echo "Verificando variáveis de ambiente..."
if [ -z "$POSTGRES_HOST" ] || [ -z "$POSTGRES_DATABASE" ] || [ -z "$POSTGRES_USERNAME" ] || [ -z "$POSTGRES_PASSWORD" ]; then
  echo "✗ Erro: Variáveis do PostgreSQL não estão todas definidas"
  echo "POSTGRES_HOST=${POSTGRES_HOST:-não definido}"
  echo "POSTGRES_DATABASE=${POSTGRES_DATABASE:-não definido}"
  echo "POSTGRES_USERNAME=${POSTGRES_USERNAME:-não definido}"
  echo "POSTGRES_PASSWORD=${POSTGRES_PASSWORD:+definido}"
  exit 1
fi

if [ -z "$SECRET_KEY_BASE" ]; then
  echo "✗ Erro: SECRET_KEY_BASE não está definida"
  exit 1
fi

echo "✓ Variáveis de ambiente essenciais estão definidas"

# Aguardar dependências
wait_for_postgres || {
  echo "✗ Falha ao conectar ao PostgreSQL. Abortando."
  exit 1
}

wait_for_redis || {
  echo "⚠ Aviso: Não foi possível conectar ao Redis, mas continuando..."
}

# Verificar se o banco de dados existe
echo "Verificando se o banco de dados existe..."
if command -v psql > /dev/null 2>&1; then
  # Usar psql se disponível
  if ! PGPASSWORD="${POSTGRES_PASSWORD}" psql -h "${POSTGRES_HOST}" -p "${POSTGRES_PORT:-5432}" -U "${POSTGRES_USERNAME}" -d postgres -tc "SELECT 1 FROM pg_database WHERE datname = '${POSTGRES_DATABASE}'" | grep -q 1; then
    echo "Banco de dados '${POSTGRES_DATABASE}' não existe. Criando..."
    PGPASSWORD="${POSTGRES_PASSWORD}" psql -h "${POSTGRES_HOST}" -p "${POSTGRES_PORT:-5432}" -U "${POSTGRES_USERNAME}" -d postgres -c "CREATE DATABASE ${POSTGRES_DATABASE};" || {
      echo "✗ Erro ao criar banco de dados"
      exit 1
    }
    echo "✓ Banco de dados criado"
  else
    echo "✓ Banco de dados já existe"
  fi
else
  # Usar Ruby se psql não estiver disponível
  DB_EXISTS=$(ruby -e "
    require 'pg'
    begin
      conn = PG.connect(
        host: '${POSTGRES_HOST}',
        port: ${POSTGRES_PORT:-5432},
        dbname: 'postgres',
        user: '${POSTGRES_USERNAME}',
        password: '${POSTGRES_PASSWORD}'
      )
      result = conn.exec(\"SELECT 1 FROM pg_database WHERE datname = '${POSTGRES_DATABASE}'\")
      conn.close
      puts result.ntuples > 0 ? '1' : '0'
    rescue => e
      puts '0'
    end
  " 2>/dev/null)
  
  if [ "$DB_EXISTS" != "1" ]; then
    echo "Banco de dados '${POSTGRES_DATABASE}' não existe. Criando..."
    ruby -e "
      require 'pg'
      begin
        conn = PG.connect(
          host: '${POSTGRES_HOST}',
          port: ${POSTGRES_PORT:-5432},
          dbname: 'postgres',
          user: '${POSTGRES_USERNAME}',
          password: '${POSTGRES_PASSWORD}'
        )
        conn.exec(\"CREATE DATABASE ${POSTGRES_DATABASE}\")
        conn.close
        exit 0
      rescue => e
        puts \"Erro: #{e.message}\"
        exit 1
      end
    " || {
      echo "✗ Erro ao criar banco de dados"
      exit 1
    }
    echo "✓ Banco de dados criado"
  else
    echo "✓ Banco de dados já existe"
  fi
fi

# Verificar se o banco já está configurado (tem tabelas)
echo "Verificando se o banco já está configurado..."
TABLE_COUNT="0"
if command -v psql > /dev/null 2>&1; then
  TABLE_COUNT=$(PGPASSWORD="${POSTGRES_PASSWORD}" psql -h "${POSTGRES_HOST}" -p "${POSTGRES_PORT:-5432}" -U "${POSTGRES_USERNAME}" -d "${POSTGRES_DATABASE}" -tc "SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>/dev/null || echo "0")
else
  TABLE_COUNT=$(ruby -e "
    require 'pg'
    begin
      conn = PG.connect(
        host: '${POSTGRES_HOST}',
        port: ${POSTGRES_PORT:-5432},
        dbname: '${POSTGRES_DATABASE}',
        user: '${POSTGRES_USERNAME}',
        password: '${POSTGRES_PASSWORD}'
      )
      result = conn.exec(\"SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public'\")
      conn.close
      puts result[0]['count']
    rescue
      puts '0'
    end
  " 2>/dev/null || echo "0")
fi

# Executar setup do Chatwoot apenas se necessário
if [ "$TABLE_COUNT" -eq "0" ] || [ -z "$TABLE_COUNT" ]; then
  echo "Banco está vazio, executando setup do Chatwoot..."
  echo "Executando db:chatwoot_prepare (isso pode levar alguns minutos)..."
  
  # Executar com timeout de 5 minutos (se disponível)
  if command -v timeout > /dev/null 2>&1; then
    SETUP_OUTPUT=$(timeout 300 bundle exec rails db:chatwoot_prepare 2>&1)
    SETUP_EXIT_CODE=$?
  else
    # Se timeout não estiver disponível, executar diretamente
    SETUP_OUTPUT=$(bundle exec rails db:chatwoot_prepare 2>&1)
    SETUP_EXIT_CODE=$?
  fi
  
  if [ $SETUP_EXIT_CODE -eq 0 ]; then
    echo "✓ Setup do Chatwoot concluído com sucesso!"
  elif [ $SETUP_EXIT_CODE -eq 124 ]; then
    echo "⚠ Timeout no setup do Chatwoot (5 minutos)"
    echo "Tentando executar migrations e seed manualmente..."
    
    # Tentar executar migrations
    echo "Executando migrations..."
    bundle exec rails db:migrate 2>&1 || echo "⚠ Aviso: Migrations podem ter falhado"
    
    # Tentar executar seed
    echo "Executando seed..."
    bundle exec rails db:seed 2>&1 || echo "⚠ Aviso: Seed pode ter falhado"
  else
    echo "⚠ Erro no setup do Chatwoot (código: $SETUP_EXIT_CODE)"
    echo "Últimas linhas do output:"
    echo "$SETUP_OUTPUT" | tail -20
    
    # Verificar se o erro é relacionado à extensão vector
    if echo "$SETUP_OUTPUT" | grep -qi "vector\|pgvector"; then
      echo "⚠ Erro relacionado à extensão 'vector' detectado"
      echo "Isso é esperado se o PostgreSQL não tiver pgvector instalado"
      echo "Tentando executar migrations e seed manualmente..."
      
      # Tentar executar migrations
      echo "Executando migrations..."
      bundle exec rails db:migrate 2>&1 || echo "⚠ Aviso: Migrations podem ter falhado"
      
      # Tentar executar seed
      echo "Executando seed..."
      bundle exec rails db:seed 2>&1 || echo "⚠ Aviso: Seed pode ter falhado"
    else
      echo "⚠ Erro diferente da extensão vector detectado"
      echo "Tentando executar migrations mesmo assim..."
      bundle exec rails db:migrate 2>&1 || echo "⚠ Aviso: Migrations podem ter falhado"
    fi
  fi
else
  echo "✓ Banco já tem $TABLE_COUNT tabelas, pulando setup inicial"
  echo "Executando migrations pendentes (se houver)..."
  bundle exec rails db:migrate 2>&1 || echo "⚠ Aviso: Migrations podem ter falhado"
fi

# Iniciar servidor em background primeiro para verificar se inicia corretamente
echo "=== Preparando para iniciar servidor Chatwoot ==="
echo "Porta: 3000"
echo "Ambiente: ${RAILS_ENV:-production}"
echo "Timestamp: $(date)"

# Verificar se a porta está disponível
if command -v nc > /dev/null 2>&1; then
  if nc -z 127.0.0.1 3000 2>/dev/null; then
    echo "⚠ Aviso: Porta 3000 já está em uso"
  fi
fi

# Iniciar servidor
echo "=== Iniciando servidor Chatwoot ==="
exec bundle exec rails s -p 3000 -b 0.0.0.0
