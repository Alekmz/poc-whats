#!/bin/bash

echo "🚀 Configurando Plataforma Corporativa de WhatsApp..."

# Cores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Verificar Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js não encontrado. Por favor, instale Node.js 18+"
    exit 1
fi

echo -e "${GREEN}✓${NC} Node.js encontrado: $(node --version)"

# Verificar Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker não encontrado. Por favor, instale Docker"
    exit 1
fi

echo -e "${GREEN}✓${NC} Docker encontrado"

# Instalar dependências do root
echo -e "\n${YELLOW}Instalando dependências do workspace...${NC}"
npm install

# Instalar dependências do backend
echo -e "\n${YELLOW}Instalando dependências do backend...${NC}"
cd backend
npm install
cd ..

# Instalar dependências do frontend
echo -e "\n${YELLOW}Instalando dependências do frontend...${NC}"
cd frontend
npm install
cd ..

# Criar arquivos .env se não existirem
if [ ! -f backend/.env ]; then
    echo -e "\n${YELLOW}Criando backend/.env...${NC}"
    cp backend/.env.example backend/.env
    echo "⚠️  Configure as variáveis em backend/.env"
fi

if [ ! -f frontend/.env.local ]; then
    echo -e "\n${YELLOW}Criando frontend/.env.local...${NC}"
    cp frontend/.env.example frontend/.env.local
    echo "⚠️  Configure as variáveis em frontend/.env.local"
fi

# Gerar Prisma Client
echo -e "\n${YELLOW}Gerando Prisma Client...${NC}"
cd backend
npx prisma generate
cd ..

echo -e "\n${GREEN}✅ Setup concluído!${NC}"
echo -e "\n${YELLOW}Próximos passos:${NC}"
echo "1. Configure as variáveis de ambiente em backend/.env e frontend/.env.local"
echo "2. Execute: docker-compose up -d"
echo "3. Execute as migrations: cd backend && npx prisma migrate dev"
echo "4. Execute: npm run dev"

