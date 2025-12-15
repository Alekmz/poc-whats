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

# Garantir permissões e verificar que o arquivo foi copiado corretamente
RUN chmod +x /app/entrypoint.sh && \
    ls -la /app/entrypoint.sh && \
    test -f /app/entrypoint.sh && \
    test -x /app/entrypoint.sh && \
    head -1 /app/entrypoint.sh && \
    which bash || which sh || echo "Shell não encontrado" && \
    echo "✓ entrypoint.sh copiado e configurado corretamente"

# Expor a porta padrão do Chatwoot
EXPOSE 3000

# Health check usando Ruby (que já está disponível na imagem)
# start-period aumentado para 10 minutos para dar tempo do setup inicial
HEALTHCHECK --interval=30s --timeout=10s --start-period=600s --retries=10 \
  CMD ruby -e "require 'socket'; begin; TCPSocket.new('127.0.0.1', 3000).close; exit 0; rescue; exit 1; end"

# Comando de inicialização
# O script entrypoint.sh trata o erro da extensão vector de forma mais robusta
# A imagem do Chatwoot baseada em Ruby deve ter bash em /bin/bash
ENTRYPOINT ["/app/entrypoint.sh"]
