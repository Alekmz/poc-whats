# 🔧 Guia de Configuração do Chatwoot

## Visão Geral

O Chatwoot já está configurado no `docker-compose.yml` e será iniciado automaticamente junto com os outros serviços.

## Configuração Inicial

### 1. Iniciar os Serviços

```bash
docker-compose up -d
```

O Chatwoot estará disponível em: **http://localhost:3001**

### 2. Primeira Inicialização

Na primeira vez que o Chatwoot iniciar, você precisa executar o setup:

```bash
# Aguardar o Chatwoot estar pronto (pode levar 1-2 minutos)
docker-compose logs -f chatwoot

# Quando estiver pronto, executar o setup
docker-compose exec chatwoot bundle exec rails db:chatwoot_prepare
```

Ou use o script automatizado:

```bash
bash docker/init-chatwoot.sh
```

### 3. Criar Conta de Administrador

**Opção 1: Via Interface Web (Recomendado)**

1. Acesse http://localhost:3001
2. Se o botão "Sign Up" aparecer, clique nele
3. Preencha os dados do primeiro administrador
4. Faça login

**Opção 2: Acessar Página de Signup Diretamente**

Se o botão não aparecer, tente acessar diretamente:
- URL: `http://localhost:3001/app/auth/signup`

**Opção 3: Criar Usuário via Console Rails (Se as opções acima não funcionarem)**

Se o registro ainda não estiver disponível, você pode criar o primeiro usuário administrador via console Rails:

```bash
# Acessar o console Rails do Chatwoot
docker-compose exec chatwoot bundle exec rails console

# No console Rails, execute:
account = Account.create!(name: 'Minha Conta')
user = User.create!(
  name: 'Administrador',
  email: 'admin@exemplo.com',
  password: 'sua_senha_segura',
  password_confirmation: 'sua_senha_segura',
  confirmed_at: Time.current
)
account_user = AccountUser.create!(
  account: account,
  user: user,
  role: :administrator
)
puts "✅ Usuário criado: #{user.email}"
exit
```

Depois disso, você poderá fazer login com o email e senha criados.

**Nota**: A variável `ENABLE_ACCOUNT_SIGNUP=true` já está configurada no `docker-compose.yml` para habilitar o registro. Se ainda não aparecer, use uma das opções acima.

### 4. Criar uma Inbox

1. No Chatwoot, vá em **Settings > Inboxes**
2. Clique em **Add Inbox**
3. Escolha o tipo de inbox (ex: API)
4. Configure conforme necessário
5. Anote o **Inbox ID** (você precisará dele)

### 5. Gerar API Token

1. No Chatwoot, vá em **Settings > Applications**
2. Clique em **New Application**
3. Preencha:
   - **Name**: WhatsApp Platform API
   - **Description**: API para integração com a plataforma
4. Clique em **Create**
5. **Copie o API Token** gerado (você só verá uma vez!)

### 6. Obter Account ID

1. No Chatwoot, vá em **Settings > Account**
2. O **Account ID** está visível na URL ou no topo da página
3. Geralmente é `1` para a primeira conta

### 7. Configurar no Backend

Edite o arquivo `backend/.env`:

```env
CHATWOOT_API_BASE_URL=http://chatwoot:3000
CHATWOOT_API_TOKEN=seu-token-aqui
CHATWOOT_ACCOUNT_ID=1
```

**Importante**: 
- Use `http://chatwoot:3000` (nome do serviço) para comunicação entre containers
- O backend já está configurado para usar essa URL por padrão

### 8. Reiniciar o Backend

```bash
docker-compose restart backend
```

## Verificação

Para verificar se a integração está funcionando:

```bash
# Ver logs do backend
docker-compose logs -f backend

# Testar endpoint de conversas
curl -H "Authorization: Bearer SEU_TOKEN" http://localhost:4000/api/conversations
```

## Estrutura de Dados

O Chatwoot usa o mesmo PostgreSQL, mas com um banco separado:
- **WhatsApp Platform**: `whatsapp_platform`
- **Chatwoot**: `chatwoot_production`

## Troubleshooting

### Chatwoot não inicia

```bash
# Ver logs
docker-compose logs chatwoot

# Verificar se o banco foi criado
docker-compose exec postgres psql -U postgres -l
```

### Erro de conexão com banco

```bash
# Verificar se o banco chatwoot_production existe
docker-compose exec postgres psql -U postgres -c "\l"

# Se não existir, criar manualmente
docker-compose exec postgres psql -U postgres -c "CREATE DATABASE chatwoot_production;"
```

### Erro 401 ao chamar API

- Verifique se o `CHATWOOT_API_TOKEN` está correto
- Verifique se o token não expirou
- Gere um novo token se necessário

### Backend não consegue conectar ao Chatwoot

- Verifique se o Chatwoot está rodando: `docker-compose ps`
- Verifique se a URL está correta: `http://chatwoot:3000` (não `localhost`)
- Verifique os logs: `docker-compose logs backend`

### Botão de Registro não aparece

**Sintoma**: Apenas a tela de login aparece, sem opção de registro.

**Soluções**:

1. **Verificar variável de ambiente**:
   ```bash
   # Verificar se ENABLE_ACCOUNT_SIGNUP está configurada
   docker-compose exec chatwoot env | grep ENABLE_ACCOUNT_SIGNUP
   ```
   Deve retornar: `ENABLE_ACCOUNT_SIGNUP=true`

2. **Acessar página de signup diretamente**:
   - Tente acessar: `http://localhost:3001/app/auth/signup`

3. **Criar usuário via console Rails** (veja Opção 3 na seção "Criar Conta de Administrador")

4. **Reiniciar o Chatwoot** após adicionar a variável:
   ```bash
   docker-compose restart chatwoot
   ```

## Variáveis de Ambiente do Chatwoot

As principais variáveis já estão configuradas no `docker-compose.yml`:

- `POSTGRES_HOST`: postgres
- `POSTGRES_DATABASE`: chatwoot_production
- `POSTGRES_USERNAME`: postgres
- `POSTGRES_PASSWORD`: postgres
- `REDIS_URL`: redis://redis:6379
- `RAILS_ENV`: production
- `FRONTEND_URL`: http://localhost:3001
- `ENABLE_ACCOUNT_SIGNUP`: true (habilita o botão de registro)

## Próximos Passos

Após configurar o Chatwoot:

1. ✅ Criar inbox
2. ✅ Obter API Token
3. ✅ Configurar no backend/.env
4. ✅ Testar integração
5. ⏭️ Configurar integração com WhatsApp (Meta API)

