import axios, { AxiosInstance } from 'axios';

export interface ZapiTextMessage {
  phone: string;
  message: string;
}

export interface ZapiMediaMessage {
  phone: string;
  image?: string;
  file?: string;
  caption?: string;
}

export interface ZapiResponse {
  success: boolean;
  message?: string;
  data?: any;
}

export class ZapiService {
  private api: AxiosInstance;
  private instanceId: string;
  private token: string;

  constructor(instanceId?: string, token?: string) {
    this.instanceId = instanceId || process.env.ZAPI_INSTANCE_ID || '';
    this.token = token || process.env.ZAPI_TOKEN || '';
    const baseURL = process.env.ZAPI_API_BASE || 'https://api.z-api.io';
    // Client-Token pode ser o mesmo token da instância ou um token separado
    const clientToken = process.env.ZAPI_CLIENT_TOKEN

    if (!this.instanceId || !this.token) {
      console.warn('Z-API não configurado: ZAPI_INSTANCE_ID ou ZAPI_TOKEN não definidos');
    }

    this.api = axios.create({
      baseURL: `${baseURL}/instances/${this.instanceId}/token/${this.token}`,
      headers: {
        'Content-Type': 'application/json',
        'Client-Token': clientToken || '', // Header necessário para autenticação Z-API
      },
    });
    
    // Log para debug
    console.log(`🔧 ZapiService criado:`, {
      instanceId: this.instanceId,
      token: this.token ? `${this.token.substring(0, 10)}...` : 'não configurado',
      clientToken: clientToken ? 'configurado' : 'não configurado',
      baseURL: `${baseURL}/instances/${this.instanceId}/token/${this.token}`,
    });
  }

  /**
   * Cria uma instância do serviço com instanceId e token específicos
   */
  static create(instanceId: string, token: string): ZapiService {
    return new ZapiService(instanceId, token);
  }

  /**
   * Obtém status da instância
   */
  async getStatus(): Promise<ZapiResponse> {
    try {
      const response = await this.api.get('/status');
      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      console.error('Erro ao obter status Z-API:', error.response?.data || error.message);
      throw new Error(
        error.response?.data?.message || 'Falha ao obter status da Z-API'
      );
    }
  }

  /**
   * Desconecta a instância (necessário para gerar novo QR Code)
   */
  async disconnect(): Promise<ZapiResponse> {
    try {
      const endpoints = ['/disconnect', '/logout', '/stop'];
      for (const endpoint of endpoints) {
        try {
          const response = await this.api.post(endpoint, {});
          console.log(`✅ Instância desconectada via ${endpoint}`);
          return {
            success: true,
            data: response.data,
          };
        } catch (error: any) {
          if (error.response?.status !== 404) {
            throw error;
          }
        }
      }
      throw new Error('Nenhum endpoint de desconexão encontrado');
    } catch (error: any) {
      console.warn('⚠️ Não foi possível desconectar a instância:', error.message);
      // Não lançar erro, apenas avisar
      return {
        success: false,
        message: error.message,
      };
    }
  }

