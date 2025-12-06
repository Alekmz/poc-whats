import { Router, Request, Response } from 'express';
import { metaWhatsAppService } from '../services/meta-whatsapp.service';
import { zapiService } from '../services/zapi.service';
import { chatwootService } from '../services/chatwoot.service';
import { botService } from '../services/bot.service';
import { auditLog } from '../middleware/logger';
import prisma from '../config/database';

const router = Router();

// Log quando o router é carregado
console.log('✅ Router de webhooks carregado');

/**
 * @swagger
 * /webhook/meta:
 *   get:
 *     summary: Valida webhook do Meta (GET)
 *     tags: [Webhooks]
 */
router.get('/meta', (req: Request, res: Response) => {
  const mode = req.query['hub.mode'] as string;
  const token = req.query['hub.verify_token'] as string;
  const challenge = req.query['hub.challenge'] as string;

  const result = metaWhatsAppService.validateWebhook(mode, token, challenge);

  if (result) {
    res.status(200).send(result);
  } else {
    res.status(403).send('Forbidden');
  }
});

/**
 * @swagger
 * /webhook/meta:
 *   post:
 *     summary: Recebe webhook do Meta (POST)
 *     tags: [Webhooks]
 */
router.post('/meta', async (req: Request, res: Response) => {
  try {
    // Verificar assinatura se configurada
    const signature = req.headers['x-hub-signature-256'] as string;
    const payload = JSON.stringify(req.body);

    if (signature) {
      const isValid = metaWhatsAppService.verifyWebhookSignature(payload, signature);
      if (!isValid) {
        return res.status(403).json({ error: 'Assinatura inválida' });
      }
    }

    // Processar webhook
    const entry = req.body.entry?.[0];
    if (entry) {
      await metaWhatsAppService.processWebhook(entry);
    }

    res.status(200).send('OK');
  } catch (error) {
    console.error('Erro ao processar webhook do Meta:', error);
    res.status(500).json({ error: 'Erro ao processar webhook' });
  }
});

/**
 * @swagger
 * /webhook/zapi:
 *   post:
 *     summary: Recebe webhook da Z-API
 *     tags: [Webhooks]
 */
