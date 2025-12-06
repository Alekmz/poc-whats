import { Router, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { zapiService } from '../services/zapi.service';
import { authenticate, AuthRequest } from '../middleware/auth';
import { auditLog } from '../middleware/logger';

const router = Router();

// Todas as rotas requerem autenticação
router.use(authenticate);

/**
 * @swagger
 * /api/messages/send:
 *   post:
 *     summary: Envia mensagem via Z-API
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - phone
 *               - message
 *             properties:
 *               phone:
 *                 type: string
 *               message:
 *                 type: string
 */
router.post(
  '/send',
  [
    body('phone').notEmpty().trim(),
    body('message').notEmpty().trim(),
  ],
  async (req: AuthRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { phone, message } = req.body;

      const result = await zapiService.sendTextMessage(phone, message);

      if (req.user) {
        await auditLog(req.user.id, 'ZAPI_MESSAGE_SENT', undefined, {
          phone,
          message: message.substring(0, 100), // Log apenas primeiros 100 caracteres
        });
      }

      res.json({
        success: true,
        message: 'Mensagem enviada com sucesso',
        data: result.data,
      });
    } catch (error: any) {
      console.error('Erro ao enviar mensagem via Z-API:', error);
      
      if (req.user) {
        await auditLog(req.user.id, 'ZAPI_MESSAGE_ERROR', undefined, {
          error: error.message,
        });
      }

      res.status(500).json({
        success: false,
        error: error.message || 'Erro ao enviar mensagem via Z-API',
      });
    }
  }
);

export default router;

