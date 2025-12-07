import { Router, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { chatwootService } from '../services/chatwoot.service';
import { authenticate, AuthRequest } from '../middleware/auth';
import { auditLog } from '../middleware/logger';

const router = Router();

// Todas as rotas requerem autenticação
router.use(authenticate);

/**
 * @swagger
 * /api/conversations:
 *   get:
 *     summary: Lista conversas
 *     tags: [Conversations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: inboxId
 *         schema:
 *           type: integer
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 */
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const inboxId = req.query.inboxId ? parseInt(req.query.inboxId as string) : undefined;
    const status = req.query.status as string | undefined;
    const whatsappNumberId = req.query.whatsappNumberId as string | undefined;

    console.log(`📋 Listando conversas - inboxId: ${inboxId}, status: ${status}, whatsappNumberId: ${whatsappNumberId}`);

    let conversations: any[] = [];
    let targetInboxId = inboxId;

    // Se especificou whatsappNumberId, buscar o inbox associado
    if (whatsappNumberId && !inboxId) {
      const prisma = (await import('../config/database')).default;
      const whatsappNumber = await prisma.whatsAppNumber.findUnique({
        where: { id: whatsappNumberId },
      });
      
      if (whatsappNumber && whatsappNumber.inboxId) {
        targetInboxId = whatsappNumber.inboxId;
        console.log(`📱 WhatsApp Number ${whatsappNumberId} associado ao inbox ${targetInboxId}`);
      } else {
        console.warn(`⚠️ WhatsApp Number ${whatsappNumberId} não encontrado ou sem inbox associado`);
      }
    }

    if (targetInboxId) {
      console.log(`🔍 Buscando conversas do inbox: ${targetInboxId}`);
      conversations = await chatwootService.listConversations(targetInboxId, status);
      console.log(`✅ Encontradas ${conversations.length} conversas no inbox ${targetInboxId}`);
    } else {
      // Se não especificar inbox, lista todas (requer listar inboxes primeiro)
      console.log(`🔍 Buscando todas as conversas de todas as inboxes`);
      const inboxes = await chatwootService.listInboxes();
      console.log(`📬 Total de inboxes: ${inboxes.length}`);
      
      if (inboxes.length === 0) {
        console.warn('⚠️ Nenhuma inbox encontrada ou Chatwoot não está acessível');
        conversations = [];
      } else {
        const allConversations = await Promise.all(
          inboxes.map(async (inbox) => {
            try {
              console.log(`🔍 Buscando conversas do inbox ${inbox.id} (${inbox.name})`);
              const convs = await chatwootService.listConversations(inbox.id, status);
              console.log(`✅ Inbox ${inbox.id}: ${convs.length} conversas`);
              return convs;
            } catch (error: any) {
              console.error(`❌ Erro ao buscar conversas do inbox ${inbox.id}:`, error.message);
              return []; // Retornar array vazio se falhar
            }
          })
        );
        conversations = allConversations.flat();
        console.log(`✅ Total de conversas encontradas: ${conversations.length}`);
      }
    }

    if (req.user) {
      await auditLog(req.user.id, 'CONVERSATIONS_LISTED', undefined, { inboxId, status });
    }

    console.log(`📤 Retornando ${conversations.length} conversas para o frontend`);
    res.json(conversations);
  } catch (error: any) {
    console.error('Erro ao listar conversas:', error);
    res.status(500).json({ error: error.message || 'Erro ao listar conversas' });
  }
});

/**
 * @swagger
 * /api/conversations/{id}:
 *   get:
 *     summary: Busca uma conversa específica
 *     tags: [Conversations]
 *     security:
 *       - bearerAuth: []
 */
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const conversationId = parseInt(req.params.id);
    const conversation = await chatwootService.getConversation(conversationId);

    if (req.user) {
      await auditLog(req.user.id, 'CONVERSATION_VIEWED', conversationId.toString());
    }

    res.json(conversation);
  } catch (error: any) {
    console.error('Erro ao buscar conversa:', error);
    res.status(500).json({ error: error.message || 'Erro ao buscar conversa' });
  }
});

/**
 * @swagger
 * /api/conversations/{id}/messages:
 *   get:
 *     summary: Lista mensagens de uma conversa
 *     tags: [Conversations]
 *     security:
 *       - bearerAuth: []
 */
