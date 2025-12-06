import axios, { AxiosInstance } from 'axios';

export interface ChatwootInbox {
  id: number;
  name: string;
  channel_type: string;
}

export interface ChatwootConversation {
  id: number;
  inbox_id: number;
  status: string;
  meta: any;
  messages: ChatwootMessage[];
}

export interface ChatwootMessage {
  id: number;
  content: string;
  message_type: number;
  created_at: string;
  sender: {
    id: number;
    name: string;
    type: string;
  };
}

export interface ChatwootAgent {
  id: number;
  name: string;
  email: string;
}

export class ChatwootService {
  private api: AxiosInstance;
  private accountId: string;

  constructor() {
    const baseURL = process.env.CHATWOOT_API_BASE_URL || 'http://chatwoot:3000';
    const apiToken = process.env.CHATWOOT_API_TOKEN;
    this.accountId = process.env.CHATWOOT_ACCOUNT_ID || '1';

    if (!apiToken) {
      throw new Error('CHATWOOT_API_TOKEN não configurado. Configure no arquivo .env');
    }

    this.api = axios.create({
      baseURL: `${baseURL}/api/v1`,
      headers: {
        'api_access_token': apiToken,
        'Content-Type': 'application/json',
      },
      timeout: 30000, // 30 segundos de timeout para todas as requisições
    });
  }

  /**
   * Lista todas as inboxes
   */
  async listInboxes(): Promise<ChatwootInbox[]> {
    try {
      const url = `/accounts/${this.accountId}/inboxes`;
      console.log(`🔍 Tentando listar inboxes do Chatwoot: ${this.api.defaults.baseURL}${url}`);
      console.log(`📋 Account ID: ${this.accountId}`);
      
      const response = await this.api.get(url);
      // A resposta do Chatwoot vem como {payload: [...]} ou como array direto
      const inboxes = response.data.payload || response.data;
      
      if (!Array.isArray(inboxes)) {
        console.warn('⚠️ Resposta do Chatwoot não é um array:', typeof inboxes, inboxes);
        return [];
      }
      
      return inboxes;
    } catch (error: any) {
      const status = error.response?.status;
      const statusText = error.response?.statusText;
      const data = error.response?.data;
      const url = error.config?.url || 'URL não disponível';
      const errorCode = error.code;
      const errorMessage = error.message;
      
      console.error('❌ Erro ao listar inboxes do Chatwoot:', {
        status,
        statusText,
        url: `${this.api.defaults.baseURL}${url}`,
        baseURL: this.api.defaults.baseURL,
        accountId: this.accountId,
        error: typeof data === 'string' ? data.substring(0, 200) : data,
        code: errorCode,
        message: errorMessage,
      });
      
      // Se for erro de conexão (Chatwoot não está acessível), retornar array vazio
      if (errorCode === 'ECONNREFUSED' || 
          errorCode === 'ETIMEDOUT' || 
          errorCode === 'ECONNRESET' ||
          errorMessage?.includes('socket hang up') ||
          errorMessage?.includes('connect ECONNREFUSED')) {
        console.warn('⚠️ Chatwoot não está acessível. Retornando array vazio.');
        return [];
      }
      
      if (status === 404) {
        throw new Error(`Chatwoot retornou 404. Verifique se a URL está correta (${this.api.defaults.baseURL}) e se o accountId (${this.accountId}) existe.`);
      }
      
      throw new Error(`Falha ao listar inboxes do Chatwoot: ${status || errorCode} ${statusText || errorMessage}`);
    }
  }

  /**
   * Lista conversas de uma inbox
   */
  async listConversations(inboxId: number, status?: string): Promise<ChatwootConversation[]> {
    try {
      const params: any = { inbox_id: inboxId };
      if (status) {
        params.status = status;
      }

      const response = await this.api.get(`/accounts/${this.accountId}/conversations`, { 
        params,
        timeout: 10000, // 10 segundos de timeout
      });
      // A resposta do Chatwoot pode vir em diferentes formatos:
      // 1. {data: {payload: [...]}} - formato mais comum
      // 2. {payload: [...]} - formato alternativo
      // 3. [...] - array direto
      let conversations = response.data;
      
      if (conversations?.data?.payload) {
        conversations = conversations.data.payload;
      } else if (conversations?.payload) {
        conversations = conversations.payload;
      }
      
      if (!Array.isArray(conversations)) {
        console.warn('⚠️ Resposta de conversas não é um array:', typeof conversations, JSON.stringify(conversations).substring(0, 200));
        return [];
      }
      
      return conversations;
    } catch (error: any) {
      const errorCode = error.code;
      const errorMessage = error.message;
      
      // Se for erro de conexão (Chatwoot não está acessível), retornar array vazio
      if (errorCode === 'ECONNREFUSED' || 
          errorCode === 'ETIMEDOUT' || 
          errorCode === 'ECONNRESET' ||
          errorMessage?.includes('socket hang up') ||
          errorMessage?.includes('connect ECONNREFUSED')) {
        console.warn(`⚠️ Chatwoot não está acessível ao buscar conversas do inbox ${inboxId}. Retornando array vazio.`);
        return [];
      }
      
      console.error('Erro ao listar conversas:', error.response?.data || error.message);
      throw new Error('Falha ao listar conversas do Chatwoot');
    }
  }

  /**
   * Busca uma conversa específica
   */
  async getConversation(conversationId: number): Promise<ChatwootConversation> {
    try {
      const response = await this.api.get(
        `/accounts/${this.accountId}/conversations/${conversationId}`
      );
      return response.data;
    } catch (error: any) {
      console.error('Erro ao buscar conversa:', error.response?.data || error.message);
      throw new Error('Falha ao buscar conversa do Chatwoot');
    }
  }