  /**
   * Obtém QR Code da instância
   * Z-API oferece diferentes endpoints para QR Code
   * Primeiro verifica o status, que pode conter o QR Code quando desconectado
   */
  async getQRCode(): Promise<ZapiResponse> {
    // Primeiro, verificar o status da instância
    let statusData: any = null;
    try {
      console.log('🔍 Verificando status da instância...');
      const statusResponse = await this.api.get('/status');
      statusData = statusResponse.data;
      console.log('📊 Status da instância:', JSON.stringify(statusData, null, 2));
      
      // Verificar se o status contém QR Code
      const qrFromStatus = 
        statusData?.qrCode || 
        statusData?.qr || 
        statusData?.qrcode || 
        statusData?.base64 ||
        statusData?.data?.qrCode ||
        statusData?.data?.qr ||
        statusData?.qrcode_base64;
      
      if (qrFromStatus) {
        console.log('✅ QR Code encontrado no endpoint /status');
        return {
          success: true,
          data: {
            qrCode: qrFromStatus,
            base64: qrFromStatus,
            qr: qrFromStatus,
            fromStatus: true,
          },
        };
      }
      
      // Se a instância já estiver conectada, tentar desconectar primeiro
      const isConnected = statusData?.connected || 
                         statusData?.status === 'connected' || 
                         statusData?.status === 'open' ||
                         statusData?.connectionState === 'open';
      
      if (isConnected) {
        console.log('⚠️ Instância está conectada. Tentando desconectar para gerar novo QR Code...');
        await this.disconnect();
        // Aguardar um pouco para a desconexão processar
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    } catch (error: any) {
      console.warn('⚠️ Erro ao verificar status:', error.message);
      // Continuar tentando obter QR Code mesmo se o status falhar
    }

    // Lista de endpoints e métodos para tentar (na ordem de preferência)
    const attempts = [
      { method: 'GET', endpoint: '/qr-code/image' },  // Retorna imagem em base64 (preferido)
      { method: 'GET', endpoint: '/qr-code' },        // Retorna bytes do QR Code
    ];

    let lastError: any = null;

    for (const attempt of attempts) {
      try {
        const fullUrl = `${this.api.defaults.baseURL}${attempt.endpoint}`;
        console.log(`🔍 Tentando obter QR Code: ${attempt.method} ${fullUrl}`);
        
        let response;
        if (attempt.method === 'POST') {
          response = await this.api.post(attempt.endpoint, {});
        } else {
          response = await this.api.get(attempt.endpoint);
        }
        
        // Verificar se a resposta contém erro
        if (response.data?.error) {
          const errorMsg = response.data.message || response.data.error;
          if (errorMsg?.includes('NOT_FOUND') || errorMsg?.includes('Unable to find')) {
            throw new Error(`Endpoint não encontrado: ${errorMsg}`);
          }
          throw new Error(errorMsg);
        }
        
        console.log(`✅ QR Code obtido com sucesso: ${attempt.method} ${attempt.endpoint}`);
        console.log('📦 Resposta da Z-API (primeiros 200 chars):', 
          typeof response.data === 'string' 
            ? response.data.substring(0, 200) 
            : JSON.stringify(response.data).substring(0, 200));
        
        // A resposta pode vir em diferentes formatos
        let qrData = response.data;
        
        // Se for string direta (base64), formatar
        if (typeof qrData === 'string') {
          // Se for base64 puro, adicionar prefixo se necessário
          if (!qrData.startsWith('data:image') && !qrData.startsWith('http')) {
            qrData = {
              base64: qrData,
              qrCode: qrData,
              qr: qrData,
            };
          } else {
            qrData = {
              base64: qrData,
              qrCode: qrData,
              qr: qrData,
            };
          }
        }
        
        // Se a resposta tiver uma propriedade específica, extrair
        if (qrData && typeof qrData === 'object') {
          // Tentar encontrar o QR Code em diferentes propriedades
          const qrValue = qrData.base64 || 
                         qrData.qrCode || 
                         qrData.qr || 
                         qrData.qrcode || 
                         qrData.data || 
                         qrData.value ||
                         qrData.qrcode_base64;
          
          if (qrValue) {
            qrData = {
              ...qrData,
              base64: qrValue,
              qrCode: qrValue,
            };
          }
        }
        
        // Validar se realmente temos um QR Code
        if (!qrData.base64 && !qrData.qrCode && !qrData.qr) {
          throw new Error('Resposta não contém QR Code válido');
        }
        
        return {
          success: true,
          data: qrData,
        };
      } catch (error: any) {
        lastError = error;
        const errorMsg = error.response?.data?.message || error.message;
        const errorStatus = error.response?.status;
        const errorData = error.response?.data;
        
        // Ignorar erros 404/400/NOT_FOUND e continuar tentando
        if (errorStatus === 404 || 
            errorStatus === 400 || 
            errorMsg?.includes('NOT_FOUND') || 
            errorMsg?.includes('Unable to find')) {
          console.warn(`⚠️ ${attempt.method} ${attempt.endpoint} não encontrado: ${errorMsg}`);
          continue;
        }
        
        console.warn(`❌ ${attempt.method} ${attempt.endpoint} falhou (${errorStatus}):`, {
          message: errorMsg,
          data: errorData,
        });
        
        // Se for 405 (Method Not Allowed), continuar tentando
        if (errorStatus === 405) {
          continue;
        }
        
        // Para outros erros, também continuar tentando (pode ser que outro endpoint funcione)
      }
    }

    // Se todos os endpoints falharam, lançar o último erro com mais detalhes
    const errorDetails = lastError?.response?.data || {};
    const statusInfo = statusData ? `\nStatus da instância: ${JSON.stringify(statusData)}` : '';
    
    console.error('❌ Todos os endpoints de QR Code falharam. Detalhes:', {
      status: lastError?.response?.status,
      error: errorDetails,
      message: lastError?.message,
      url: `${this.api.defaults.baseURL}`,
      statusInfo,
    });
    
    const errorMessage = errorDetails.message || lastError?.message || 'Falha ao obter QR Code da Z-API';
    
    throw new Error(
      `${errorMessage}\n\n` +
      `Possíveis soluções:\n` +
      `1. Verifique se a instância está desconectada no painel Z-API (zapi.tools)\n` +
      `2. Desconecte a instância manualmente no painel e tente novamente\n` +
      `3. Verifique se os endpoints /qr-code ou /qr-code/image existem na sua versão da Z-API\n` +
      `4. Consulte a documentação: https://developer.z-api.io/instance/qrcode\n` +
      `5. Verifique se o instanceId e token estão corretos\n` +
      `\nURL base tentada: ${this.api.defaults.baseURL}${statusInfo}`
    );
  }

  /**
   * Envia mensagem de texto via Z-API
   */
  async sendTextMessage(phone: string, message: string): Promise<ZapiResponse> {
    try {
      if (!this.instanceId || !this.token) {
        throw new Error('Z-API não configurado. Configure instanceId e token');
      }

      // Formatar telefone (remover caracteres especiais, adicionar código do país se necessário)
      const formattedPhone = this.formatPhone(phone);

      const response = await this.api.post('/send-text', {
        phone: formattedPhone,
        message: message,
      });

      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      console.error('Erro ao enviar mensagem via Z-API:', error.response?.data || error.message);
      throw new Error(
        error.response?.data?.message || 'Falha ao enviar mensagem via Z-API'
      );
    }
  }

  /**
   * Método estático para enviar mensagem com instanceId e token específicos
   */
  static async sendTextMessageWithCredentials(
    instanceId: string,
    token: string,
    phone: string,
    message: string
  ): Promise<ZapiResponse> {
    const service = ZapiService.create(instanceId, token);
    return service.sendTextMessage(phone, message);
  }

  /**
   * Envia mensagem com imagem via Z-API
   */
  async sendMediaMessage(
    phone: string,
    mediaUrl: string,
    caption?: string
  ): Promise<ZapiResponse> {
    try {
      if (!this.instanceId || !this.token) {
        throw new Error('Z-API não configurado. Configure instanceId e token');
      }

      const formattedPhone = this.formatPhone(phone);

      const response = await this.api.post('/send-image', {
        phone: formattedPhone,
        image: mediaUrl,
        caption: caption || '',
      });

      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      console.error('Erro ao enviar mídia via Z-API:', error.response?.data || error.message);
      throw new Error(
        error.response?.data?.message || 'Falha ao enviar mídia via Z-API'
      );
    }
  }

  /**
   * Método estático para enviar mídia com instanceId e token específicos
   */
  static async sendMediaMessageWithCredentials(
    instanceId: string,
    token: string,
    phone: string,
    mediaUrl: string,
    caption?: string
  ): Promise<ZapiResponse> {
    const service = ZapiService.create(instanceId, token);
    return service.sendMediaMessage(phone, mediaUrl, caption);
  }

  /**
   * Envia arquivo via Z-API
   */
  async sendFileMessage(
    phone: string,
    fileUrl: string,
    caption?: string
  ): Promise<ZapiResponse> {
    try {
      if (!this.instanceId || !this.token) {
        throw new Error('Z-API não configurado. Configure instanceId e token');
      }

      const formattedPhone = this.formatPhone(phone);

      const response = await this.api.post('/send-file', {
        phone: formattedPhone,
        file: fileUrl,
        caption: caption || '',
      });

      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      console.error('Erro ao enviar arquivo via Z-API:', error.response?.data || error.message);
      throw new Error(
        error.response?.data?.message || 'Falha ao enviar arquivo via Z-API'
      );
    }
  }

  /**
   * Método estático para enviar arquivo com instanceId e token específicos
   */
  static async sendFileMessageWithCredentials(
    instanceId: string,
    token: string,
    phone: string,
    fileUrl: string,
    caption?: string
  ): Promise<ZapiResponse> {
    const service = ZapiService.create(instanceId, token);
    return service.sendFileMessage(phone, fileUrl, caption);
  }

  /**
   * Métodos estáticos para status e QR Code
   */
  static async getStatusWithCredentials(
    instanceId: string,
    token: string
  ): Promise<ZapiResponse> {
    const service = ZapiService.create(instanceId, token);
    return service.getStatus();
  }

  static async getQRCodeWithCredentials(
    instanceId: string,
    token: string
  ): Promise<ZapiResponse> {
    const service = ZapiService.create(instanceId, token);
    return service.getQRCode();
  }

  /**
   * Formata número de telefone para o padrão Z-API
   * Remove caracteres especiais e garante formato internacional
   */
  private formatPhone(phone: string): string {
    // Remove caracteres não numéricos
    let formatted = phone.replace(/\D/g, '');

    // Se não começar com código do país, assume Brasil (55)
    if (!formatted.startsWith('55') && formatted.length === 11) {
      formatted = '55' + formatted;
    }

    return formatted;
  }
}

export const zapiService = new ZapiService();

