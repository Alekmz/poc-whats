import { Router, Response } from 'express';
import { body, validationResult } from 'express-validator';
import prisma from '../config/database';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { auditLog } from '../middleware/logger';
import { botService } from '../services/bot.service';

const router = Router();

// Todas as rotas requerem autenticação
router.use(authenticate);
router.use(authorize('ADMIN', 'SUPERVISOR'));

/**
 * @swagger
 * /api/bot/flows:
 *   get:
 *     summary: Lista todos os fluxos de bot
 *     tags: [Bot]
 *     security:
 *       - bearerAuth: []
 */
router.get('/flows', async (req: AuthRequest, res: Response) => {
  try {
    const flows = await prisma.botFlow.findMany({
      include: {
        whatsappNumber: {
          select: {
            id: true,
            name: true,
            phoneNumber: true,
            isConnected: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(flows);
  } catch (error: any) {
    console.error('Erro ao listar fluxos de bot:', error);
    res.status(500).json({ error: 'Erro ao listar fluxos de bot' });
  }
});

/**
 * @swagger
 * /api/bot/flows:
 *   post:
 *     summary: Cria um novo fluxo de bot
 *     tags: [Bot]
 *     security:
 *       - bearerAuth: []
 */
router.post(
  '/flows',
  [
    body('name').notEmpty().trim(),
    body('whatsappNumberId').notEmpty().trim(),
    body('initialMessage').notEmpty().trim(),
    body('menuSteps').isArray(),
  ],
  async (req: AuthRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { name, whatsappNumberId, initialMessage, menuSteps, isActive } = req.body;

      // Verificar se o WhatsAppNumber existe
      const whatsappNumber = await prisma.whatsAppNumber.findUnique({
        where: { id: whatsappNumberId },
      });

      if (!whatsappNumber) {
        return res.status(404).json({ error: 'WhatsApp Number não encontrado' });
      }

      // Criar fluxo
      const botFlow = await prisma.botFlow.create({
        data: {
          name,
          whatsappNumberId,
          initialMessage,
          menuSteps,
          isActive: isActive !== undefined ? isActive : true,
        },
        include: {
          whatsappNumber: {
            select: {
              id: true,
              name: true,
              phoneNumber: true,
            },
          },
        },
      });

      if (req.user) {
        await auditLog(req.user.id, 'BOT_FLOW_CREATED', undefined, {
          botFlowId: botFlow.id,
          name,
          whatsappNumberId,
        });
      }

      res.status(201).json(botFlow);
    } catch (error: any) {
      console.error('Erro ao criar fluxo de bot:', error);
      res.status(500).json({ error: error.message || 'Erro ao criar fluxo de bot' });
    }
  }
);

/**
 * @swagger
 * /api/bot/flows/{id}:
 *   get:
 *     summary: Busca um fluxo de bot específico
 *     tags: [Bot]
 *     security:
 *       - bearerAuth: []
 */
router.get('/flows/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const botFlow = await prisma.botFlow.findUnique({
      where: { id },
      include: {
        whatsappNumber: {
          select: {
            id: true,
            name: true,
            phoneNumber: true,
            isConnected: true,
          },
        },
        sessions: {
          where: { isActive: true },
          take: 10,
          orderBy: { updatedAt: 'desc' },
        },
      },
    });

    if (!botFlow) {
      return res.status(404).json({ error: 'Fluxo de bot não encontrado' });
    }

    res.json(botFlow);
  } catch (error: any) {
    console.error('Erro ao buscar fluxo de bot:', error);
    res.status(500).json({ error: 'Erro ao buscar fluxo de bot' });
  }
});

/**
 * @swagger
 * /api/bot/flows/{id}:
 *   put:
 *     summary: Atualiza um fluxo de bot
 *     tags: [Bot]
 *     security:
 *       - bearerAuth: []
 */
router.put(
  '/flows/:id',
  [
    body('name').optional().trim(),
    body('initialMessage').optional().trim(),
    body('menuSteps').optional().isArray(),
    body('isActive').optional().isBoolean(),
  ],
  async (req: AuthRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { id } = req.params;
      const { name, initialMessage, menuSteps, isActive } = req.body;

      // Verificar se existe
      const existing = await prisma.botFlow.findUnique({
        where: { id },
      });

      if (!existing) {
        return res.status(404).json({ error: 'Fluxo de bot não encontrado' });
      }

      // Atualizar
      const botFlow = await prisma.botFlow.update({
        where: { id },
        data: {
          ...(name && { name }),
          ...(initialMessage && { initialMessage }),
          ...(menuSteps && { menuSteps }),
          ...(isActive !== undefined && { isActive }),
        },
        include: {
          whatsappNumber: {
            select: {
              id: true,
              name: true,
              phoneNumber: true,
            },
          },
        },
      });

      if (req.user) {
        await auditLog(req.user.id, 'BOT_FLOW_UPDATED', undefined, {
          botFlowId: id,
          changes: req.body,
        });
      }

      res.json(botFlow);
    } catch (error: any) {
      console.error('Erro ao atualizar fluxo de bot:', error);
      res.status(500).json({ error: error.message || 'Erro ao atualizar fluxo de bot' });
    }
  }
);

