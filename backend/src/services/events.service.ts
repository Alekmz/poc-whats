import { Response } from 'express';

interface Client {
  id: string;
  res: Response;
  conversationId?: number;
}

class EventsService {
  private clients: Map<string, Client> = new Map();
  private clientIdCounter = 0;

  /**
   * Adiciona um novo cliente SSE
   */
  addClient(res: Response, conversationId?: number): string {
    const clientId = `client-${++this.clientIdCounter}-${Date.now()}`;
    
    // Configurar headers para SSE
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no', // Desabilitar buffering do nginx
    });

    // Enviar mensagem inicial de conexão
    res.write(`data: ${JSON.stringify({ type: 'connected', clientId })}\n\n`);

    // Armazenar cliente
    this.clients.set(clientId, {
      id: clientId,
      res,
      conversationId,
    });

    console.log(`✅ Cliente SSE conectado: ${clientId}${conversationId ? ` (conversa ${conversationId})` : ''}`);
    console.log(`📊 Total de clientes conectados: ${this.clients.size}`);

    // Remover cliente quando desconectar
    res.on('close', () => {
      this.removeClient(clientId);
    });

    return clientId;
  }

  /**
   * Remove um cliente
   */
  removeClient(clientId: string): void {
    if (this.clients.has(clientId)) {
      this.clients.delete(clientId);
      console.log(`❌ Cliente SSE desconectado: ${clientId}`);
      console.log(`📊 Total de clientes conectados: ${this.clients.size}`);
    }
  }

  /**
   * Envia um evento para todos os clientes ou para clientes de uma conversa específica
   */
  broadcast(event: { type: string; data: any; conversationId?: number }): void {
    const message = `data: ${JSON.stringify(event)}\n\n`;
    let sentCount = 0;

    this.clients.forEach((client, clientId) => {
      // Se o evento tem conversationId, enviar apenas para clientes dessa conversa
      // Se não tem conversationId, enviar para todos
      if (!event.conversationId || client.conversationId === event.conversationId) {
        try {
          client.res.write(message);
          sentCount++;
        } catch (error) {
          console.error(`Erro ao enviar evento para cliente ${clientId}:`, error);
          this.removeClient(clientId);
        }
      }
    });

    if (sentCount > 0) {
      console.log(`📤 Evento "${event.type}" enviado para ${sentCount} cliente(s)`);
    }
  }

  /**
   * Envia evento de nova mensagem
   */
  sendNewMessage(conversationId: number, message: any): void {
    this.broadcast({
      type: 'new_message',
      conversationId,
      data: { message },
    });
  }

  /**
   * Envia evento de atualização de conversa
   */
  sendConversationUpdate(conversationId: number, conversation: any): void {
    this.broadcast({
      type: 'conversation_update',
      conversationId,
      data: { conversation },
    });
  }

  /**
   * Retorna o número de clientes conectados
   */
  getClientCount(): number {
    return this.clients.size;
  }
}

// Singleton
export const eventsService = new EventsService();

