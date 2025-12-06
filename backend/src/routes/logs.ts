import { Router, Response } from 'express';
import prisma from '../config/database';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';

const router = Router();

// Apenas supervisores e admins podem ver logs
router.use(authenticate);
router.use(authorize('SUPERVISOR', 'ADMIN'));

/**
 * @swagger
 * /api/logs:
 *   get:
 *     summary: Lista logs de auditoria
 *     tags: [Logs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *       - in: query
 *         name: conversationId
 *         schema:
 *           type: string
 *       - in: query
 *         name: action
 *         schema:
 *           type: string
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 100
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 */
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.query.userId as string | undefined;
    const conversationId = req.query.conversationId as string | undefined;
    const action = req.query.action as string | undefined;
    const limit = parseInt(req.query.limit as string) || 100;
    const offset = parseInt(req.query.offset as string) || 0;

    const where: any = {};
    if (userId) where.userId = userId;
    if (conversationId) where.conversationId = conversationId;
    if (action) where.action = { contains: action, mode: 'insensitive' };

    const [logs, total] = await Promise.all([
      prisma.log.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: { timestamp: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.log.count({ where }),
    ]);

    res.json({
      logs,
      total,
      limit,
      offset,
    });
  } catch (error) {
    console.error('Erro ao listar logs:', error);
    res.status(500).json({ error: 'Erro ao listar logs' });
  }
});

export default router;

