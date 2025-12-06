import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed do banco de dados...');

  // Criar usuário admin padrão
  const adminEmail = 'admin@whatsapp-platform.com';
  const adminPassword = 'admin123';

  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (!existingAdmin) {
    const passwordHash = await bcrypt.hash(adminPassword, 10);

    const admin = await prisma.user.create({
      data: {
        name: 'Administrador',
        email: adminEmail,
        passwordHash,
        role: 'ADMIN',
        active: true,
      },
    });

    console.log('✅ Usuário admin criado:');
    console.log(`   Email: ${adminEmail}`);
    console.log(`   Senha: ${adminPassword}`);
    console.log(`   ID: ${admin.id}`);
  } else {
    console.log('ℹ️  Usuário admin já existe');
  }

  // Criar usuário supervisor de exemplo
  const supervisorEmail = 'supervisor@whatsapp-platform.com';
  const supervisorPassword = 'supervisor123';

  const existingSupervisor = await prisma.user.findUnique({
    where: { email: supervisorEmail },
  });

  if (!existingSupervisor) {
    const passwordHash = await bcrypt.hash(supervisorPassword, 10);

    const supervisor = await prisma.user.create({
      data: {
        name: 'Supervisor',
        email: supervisorEmail,
        passwordHash,
        role: 'SUPERVISOR',
        active: true,
      },
    });

    console.log('✅ Usuário supervisor criado:');
    console.log(`   Email: ${supervisorEmail}`);
    console.log(`   Senha: ${supervisorPassword}`);
  } else {
    console.log('ℹ️  Usuário supervisor já existe');
  }

  // Criar usuário operador de exemplo
  const operatorEmail = 'operador@whatsapp-platform.com';
  const operatorPassword = 'operador123';

  const existingOperator = await prisma.user.findUnique({
    where: { email: operatorEmail },
  });

  if (!existingOperator) {
    const passwordHash = await bcrypt.hash(operatorPassword, 10);

    const operator = await prisma.user.create({
      data: {
        name: 'Operador',
        email: operatorEmail,
        passwordHash,
        role: 'OPERATOR',
        active: true,
      },
    });

    console.log('✅ Usuário operador criado:');
    console.log(`   Email: ${operatorEmail}`);
    console.log(`   Senha: ${operatorPassword}`);
  } else {
    console.log('ℹ️  Usuário operador já existe');
  }

  console.log('✅ Seed concluído!');
}

main()
  .catch((e) => {
    console.error('❌ Erro no seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

