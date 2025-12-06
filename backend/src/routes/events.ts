import { Router, Request, Response } from 'express';
import { eventsService } from '../services/events.service';
import { authenticate } from '../middleware/auth';
import jwt from 'jsonwebtoken';

const router = Router();

/**
 * Middleware para autenticar SSE (aceita token no header ou query)
 */
const authenticateSSE = (req: Request, res: Response, next: any) => {
  // Tentar pegar token do header Authorization
  const authHeader = req.headers.authorization;
  let token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;
  
  // Se não tiver no header, tentar pegar do query parameter (para EventSource)
  if (!token) {
    token = req.query.token as string;
  }
  
  if (!token) {
    return res.status(401).json({ error: 'Token não fornecido' });
  }
  
  try {
    const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    (req as any).user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Token inválido' });
  }
};

/**
 * @swagger
 * /api/events:
 *   get:
 *     summary: Conecta ao stream de eventos Server-Sent Events (SSE)
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: conversationId
 *         schema:
 *           type: integer
 *         description: ID da conversa para receber eventos específicos
 *       - in: query
 *         name: token
 *         schema:
 *           type: string
 *         description: Token JWT (alternativa ao header Authorization para EventSource)
 */
router.get('/', authenticateSSE, (req: any, res: Response) => {
  try {
    const conversationId = req.query.conversationId 
      ? parseInt(req.query.conversationId as string) 
      : undefined;

    // Adicionar cliente ao serviço de eventos
    const clientId = eventsService.addClient(res, conversationId);

    // Manter conexão viva com ping periódico
    const pingInterval = setInterval(() => {
      try {
        res.write(`: ping\n\n`);
      } catch (error) {
        clearInterval(pingInterval);
        eventsService.removeClient(clientId);
      }
    }, 30000); // Ping a cada 30 segundos

    // Limpar intervalo quando cliente desconectar
    res.on('close', () => {
      clearInterval(pingInterval);
      eventsService.removeClient(clientId);
    });
  } catch (error: any) {
    console.error('Erro ao conectar cliente SSE:', error);
    res.status(500).json({ error: 'Erro ao conectar ao stream de eventos' });
  }
});

export default router;

