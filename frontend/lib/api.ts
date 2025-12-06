import axios, { AxiosInstance } from 'axios';
import Cookies from 'js-cookie';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: `${API_URL}/api`,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Interceptor para adicionar token
    this.client.interceptors.request.use((config) => {
      const token = Cookies.get('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // Interceptor para tratar erros
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          Cookies.remove('token');
          Cookies.remove('refreshToken');
          if (typeof window !== 'undefined') {
            window.location.href = '/login';
          }
        }
        return Promise.reject(error);
      }
    );
  }

  // Auth
  async login(email: string, password: string) {
    const response = await this.client.post('/auth/login', { email, password });
    return response.data;
  }

  async refreshToken(refreshToken: string) {
    const response = await this.client.post('/auth/refresh', { refreshToken });
    return response.data;
  }

  async getMe() {
    const response = await this.client.get('/auth/me');
    return response.data;
  }

  // Users
  async getUsers() {
    const response = await this.client.get('/users');
    return response.data;
  }

  async createUser(data: any) {
    const response = await this.client.post('/users', data);
    return response.data;
  }

  async updateUser(id: string, data: any) {
    const response = await this.client.put(`/users/${id}`, data);
    return response.data;
  }

  // Conversations
  async getConversations(params?: { inboxId?: number; status?: string; whatsappNumberId?: string }) {
    const response = await this.client.get('/conversations', { params });
    return response.data;
  }

  async getConversation(id: number) {
    const response = await this.client.get(`/conversations/${id}`);
    return response.data;
  }

  async getMessages(conversationId: number) {
    const response = await this.client.get(`/conversations/${conversationId}/messages`);
    return response.data;
  }

  async sendMessage(conversationId: number, content: string) {
    const response = await this.client.post(`/conversations/${conversationId}/send`, { content });
    return response.data;
  }

  async transferConversation(conversationId: number, targetAgentId: number) {
    const response = await this.client.post(`/conversations/${conversationId}/transfer`, {
      targetAgentId,
    });
    return response.data;
  }

  // Supervisor
  async getSupervisorMirror(params?: { inboxId?: number; agentId?: number; whatsappNumberId?: string }) {
    const response = await this.client.get('/supervisor/mirror', { params });
    return response.data;
  }

  async getAgents() {
    const response = await this.client.get('/supervisor/agents');
    return response.data;
  }

  async getInboxes() {
    const response = await this.client.get('/supervisor/inboxes');
    return response.data;
  }

  // Logs
  async getLogs(params?: {
    userId?: string;
    conversationId?: string;
    action?: string;
    limit?: number;
    offset?: number;
  }) {
    const response = await this.client.get('/logs', { params });
    return response.data;
  }

  // WhatsApp Numbers
  async getWhatsAppNumbers() {
    const response = await this.client.get('/whatsapp/numbers');
    return response.data;
  }

  async createWhatsAppNumber(data: {
    instanceId: string;
    token: string;
    name?: string;
    inboxId?: number;
  }) {
    const response = await this.client.post('/whatsapp/numbers', data);
    return response.data;
  }

  async updateWhatsAppNumber(id: string, data: {
    name?: string;
    token?: string;
    inboxId?: number;
  }) {
    const response = await this.client.put(`/whatsapp/numbers/${id}`, data);
    return response.data;
  }

  async deleteWhatsAppNumber(id: string) {
    const response = await this.client.delete(`/whatsapp/numbers/${id}`);
    return response.data;
  }

  async getWhatsAppNumberStatus(id: string) {
    const response = await this.client.get(`/whatsapp/numbers/${id}/status`);
    return response.data;
  }

  async refreshWhatsAppNumberQR(id: string) {
    const response = await this.client.post(`/whatsapp/numbers/${id}/refresh-qr`);
    return response.data;
  }

  async getWhatsAppNumberStats(id: string) {
    const response = await this.client.get(`/whatsapp/numbers/${id}/stats`);
    return response.data;
  }

  // Bot Flows
  async getBotFlows() {
    const response = await this.client.get('/bot/flows');
    return response.data;
  }

  async getBotFlow(id: string) {
    const response = await this.client.get(`/bot/flows/${id}`);
    return response.data;
  }

  async createBotFlow(data: {
    name: string;
    whatsappNumberId: string;
    initialMessage: string;
    menuSteps: any[];
    isActive?: boolean;
  }) {
    const response = await this.client.post('/bot/flows', data);
    return response.data;
  }

  async updateBotFlow(id: string, data: {
    name?: string;
    initialMessage?: string;
    menuSteps?: any[];
    isActive?: boolean;
  }) {
    const response = await this.client.put(`/bot/flows/${id}`, data);
    return response.data;
  }

  async deleteBotFlow(id: string) {
    const response = await this.client.delete(`/bot/flows/${id}`);
    return response.data;
  }

  async getBotSessions(params?: { botFlowId?: string; phoneNumber?: string; isActive?: boolean }) {
    const response = await this.client.get('/bot/sessions', { params });
    return response.data;
  }

  async transferBotSession(id: string) {
    const response = await this.client.post(`/bot/sessions/${id}/transfer`);
    return response.data;
  }

  // Transfer conversation (melhorado)
  async transferConversationToInbox(conversationId: number, targetInboxId: number, targetAgentId?: number) {
    const response = await this.client.post(`/conversations/${conversationId}/transfer`, {
      targetInboxId,
      targetAgentId,
    });
    return response.data;
  }
}

export const api = new ApiClient();

