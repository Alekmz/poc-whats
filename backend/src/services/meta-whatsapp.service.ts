import axios, { AxiosInstance } from 'axios';
import crypto from 'crypto';
import { chatwootService } from './chatwoot.service';

export interface MetaMessage {
  messaging_product: string;
  to: string;
  type: string;
  text?: {
    body: string;
  };
}

export interface MetaWebhookEntry {
  id: string;
  changes: Array<{
    value: {
      messaging_product: string;
      metadata: {
        display_phone_number: string;
        phone_number_id: string;
      };
      contacts?: Array<{
        profile: {
          name: string;
        };
        wa_id: string;
      }>;
      messages?: Array<{
        from: string;
        id: string;
        timestamp: string;
        text?: {
          body: string;
        };
        type: string;
      }>;
    };
  }>;
}

export class MetaWhatsAppService {
  private api: AxiosInstance;
  private phoneNumberId: string;
  private webhookSecret: string;

  constructor() {
    const baseURL = process.env.META_API_BASE_URL || 'https://graph.facebook.com/v18.0';
    const apiToken = process.env.META_API_TOKEN;
    this.phoneNumberId = process.env.META_PHONE_NUMBER_ID || '';
    this.webhookSecret = process.env.META_WEBHOOK_SECRET || '';

    if (!apiToken) {
      throw new Error('META_API_TOKEN não configurado');
    }

    this.api = axios.create({
      baseURL: `${baseURL}/${this.phoneNumberId}`,
      headers: {
        'Authorization': `Bearer ${apiToken}`,
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Envia mensagem via Meta WhatsApp API
   */
  async sendMessage(phoneNumber: string, text: string): Promise<any> {
    try {
      const message: MetaMessage = {
        messaging_product: 'whatsapp',
        to: phoneNumber,
        type: 'text',
        text: {
          body: text,
        },
      };

      const response = await this.api.post('/messages', message);
      return response.data;
    } catch (error: any) {
      console.error('Erro ao enviar mensagem Meta:', error.response?.data || error.message);
      throw new Error('Falha ao enviar mensagem via Meta WhatsApp API');
    }
  }

  /**
   * Verifica assinatura do webhook
   */
  verifyWebhookSignature(payload: string, signature: string): boolean {
    if (!this.webhookSecret) {
      console.warn('META_WEBHOOK_SECRET não configurado, pulando verificação');
      return true;
    }

    const hash = crypto
      .createHmac('sha256', this.webhookSecret)
      .update(payload)
      .digest('hex');

    return `sha256=${hash}` === signature;
  }

  /**
   * Processa webhook do Meta e roteia para Chatwoot
   */
  async processWebhook(entry: MetaWebhookEntry): Promise<void> {
    try {
      for (const change of entry.changes) {
        const value = change.value;

        // Processar mensagens recebidas
        if (value.messages) {
          for (const message of value.messages) {
            const phoneNumber = message.from;
            const messageText = message.text?.body || '';
            const messageId = message.id;

            // Aqui você deve:
            // 1. Buscar ou criar conversa no Chatwoot baseado no phoneNumber
            // 2. Criar mensagem na conversa do Chatwoot
            // 3. Notificar operadores sobre nova mensagem

            console.log(`Mensagem recebida de ${phoneNumber}: ${messageText}`);

            // Exemplo de integração (ajustar conforme sua lógica):
            // const conversation = await this.findOrCreateConversation(phoneNumber);
            // await chatwootService.sendMessage(conversation.id, messageText);
          }
        }
      }
    } catch (error) {
      console.error('Erro ao processar webhook do Meta:', error);
      throw error;
    }
  }

  /**
   * Valida webhook do Meta (GET request)
   */
  validateWebhook(mode: string, token: string, challenge: string): string | null {
    const verifyToken = process.env.META_WEBHOOK_VERIFY_TOKEN || 'your-verify-token';

    if (mode === 'subscribe' && token === verifyToken) {
      return challenge;
    }

    return null;
  }
}

export const metaWhatsAppService = new MetaWhatsAppService();

