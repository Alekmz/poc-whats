import { Router, Response } from 'express';
import { chatwootService } from '../services/chatwoot.service';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { auditLog } from '../middleware/logger';

const router = Router();

// Apenas supervisores e admins
router.use(authenticate);
router.use(authorize('SUPERVISOR', 'ADMIN'));

/**
 * @swagger
 * /api/supervisor/mirror:
 *   get:
 *     summary: Modo espelho - visualiza todas as conversas
 *     tags: [Supervisor]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: inboxId
 *         schema:
 *           type: integer
 *       - in: query
 *         name: agentId
 *         schema:
 *           type: integer
 */
router.get('/mirror', async (req: AuthRequest, res: Response) => {
  try {
    const inboxId = req.query.inboxId ? parseInt(req.query.inboxId as string) : undefined;
    const agentId = req.query.agentId ? parseInt(req.query.agentId as string) : undefined;
    const whatsappNumberId = req.query.whatsappNumberId as string | undefined;

    // Se especificou whatsappNumberId, buscar o inbox associado
    let targetInboxId = inboxId;
    if (whatsappNumberId && !inboxId) {
      const prisma = (await import('../config/database')).default;
      const whatsappNumber = await prisma.whatsAppNumber.findUnique({
        where: { id: whatsappNumberId },
      });
      
      if (whatsappNumber && whatsappNumber.inboxId) {
        targetInboxId = whatsappNumber.inboxId;
        console.log(`📱 WhatsApp Number ${whatsappNumberId} associado ao inbox ${targetInboxId}`);
      }
    }

    // Lista todas as conversas (modo espelho)
    let conversations;

    if (targetInboxId) {
      conversations = await chatwootService.listConversations(targetInboxId);
    } else {
      const inboxes = await chatwootService.listInboxes();
      const allConversations = await Promise.all(
        inboxes.map((inbox) => chatwootService.listConversations(inbox.id))
      );
      conversations = allConversations.flat();
    }

    // Filtrar por agente se especificado
    if (agentId) {
      conversations = conversations.filter(
        (conv: any) => conv.assignee?.id === agentId
      );
    }

    // Adicionar métricas básicas
    const metrics = {
      total: conversations.length,
      open: conversations.filter((c: any) => c.status === 'open').length,
      resolved: conversations.filter((c: any) => c.status === 'resolved').length,
      pending: conversations.filter((c: any) => c.status === 'pending').length,
    };

    if (req.user) {
      await auditLog(req.user.id, 'SUPERVISOR_MIRROR_ACCESSED', undefined, { inboxId, agentId });
    }

    res.json({
      conversations,
      metrics,
    });
  } catch (error: any) {
    console.error('Erro no modo espelho:', error);
    res.status(500).json({ error: error.message || 'Erro ao acessar modo espelho' });
  }
});

/**
 * @swagger
 * /api/supervisor/agents:
 *   get:
 *     summary: Lista agentes para filtro
 *     tags: [Supervisor]
 *     security:
 *       - bearerAuth: []
 */
router.get('/agents', async (req: AuthRequest, res: Response) => {
  try {
    const agents = await chatwootService.listAgents();

    res.json(agents);
  } catch (error: any) {
    console.error('Erro ao listar agentes:', error);
    res.status(500).json({ error: error.message || 'Erro ao listar agentes' });
  }
});

/**
 * @swagger
 * /api/supervisor/inboxes:
 *   get:
 *     summary: Lista inboxes
 *     tags: [Supervisor]
 *     security:
 *       - bearerAuth: []
 */
router.get('/inboxes', async (req: AuthRequest, res: Response) => {
  try {
    const inboxes = await chatwootService.listInboxes();

    res.json(inboxes);
  } catch (error: any) {
    console.error('Erro ao listar inboxes:', error);
    res.status(500).json({ error: error.message || 'Erro ao listar inboxes' });
  }
});

export default router;

