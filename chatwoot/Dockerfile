# Dockerfile para Chatwoot no Railway
# Usa a imagem oficial do Chatwoot

FROM chatwoot/chatwoot:latest

# Garantir que estamos no diretório correto
WORKDIR /app

# Instalar dependências necessárias para healthcheck e verificação de conexão
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    postgresql-client \
    netcat-openbsd \
    wget \
    && rm -rf /var/lib/apt/lists/*

# Copiar script de inicialização
COPY entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh

# Expor a porta padrão do Chatwoot
EXPOSE 3000

# Health check melhorado
HEALTHCHECK --interval=30s --timeout=10s --start-period=300s --retries=5 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:3000/ || nc -z 127.0.0.1 3000 || exit 1

# Comando de inicialização
# O script entrypoint.sh trata o erro da extensão vector de forma mais robusta
ENTRYPOINT ["/app/entrypoint.sh"]
