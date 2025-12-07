# Dockerfile para Chatwoot no Railway
# Usa a imagem oficial do Chatwoot

FROM chatwoot/chatwoot:latest

# O Chatwoot já vem com tudo configurado
# As variáveis de ambiente serão passadas pelo Railway

# Expor a porta padrão do Chatwoot
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=180s --retries=5 \
  CMD /usr/bin/wget --no-verbose --tries=1 --spider http://127.0.0.1:3000/ || /usr/bin/nc -z 127.0.0.1 3000 || exit 1

# Comando de inicialização
# O Railway executará este comando
CMD sh -c "echo 'Aguardando setup do banco...' && sleep 10 && echo 'Executando setup do Chatwoot...' && bundle exec rails db:chatwoot_prepare 2>&1 || echo 'Setup pode ter falhado, mas continuando...' && echo 'Iniciando servidor Chatwoot...' && bundle exec rails s -p 3000 -b 0.0.0.0"