/**
 * @swagger
 * /api/bot/flows/{id}:
 *   delete:
 *     summary: Deleta um fluxo de bot
 *     tags: [Bot]
 *     security:
 *       - bearerAuth: []
 */
router.delete('/flows/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Verificar se existe
    const existing = await prisma.botFlow.findUnique({
      where: { id },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Fluxo de bot não encontrado' });
    }

    // Deletar (cascade vai deletar sessões também)
    await prisma.botFlow.delete({
      where: { id },
    });

    if (req.user) {
      await auditLog(req.user.id, 'BOT_FLOW_DELETED', undefined, {
        botFlowId: id,
        name: existing.name,
      });
    }

    res.json({ message: 'Fluxo de bot deletado com sucesso' });
  } catch (error: any) {
    console.error('Erro ao deletar fluxo de bot:', error);
    res.status(500).json({ error: 'Erro ao deletar fluxo de bot' });
  }
});

/**
 * @swagger
 * /api/bot/sessions:
 *   get:
 *     summary: Lista sessões ativas do bot
 *     tags: [Bot]
 *     security:
 *       - bearerAuth: []
 */
router.get('/sessions', async (req: AuthRequest, res: Response) => {
  try {
    const { botFlowId, phoneNumber, isActive } = req.query;

    const where: any = {};
    if (botFlowId) where.botFlowId = botFlowId as string;
    if (phoneNumber) where.phoneNumber = phoneNumber as string;
    if (isActive !== undefined) where.isActive = isActive === 'true';

    const sessions = await prisma.botSession.findMany({
      where,
      include: {
        botFlow: {
          select: {
            id: true,
            name: true,
            whatsappNumber: {
              select: {
                id: true,
                name: true,
                phoneNumber: true,
              },
            },
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
      take: 100,
    });

    res.json(sessions);
  } catch (error: any) {
    console.error('Erro ao listar sessões do bot:', error);
    res.status(500).json({ error: 'Erro ao listar sessões do bot' });
  }
});

/**
 * @swagger
 * /api/bot/sessions/{id}/transfer:
 *   post:
 *     summary: Transfere uma sessão do bot para atendente
 *     tags: [Bot]
 *     security:
 *       - bearerAuth: []
 */
router.post('/sessions/:id/transfer', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const session = await prisma.botSession.findUnique({
      where: { id },
      include: {
        botFlow: {
          include: {
            whatsappNumber: true,
          },
        },
      },
    });

    if (!session) {
      return res.status(404).json({ error: 'Sessão não encontrada' });
    }

    if (!session.isActive) {
      return res.status(400).json({ error: 'Sessão já está inativa' });
    }

    // Transferir para Chatwoot
    if (session.botFlow.whatsappNumber.inboxId) {
      const chatwootService = (await import('../services/chatwoot.service')).chatwootService;
      const conversationId = await chatwootService.findOrCreateConversationByPhone(
        session.phoneNumber,
        session.botFlow.whatsappNumber.inboxId
      );

      // Atualizar sessão
      await prisma.botSession.update({
        where: { id },
        data: {
          conversationId: conversationId,
          isActive: false,
        },
      });

      // Enviar mensagem de transferência
      await chatwootService.createMessageInConversation(
        conversationId,
        `🤖 Conversa transferida do bot manualmente. Cliente estava no step: ${session.currentStep || 'initial'}`,
        'outgoing',
        'user'
      );

      if (req.user) {
        await auditLog(req.user.id, 'BOT_SESSION_TRANSFERRED', conversationId.toString(), {
          sessionId: id,
          phoneNumber: session.phoneNumber,
        });
      }

      res.json({
        message: 'Sessão transferida com sucesso',
        conversationId: conversationId,
      });
    } else {
      res.status(400).json({ error: 'WhatsApp Number não tem inbox associado' });
    }
  } catch (error: any) {
    console.error('Erro ao transferir sessão:', error);
    res.status(500).json({ error: error.message || 'Erro ao transferir sessão' });
  }
});

export default router;

