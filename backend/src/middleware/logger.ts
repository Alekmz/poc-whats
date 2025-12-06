import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from './auth';
import prisma from '../config/database';

export const logger = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const start = Date.now();

  // Interceptar resposta para logar após o término
  const originalSend = res.send;
  res.send = function (body) {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.path} - ${res.statusCode} - ${duration}ms`);
    return originalSend.call(this, body);
  };

  next();
};

export const auditLog = async (
  userId: string,
  action: string,
  conversationId?: string,
  metadata?: any
) => {
  try {
    // Se userId for 'system', buscar ou criar usuário system
    let finalUserId = userId;
    if (userId === 'system') {
      let systemUser = await prisma.user.findFirst({
        where: { email: 'system@whatsapp-platform.com' },
      });
      
      if (!systemUser) {
        systemUser = await prisma.user.create({
          data: {
            name: 'System',
            email: 'system@whatsapp-platform.com',
            passwordHash: '', // Não será usado para login
            role: 'ADMIN',
            active: true,
          },
        });
      }
      
      finalUserId = systemUser.id;
    }

    await prisma.log.create({
      data: {
        userId: finalUserId,
        action,
        conversationId: conversationId || null,
        metadata: metadata || {},
      },
    });
  } catch (error) {
    console.error('Erro ao criar log de auditoria:', error);
  }
};