  /**
   * Lista mensagens de uma conversa
   */
  async listMessages(conversationId: number): Promise<ChatwootMessage[]> {
    try {
      const response = await this.api.get(
        `/accounts/${this.accountId}/conversations/${conversationId}/messages`
      );
      
      // O Chatwoot pode retornar mensagens em diferentes formatos
      // Tentar extrair do payload primeiro, depois do data direto
      const messages = response.data.payload || response.data || [];
      
      // Garantir que é um array
      if (!Array.isArray(messages)) {
        console.warn('⚠️ Resposta de mensagens não é um array:', typeof messages, messages);
        return [];
      }
      
      return messages;
    } catch (error: any) {
      console.error('Erro ao listar mensagens:', error.response?.data || error.message);
      throw new Error('Falha ao listar mensagens do Chatwoot');
    }
  }

  /**
   * Envia uma mensagem
   */
  async sendMessage(conversationId: number, content: string): Promise<ChatwootMessage> {
    try {
      const response = await this.api.post(
        `/accounts/${this.accountId}/conversations/${conversationId}/messages`,
        {
          content,
          message_type: 'outgoing',
          private: false,
        }
      );
      
      // Extrair mensagem do payload se necessário
      const message = response.data.payload || response.data;
      console.log(`✅ Mensagem enviada no Chatwoot:`, {
        id: message.id,
        content: message.content?.substring(0, 50),
        message_type: message.message_type,
      });
      
      return message;
    } catch (error: any) {
      console.error('Erro ao enviar mensagem:', error.response?.data || error.message);
      throw new Error('Falha ao enviar mensagem no Chatwoot');
    }
  }

  /**
   * Transfere uma conversa para outro agente
   */
  async transferConversation(
    conversationId: number,
    targetAgentId: number
  ): Promise<void> {
    try {
      await this.api.post(
        `/accounts/${this.accountId}/conversations/${conversationId}/assignments`,
        {
          assignee_id: targetAgentId,
        }
      );
    } catch (error: any) {
      console.error('Erro ao transferir conversa:', error.response?.data || error.message);
      throw new Error('Falha ao transferir conversa no Chatwoot');
    }
  }

  /**
   * Transfere uma conversa para outro inbox (e opcionalmente para um agente)
   */
  async transferConversationToInbox(
    conversationId: number,
    targetInboxId: number,
    targetAgentId?: number
  ): Promise<void> {
    try {
      // Primeiro, transferir para o inbox
      await this.api.post(
        `/accounts/${this.accountId}/conversations/${conversationId}/transfers`,
        {
          inbox_id: targetInboxId,
        }
      );

      // Se especificou um agente, atribuir também
      if (targetAgentId) {
        await this.api.post(
          `/accounts/${this.accountId}/conversations/${conversationId}/assignments`,
          {
            assignee_id: targetAgentId,
          }
        );
      }
    } catch (error: any) {
      console.error('Erro ao transferir conversa para inbox:', error.response?.data || error.message);
      throw new Error('Falha ao transferir conversa para inbox no Chatwoot');
    }
  }

  /**
   * Lista agentes
   */
  async listAgents(): Promise<ChatwootAgent[]> {
    try {
      const response = await this.api.get(`/accounts/${this.accountId}/agents`);
      return response.data;
    } catch (error: any) {
      console.error('Erro ao listar agentes:', error.response?.data || error.message);
      throw new Error('Falha ao listar agentes do Chatwoot');
    }
  }

  /**
   * Atualiza status da conversa
   */
  async updateConversationStatus(conversationId: number, status: string): Promise<void> {
    try {
      await this.api.put(
        `/accounts/${this.accountId}/conversations/${conversationId}`,
        { status }
      );
    } catch (error: any) {
      console.error('Erro ao atualizar status:', error.response?.data || error.message);
      throw new Error('Falha ao atualizar status da conversa');
    }
  }

