import { ZapiService } from './zapi.service';
import { ChatwootService } from './chatwoot.service';
import prisma from '../config/database';

export interface MenuStep {
  key: string; // Chave do step (ex: "initial", "menu1", "option1")
  message: string; // Mensagem a ser enviada
  options?: Array<{
    key: string; // Tecla/número (ex: "1", "2", "3")
    text: string; // Texto da opção
    nextStep?: string; // Próximo step ou "transfer" para transferir para atendente
    action?: 'transfer' | 'end' | 'next'; // Ação a executar
  }>;
  action?: 'transfer' | 'end' | 'next'; // Ação padrão se não houver opções
  nextStep?: string; // Próximo step se action for 'next'
}

export interface BotFlowConfig {
  initialMessage: string;
  menuSteps: MenuStep[];
}

export class BotService {
  private chatwootService: ChatwootService;

  constructor() {
    this.chatwootService = new ChatwootService();
  }

  /**
   * Verifica se há um bot ativo para o número WhatsApp
   */
  async getActiveBotFlow(whatsappNumberId: string): Promise<any | null> {
    try {
      const botFlow = await prisma.botFlow.findFirst({
        where: {
          whatsappNumberId,
          isActive: true,
        },
      });

      return botFlow;
    } catch (error) {
      console.error('Erro ao buscar bot flow:', error);
      return null;
    }
  }

  /**
   * Obtém ou cria uma sessão ativa do bot
   */
  async getOrCreateSession(
    phoneNumber: string,
    botFlowId: string
  ): Promise<any> {
    try {
      // Buscar sessão ativa existente
      let session = await prisma.botSession.findFirst({
        where: {
          phoneNumber,
          botFlowId,
          isActive: true,
        },
      });

      if (!session) {
        // Criar nova sessão
        session = await prisma.botSession.create({
          data: {
            phoneNumber,
            botFlowId,
            currentStep: 'initial',
            context: {},
            isActive: true,
          },
        });
      }

      return session;
    } catch (error) {
      console.error('Erro ao obter/criar sessão:', error);
      throw error;
    }
  }

  /**
   * Processa uma mensagem recebida e retorna a resposta do bot
   */
  async processMessage(
    phoneNumber: string,
    message: string,
    whatsappNumberId: string,
    instanceId: string,
    token: string
  ): Promise<{ handled: boolean; shouldTransferToChatwoot: boolean }> {
    try {
      // Buscar bot flow ativo
      const botFlow = await this.getActiveBotFlow(whatsappNumberId);
      
      if (!botFlow) {
        console.log(`🤖 Nenhum bot ativo encontrado para WhatsApp Number ${whatsappNumberId}`);
        return { handled: false, shouldTransferToChatwoot: true };
      }

      console.log(`🤖 Bot encontrado: ${botFlow.name} (ID: ${botFlow.id})`);

      // Obter ou criar sessão
      const session = await this.getOrCreateSession(phoneNumber, botFlow.id);
      
      // Parse do menuSteps
      const menuSteps: MenuStep[] = botFlow.menuSteps as any;
      const currentStepKey = session.currentStep || 'initial';
      
      // Encontrar step atual
      let currentStep = menuSteps.find((step) => step.key === currentStepKey);
      
      // Se não encontrou, usar o primeiro step ou initial
      if (!currentStep) {
        currentStep = menuSteps.find((step) => step.key === 'initial') || menuSteps[0];
      }

      if (!currentStep) {
        console.error('❌ Nenhum step encontrado no bot flow');
        return { handled: false, shouldTransferToChatwoot: true };
      }

      // Se o step tem opções, verificar se a mensagem corresponde a alguma opção
      if (currentStep.options && currentStep.options.length > 0) {
        const normalizedMessage = message.trim().toLowerCase();
        
        // Verificar se a mensagem corresponde a alguma opção
        const selectedOption = currentStep.options.find(
          (opt) =>
            opt.key.toLowerCase() === normalizedMessage ||
            opt.text.toLowerCase().includes(normalizedMessage) ||
            normalizedMessage.includes(opt.key.toLowerCase())
        );

        if (selectedOption) {
          // Processar ação da opção
          if (selectedOption.action === 'transfer' || selectedOption.nextStep === 'transfer') {
            // Transferir para atendente
            console.log(`🤖 Transferindo para atendente: ${phoneNumber}`);
            await this.transferToChatwoot(session, botFlow, phoneNumber, whatsappNumberId);
            return { handled: true, shouldTransferToChatwoot: true };
          } else if (selectedOption.action === 'end') {
            // Finalizar sessão
            await prisma.botSession.update({
              where: { id: session.id },
              data: { isActive: false },
            });
            await ZapiService.sendTextMessageWithCredentials(
              instanceId,
              token,
              phoneNumber,
              'Obrigado por entrar em contato! Até logo! 👋'
            );
            return { handled: true, shouldTransferToChatwoot: false };
          } else if (selectedOption.nextStep) {
            // Ir para próximo step
            const nextStep = menuSteps.find((step) => step.key === selectedOption.nextStep);
            if (nextStep) {
              await this.sendStepMessage(instanceId, token, phoneNumber, nextStep);
              await prisma.botSession.update({
                where: { id: session.id },
                data: { currentStep: nextStep.key },
              });
              return { handled: true, shouldTransferToChatwoot: false };
            }
          }
        } else {
          // Mensagem não corresponde a nenhuma opção, reenviar o menu
          await this.sendStepMessage(instanceId, token, phoneNumber, currentStep);
          return { handled: true, shouldTransferToChatwoot: false };
        }
      } else {
        // Step sem opções, verificar ação padrão
        if (currentStep.action === 'transfer') {
          await this.transferToChatwoot(session, botFlow, phoneNumber, whatsappNumberId);
          return { handled: true, shouldTransferToChatwoot: true };
        } else if (currentStep.action === 'end') {
          await prisma.botSession.update({
            where: { id: session.id },
            data: { isActive: false },
          });
          return { handled: true, shouldTransferToChatwoot: false };
        } else if (currentStep.nextStep) {
          const nextStep = menuSteps.find((step) => step.key === currentStep.nextStep);
          if (nextStep) {
            await this.sendStepMessage(instanceId, token, phoneNumber, nextStep);
            await prisma.botSession.update({
              where: { id: session.id },
              data: { currentStep: nextStep.key },
            });
            return { handled: true, shouldTransferToChatwoot: false };
          }
        }
      }

      // Se chegou aqui, não processou corretamente
      return { handled: false, shouldTransferToChatwoot: true };
    } catch (error: any) {
      console.error('❌ Erro ao processar mensagem do bot:', error);
      return { handled: false, shouldTransferToChatwoot: true };
    }
  }