router.post('/zapi', async (req: Request, res: Response) => {
  console.log('🚀 ========== WEBHOOK /zapi CHAMADO ==========');
  console.log('📥 Método:', req.method);
  console.log('🔗 URL:', req.url);
  console.log('📋 Headers recebidos:', Object.keys(req.headers));
  
  try {
    const event = req.body;
    const headers = req.headers;

    // Log detalhado do evento recebido
    console.log('🔔 ========== WEBHOOK Z-API RECEBIDO ==========');
    console.log('📋 Headers:', JSON.stringify(headers, null, 2));
    console.log('📦 Body:', JSON.stringify(event, null, 2));
    console.log('📦 Body type:', typeof event);
    console.log('📦 Body keys:', event ? Object.keys(event) : 'body vazio');
    console.log('🔍 Tipo de evento:', event?.event || event?.type || event?.action || 'desconhecido');
    console.log('🔍 Instance ID (header):', headers['x-instance-id']);
    console.log('🔍 Instance ID (body):', event?.instanceId || event?.instance?.id);

    // Identificar instanceId do evento (pode vir no header ou no body)
    const instanceId = req.headers['x-instance-id'] as string || 
                      event.instanceId || 
                      event.instance?.id;

    // Processar diferentes tipos de eventos
    // A Z-API pode enviar eventos em diferentes formatos
    const eventType = event.event || event.type || event.action;
    console.log(`🔍 Processando evento do tipo: ${eventType}`);
    
    // Verificar se é uma mensagem recebida
    // Z-API envia ReceivedCallback para mensagens recebidas
    const isMessageEvent = 
      eventType === 'message' || 
      eventType === 'messages' ||
      eventType === 'received' ||
      eventType === 'ReceivedCallback' ||
      (event.message && (event.message.from || event.message.phone)) ||
      (event.phone && event.fromMe === false); // Formato direto da Z-API
    
    if (isMessageEvent) {
      console.log('✅ Evento identificado como MENSAGEM RECEBIDA');
      
      // Z-API pode enviar em dois formatos:
      // 1. Formato com event.message (formato antigo)
      // 2. Formato direto com campos no root (formato novo - ReceivedCallback)
      let phone: string;
      let text: string;
      let messageType: string;
      let mediaUrl: string | undefined;
      
      if (event.message) {
        // Formato antigo: event.message
        const message = event.message;
        phone = message.from || message.phone || message.phoneNumber || message.contact?.phone;
        text = message.text || message.body || message.content || '';
        messageType = message.type || 'text';
        mediaUrl = message.mediaUrl || message.fileUrl || message.imageUrl || message.videoUrl || message.stickerUrl;
      } else {
        // Formato novo: campos diretos no root (ReceivedCallback)
        phone = event.phone || event.from || event.phoneNumber;
        
        // Extrair texto - pode vir como string ou objeto
        if (typeof event.text === 'string') {
          text = event.text;
        } else if (event.text && typeof event.text === 'object') {
          // Se text for um objeto, tentar extrair a mensagem
          text = event.text.message || event.text.text || event.text.body || event.text.content || '';
        } else {
          text = event.body || event.content || '';
        }
        
        messageType = event.messageType || event.type || 'text';
        
        // Extrair URL de mídia
        mediaUrl = event.mediaUrl || event.fileUrl || event.imageUrl || event.videoUrl;
        
        // Se for mídia (sticker, imagem, etc.), criar texto descritivo e extrair URL
        if (event.sticker) {
          text = '[Sticker]';
          messageType = 'sticker';
          mediaUrl = event.sticker?.stickerUrl || event.stickerUrl || mediaUrl;
        } else if (event.image || event.photo) {
          text = text || '[Imagem]';
          messageType = 'image';
          mediaUrl = event.image?.imageUrl || event.photo || mediaUrl;
        } else if (event.video) {
          text = text || '[Vídeo]';
          messageType = 'video';
          mediaUrl = event.video?.videoUrl || event.videoUrl || mediaUrl;
        } else if (event.audio) {
          text = text || '[Áudio]';
          messageType = 'audio';
          mediaUrl = event.audio?.audioUrl || event.audioUrl || mediaUrl;
        } else if (event.document) {
          text = text || '[Documento]';
          messageType = 'document';
          mediaUrl = event.document?.documentUrl || event.documentUrl || mediaUrl;
        }
      }
      
      // Garantir que text é sempre uma string
      if (typeof text !== 'string') {
        text = String(text || '');
      }

      console.log(`📱 Telefone extraído: ${phone}`);
      console.log(`💬 Texto extraído: ${text && typeof text === 'string' ? text.substring(0, 100) : '(sem texto ou formato inválido)'}`);
      console.log(`📝 Tipo de mensagem: ${messageType}`);
      console.log(`👤 Nome do remetente: ${event.senderName || event.chatName || 'desconhecido'}`);

      if (!phone) {
        console.warn('⚠️ Mensagem Z-API sem telefone. Estrutura completa:', JSON.stringify(event, null, 2));
        return res.status(200).json({ success: true });
      }
      
      // Ignorar mensagens enviadas por mim
      if (event.fromMe === true) {
        console.log('ℹ️ Mensagem enviada por mim, ignorando...');
        return res.status(200).json({ success: true });
      }

      // Buscar WhatsAppNumber pelo instanceId se disponível
      let whatsappNumber = null;
      let inboxId: number | null = null;

      console.log(`🔍 Buscando WhatsAppNumber com instanceId: ${instanceId}`);
      
      if (instanceId) {
        whatsappNumber = await prisma.whatsAppNumber.findUnique({
          where: { instanceId },
        });

        if (whatsappNumber) {
          console.log(`✅ WhatsAppNumber encontrado: ${whatsappNumber.name} (ID: ${whatsappNumber.id})`);
          
          // Se não tiver inboxId associado, buscar inbox padrão e associar
          if (!whatsappNumber.inboxId) {
            console.log(`⚠️ WhatsAppNumber não tem inbox associado. Buscando inbox padrão...`);
            const inboxes = await chatwootService.listInboxes();
            if (inboxes.length > 0) {
              const defaultInbox = inboxes[0];
              await prisma.whatsAppNumber.update({
                where: { instanceId },
                data: { 
                  inboxId: defaultInbox.id,
                  lastSeen: new Date(), 
                  isConnected: true 
                },
              });
              inboxId = defaultInbox.id;
              console.log(`✅ WhatsAppNumber ${whatsappNumber.id} associado ao inbox padrão ${defaultInbox.id}`);
            }
          } else {
            inboxId = whatsappNumber.inboxId;
          }
          
          console.log(`📬 Inbox ID associado: ${inboxId}`);
          
          // Atualizar lastSeen
          await prisma.whatsAppNumber.update({
            where: { instanceId },
            data: { lastSeen: new Date(), isConnected: true },
          });
        } else {
          console.warn(`⚠️ WhatsAppNumber não encontrado para instanceId: ${instanceId}`);
        }
      } else {
        console.warn('⚠️ InstanceId não encontrado no webhook');
      }

      // Verificar se há bot ativo para este número e processar mensagem
      if (whatsappNumber && text) {
        try {
          console.log(`🤖 Verificando se há bot ativo para WhatsApp Number: ${whatsappNumber.id}`);
          const botResult = await botService.processMessage(
            phone,
            text,
            whatsappNumber.id,
            whatsappNumber.instanceId,
            whatsappNumber.token
          );

          if (botResult.handled) {
            console.log(`✅ Mensagem processada pelo bot. Transferir para Chatwoot: ${botResult.shouldTransferToChatwoot}`);
            
            // Se o bot processou e não precisa transferir, apenas retornar sucesso
            if (!botResult.shouldTransferToChatwoot) {
              await auditLog('system', 'ZAPI_MESSAGE_RECEIVED', undefined, {
                phone,
                text: text.substring(0, 100),
                type: messageType,
                instanceId,
                handledByBot: true,
              });
              return res.status(200).json({ success: true, handledByBot: true });
            }

            // Se precisa transferir para Chatwoot, continuar o fluxo normal abaixo
            console.log(`🔄 Bot processou e transferiu para Chatwoot`);
          } else {
            console.log(`ℹ️ Bot não processou a mensagem (não há bot ativo ou não correspondeu). Continuando fluxo normal.`);
          }
        } catch (botError: any) {
          console.error('❌ Erro ao processar mensagem no bot:', botError);
          // Continuar fluxo normal mesmo se houver erro no bot
        }
      }

      // Encaminhar para Chatwoot
      try {
        let targetInboxId: number;

        if (inboxId) {
          targetInboxId = inboxId;
        } else {
          // Buscar inbox padrão (primeira inbox disponível)
          const inboxes = await chatwootService.listInboxes();
          if (inboxes.length === 0) {
            console.warn('Nenhuma inbox encontrada no Chatwoot');
            await auditLog('system', 'ZAPI_MESSAGE_RECEIVED', undefined, {
              phone,
              text: text.substring(0, 100),
              type: messageType,
              instanceId,
              error: 'Nenhuma inbox disponível',
            });
            return res.status(200).json({ success: true });
          }
          targetInboxId = inboxes[0].id;
        }

        // Tentar encontrar ou criar conversa
        let conversationId: number | null = null;
        try {
          console.log(`🔍 Buscando/criando conversa para telefone: ${phone} no inbox: ${targetInboxId}`);
          const contactName = event.senderName || event.chatName || undefined;
          
          try {
            conversationId = await chatwootService.findOrCreateConversationByPhone(
              phone,
              targetInboxId,
              contactName
            );
            console.log(`✅ Conversa encontrada/criada: ${conversationId}`);

            // Criar mensagem no Chatwoot
            console.log(`💬 Criando mensagem no Chatwoot...`);
            const createdMessage = await chatwootService.createMessageInConversation(conversationId, text, mediaUrl);
            console.log(`✅ Mensagem criada no Chatwoot com sucesso!`);
            
            // Emitir evento SSE para atualizar frontend em tempo real
            try {
              const { eventsService } = await import('../services/events.service');
              eventsService.sendNewMessage(conversationId, createdMessage);
              console.log(`📡 Evento SSE enviado para conversa ${conversationId}`);
            } catch (sseError) {
              console.warn('⚠️ Erro ao enviar evento SSE (não crítico):', sseError);
            }
          } catch (conversationError: any) {
            // Se não conseguiu criar conversa, tentar criar mensagem diretamente via contact_inbox
            console.warn(`⚠️ Não foi possível criar conversa diretamente: ${conversationError.message}`);
            console.log(`🔄 Tentando criar mensagem via contact_inbox (cria conversa automaticamente)...`);
            
            const result = await chatwootService.createMessageViaContactInbox(
              phone,
              targetInboxId,
              text,
              contactName,
              mediaUrl
            );
            conversationId = result.conversationId;
            console.log(`✅ Mensagem criada via contact_inbox e conversa ${conversationId} criada automaticamente!`);
            
            // Emitir evento SSE para atualizar frontend em tempo real
            try {
              const { eventsService } = await import('../services/events.service');
              eventsService.sendNewMessage(conversationId, result.message);
              console.log(`📡 Evento SSE enviado para conversa ${conversationId}`);
            } catch (sseError) {
              console.warn('⚠️ Erro ao enviar evento SSE (não crítico):', sseError);
            }
          }

          await auditLog('system', 'ZAPI_MESSAGE_RECEIVED', conversationId?.toString() || 'unknown', {
            phone,
            text: text.substring(0, 100),
            type: messageType,
            instanceId: instanceId || 'unknown',
          });

          console.log(`✅ Mensagem Z-API encaminhada para Chatwoot: ${phone} -> conversa ${conversationId}`);
        } catch (error: any) {
          // Se tudo falhar, apenas loga
          console.error(`❌ Erro ao processar mensagem para ${phone}:`, error.message);
          await auditLog('system', 'ZAPI_MESSAGE_RECEIVED', undefined, {
            phone,
            text: text.substring(0, 100),
            type: messageType,
            instanceId: instanceId || 'unknown',
            error: error.message,
          });
        }
      } catch (chatwootError: any) {
        console.error('Erro ao encaminhar para Chatwoot:', chatwootError);
        await auditLog('system', 'ZAPI_MESSAGE_ERROR', undefined, {
          phone,
          instanceId: instanceId || 'unknown',
          error: chatwootError.message,
        });
      }
    } else if (event.event === 'status' || event.status) {
      // Processar status de conexão/desconexão
      if (instanceId) {
        const status = event.status || event.connectionStatus;
        
        await prisma.whatsAppNumber.updateMany({
          where: { instanceId },
          data: {
            isConnected: status === 'connected' || status === 'open',
            lastSeen: new Date(),
          },
        });

        await auditLog('system', 'ZAPI_STATUS_UPDATE', undefined, {
          instanceId,
          status,
        });
      }
    } else if (event.event === 'qr-code' || event.qrCode) {
      // Atualizar QR Code quando recebido
      if (instanceId) {
        await prisma.whatsAppNumber.updateMany({
          where: { instanceId },
          data: {
            qrCode: event.qrCode || event.qr,
            isConnected: false,
          },
        });
      }
    }

    // Se não foi um evento de mensagem, logar para debug
    if (!isMessageEvent) {
      console.log(`ℹ️ Evento não processado (tipo: ${eventType}). Estrutura:`, JSON.stringify(event, null, 2));
    }
    
    console.log('🔔 ========== FIM DO PROCESSAMENTO DO WEBHOOK ==========');
    
    // Sempre retornar 200 OK para a Z-API
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('❌ Erro ao processar webhook Z-API:', error);
    console.error('❌ Stack trace:', error instanceof Error ? error.stack : 'N/A');
    // Sempre retornar 200 para não causar retentativas desnecessárias
    res.status(200).json({ success: false, error: 'Erro ao processar webhook' });
  }
});

export default router;