  /**
   * Formata telefone para formato E.164 (+[código do país][número])
   */
  private formatPhoneToE164(phone: string): string {
    // Se já começar com +, retornar como está (já está em E.164)
    if (phone.startsWith('+')) {
      return phone;
    }
    
    // Remove todos os caracteres não numéricos
    let cleaned = phone.replace(/\D/g, '');
    
    // Lista de códigos de país comuns (1-3 dígitos)
    const countryCodes = [
      // 1 dígito
      { code: '1', countries: ['US', 'CA'] }, // EUA/Canadá
      // 2 dígitos
      { code: '20', countries: ['EG'] }, // Egito
      { code: '27', countries: ['ZA'] }, // África do Sul
      { code: '30', countries: ['GR'] }, // Grécia
      { code: '31', countries: ['NL'] }, // Holanda
      { code: '32', countries: ['BE'] }, // Bélgica
      { code: '33', countries: ['FR'] }, // França
      { code: '34', countries: ['ES'] }, // Espanha
      { code: '39', countries: ['IT'] }, // Itália
      { code: '40', countries: ['RO'] }, // Romênia
      { code: '41', countries: ['CH'] }, // Suíça
      { code: '43', countries: ['AT'] }, // Áustria
      { code: '44', countries: ['GB'] }, // Reino Unido
      { code: '45', countries: ['DK'] }, // Dinamarca
      { code: '46', countries: ['SE'] }, // Suécia
      { code: '47', countries: ['NO'] }, // Noruega
      { code: '48', countries: ['PL'] }, // Polônia
      { code: '49', countries: ['DE'] }, // Alemanha
      { code: '51', countries: ['PE'] }, // Peru
      { code: '52', countries: ['MX'] }, // México
      { code: '53', countries: ['CU'] }, // Cuba
      { code: '54', countries: ['AR'] }, // Argentina
      { code: '55', countries: ['BR'] }, // Brasil
      { code: '56', countries: ['CL'] }, // Chile
      { code: '57', countries: ['CO'] }, // Colômbia
      { code: '58', countries: ['VE'] }, // Venezuela
      { code: '60', countries: ['MY'] }, // Malásia
      { code: '61', countries: ['AU'] }, // Austrália
      { code: '62', countries: ['ID'] }, // Indonésia
      { code: '63', countries: ['PH'] }, // Filipinas
      { code: '64', countries: ['NZ'] }, // Nova Zelândia
      { code: '65', countries: ['SG'] }, // Singapura
      { code: '66', countries: ['TH'] }, // Tailândia
      { code: '81', countries: ['JP'] }, // Japão
      { code: '82', countries: ['KR'] }, // Coreia do Sul
      { code: '84', countries: ['VN'] }, // Vietnã
      { code: '86', countries: ['CN'] }, // China
      { code: '90', countries: ['TR'] }, // Turquia
      { code: '91', countries: ['IN'] }, // Índia
      { code: '92', countries: ['PK'] }, // Paquistão
      { code: '93', countries: ['AF'] }, // Afeganistão
      { code: '94', countries: ['LK'] }, // Sri Lanka
      { code: '95', countries: ['MM'] }, // Myanmar
      { code: '98', countries: ['IR'] }, // Irã
      { code: '212', countries: ['MA'] }, // Marrocos
      { code: '213', countries: ['DZ'] }, // Argélia
      { code: '216', countries: ['TN'] }, // Tunísia
      { code: '218', countries: ['LY'] }, // Líbia
      { code: '220', countries: ['GM'] }, // Gâmbia
      { code: '221', countries: ['SN'] }, // Senegal
      { code: '222', countries: ['MR'] }, // Mauritânia
      { code: '223', countries: ['ML'] }, // Mali
      { code: '224', countries: ['GN'] }, // Guiné
      { code: '225', countries: ['CI'] }, // Costa do Marfim
      { code: '226', countries: ['BF'] }, // Burkina Faso
      { code: '227', countries: ['NE'] }, // Níger
      { code: '228', countries: ['TG'] }, // Togo
      { code: '229', countries: ['BJ'] }, // Benim
      { code: '230', countries: ['MU'] }, // Maurício
      { code: '231', countries: ['LR'] }, // Libéria
      { code: '232', countries: ['SL'] }, // Serra Leoa
      { code: '233', countries: ['GH'] }, // Gana
      { code: '234', countries: ['NG'] }, // Nigéria
      { code: '235', countries: ['TD'] }, // Chade
      { code: '236', countries: ['CF'] }, // República Centro-Africana
      { code: '237', countries: ['CM'] }, // Camarões
      { code: '238', countries: ['CV'] }, // Cabo Verde
      { code: '239', countries: ['ST'] }, // São Tomé e Príncipe
      { code: '240', countries: ['GQ'] }, // Guiné Equatorial
      { code: '241', countries: ['GA'] }, // Gabão
      { code: '242', countries: ['CG'] }, // República do Congo
      { code: '243', countries: ['CD'] }, // República Democrática do Congo
      { code: '244', countries: ['AO'] }, // Angola
      { code: '245', countries: ['GW'] }, // Guiné-Bissau
      { code: '246', countries: ['IO'] }, // Território Britânico do Oceano Índico
      { code: '248', countries: ['SC'] }, // Seicheles
      { code: '249', countries: ['SD'] }, // Sudão
      { code: '250', countries: ['RW'] }, // Ruanda
      { code: '251', countries: ['ET'] }, // Etiópia
      { code: '252', countries: ['SO'] }, // Somália
      { code: '253', countries: ['DJ'] }, // Djibuti
      { code: '254', countries: ['KE'] }, // Quênia
      { code: '255', countries: ['TZ'] }, // Tanzânia
      { code: '256', countries: ['UG'] }, // Uganda
      { code: '257', countries: ['BI'] }, // Burundi
      { code: '258', countries: ['MZ'] }, // Moçambique
      { code: '260', countries: ['ZM'] }, // Zâmbia
      { code: '261', countries: ['MG'] }, // Madagascar
      { code: '262', countries: ['RE'] }, // Reunião
      { code: '263', countries: ['ZW'] }, // Zimbábue
      { code: '264', countries: ['NA'] }, // Namíbia
      { code: '265', countries: ['MW'] }, // Malawi
      { code: '266', countries: ['LS'] }, // Lesoto
      { code: '267', countries: ['BW'] }, // Botswana
      { code: '268', countries: ['SZ'] }, // Suazilândia
      { code: '269', countries: ['KM'] }, // Comores
      { code: '290', countries: ['SH'] }, // Santa Helena
      { code: '291', countries: ['ER'] }, // Eritreia
      { code: '297', countries: ['AW'] }, // Aruba
      { code: '298', countries: ['FO'] }, // Ilhas Feroé
      { code: '299', countries: ['GL'] }, // Groenlândia
      { code: '350', countries: ['GI'] }, // Gibraltar
      { code: '351', countries: ['PT'] }, // Portugal
      { code: '352', countries: ['LU'] }, // Luxemburgo
      { code: '353', countries: ['IE'] }, // Irlanda
      { code: '354', countries: ['IS'] }, // Islândia
      { code: '355', countries: ['AL'] }, // Albânia
      { code: '356', countries: ['MT'] }, // Malta
      { code: '357', countries: ['CY'] }, // Chipre
      { code: '358', countries: ['FI'] }, // Finlândia
      { code: '359', countries: ['BG'] }, // Bulgária
      { code: '370', countries: ['LT'] }, // Lituânia
      { code: '371', countries: ['LV'] }, // Letônia
      { code: '372', countries: ['EE'] }, // Estônia
      { code: '373', countries: ['MD'] }, // Moldávia
      { code: '374', countries: ['AM'] }, // Armênia
      { code: '375', countries: ['BY'] }, // Belarus
      { code: '376', countries: ['AD'] }, // Andorra
      { code: '377', countries: ['MC'] }, // Mônaco
      { code: '378', countries: ['SM'] }, // San Marino
      { code: '380', countries: ['UA'] }, // Ucrânia
      { code: '381', countries: ['RS'] }, // Sérvia
      { code: '382', countries: ['ME'] }, // Montenegro
      { code: '383', countries: ['XK'] }, // Kosovo
      { code: '385', countries: ['HR'] }, // Croácia
      { code: '386', countries: ['SI'] }, // Eslovênia
      { code: '387', countries: ['BA'] }, // Bósnia e Herzegovina
      { code: '389', countries: ['MK'] }, // Macedônia do Norte
      { code: '420', countries: ['CZ'] }, // República Tcheca
      { code: '421', countries: ['SK'] }, // Eslováquia
      { code: '423', countries: ['LI'] }, // Liechtenstein
      { code: '500', countries: ['FK'] }, // Ilhas Falkland
      { code: '501', countries: ['BZ'] }, // Belize
      { code: '502', countries: ['GT'] }, // Guatemala
      { code: '503', countries: ['SV'] }, // El Salvador
      { code: '504', countries: ['HN'] }, // Honduras
      { code: '505', countries: ['NI'] }, // Nicarágua
      { code: '506', countries: ['CR'] }, // Costa Rica
      { code: '507', countries: ['PA'] }, // Panamá
      { code: '508', countries: ['PM'] }, // São Pedro e Miquelão
      { code: '509', countries: ['HT'] }, // Haiti
      { code: '590', countries: ['GP'] }, // Guadalupe
      { code: '591', countries: ['BO'] }, // Bolívia
      { code: '592', countries: ['GY'] }, // Guiana
      { code: '593', countries: ['EC'] }, // Equador
      { code: '594', countries: ['GF'] }, // Guiana Francesa
      { code: '595', countries: ['PY'] }, // Paraguai
      { code: '596', countries: ['MQ'] }, // Martinica
      { code: '597', countries: ['SR'] }, // Suriname
      { code: '598', countries: ['UY'] }, // Uruguai
      { code: '599', countries: ['CW'] }, // Curaçao
      { code: '670', countries: ['TL'] }, // Timor-Leste
      { code: '672', countries: ['NF'] }, // Ilha Norfolk
      { code: '673', countries: ['BN'] }, // Brunei
      { code: '674', countries: ['NR'] }, // Nauru
      { code: '675', countries: ['PG'] }, // Papua Nova Guiné
      { code: '676', countries: ['TO'] }, // Tonga
      { code: '677', countries: ['SB'] }, // Ilhas Salomão
      { code: '678', countries: ['VU'] }, // Vanuatu
      { code: '679', countries: ['FJ'] }, // Fiji
      { code: '680', countries: ['PW'] }, // Palau
      { code: '681', countries: ['WF'] }, // Wallis e Futuna
      { code: '682', countries: ['CK'] }, // Ilhas Cook
      { code: '683', countries: ['NU'] }, // Niue
      { code: '685', countries: ['WS'] }, // Samoa
      { code: '686', countries: ['KI'] }, // Kiribati
      { code: '687', countries: ['NC'] }, // Nova Caledônia
      { code: '688', countries: ['TV'] }, // Tuvalu
      { code: '689', countries: ['PF'] }, // Polinésia Francesa
      { code: '690', countries: ['TK'] }, // Tokelau
      { code: '691', countries: ['FM'] }, // Micronésia
      { code: '692', countries: ['MH'] }, // Ilhas Marshall
      { code: '850', countries: ['KP'] }, // Coreia do Norte
      { code: '852', countries: ['HK'] }, // Hong Kong
      { code: '853', countries: ['MO'] }, // Macau
      { code: '855', countries: ['KH'] }, // Camboja
      { code: '856', countries: ['LA'] }, // Laos
      { code: '880', countries: ['BD'] }, // Bangladesh
      { code: '886', countries: ['TW'] }, // Taiwan
      { code: '960', countries: ['MV'] }, // Maldivas
      { code: '961', countries: ['LB'] }, // Líbano
      { code: '962', countries: ['JO'] }, // Jordânia
      { code: '963', countries: ['SY'] }, // Síria
      { code: '964', countries: ['IQ'] }, // Iraque
      { code: '965', countries: ['KW'] }, // Kuwait
      { code: '966', countries: ['SA'] }, // Arábia Saudita
      { code: '967', countries: ['YE'] }, // Iêmen
      { code: '968', countries: ['OM'] }, // Omã
      { code: '970', countries: ['PS'] }, // Palestina
      { code: '971', countries: ['AE'] }, // Emirados Árabes Unidos
      { code: '972', countries: ['IL'] }, // Israel
      { code: '973', countries: ['BH'] }, // Bahrein
      { code: '974', countries: ['QA'] }, // Catar
      { code: '975', countries: ['BT'] }, // Butão
      { code: '976', countries: ['MN'] }, // Mongólia
      { code: '977', countries: ['NP'] }, // Nepal
      { code: '992', countries: ['TJ'] }, // Tajiquistão
      { code: '993', countries: ['TM'] }, // Turcomenistão
      { code: '994', countries: ['AZ'] }, // Azerbaijão
      { code: '995', countries: ['GE'] }, // Geórgia
      { code: '996', countries: ['KG'] }, // Quirguistão
      { code: '998', countries: ['UZ'] }, // Uzbequistão
    ];
    
    // Tentar detectar código do país
    // Se o número tem mais de 10 dígitos, provavelmente já tem código do país
    if (cleaned.length > 10) {
      // Tentar encontrar código do país conhecido
      for (const country of countryCodes) {
        if (cleaned.startsWith(country.code)) {
          return '+' + cleaned;
        }
      }
      // Se não encontrou código conhecido mas tem mais de 10 dígitos, assumir que já tem código
      return '+' + cleaned;
    }
    
    // Se tem exatamente 10 ou 11 dígitos, provavelmente é Brasil
    if (cleaned.length === 10 || cleaned.length === 11) {
      return '+55' + cleaned;
    }
    
    // Se tem menos de 10 dígitos, assumir Brasil (número incompleto)
    return '+55' + cleaned;
  }

