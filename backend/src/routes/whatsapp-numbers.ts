import { Router, Response } from 'express';
import { body, validationResult } from 'express-validator';
import prisma from '../config/database';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { auditLog } from '../middleware/logger';
import { ZapiService } from '../services/zapi.service';

const router = Router();

// Todas as rotas requerem autenticação
router.use(authenticate);
router.use(authorize('ADMIN', 'SUPERVISOR'));

/**
 * @swagger
 * /api/whatsapp/numbers:
 *   get:
 *     summary: Lista todos os números WhatsApp cadastrados
 *     tags: [WhatsApp Numbers]
 *     security:
 *       - bearerAuth: []
 */
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const numbers = await prisma.whatsAppNumber.findMany({
      orderBy: { createdAt: 'desc' },
    });

    res.json(numbers);
  } catch (error) {
    console.error('Erro ao listar números WhatsApp:', error);
    res.status(500).json({ error: 'Erro ao listar números WhatsApp' });
  }
});

/**
 * @swagger
 * /api/whatsapp/numbers:
 *   post:
 *     summary: Cadastra um novo número WhatsApp
 *     tags: [WhatsApp Numbers]
 *     security:
 *       - bearerAuth: []
 */
router.post(
  '/',
  [
    body('instanceId').notEmpty().trim(),
    body('token').notEmpty().trim(),
    body('name').optional().trim(),
    body('inboxId').optional().isInt(),
  ],
  async (req: AuthRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { instanceId, token, name, inboxId } = req.body;

      // Verificar se já existe
      const existing = await prisma.whatsAppNumber.findUnique({
        where: { instanceId },
      });

      if (existing) {
        return res.status(400).json({ error: 'Instance ID já cadastrado' });
      }

      // Criar número
      const whatsappNumber = await prisma.whatsAppNumber.create({
        data: {
          instanceId,
          token,
          name: name || `WhatsApp ${instanceId}`,
          inboxId: inboxId || null,
        },
      });

      if (req.user) {
        await auditLog(req.user.id, 'WHATSAPP_NUMBER_CREATED', undefined, {
          instanceId,
          name,
        });
      }

      res.status(201).json(whatsappNumber);
    } catch (error: any) {
      console.error('Erro ao criar número WhatsApp:', error);
      res.status(500).json({ error: error.message || 'Erro ao criar número WhatsApp' });
    }
  }
);

/**
 * @swagger
 * /api/whatsapp/numbers/{id}:
 *   put:
 *     summary: Atualiza um número WhatsApp
 *     tags: [WhatsApp Numbers]
 *     security:
 *       - bearerAuth: []
 */
router.put(
  '/:id',
  [
    body('name').optional().trim(),
    body('token').optional().trim(),
    body('inboxId').optional().isInt(),
  ],
  async (req: AuthRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { id } = req.params;
      const { name, token, inboxId } = req.body;

      const updateData: any = {};
      if (name) updateData.name = name;
      if (token) updateData.token = token;
      if (inboxId !== undefined) updateData.inboxId = inboxId;

      const whatsappNumber = await prisma.whatsAppNumber.update({
        where: { id },
        data: updateData,
      });

      if (req.user) {
        await auditLog(req.user.id, 'WHATSAPP_NUMBER_UPDATED', undefined, { id });
      }

      res.json(whatsappNumber);
    } catch (error: any) {
      if (error.code === 'P2025') {
        return res.status(404).json({ error: 'Número WhatsApp não encontrado' });
      }
      console.error('Erro ao atualizar número WhatsApp:', error);
      res.status(500).json({ error: 'Erro ao atualizar número WhatsApp' });
    }
  }
);

/**
 * @swagger
 * /api/whatsapp/numbers/{id}:
 *   delete:
 *     summary: Remove um número WhatsApp
 *     tags: [WhatsApp Numbers]
 *     security:
 *       - bearerAuth: []
 */
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    await prisma.whatsAppNumber.delete({
      where: { id },
    });

    if (req.user) {
      await auditLog(req.user.id, 'WHATSAPP_NUMBER_DELETED', undefined, { id });
    }

    res.json({ message: 'Número WhatsApp removido com sucesso' });
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Número WhatsApp não encontrado' });
    }
    console.error('Erro ao deletar número WhatsApp:', error);
    res.status(500).json({ error: 'Erro ao deletar número WhatsApp' });
  }
});

/**
 * @swagger
 * /api/whatsapp/numbers/{id}/status:
 *   get:
 *     summary: Obtém status de um número WhatsApp
 *     tags: [WhatsApp Numbers]
 *     security:
 *       - bearerAuth: []
 */
