'use client';

import { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';
import { Eye, Filter, ArrowRight, User, CheckCircle, XCircle, Clock } from 'lucide-react';
import Link from 'next/link';

export default function SupervisorPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [inboxId, setInboxId] = useState<number | undefined>();
  const [agentId, setAgentId] = useState<number | undefined>();
  const [whatsappNumberId, setWhatsappNumberId] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [inboxes, setInboxes] = useState<any[]>([]);
  const [agents, setAgents] = useState<any[]>([]);
  const [whatsappNumbers, setWhatsappNumbers] = useState<any[]>([]);
  const [selectedConversations, setSelectedConversations] = useState<Set<number>>(new Set());

  useEffect(() => {
    loadInboxes();
    loadAgents();
    loadWhatsAppNumbers();
  }, []);

  useEffect(() => {
    loadMirror();
  }, [inboxId, agentId, whatsappNumberId, statusFilter]);

  const loadInboxes = async () => {
    try {
      const data = await api.getInboxes();
      setInboxes(data);
    } catch (error: any) {
      toast.error('Erro ao carregar inboxes');
    }
  };

  const loadAgents = async () => {
    try {
      const data = await api.getAgents();
      setAgents(data);
    } catch (error: any) {
      toast.error('Erro ao carregar agentes');
    }
  };

  const loadWhatsAppNumbers = async () => {
    try {
      const data = await api.getWhatsAppNumbers();
      setWhatsappNumbers(data);
    } catch (error: any) {
      console.error('Erro ao carregar números WhatsApp:', error);
    }
  };

  const loadMirror = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (inboxId) params.inboxId = inboxId;
      if (agentId) params.agentId = agentId;
      if (whatsappNumberId) params.whatsappNumberId = whatsappNumberId;
      const result = await api.getSupervisorMirror(params);
      
      // Filtrar por status se especificado
      if (statusFilter && result.conversations) {
        result.conversations = result.conversations.filter(
          (c: any) => c.status === statusFilter
        );
      }
      
      setData(result);
      setSelectedConversations(new Set()); // Limpar seleção ao recarregar
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erro ao carregar modo espelho');
    } finally {
      setLoading(false);
    }
  };

  const toggleConversationSelection = (conversationId: number) => {
    const newSelection = new Set(selectedConversations);
    if (newSelection.has(conversationId)) {
      newSelection.delete(conversationId);
    } else {
      newSelection.add(conversationId);
    }
    setSelectedConversations(newSelection);
  };

  const selectAll = () => {
    if (data?.conversations) {
      setSelectedConversations(new Set(data.conversations.map((c: any) => c.id)));
    }
  };

  const deselectAll = () => {
    setSelectedConversations(new Set());
  };

  const handleBulkTransfer = async (targetInboxId: number, targetAgentId?: number) => {
    if (selectedConversations.size === 0) {
      toast.error('Selecione pelo menos uma conversa');
      return;
    }

    try {
      const promises = Array.from(selectedConversations).map((convId) =>
        api.transferConversationToInbox(convId, targetInboxId, targetAgentId)
      );
      await Promise.all(promises);
      toast.success(`${selectedConversations.size} conversa(s) transferida(s) com sucesso!`);
      setSelectedConversations(new Set());
      loadMirror();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erro ao transferir conversas');
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <Eye className="w-8 h-8 mr-2 text-primary-500" />
            Modo Espelho - Supervisor
          </h1>
        </div>

        {/* Filtros */}
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-5 h-5 text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-900">Filtros</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Número WhatsApp
              </label>
              <select
                value={whatsappNumberId}
                onChange={(e) => {
                  setWhatsappNumberId(e.target.value);
                  setInboxId(undefined);
                }}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
              >
                <option value="">Todos</option>
                {whatsappNumbers.map((number) => (
                  <option key={number.id} value={number.id}>
                    {number.name || number.phoneNumber || number.instanceId}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Inbox
              </label>
              <select
                value={inboxId || ''}
                onChange={(e) => {
                  setInboxId(e.target.value ? parseInt(e.target.value) : undefined);
                  setWhatsappNumberId('');
                }}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
              >
                <option value="">Todas</option>
                {inboxes.map((inbox) => (
                  <option key={inbox.id} value={inbox.id}>
                    {inbox.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Agente
              </label>
              <select
                value={agentId || ''}
                onChange={(e) => setAgentId(e.target.value ? parseInt(e.target.value) : undefined)}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
              >
                <option value="">Todos</option>
                {agents.map((agent) => (
                  <option key={agent.id} value={agent.id}>
                    {agent.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
              >
                <option value="">Todos</option>
                <option value="open">Abertas</option>
                <option value="pending">Pendentes</option>
                <option value="resolved">Resolvidas</option>
              </select>
            </div>
          </div>
        </div>

        {/* Métricas */}
        {data?.metrics && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <p className="text-gray-600 text-sm">Total</p>
              <p className="text-2xl font-bold text-gray-900">{data.metrics.total}</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <p className="text-gray-600 text-sm">Abertas</p>
              <p className="text-2xl font-bold text-blue-600">{data.metrics.open}</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <p className="text-gray-600 text-sm">Pendentes</p>
              <p className="text-2xl font-bold text-yellow-600">{data.metrics.pending}</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <p className="text-gray-600 text-sm">Resolvidas</p>
              <p className="text-2xl font-bold text-green-600">{data.metrics.resolved}</p>
            </div>
          </div>
        )}

        {/* Ações em massa */}
        {selectedConversations.size > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-blue-900">
                  {selectedConversations.size} conversa(s) selecionada(s)
                </span>
                <button
                  onClick={deselectAll}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Desmarcar todas
                </button>
              </div>
              <div className="flex items-center gap-2">
                <select
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value) {
                      const [inboxId, agentId] = value.split('-');
                      handleBulkTransfer(parseInt(inboxId), agentId ? parseInt(agentId) : undefined);
                    }
                  }}
                  className="border border-gray-300 rounded-md px-3 py-2 text-sm"
                  defaultValue=""
                >
                  <option value="">Transferir para...</option>
                  {inboxes.map((inbox) => (
                    <optgroup key={inbox.id} label={inbox.name}>
                      <option value={`${inbox.id}-`}>Inbox: {inbox.name}</option>
                      {agents.map((agent) => (
                        <option key={agent.id} value={`${inbox.id}-${agent.id}`}>
                          {inbox.name} → {agent.name}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Lista de conversas */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">Todas as Conversas</h2>
            {data?.conversations && data.conversations.length > 0 && (
              <div className="flex items-center gap-2">
                <button
                  onClick={selectAll}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Selecionar todas
                </button>
                {selectedConversations.size > 0 && (
                  <button
                    onClick={deselectAll}
                    className="text-sm text-gray-600 hover:text-gray-800"
                  >
                    Desmarcar todas
                  </button>
                )}
              </div>
            )}
          </div>
          {loading ? (
            <div className="p-6 text-center text-gray-600">Carregando...</div>
          ) : !data?.conversations || data.conversations.length === 0 ? (
            <div className="p-6 text-center text-gray-600">Nenhuma conversa encontrada</div>
          ) : (
            <div className="divide-y divide-gray-200">
              {data.conversations.map((conversation: any) => (
                <div
                  key={conversation.id}
                  className={`p-6 hover:bg-gray-50 ${
                    selectedConversations.has(conversation.id) ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <input
                      type="checkbox"
                      checked={selectedConversations.has(conversation.id)}
                      onChange={() => toggleConversationSelection(conversation.id)}
                      className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="font-medium text-gray-900">
                            {conversation.meta?.sender?.name || 'Sem nome'}
                          </p>
                          <p className="text-sm text-gray-600">
                            {conversation.meta?.sender?.phone_number || 'Sem telefone'}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-1 text-xs rounded-full ${
                              conversation.status === 'open'
                                ? 'bg-blue-100 text-blue-800'
                                : conversation.status === 'resolved'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}
                          >
                            {conversation.status}
                          </span>
                          <Link
                            href={`/conversations/${conversation.id}`}
                            className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 flex items-center gap-1"
                          >
                            <ArrowRight className="w-4 h-4" />
                            Abrir
                          </Link>
                        </div>
                      </div>
                      {conversation.assignee && (
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <User className="w-3 h-3" />
                          <span>Atribuído a: {conversation.assignee.name}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

