# Dockerfile para Chatwoot no Railway
# Usa a imagem oficial do Chatwoot

FROM chatwoot/chatwoot:latest

# Garantir que estamos no diretório correto
WORKDIR /app

# Tentar instalar dependências apenas se apt-get estiver disponível
# A imagem do Chatwoot pode já ter algumas dessas ferramentas
# Garantir que bash está disponível
RUN (command -v apt-get > /dev/null 2>&1 && \
     apt-get update && \
     apt-get install -y --no-install-recommends \
     bash \
     postgresql-client \
     netcat-openbsd \
     wget \
     curl \
     && rm -rf /var/lib/apt/lists/*) || \
    (command -v apk > /dev/null 2>&1 && \
     apk add --no-cache \
     bash \
     postgresql-client \
     netcat-openbsd \
     wget \
     curl) || \
    (command -v bash > /dev/null 2>&1 && echo "bash já está disponível" || echo "bash não encontrado, usando sh")

# Copiar script de inicialização
COPY entrypoint.sh /app/entrypoint.sh

# Garantir permissões e verificar que o arquivo foi copiado corretamente
# Também garantir que o bash existe e converter quebras de linha se necessário
RUN chmod +x /app/entrypoint.sh && \
    test -f /app/entrypoint.sh && \
    test -x /app/entrypoint.sh && \
    sed -i 's/\r$//' /app/entrypoint.sh 2>/dev/null || true && \
    (command -v bash > /dev/null 2>&1 && echo "bash encontrado em: $(command -v bash)" || echo "bash não encontrado") && \
    (command -v sh > /dev/null 2>&1 && echo "sh encontrado em: $(command -v sh)" || echo "sh não encontrado") && \
    ls -la /app/entrypoint.sh && \
    head -1 /app/entrypoint.sh && \
    echo "✓ entrypoint.sh copiado e configurado corretamente"

# Expor a porta padrão do Chatwoot
EXPOSE 3000

# Health check usando Ruby (que já está disponível na imagem)
# start-period aumentado para 10 minutos para dar tempo do setup inicial
HEALTHCHECK --interval=30s --timeout=10s --start-period=600s --retries=10 \
  CMD ruby -e "require 'socket'; begin; TCPSocket.new('127.0.0.1', 3000).close; exit 0; rescue; exit 1; end"

# Comando de inicialização
# O script entrypoint.sh trata o erro da extensão vector de forma mais robusta
# Usar bash explicitamente (deve estar disponível após instalação acima)
ENTRYPOINT ["/bin/bash", "/app/entrypoint.sh"]
