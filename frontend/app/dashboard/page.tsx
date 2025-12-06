'use client';

import { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import { api } from '@/lib/api';
import { MessageSquare, Users, Clock, CheckCircle, Filter, BarChart3 } from 'lucide-react';
import toast from 'react-hot-toast';
import Link from 'next/link';

export default function DashboardPage() {
  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [whatsappNumbers, setWhatsappNumbers] = useState<any[]>([]);
  const [selectedWhatsappNumberId, setSelectedWhatsappNumberId] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [statsByNumber, setStatsByNumber] = useState<{ [key: string]: any }>({});
  const [loadingStats, setLoadingStats] = useState<{ [key: string]: boolean }>({});
  const [stats, setStats] = useState({
    total: 0,
    open: 0,
    resolved: 0,
    pending: 0,
  });

  useEffect(() => {
    loadWhatsAppNumbers();
  }, []);

  useEffect(() => {
    loadConversations();
  }, [selectedWhatsappNumberId, selectedStatus]);

  useEffect(() => {
    // Carregar estatísticas de cada número
    whatsappNumbers.forEach((number) => {
      loadNumberStats(number.id);
    });
  }, [whatsappNumbers]);

  const loadWhatsAppNumbers = async () => {
    try {
      const data = await api.getWhatsAppNumbers();
      setWhatsappNumbers(data);
    } catch (error: any) {
      console.error('Erro ao carregar números WhatsApp:', error);
    }
  };

  const loadConversations = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (selectedWhatsappNumberId) {
        params.whatsappNumberId = selectedWhatsappNumberId;
      }
      if (selectedStatus) {
        params.status = selectedStatus;
      }
      const data = await api.getConversations(params);
      setConversations(data);

      // Calcular estatísticas
      setStats({
        total: data.length,
        open: data.filter((c: any) => c.status === 'open').length,
        resolved: data.filter((c: any) => c.status === 'resolved').length,
        pending: data.filter((c: any) => c.status === 'pending').length,
      });
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erro ao carregar conversas');
    } finally {
      setLoading(false);
    }
  };

  const loadNumberStats = async (numberId: string) => {
    if (loadingStats[numberId]) return;
    
    try {
      setLoadingStats((prev) => ({ ...prev, [numberId]: true }));
      const data = await api.getWhatsAppNumberStats(numberId);
      setStatsByNumber((prev) => ({ ...prev, [numberId]: data.stats }));
    } catch (error: any) {
      console.error(`Erro ao carregar estatísticas do número ${numberId}:`, error);
    } finally {
      setLoadingStats((prev) => ({ ...prev, [numberId]: false }));
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>

        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Total</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <MessageSquare className="w-8 h-8 text-primary-500" />
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Abertas</p>
                <p className="text-2xl font-bold text-blue-600">{stats.open}</p>
              </div>
              <Clock className="w-8 h-8 text-blue-500" />
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Pendentes</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-500" />
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Resolvidas</p>
                <p className="text-2xl font-bold text-green-600">{stats.resolved}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-5 h-5 text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-900">Filtros</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {whatsappNumbers.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Número WhatsApp
                </label>
                <select
                  value={selectedWhatsappNumberId}
                  onChange={(e) => setSelectedWhatsappNumberId(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                >
                  <option value="">Todos os números</option>
                  {whatsappNumbers.map((number) => (
                    <option key={number.id} value={number.id}>
                      {number.name || number.phoneNumber || number.instanceId}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
              >
                <option value="">Todos os status</option>
                <option value="open">Abertas</option>
                <option value="pending">Pendentes</option>
                <option value="resolved">Resolvidas</option>
              </select>
            </div>
          </div>
        </div>

        {/* Métricas por Número WhatsApp */}
        {whatsappNumbers.length > 0 && (
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-gray-600" />
                <h2 className="text-xl font-semibold text-gray-900">Métricas por Número WhatsApp</h2>
              </div>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {whatsappNumbers.map((number) => {
                  const numberStats = statsByNumber[number.id];
                  return (
                    <div key={number.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold text-gray-900">
                          {number.name || number.phoneNumber || number.instanceId}
                        </h3>
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${
                            number.isConnected
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {number.isConnected ? 'Online' : 'Offline'}
                        </span>
                      </div>
                      {loadingStats[number.id] ? (
                        <div className="text-sm text-gray-500">Carregando...</div>
                      ) : numberStats ? (
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Total:</span>
                            <span className="font-semibold">{numberStats.totalConversations || 0}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Abertas:</span>
                            <span className="text-blue-600 font-semibold">{numberStats.openConversations || 0}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Pendentes:</span>
                            <span className="text-yellow-600 font-semibold">{numberStats.pendingConversations || 0}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Resolvidas:</span>
                            <span className="text-green-600 font-semibold">{numberStats.resolvedConversations || 0}</span>
                          </div>
                          {numberStats.messages && (
                            <div className="pt-2 border-t border-gray-200 mt-2">
                              <div className="flex justify-between">
                                <span className="text-gray-600">Mensagens:</span>
                                <span className="font-semibold">{numberStats.messages.total || 0}</span>
                              </div>
                              <div className="flex justify-between text-xs text-gray-500">
                                <span>Recebidas: {numberStats.messages.incoming || 0}</span>
                                <span>Enviadas: {numberStats.messages.outgoing || 0}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-sm text-gray-500">Sem dados</div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Lista de conversas */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Conversas Recentes</h2>
          </div>
          {loading ? (
            <div className="p-6 text-center text-gray-600">Carregando...</div>
          ) : conversations.length === 0 ? (
            <div className="p-6 text-center text-gray-600">Nenhuma conversa encontrada</div>
          ) : (
            <div className="divide-y divide-gray-200">
              {conversations.slice(0, 10).map((conversation: any) => (
                <Link
                  key={conversation.id}
                  href={`/conversations/${conversation.id}`}
                  className="block p-6 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">
                        {conversation.meta?.sender?.name || 'Sem nome'}
                      </p>
                      <p className="text-sm text-gray-600">
                        {conversation.meta?.sender?.phone_number || 'Sem telefone'}
                      </p>
                    </div>
                    <div className="text-right">
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
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