  /**
   * Cria ou busca um contato no Chatwoot pelo telefone
   */
  async findOrCreateContactByPhone(
    phone: string,
    name?: string
  ): Promise<number> {
    try {
      // Formatar telefone para E.164
      const formattedPhone = this.formatPhoneToE164(phone);
      console.log(`📞 Telefone formatado: ${phone} -> ${formattedPhone}`);
      
      // Buscar contatos existentes (tentar com ambos os formatos)
      const searchPhones = [formattedPhone, phone, phone.replace(/\D/g, '')];
      let existingContact = null;
      
      for (const searchPhone of searchPhones) {
        try {
          const response = await this.api.get(`/accounts/${this.accountId}/contacts/search`, {
            params: { q: searchPhone }
          });
          
          const contacts = response.data.payload || response.data || [];
          existingContact = contacts.find((contact: any) => {
            const contactPhone = contact.phone_number || contact.identifier || '';
            const cleanedContactPhone = contactPhone.replace(/\D/g, '');
            const cleanedSearchPhone = searchPhone.replace(/\D/g, '');
            return contactPhone === searchPhone || 
                   contactPhone === formattedPhone ||
                   cleanedContactPhone === cleanedSearchPhone;
          });
          
          if (existingContact) break;
        } catch (error) {
          // Continuar tentando outros formatos
          continue;
        }
      }

      if (existingContact) {
        console.log(`✅ Contato encontrado: ${existingContact.id}`);
        return existingContact.id;
      }

      // Criar novo contato com telefone formatado em E.164
      console.log(`📝 Criando novo contato para telefone: ${formattedPhone}`);
      const createResponse = await this.api.post(`/accounts/${this.accountId}/contacts`, {
        identifier: formattedPhone,
        name: name || formattedPhone,
        phone_number: formattedPhone,
      });

      const newContact = createResponse.data.payload || createResponse.data;
      console.log(`✅ Contato criado: ${newContact.id}`);
      return newContact.id;
    } catch (error: any) {
      console.error('Erro ao buscar/criar contato:', error.response?.data || error.message);
      throw new Error(`Falha ao criar contato: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Cria ou busca uma conversa no Chatwoot baseada no telefone
   * Retorna o ID da conversa
   */
  async findOrCreateConversationByPhone(
    phone: string,
    inboxId: number,
    contactName?: string
  ): Promise<number> {
    try {
      // Buscar conversas existentes na inbox
      const conversations = await this.listConversations(inboxId);
      
      // Formatar telefone para comparação
      const formattedPhone = this.formatPhoneToE164(phone);
      const cleanedPhone = phone.replace(/\D/g, '');
      const cleanedFormattedPhone = formattedPhone.replace(/\D/g, '');
      
      // Tentar encontrar conversa existente pelo telefone (comparar em diferentes formatos)
      const existingConversation = conversations.find((conv: any) => {
        const convPhone = conv.meta?.sender?.phone_number || 
                         conv.meta?.sender?.identifier ||
                         conv.meta?.phone_number;
        if (!convPhone) return false;
        
        const cleanedConvPhone = convPhone.replace(/\D/g, '');
        
        // Comparar em diferentes formatos
        return convPhone === phone || 
               convPhone === formattedPhone ||
               cleanedConvPhone === cleanedPhone ||
               cleanedConvPhone === cleanedFormattedPhone ||
               (cleanedConvPhone.length > 8 && cleanedPhone.length > 8 && 
                (cleanedConvPhone.endsWith(cleanedPhone.slice(-8)) || 
                 cleanedPhone.endsWith(cleanedConvPhone.slice(-8)))); // Últimos 8 dígitos
      });

      if (existingConversation) {
        console.log(`✅ Conversa existente encontrada: ${existingConversation.id}`);
        return existingConversation.id;
      }

      // Se não encontrou, criar nova conversa
      // No Chatwoot, conversas são criadas automaticamente ao enviar mensagem
      // Vamos criar o contato e depois criar uma mensagem que criará a conversa
      console.log(`📝 Criando contato e preparando para criar conversa via mensagem`);
      
      // Primeiro, criar ou buscar contato
      const contactId = await this.findOrCreateContactByPhone(phone, contactName);
      
      // Buscar contact_inbox (associação entre contato e inbox)
      // Isso é necessário para criar mensagens
      let contactInboxId: number | null = null;
      try {
        const contactResponse = await this.api.get(`/accounts/${this.accountId}/contacts/${contactId}`);
        const contact = contactResponse.data.payload || contactResponse.data;
        const contactInbox = contact.contact_inboxes?.find((ci: any) => ci.inbox_id === inboxId);
        contactInboxId = contactInbox?.id || null;
        
        if (!contactInboxId) {
          // Criar contact_inbox se não existir
          console.log(`📝 Criando contact_inbox para contato ${contactId} e inbox ${inboxId}`);
          try {
            const ciResponse = await this.api.post(`/accounts/${this.accountId}/contacts/${contactId}/contact_inboxes`, {
              inbox_id: inboxId,
              source_id: `contact:${contactId}`,
            });
            const newCI = ciResponse.data.payload || ciResponse.data;
            contactInboxId = newCI.id;
            console.log(`✅ Contact inbox criado: ${contactInboxId}`);
          } catch (ciError: any) {
            console.warn('⚠️ Erro ao criar contact_inbox:', ciError.response?.data || ciError.message);
            // Tentar criar usando apenas inbox_id
            try {
              const ciResponse2 = await this.api.post(`/accounts/${this.accountId}/contacts/${contactId}/contact_inboxes`, {
                inbox_id: inboxId,
              });
              const newCI2 = ciResponse2.data.payload || ciResponse2.data;
              contactInboxId = newCI2.id;
              console.log(`✅ Contact inbox criado (método alternativo): ${contactInboxId}`);
            } catch (ciError2: any) {
              console.warn('⚠️ Erro ao criar contact_inbox (método alternativo):', ciError2.response?.data || ciError2.message);
            }
          }
        } else {
          console.log(`✅ Contact inbox já existe: ${contactInboxId}`);
        }
      } catch (error: any) {
        console.warn('⚠️ Erro ao buscar contact_inbox:', error.response?.data || error.message);
      }
      
      // Tentar criar conversa usando contact_inbox
      if (contactInboxId) {
        try {
          console.log(`📝 Tentando criar conversa usando contact_inbox: ${contactInboxId}`);
          const createResponse = await this.api.post(`/accounts/${this.accountId}/conversations`, {
            source_id: contactInboxId,
            inbox_id: inboxId,
          });

          console.log(`📦 Resposta da criação de conversa:`, JSON.stringify(createResponse.data, null, 2));
          
          const newConversation = createResponse.data.payload || createResponse.data;
          const conversationId = newConversation.id || newConversation.conversation?.id;
          
          if (conversationId) {
            console.log(`✅ Conversa criada: ${conversationId}`);
            return conversationId;
          }
        } catch (createError: any) {
          console.warn('⚠️ Não foi possível criar conversa com contact_inbox:', createError.response?.data || createError.message);
        }
      }
      
      // Se não conseguiu criar conversa, lançar erro para que o webhook tente criar mensagem diretamente
      throw new Error('Não foi possível criar conversa. A mensagem será criada diretamente via contact_inbox.');
    } catch (error: any) {
      console.error('Erro ao buscar/criar conversa:', error.response?.data || error.message);
      throw new Error(`Falha ao criar conversa: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Cria uma mensagem em uma conversa do Chatwoot (incoming - recebida)
   */
  async createMessageInConversation(
    conversationId: number,
    content: string,
    mediaUrl?: string
  ): Promise<ChatwootMessage> {
    try {
      // Se tiver mediaUrl, criar mensagem com anexo
      if (mediaUrl) {
        console.log(`📎 Criando mensagem com anexo: ${mediaUrl}`);
        return await this.sendMessageWithAttachment(conversationId, content, mediaUrl);
      }
      
      // Criar mensagem incoming (recebida) - não usar sendMessage que cria outgoing
      const response = await this.api.post(
        `/accounts/${this.accountId}/conversations/${conversationId}/messages`,
        {
          content,
          message_type: 'incoming', // Mensagem recebida do contato
          private: false,
        }
      );
      
      const message = response.data.payload || response.data;
      console.log(`✅ Mensagem incoming criada no Chatwoot:`, {
        id: message.id,
        content: message.content?.substring(0, 50),
        message_type: message.message_type,
      });
      
      return message;
    } catch (error: any) {
      console.error('Erro ao criar mensagem no Chatwoot:', error);
      throw error;
    }
  }

  /**
   * Envia uma mensagem com anexo (imagem, sticker, etc.)
   */
  async sendMessageWithAttachment(
    conversationId: number,
    content: string,
    mediaUrl: string
  ): Promise<ChatwootMessage> {
    try {
      // Determinar o tipo de anexo baseado na URL ou extensão
      let attachmentType = 'image';
      if (mediaUrl.includes('.webp') || mediaUrl.includes('sticker')) {
        attachmentType = 'image'; // Stickers são imagens
      } else if (mediaUrl.includes('.mp4') || mediaUrl.includes('video')) {
        attachmentType = 'video';
      } else if (mediaUrl.includes('.mp3') || mediaUrl.includes('audio')) {
        attachmentType = 'audio';
      }

      // Tentar primeiro com o formato de URL direta (algumas versões do Chatwoot aceitam)
      try {
        const response = await this.api.post(
          `/accounts/${this.accountId}/conversations/${conversationId}/messages`,
          {
            content: content || '',
            message_type: 'incoming',
            private: false,
            attachments: [
              {
                file_type: attachmentType,
                remote_file_url: mediaUrl, // Tentar remote_file_url ao invés de file_url
              },
            ],
          }
        );
        
        const message = response.data.payload || response.data;
        console.log(`✅ Mensagem com anexo criada (remote_file_url): ${message.id}`);
        return message;
      } catch (urlError: any) {
        console.warn('⚠️ Erro ao enviar com remote_file_url, tentando baixar arquivo...', urlError.response?.data || urlError.message);
        
        // Se falhar, baixar o arquivo e enviar
        const axios = require('axios');
        const fileResponse = await axios.get(mediaUrl, {
          responseType: 'arraybuffer',
          timeout: 30000,
        });
        
        const fileBuffer = Buffer.from(fileResponse.data);
        const base64File = fileBuffer.toString('base64');
        
        // Determinar content type
        let contentType = 'image/webp';
        if (mediaUrl.includes('.jpg') || mediaUrl.includes('.jpeg')) {
          contentType = 'image/jpeg';
        } else if (mediaUrl.includes('.png')) {
          contentType = 'image/png';
        } else if (mediaUrl.includes('.gif')) {
          contentType = 'image/gif';
        } else if (mediaUrl.includes('.mp4')) {
          contentType = 'video/mp4';
        } else if (mediaUrl.includes('.mp3')) {
          contentType = 'audio/mpeg';
        }
        
        // Enviar com data URL
        const dataUrl = `data:${contentType};base64,${base64File}`;
        
        const response = await this.api.post(
          `/accounts/${this.accountId}/conversations/${conversationId}/messages`,
          {
            content: content || '',
            message_type: 'incoming',
            private: false,
            attachments: [
              {
                file_type: attachmentType,
                data: dataUrl,
                file_name: `attachment.${mediaUrl.split('.').pop()?.split('?')[0] || 'webp'}`,
              },
            ],
          }
        );
        
        const message = response.data.payload || response.data;
        console.log(`✅ Mensagem com anexo criada (data URL): ${message.id}`);
        return message;
      }
    } catch (error: any) {
      console.error('Erro ao enviar mensagem com anexo:', error.response?.data || error.message);
      // Se falhar, tentar enviar sem anexo mas com a URL no conteúdo
      console.log('⚠️ Tentando enviar mensagem sem anexo, incluindo URL no conteúdo...');
      const messageWithUrl = content ? `${content}\n\n📎 ${mediaUrl}` : `📎 ${mediaUrl}`;
      return await this.sendMessage(conversationId, messageWithUrl);
    }
  }

  /**
   * Cria uma mensagem diretamente via contact_inbox (cria conversa automaticamente)
   */
  async createMessageViaContactInbox(
    phone: string,
    inboxId: number,
    content: string,
    contactName?: string,
    mediaUrl?: string
  ): Promise<{ conversationId: number; message: ChatwootMessage }> {
    try {
      // Criar ou buscar contato
      const contactId = await this.findOrCreateContactByPhone(phone, contactName);
      
      // Buscar ou criar contact_inbox
      let contactInboxId: number;
      let sourceId: string;
      try {
        const contactResponse = await this.api.get(`/accounts/${this.accountId}/contacts/${contactId}`);
        const contact = contactResponse.data.payload || contactResponse.data;
        const contactInbox = contact.contact_inboxes?.find((ci: any) => ci.inbox_id === inboxId);
        
        if (contactInbox?.id) {
          contactInboxId = contactInbox.id;
          sourceId = contactInbox.source_id || `contact_inbox:${contactInboxId}`;
          console.log(`✅ Contact inbox encontrado: ${contactInboxId}, source_id: ${sourceId}`);
        } else {
          // Criar contact_inbox
          console.log(`📝 Criando contact_inbox para contato ${contactId} e inbox ${inboxId}`);
          const ciResponse = await this.api.post(`/accounts/${this.accountId}/contacts/${contactId}/contact_inboxes`, {
            inbox_id: inboxId,
            source_id: `contact:${contactId}`,
          });
          const newCI = ciResponse.data.payload || ciResponse.data;
          contactInboxId = newCI.id;
          sourceId = newCI.source_id || `contact_inbox:${contactInboxId}`;
          console.log(`✅ Contact inbox criado: ${contactInboxId}, source_id: ${sourceId}`);
        }
      } catch (error: any) {
        console.error('Erro ao buscar/criar contact_inbox:', error.response?.data || error.message);
        throw new Error(`Falha ao criar contact_inbox: ${error.response?.data?.message || error.message}`);
      }
      
      // Criar conversa usando source_id do contact_inbox
      console.log(`📝 Criando conversa usando source_id: ${sourceId}...`);
      let conversationId: number;
      
      try {
        // Tentar criar conversa usando source_id do contact_inbox
        const convResponse = await this.api.post(`/accounts/${this.accountId}/conversations`, {
          source_id: sourceId,
          inbox_id: inboxId,
        });
        
        console.log(`📦 Resposta da criação de conversa:`, JSON.stringify(convResponse.data, null, 2));
        
        const newConversation = convResponse.data.payload || convResponse.data;
        conversationId = newConversation.id || newConversation.conversation?.id;
        
        if (conversationId) {
          console.log(`✅ Conversa criada: ${conversationId}`);
        } else {
          throw new Error('Conversa criada mas ID não encontrado');
        }
      } catch (convError: any) {
        console.warn('⚠️ Erro ao criar conversa com source_id:', convError.response?.data || convError.message);
        
        // Se falhar, tentar buscar conversa existente
        try {
          const conversationsResponse = await this.api.get(`/accounts/${this.accountId}/contacts/${contactId}/conversations`);
          const conversations = conversationsResponse.data.payload || conversationsResponse.data || [];
          const existingConv = conversations.find((conv: any) => conv.inbox_id === inboxId);
          
          if (existingConv) {
            conversationId = existingConv.id;
            console.log(`✅ Conversa existente encontrada: ${conversationId}`);
          } else {
            throw new Error('Não foi possível criar ou encontrar conversa');
          }
        } catch (searchError: any) {
          console.error('❌ Erro ao buscar conversas existentes:', searchError.response?.data || searchError.message);
          throw new Error(`Falha ao criar conversa: ${convError.response?.data?.message || convError.message}`);
        }
      }
      
      // Criar mensagem na conversa (incoming - recebida do contato)
      console.log(`💬 Criando mensagem incoming na conversa ${conversationId}...`);
      let message: ChatwootMessage;
      
      if (mediaUrl) {
        message = await this.sendMessageWithAttachment(conversationId, content, mediaUrl);
      } else {
        // Criar mensagem incoming (recebida) - não usar sendMessage que cria outgoing
        const response = await this.api.post(
          `/accounts/${this.accountId}/conversations/${conversationId}/messages`,
          {
            content,
            message_type: 'incoming', // Mensagem recebida do contato
            private: false,
          }
        );
        message = response.data.payload || response.data;
        console.log(`✅ Mensagem incoming criada: ${message.id}`);
      }
      
      console.log(`✅ Mensagem criada na conversa ${conversationId}`);
      return {
        conversationId,
        message,
      };
    } catch (error: any) {
      console.error('Erro ao criar mensagem via contact_inbox:', error.response?.data || error.message);
      throw new Error(`Falha ao criar mensagem: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Encaminha mensagem enviada no Chatwoot para Z-API
   * Este método identifica o número do cliente e envia via Z-API
   * Versão melhorada: busca WhatsAppNumber associado ao inbox
   */
  async relayOutgoingMessageToZapi(
    conversationId: number,
    message: ChatwootMessage
  ): Promise<void> {
    try {
      // Importar dinamicamente para evitar dependência circular
      const { ZapiService } = await import('./zapi.service');
      const prisma = await import('../config/database').then(m => m.default);

      // Buscar conversa para obter informações do contato e inbox
      const conversation = await this.getConversation(conversationId);
      const inboxId = conversation.inbox_id;

      // Buscar WhatsAppNumber associado ao inbox
      let whatsappNumber = await prisma.whatsAppNumber.findFirst({
        where: { inboxId: inboxId },
      });

      // Se não encontrou pelo inboxId, tentar buscar qualquer WhatsAppNumber disponível
      if (!whatsappNumber) {
        console.warn(`⚠️ Nenhum WhatsAppNumber encontrado para inbox ${inboxId}. Buscando qualquer número disponível...`);
        
        // Primeiro tentar buscar qualquer número conectado
        whatsappNumber = await prisma.whatsAppNumber.findFirst({
          where: { isConnected: true },
        });
        
        // Se não encontrou conectado, buscar qualquer número
        if (!whatsappNumber) {
          console.warn(`⚠️ Nenhum WhatsAppNumber conectado encontrado. Buscando qualquer número...`);
          whatsappNumber = await prisma.whatsAppNumber.findFirst();
        }
        
        if (whatsappNumber) {
          console.log(`✅ Usando WhatsAppNumber alternativo: ${whatsappNumber.name || whatsappNumber.instanceId} (ID: ${whatsappNumber.id})`);
          // Associar este número ao inbox para próximas vezes
          await prisma.whatsAppNumber.update({
            where: { id: whatsappNumber.id },
            data: { inboxId: inboxId },
          });
          console.log(`✅ WhatsAppNumber ${whatsappNumber.id} associado ao inbox ${inboxId}`);
        }
      }

      if (!whatsappNumber) {
        console.error(`❌ Nenhum WhatsAppNumber encontrado no banco de dados. Não é possível enviar mensagem via Z-API.`);
        console.error(`❌ Configure um número WhatsApp em: /whatsapp-numbers`);
        throw new Error(`Nenhum WhatsAppNumber configurado. Configure um número WhatsApp primeiro.`);
      }

      // Extrair telefone do contato
      const phone = conversation.meta?.sender?.phone_number || 
                    conversation.meta?.sender?.identifier ||
                    conversation.meta?.phone_number;

      if (!phone) {
        console.warn(`Não foi possível encontrar telefone na conversa ${conversationId}`);
        return;
      }

      // Verificar se a mensagem é do tipo outgoing (enviada pelo operador)
      // No Chatwoot:
      // - message_type: 0 = incoming, 1 = outgoing (número)
      // - message_type: 'incoming' ou 'outgoing' (string)
      // - sender.type: 'user' = enviada por usuário/agente, 'contact' = enviada por contato
      
      console.log(`🔍 Verificando se mensagem é outgoing:`, {
        message_type: message.message_type,
        message_type_type: typeof message.message_type,
        sender: message.sender,
        sender_type: message.sender?.type,
        private: message.private,
        content: message.content?.substring(0, 50),
        full_message: JSON.stringify(message, null, 2),
      });
      
      // Verificar se é outgoing de múltiplas formas
      const isOutgoing = 
        message.message_type === 1 || 
        message.message_type === 'outgoing' ||
        message.message_type === 'Outgoing' ||
        message.sender?.type === 'user' ||
        message.sender?.type === 'User' ||
        (message.sender && message.sender.type !== 'contact' && message.sender.type !== 'Contact');
      
      console.log(`🔍 Resultado da verificação: isOutgoing = ${isOutgoing}`);
      
      if (isOutgoing) {
        // Formatar telefone para E.164 antes de enviar
        const formattedPhone = this.formatPhoneToE164(phone);
        
        console.log(`📤 Enviando mensagem via Z-API:`, {
          instanceId: whatsappNumber.instanceId,
          phone: formattedPhone,
          content: message.content?.substring(0, 50),
        });
        
        // Enviar via Z-API usando as credenciais do WhatsAppNumber
        const result = await ZapiService.sendTextMessageWithCredentials(
          whatsappNumber.instanceId,
          whatsappNumber.token,
          formattedPhone,
          message.content
        );
        
        console.log(`✅ Mensagem encaminhada para Z-API (${whatsappNumber.name}): ${formattedPhone} - ${message.content.substring(0, 50)}...`);
        console.log(`📦 Resposta Z-API:`, JSON.stringify(result, null, 2));
      } else {
        console.log(`ℹ️ Mensagem não é outgoing (message_type: ${message.message_type}, sender.type: ${message.sender?.type}), não encaminhando para Z-API`);
      }
    } catch (error: any) {
      // Não falhar o fluxo principal se houver erro no relay, mas logar detalhes completos
      console.error('❌ Erro ao encaminhar mensagem para Z-API:', {
        message: error.message,
        stack: error.stack,
        response: error.response?.data,
        status: error.response?.status,
        config: {
          url: error.config?.url,
          method: error.config?.method,
          baseURL: error.config?.baseURL,
        },
      });
      // Não re-lançar o erro para não quebrar o fluxo, mas logar tudo
    }
  }
}

export const chatwootService = new ChatwootService();

