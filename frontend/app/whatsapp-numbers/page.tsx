'use client';

import { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';
import { Smartphone, Plus, RefreshCw, Trash2, QrCode, Wifi, WifiOff, MessageSquare, BarChart3, Bot, Eye } from 'lucide-react';
import Link from 'next/link';

interface WhatsAppNumber {
  id: string;
  instanceId: string;
  token: string;
  phoneNumber?: string;
  name?: string;
  isConnected: boolean;
  lastSeen?: string;
  qrCode?: string;
  inboxId?: number;
  createdAt: string;
  updatedAt: string;
}

export default function WhatsAppNumbersPage() {
  const [numbers, setNumbers] = useState<WhatsAppNumber[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    instanceId: '',
    token: '',
    name: '',
    inboxId: '',
  });
  const [refreshingQR, setRefreshingQR] = useState<string | null>(null);
  const [checkingStatus, setCheckingStatus] = useState<string | null>(null);
  const [qrCodeModal, setQrCodeModal] = useState<{ id: string; qrCode: string; name: string } | null>(null);
  const [statsByNumber, setStatsByNumber] = useState<{ [key: string]: any }>({});
  const [loadingStats, setLoadingStats] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    loadNumbers();
  }, []);

  const loadNumbers = async () => {
    try {
      setLoading(true);
      const data = await api.getWhatsAppNumbers();
      setNumbers(data);
      
      // Carregar estatísticas de cada número
      data.forEach((number: WhatsAppNumber) => {
        loadNumberStats(number.id);
      });
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erro ao carregar números');
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createWhatsAppNumber({
        instanceId: formData.instanceId,
        token: formData.token,
        name: formData.name || undefined,
        inboxId: formData.inboxId ? parseInt(formData.inboxId) : undefined,
      });
      toast.success('Número cadastrado com sucesso!');
      setShowModal(false);
      setFormData({ instanceId: '', token: '', name: '', inboxId: '' });
      loadNumbers();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erro ao cadastrar número');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja remover este número?')) return;

    try {
      await api.deleteWhatsAppNumber(id);
      toast.success('Número removido com sucesso!');
      loadNumbers();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erro ao remover número');
    }
  };

  const handleRefreshQR = async (id: string) => {
    try {
      setRefreshingQR(id);
      const data = await api.refreshWhatsAppNumberQR(id);
      
      console.log('QR Code response data:', data);
      
      // Extrair QR Code da resposta em diferentes formatos
      const qrCode = 
        data.qrCode || 
        data.qrCodeData?.qrCode || 
        data.qrCodeData?.base64 || 
        data.qrCodeData?.qr ||
        data.qrCodeData?.qr_code ||
        data.qrCodeData?.data?.qrCode ||
        data.qrCodeData?.data?.base64;
      
      if (qrCode) {
        // Formatar QR Code se necessário
        let formattedQR = qrCode;
        
        // Remover espaços e quebras de linha
        formattedQR = formattedQR.replace(/\s/g, '');
        
        // Se não começar com data:image ou http, adicionar prefixo base64
        if (!formattedQR.startsWith('data:image') && !formattedQR.startsWith('http')) {
          formattedQR = `data:image/png;base64,${formattedQR}`;
        }
        
        // Encontrar o número para pegar o nome
        const number = numbers.find(n => n.id === id);
        
        // Mostrar modal com QR Code
        setQrCodeModal({
          id,
          qrCode: formattedQR,
          name: number?.name || number?.instanceId || 'WhatsApp',
        });
        
        toast.success('QR Code gerado! Escaneie com o WhatsApp.');
      } else {
        console.error('QR Code não encontrado na resposta:', data);
        toast.error('QR Code não retornado pela API. Verifique os logs do backend.');
      }
      
      // Recarregar números para atualizar estado
      loadNumbers();
    } catch (error: any) {
      console.error('Erro ao gerar QR Code:', error);
      toast.error(error.response?.data?.error || 'Erro ao gerar QR Code');
    } finally {
      setRefreshingQR(null);
    }
  };

  const handleCheckStatus = async (id: string) => {
    try {
      setCheckingStatus(id);
      const data = await api.getWhatsAppNumberStatus(id);
      toast.success(`Status: ${data.isConnected ? 'Online' : 'Offline'}`);
      loadNumbers();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erro ao verificar status');
    } finally {
      setCheckingStatus(null);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Nunca';
    return new Date(dateString).toLocaleString('pt-BR');
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <Smartphone className="w-8 h-8 mr-2 text-primary-500" />
            Gerenciar Números WhatsApp
          </h1>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
          >
            <Plus className="w-5 h-5 mr-2" />
            Cadastrar Número
          </button>
        </div>

        {loading ? (
          <div className="text-center text-gray-600 py-8">Carregando...</div>
        ) : numbers.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <Smartphone className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600 mb-4">Nenhum número cadastrado</p>
            <button
              onClick={() => setShowModal(true)}
              className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
            >
              Cadastrar Primeiro Número
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {numbers.map((number) => (
              <div key={number.id} className="bg-white rounded-lg shadow p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {number.name || number.instanceId}
                    </h3>
                    <p className="text-sm text-gray-500">{number.instanceId}</p>
                    {number.phoneNumber && (
                      <p className="text-sm text-gray-700 mt-1">{number.phoneNumber}</p>
                    )}
                  </div>
                  <div className="flex items-center">
                    {number.isConnected ? (
                      <Wifi className="w-5 h-5 text-green-500" />
                    ) : (
                      <WifiOff className="w-5 h-5 text-red-500" />
                    )}
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Status:</span>
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        number.isConnected
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {number.isConnected ? 'Online' : 'Offline'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Última verificação:</span>
                    <span className="text-gray-900">{formatDate(number.lastSeen)}</span>
                  </div>
                  {number.inboxId && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Inbox ID:</span>
                      <span className="text-gray-900">{number.inboxId}</span>
                    </div>
                  )}
                  
                  {/* Métricas */}
                  {statsByNumber[number.id] && (
                    <div className="pt-3 mt-3 border-t border-gray-200">
                      <div className="flex items-center gap-2 mb-2">
                        <BarChart3 className="w-4 h-4 text-gray-500" />
                        <span className="text-xs font-semibold text-gray-700">Métricas</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-gray-600">Conversas:</span>
                          <span className="ml-1 font-semibold text-gray-900">
                            {statsByNumber[number.id].totalConversations || 0}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600">Abertas:</span>
                          <span className="ml-1 font-semibold text-blue-600">
                            {statsByNumber[number.id].openConversations || 0}
                          </span>
                        </div>
                        {statsByNumber[number.id].messages && (
                          <>
                            <div>
                              <span className="text-gray-600">Mensagens:</span>
                              <span className="ml-1 font-semibold text-gray-900">
                                {statsByNumber[number.id].messages.total || 0}
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-600">Resolvidas:</span>
                              <span className="ml-1 font-semibold text-green-600">
                                {statsByNumber[number.id].resolvedConversations || 0}
                              </span>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {number.qrCode && !number.isConnected && (
                  <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-600 mb-2">QR Code disponível:</p>
                    <button
                      onClick={() => {
                        const formattedQR = number.qrCode!.startsWith('data:image') || number.qrCode!.startsWith('http')
                          ? number.qrCode!
                          : `data:image/png;base64,${number.qrCode}`;
                        setQrCodeModal({
                          id: number.id,
                          qrCode: formattedQR,
                          name: number.name || number.instanceId || 'WhatsApp',
                        });
                      }}
                      className="w-full px-3 py-2 text-sm bg-primary-100 text-primary-700 rounded-md hover:bg-primary-200 flex items-center justify-center"
                    >
                      <QrCode className="w-4 h-4 mr-2" />
                      Ver QR Code
                    </button>
                  </div>
                )}

                <div className="space-y-2">
                  {/* Ações rápidas */}
                  <div className="grid grid-cols-2 gap-2">
                    <Link
                      href={`/dashboard?whatsappNumberId=${number.id}`}
                      className="px-3 py-2 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 flex items-center justify-center gap-1"
                    >
                      <MessageSquare className="w-4 h-4" />
                      Conversas
                    </Link>
                    <Link
                      href="/bot-flows"
                      className="px-3 py-2 text-sm bg-purple-100 text-purple-700 rounded-md hover:bg-purple-200 flex items-center justify-center gap-1"
                    >
                      <Bot className="w-4 h-4" />
                      Bot/URA
                    </Link>
                  </div>
                  
                  {/* Ações de gerenciamento */}
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => handleCheckStatus(number.id)}
                      disabled={checkingStatus === number.id}
                      className="flex-1 px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 disabled:opacity-50"
                    >
                      {checkingStatus === number.id ? 'Verificando...' : 'Status'}
                    </button>
                    <button
                      onClick={() => handleRefreshQR(number.id)}
                      disabled={refreshingQR === number.id}
                      className="px-3 py-2 text-sm bg-yellow-100 text-yellow-700 rounded-md hover:bg-yellow-200 disabled:opacity-50 flex items-center justify-center"
                      title="Gerar QR Code"
                    >
                      <QrCode className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(number.id)}
                      className="px-3 py-2 text-sm bg-red-100 text-red-700 rounded-md hover:bg-red-200"
                      title="Deletar número"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal de QR Code */}
        {qrCodeModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">QR Code - {qrCodeModal.name}</h2>
                <button
                  onClick={() => setQrCodeModal(null)}
                  className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
                >
                  ×
                </button>
              </div>
              <div className="flex flex-col items-center">
                <div className="p-4 bg-white border-2 border-gray-300 rounded-lg mb-4 flex items-center justify-center min-h-[256px]">
                  <img
                    src={qrCodeModal.qrCode}
                    alt="QR Code"
                    className="max-w-full max-h-64 object-contain"
                    onError={(e) => {
                      console.error('Erro ao carregar QR Code:', qrCodeModal.qrCode.substring(0, 100));
                      const target = e.currentTarget;
                      target.style.display = 'none';
                      const parent = target.parentElement;
                      if (parent) {
                        parent.innerHTML = `
                          <div class="text-center text-red-600">
                            <p class="font-semibold mb-2">Erro ao carregar QR Code</p>
                            <p class="text-sm text-gray-600">O formato do QR Code pode estar incorreto</p>
                            <p class="text-xs text-gray-500 mt-2">Verifique os logs do backend</p>
                          </div>
                        `;
                      }
                    }}
                    onLoad={() => {
                      console.log('QR Code carregado com sucesso');
                    }}
                  />
                </div>
                <p className="text-sm text-gray-600 text-center mb-4">
                  Escaneie este QR Code com o WhatsApp para conectar
                </p>
                <div className="flex space-x-2 w-full">
                  <button
                    onClick={() => {
                      setQrCodeModal(null);
                      loadNumbers();
                    }}
                    className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                  >
                    Fechar
                  </button>
                  <button
                    onClick={() => handleRefreshQR(qrCodeModal.id)}
                    disabled={refreshingQR === qrCodeModal.id}
                    className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50"
                  >
                    {refreshingQR === qrCodeModal.id ? 'Gerando...' : 'Gerar Novo'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal de criação */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <h2 className="text-xl font-bold mb-4">Cadastrar Novo Número</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nome (opcional)
                  </label>
                  <input
                    type="text"
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ex: WhatsApp Vendas"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Instance ID *
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    value={formData.instanceId}
                    onChange={(e) => setFormData({ ...formData, instanceId: e.target.value })}
                    placeholder="Ex: 3C7E8F9A"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Token *
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    value={formData.token}
                    onChange={(e) => setFormData({ ...formData, token: e.target.value })}
                    placeholder="Token da Z-API"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Inbox ID (opcional)
                  </label>
                  <input
                    type="number"
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    value={formData.inboxId}
                    onChange={(e) => setFormData({ ...formData, inboxId: e.target.value })}
                    placeholder="ID do inbox do Chatwoot"
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
                  >
                    Cadastrar
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