router.get('/:id/messages', async (req: AuthRequest, res: Response) => {
  try {
    const conversationId = parseInt(req.params.id);
    const messages = await chatwootService.listMessages(conversationId);

    if (req.user) {
      await auditLog(req.user.id, 'MESSAGES_LISTED', conversationId.toString());
    }

    res.json(messages);
  } catch (error: any) {
    console.error('Erro ao listar mensagens:', error);
    res.status(500).json({ error: error.message || 'Erro ao listar mensagens' });
  }
});

/**
 * @swagger
 * /api/conversations/{id}/send:
 *   post:
 *     summary: Envia uma mensagem
 *     tags: [Conversations]
 *     security:
 *       - bearerAuth: []
 */
router.post(
  '/:id/send',
  [body('content').notEmpty().trim()],
  async (req: AuthRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const conversationId = parseInt(req.params.id);
      const { content } = req.body;

      console.log(`📤 Enviando mensagem na conversa ${conversationId}: ${content.substring(0, 50)}...`);

      const message = await chatwootService.sendMessage(conversationId, content);
      
      console.log(`✅ Mensagem criada no Chatwoot:`, {
        id: message.id,
        content: message.content,
        message_type: message.message_type,
      });

      // Emitir evento SSE para atualizar frontend em tempo real
      try {
        const { eventsService } = await import('../services/events.service');
        eventsService.sendNewMessage(conversationId, message);
        console.log(`📡 Evento SSE enviado para conversa ${conversationId}`);
      } catch (sseError) {
        console.warn('⚠️ Erro ao enviar evento SSE (não crítico):', sseError);
      }

      // Encaminhar mensagem para Z-API se configurado
      try {
        console.log(`🔄 Encaminhando mensagem para Z-API...`);
        console.log(`📋 Dados da mensagem recebida do Chatwoot:`, JSON.stringify(message, null, 2));
        await chatwootService.relayOutgoingMessageToZapi(conversationId, message);
        console.log(`✅ Mensagem encaminhada para Z-API com sucesso`);
      } catch (relayError: any) {
        // Não falhar a requisição se o relay falhar, mas logar todos os detalhes
        console.error('❌ Erro ao encaminhar para Z-API (não crítico):', {
          message: relayError.message,
          stack: relayError.stack,
          response: relayError.response?.data,
          status: relayError.response?.status,
        });
        // Continuar mesmo com erro - a mensagem já foi salva no Chatwoot
      }

      if (req.user) {
        await auditLog(req.user.id, 'MESSAGE_SENT', conversationId.toString(), { content });
      }

      res.json(message);
    } catch (error: any) {
      console.error('Erro ao enviar mensagem:', error);
      res.status(500).json({ error: error.message || 'Erro ao enviar mensagem' });
    }
  }
);

/**
 * @swagger
 * /api/conversations/{id}/transfer:
 *   post:
 *     summary: Transfere uma conversa
 *     tags: [Conversations]
 *     security:
 *       - bearerAuth: []
 */
router.post(
  '/:id/transfer',
  [
    body('targetAgentId').optional().isInt(),
    body('targetInboxId').optional().isInt(),
  ],
  async (req: AuthRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const conversationId = parseInt(req.params.id);
      const { targetAgentId, targetInboxId } = req.body;

      // Se especificou targetInboxId, transferir para outro inbox
      if (targetInboxId) {
        await chatwootService.transferConversationToInbox(
          conversationId,
          targetInboxId,
          targetAgentId
        );

        if (req.user) {
          await auditLog(
            req.user.id,
            'CONVERSATION_TRANSFERRED',
            conversationId.toString(),
            { targetInboxId, targetAgentId }
          );
        }

        res.json({ message: 'Conversa transferida para outro inbox com sucesso' });
      } else if (targetAgentId) {
        // Transferir apenas entre agentes (mesmo inbox)
        await chatwootService.transferConversation(conversationId, targetAgentId);

        if (req.user) {
          await auditLog(
            req.user.id,
            'CONVERSATION_TRANSFERRED',
            conversationId.toString(),
            { targetAgentId }
          );
        }

        res.json({ message: 'Conversa transferida com sucesso' });
      } else {
        res.status(400).json({ error: 'É necessário especificar targetAgentId ou targetInboxId' });
      }
    } catch (error: any) {
      console.error('Erro ao transferir conversa:', error);
      res.status(500).json({ error: error.message || 'Erro ao transferir conversa' });
    }
  }
);

export default router;