  /**
   * Envia mensagem de um step
   */
  private async sendStepMessage(
    instanceId: string,
    token: string,
    phoneNumber: string,
    step: MenuStep
  ): Promise<void> {
    let message = step.message;

    // Adicionar opções ao final da mensagem
    if (step.options && step.options.length > 0) {
      const optionsText = step.options
        .map((opt) => `${opt.key} - ${opt.text}`)
        .join('\n');
      message = `${message}\n\n${optionsText}`;
    }

    await ZapiService.sendTextMessageWithCredentials(instanceId, token, phoneNumber, message);
  }

  /**
   * Transfere a sessão para o Chatwoot (atendente humano)
   */
  private async transferToChatwoot(
    session: any,
    botFlow: any,
    phoneNumber: string,
    whatsappNumberId: string
  ): Promise<void> {
    try {
      // Buscar WhatsAppNumber para obter inboxId
      const whatsappNumber = await prisma.whatsAppNumber.findUnique({
        where: { id: whatsappNumberId },
      });

      if (!whatsappNumber || !whatsappNumber.inboxId) {
        console.error('❌ WhatsAppNumber não encontrado ou sem inbox associado');
        return;
      }

      // Criar ou encontrar conversa no Chatwoot
      const conversationId = await this.chatwootService.findOrCreateConversationByPhone(
        phoneNumber,
        whatsappNumber.inboxId
      );

      // Atualizar sessão com conversationId
      await prisma.botSession.update({
        where: { id: session.id },
        data: {
          conversationId: conversationId,
          isActive: false, // Desativar sessão do bot
        },
      });

      // Enviar mensagem de transferência
      await this.chatwootService.createMessageInConversation(
        conversationId,
        `🤖 Conversa transferida do bot. Cliente estava no step: ${session.currentStep || 'initial'}`,
        'outgoing',
        'user'
      );

      console.log(`✅ Sessão transferida para Chatwoot: conversa ${conversationId}`);
    } catch (error: any) {
      console.error('❌ Erro ao transferir para Chatwoot:', error);
      throw error;
    }
  }

  /**
   * Inicia uma nova sessão do bot (envia mensagem inicial)
   */
  async startBotSession(
    phoneNumber: string,
    botFlowId: string,
    instanceId: string,
    token: string
  ): Promise<void> {
    try {
      const botFlow = await prisma.botFlow.findUnique({
        where: { id: botFlowId },
      });

      if (!botFlow || !botFlow.isActive) {
        throw new Error('Bot flow não encontrado ou inativo');
      }

      // Criar sessão
      const session = await this.getOrCreateSession(phoneNumber, botFlowId);

      // Parse do menuSteps
      const menuSteps: MenuStep[] = botFlow.menuSteps as any;
      const initialStep = menuSteps.find((step) => step.key === 'initial') || menuSteps[0];

      if (initialStep) {
        await this.sendStepMessage(instanceId, token, phoneNumber, initialStep);
      } else {
        // Se não houver step inicial, enviar mensagem inicial do bot
        await ZapiService.sendTextMessageWithCredentials(
          instanceId,
          token,
          phoneNumber,
          botFlow.initialMessage
        );
      }
    } catch (error: any) {
      console.error('❌ Erro ao iniciar sessão do bot:', error);
      throw error;
    }
  }

  /**
   * Finaliza uma sessão do bot
   */
  async endSession(sessionId: string): Promise<void> {
    await prisma.botSession.update({
      where: { id: sessionId },
      data: { isActive: false },
    });
  }
}

export const botService = new BotService();

