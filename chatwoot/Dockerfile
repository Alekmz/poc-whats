# Dockerfile para Chatwoot no Railway
# Usa a imagem oficial do Chatwoot

FROM chatwoot/chatwoot:latest

# O Chatwoot já vem com tudo configurado
# As variáveis de ambiente serão passadas pelo Railway

# Copiar script de inicialização
COPY entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh

# Expor a porta padrão do Chatwoot
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=180s --retries=5 \
  CMD /usr/bin/wget --no-verbose --tries=1 --spider http://127.0.0.1:3000/ || /usr/bin/nc -z 127.0.0.1 3000 || exit 1

# Comando de inicialização
# O script entrypoint.sh trata o erro da extensão vector de forma mais robusta
ENTRYPOINT ["/app/entrypoint.sh"]
