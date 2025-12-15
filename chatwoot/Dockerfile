# Dockerfile para Chatwoot no Railway
# Usa a imagem oficial do Chatwoot

FROM chatwoot/chatwoot:latest

# Garantir que estamos no diretório correto
WORKDIR /app

# Tentar instalar dependências apenas se apt-get estiver disponível
# A imagem do Chatwoot pode já ter algumas dessas ferramentas
RUN (command -v apt-get > /dev/null 2>&1 && \
     apt-get update && \
     apt-get install -y --no-install-recommends \
     postgresql-client \
     netcat-openbsd \
     wget \
     curl \
     && rm -rf /var/lib/apt/lists/*) || \
    (command -v apk > /dev/null 2>&1 && \
     apk add --no-cache \
     postgresql-client \
     netcat-openbsd \
     wget \
     curl) || \
    echo "Gerenciador de pacotes não encontrado, usando comandos disponíveis na imagem"

# Copiar script de inicialização
COPY entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh

# Expor a porta padrão do Chatwoot
EXPOSE 3000

# Health check usando Ruby (que já está disponível na imagem)
HEALTHCHECK --interval=30s --timeout=10s --start-period=300s --retries=5 \
  CMD ruby -e "require 'socket'; begin; TCPSocket.new('127.0.0.1', 3000).close; exit 0; rescue; exit 1; end"

# Comando de inicialização
# O script entrypoint.sh trata o erro da extensão vector de forma mais robusta
ENTRYPOINT ["/app/entrypoint.sh"]