router.get('/:id/status', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const whatsappNumber = await prisma.whatsAppNumber.findUnique({
      where: { id },
    });

    if (!whatsappNumber) {
      return res.status(404).json({ error: 'Número WhatsApp não encontrado' });
    }

    // Buscar status da Z-API
    const status = await ZapiService.getStatusWithCredentials(
      whatsappNumber.instanceId,
      whatsappNumber.token
    );

    // Atualizar status no banco
    await prisma.whatsAppNumber.update({
      where: { id },
      data: {
        isConnected: status.data?.connected || false,
        lastSeen: new Date(),
        phoneNumber: status.data?.phone || whatsappNumber.phoneNumber,
      },
    });

    res.json({
      ...whatsappNumber,
      status: status.data,
    });
  } catch (error: any) {
    console.error('Erro ao obter status:', error);
    res.status(500).json({ error: error.message || 'Erro ao obter status' });
  }
});

/**
 * @swagger
 * /api/whatsapp/numbers/{id}/refresh-qr:
 *   post:
 *     summary: Gera novo QR Code para um número WhatsApp
 *     tags: [WhatsApp Numbers]
 *     security:
 *       - bearerAuth: []
 */
router.post('/:id/refresh-qr', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const whatsappNumber = await prisma.whatsAppNumber.findUnique({
      where: { id },
    });

    if (!whatsappNumber) {
      return res.status(404).json({ error: 'Número WhatsApp não encontrado' });
    }

    // Verificar status da instância primeiro para garantir que existe
    try {
      const statusResponse = await ZapiService.getStatusWithCredentials(
        whatsappNumber.instanceId,
        whatsappNumber.token
      );
      console.log('Status da instância Z-API:', JSON.stringify(statusResponse, null, 2));
      
      // Se a instância já estiver conectada, não precisa de QR Code
      if (statusResponse.data?.connected || statusResponse.data?.status === 'connected') {
        return res.status(400).json({ 
          error: 'INSTANCE_ALREADY_CONNECTED',
          message: 'A instância já está conectada. Não é necessário gerar QR Code.' 
        });
      }
    } catch (statusError: any) {
      console.warn('Erro ao verificar status da instância:', statusError.message);
      // Continuar mesmo se o status falhar, pode ser que o endpoint de status não exista
    }

    // Buscar QR Code da Z-API
    console.log(`📋 Dados do WhatsApp Number do banco:`, {
      id: whatsappNumber.id,
      instanceId: whatsappNumber.instanceId,
      token: whatsappNumber.token ? `${whatsappNumber.token.substring(0, 10)}...` : 'não configurado',
      name: whatsappNumber.name,
    });
    console.log(`📋 Variáveis do .env:`, {
      ZAPI_INSTANCE_ID: process.env.ZAPI_INSTANCE_ID,
      ZAPI_TOKEN: process.env.ZAPI_TOKEN ? `${process.env.ZAPI_TOKEN.substring(0, 10)}...` : 'não configurado',
      ZAPI_CLIENT_TOKEN: process.env.ZAPI_CLIENT_TOKEN ? 'configurado' : 'não configurado',
    });
    console.log(`🔗 URL que será chamada: ${process.env.ZAPI_API_BASE || 'https://api.z-api.io'}/instances/${whatsappNumber.instanceId}/token/${whatsappNumber.token}`);
    
    const qrResponse = await ZapiService.getQRCodeWithCredentials(
      whatsappNumber.instanceId,
      whatsappNumber.token
    );

    console.log('QR Code response:', JSON.stringify(qrResponse, null, 2));

    // Extrair QR Code em diferentes formatos possíveis
    let qrCodeValue: string | null = null;
    const responseData = qrResponse.data;

    if (responseData) {
      // Tentar diferentes formatos de resposta da Z-API
      qrCodeValue = 
        responseData.qrCode || 
        responseData.base64 || 
        responseData.qr || 
        responseData.qrcode ||
        responseData.qr_code ||
        responseData.data?.qrCode ||
        responseData.data?.base64 ||
        responseData.data?.qr ||
        (typeof responseData === 'string' ? responseData : null);

      console.log('QR Code extraído (antes do formato):', qrCodeValue ? qrCodeValue.substring(0, 50) + '...' : 'null');

      // Se for base64 sem prefixo data:image, adicionar
      if (qrCodeValue && !qrCodeValue.startsWith('data:image') && !qrCodeValue.startsWith('http')) {
        // Verificar se já é base64 válido (pode ter espaços ou quebras de linha)
        const cleanBase64 = qrCodeValue.replace(/\s/g, '');
        if (cleanBase64.match(/^[A-Za-z0-9+/=]+$/)) {
          qrCodeValue = `data:image/png;base64,${cleanBase64}`;
        } else {
          // Se não for base64 válido, pode ser uma URL ou outro formato
          console.warn('QR Code não parece ser base64 válido, usando como está');
        }
      }
    }

    if (!qrCodeValue) {
      console.warn('QR Code não encontrado na resposta:', responseData);
    }

    // Atualizar QR Code no banco
    const updated = await prisma.whatsAppNumber.update({
      where: { id },
      data: {
        qrCode: qrCodeValue,
        isConnected: false, // Resetar conexão ao gerar novo QR
      },
    });

    if (req.user) {
      await auditLog(req.user.id, 'WHATSAPP_QR_REFRESHED', undefined, { id });
    }

    res.json({
      ...updated,
      qrCodeData: qrResponse.data,
    });
  } catch (error: any) {
    console.error('Erro ao gerar QR Code:', error);
    res.status(500).json({ error: error.message || 'Erro ao gerar QR Code' });
  }
});

/**
 * @swagger
 * /api/whatsapp/numbers/{id}/stats:
 *   get:
 *     summary: Obtém estatísticas de um número WhatsApp
 *     tags: [WhatsApp Numbers]
 *     security:
 *       - bearerAuth: []
 */
router.get('/:id/stats', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const whatsappNumber = await prisma.whatsAppNumber.findUnique({
      where: { id },
    });

    if (!whatsappNumber) {
      return res.status(404).json({ error: 'Número WhatsApp não encontrado' });
    }

    // Buscar conversas do inbox associado
    let conversations: any[] = [];
    if (whatsappNumber.inboxId) {
      try {
        const { chatwootService } = await import('../services/chatwoot.service');
        conversations = await chatwootService.listConversations(whatsappNumber.inboxId);
      } catch (error: any) {
        console.warn('Erro ao buscar conversas para estatísticas:', error.message);
      }
    }

    // Calcular estatísticas
    const stats = {
      totalConversations: conversations.length,
      openConversations: conversations.filter((c: any) => c.status === 'open').length,
      resolvedConversations: conversations.filter((c: any) => c.status === 'resolved').length,
      pendingConversations: conversations.filter((c: any) => c.status === 'pending').length,
      // Buscar mensagens para calcular tempo médio de resposta
      messages: {
        total: 0,
        incoming: 0,
        outgoing: 0,
      },
      // Horários de pico (últimas 24h)
      peakHours: [] as any[],
    };

    // Calcular estatísticas de mensagens
    for (const conversation of conversations) {
      try {
        const { chatwootService } = await import('../services/chatwoot.service');
        const messages = await chatwootService.listMessages(conversation.id);
        
        stats.messages.total += messages.length;
        stats.messages.incoming += messages.filter((m: any) => m.message_type === 0 || m.message_type === 'incoming').length;
        stats.messages.outgoing += messages.filter((m: any) => m.message_type === 1 || m.message_type === 'outgoing').length;
      } catch (error: any) {
        // Ignorar erros ao buscar mensagens
      }
    }

    // Calcular horários de pico (últimas 24h)
    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const hourCounts: { [key: number]: number } = {};
    
    for (let i = 0; i < 24; i++) {
      hourCounts[i] = 0;
    }

    // Contar mensagens por hora (simplificado - pode ser melhorado)
    for (const conversation of conversations) {
      try {
        const { chatwootService } = await import('../services/chatwoot.service');
        const messages = await chatwootService.listMessages(conversation.id);
        
        for (const message of messages) {
          const messageDate = new Date(message.created_at * 1000 || message.created_at);
          if (messageDate >= last24h) {
            const hour = messageDate.getHours();
            hourCounts[hour] = (hourCounts[hour] || 0) + 1;
          }
        }
      } catch (error: any) {
        // Ignorar erros
      }
    }

    // Converter para array e ordenar
    stats.peakHours = Object.entries(hourCounts)
      .map(([hour, count]) => ({ hour: parseInt(hour), count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5); // Top 5 horários

    res.json({
      whatsappNumber: {
        id: whatsappNumber.id,
        name: whatsappNumber.name,
        phoneNumber: whatsappNumber.phoneNumber,
        isConnected: whatsappNumber.isConnected,
      },
      stats,
    });
  } catch (error: any) {
    console.error('Erro ao obter estatísticas:', error);
    res.status(500).json({ error: error.message || 'Erro ao obter estatísticas' });
  }
});

export default router;

