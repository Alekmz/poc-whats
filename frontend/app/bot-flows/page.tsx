'use client';

import { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';
import { Bot, Plus, Edit, Trash2, Play, Pause, MessageSquare } from 'lucide-react';
import Link from 'next/link';

interface BotFlow {
  id: string;
  name: string;
  whatsappNumberId: string;
  whatsappNumber: {
    id: string;
    name: string;
    phoneNumber?: string;
  };
  isActive: boolean;
  initialMessage: string;
  menuSteps: any[];
  createdAt: string;
  updatedAt: string;
}

export default function BotFlowsPage() {
  const [flows, setFlows] = useState<BotFlow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingFlow, setEditingFlow] = useState<BotFlow | null>(null);
  const [whatsappNumbers, setWhatsappNumbers] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    whatsappNumberId: '',
    initialMessage: '',
    isActive: true,
    menuSteps: [] as any[],
  });

  useEffect(() => {
    loadFlows();
    loadWhatsAppNumbers();
  }, []);

  const loadFlows = async () => {
    try {
      setLoading(true);
      const data = await api.getBotFlows();
      setFlows(data);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erro ao carregar fluxos');
    } finally {
      setLoading(false);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingFlow) {
        await api.updateBotFlow(editingFlow.id, formData);
        toast.success('Fluxo atualizado com sucesso!');
      } else {
        await api.createBotFlow(formData);
        toast.success('Fluxo criado com sucesso!');
      }
      setShowModal(false);
      setEditingFlow(null);
      resetForm();
      loadFlows();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erro ao salvar fluxo');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja deletar este fluxo?')) return;

    try {
      await api.deleteBotFlow(id);
      toast.success('Fluxo deletado com sucesso!');
      loadFlows();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erro ao deletar fluxo');
    }
  };

  const handleToggleActive = async (flow: BotFlow) => {
    try {
      await api.updateBotFlow(flow.id, { isActive: !flow.isActive });
      toast.success(`Fluxo ${!flow.isActive ? 'ativado' : 'desativado'} com sucesso!`);
      loadFlows();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erro ao atualizar fluxo');
    }
  };

  const handleEdit = (flow: BotFlow) => {
    setEditingFlow(flow);
    setFormData({
      name: flow.name,
      whatsappNumberId: flow.whatsappNumberId,
      initialMessage: flow.initialMessage,
      isActive: flow.isActive,
      menuSteps: flow.menuSteps || [],
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      whatsappNumberId: '',
      initialMessage: '',
      isActive: true,
      menuSteps: [],
    });
    setEditingFlow(null);
  };

  const addMenuStep = () => {
    setFormData({
      ...formData,
      menuSteps: [
        ...formData.menuSteps,
        {
          key: `step${formData.menuSteps.length + 1}`,
          message: '',
          options: [],
        },
      ],
    });
  };

  const updateMenuStep = (index: number, field: string, value: any) => {
    const newSteps = [...formData.menuSteps];
    newSteps[index] = { ...newSteps[index], [field]: value };
    setFormData({ ...formData, menuSteps: newSteps });
  };

  const addOptionToStep = (stepIndex: number) => {
    const newSteps = [...formData.menuSteps];
    if (!newSteps[stepIndex].options) {
      newSteps[stepIndex].options = [];
    }
    newSteps[stepIndex].options.push({
      key: `${newSteps[stepIndex].options.length + 1}`,
      text: '',
      nextStep: '',
      action: 'next',
    });
    setFormData({ ...formData, menuSteps: newSteps });
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Fluxos de Bot (URA)</h1>
            <p className="text-gray-600 mt-1">Gerencie os fluxos de atendimento automatizado</p>
          </div>
          <button
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-5 h-5" />
            Criar Fluxo
          </button>
        </div>

        {loading ? (
          <div className="text-center py-8 text-gray-600">Carregando...</div>
        ) : flows.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <Bot className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">Nenhum fluxo de bot criado ainda</p>
            <button
              onClick={() => {
                resetForm();
                setShowModal(true);
              }}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              Criar Primeiro Fluxo
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {flows.map((flow) => (
              <div key={flow.id} className="bg-white rounded-lg shadow p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{flow.name}</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {flow.whatsappNumber.name} ({flow.whatsappNumber.phoneNumber || 'N/A'})
                    </p>
                  </div>
                  <span
                    className={`px-2 py-1 text-xs rounded-full ${
                      flow.isActive
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {flow.isActive ? 'Ativo' : 'Inativo'}
                  </span>
                </div>

                <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                  {flow.initialMessage}
                </p>

                <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
                  <MessageSquare className="w-4 h-4" />
                  <span>{flow.menuSteps?.length || 0} steps configurados</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleActive(flow)}
                    className={`flex-1 px-3 py-2 rounded text-sm ${
                      flow.isActive
                        ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        : 'bg-green-100 text-green-700 hover:bg-green-200'
                    }`}
                  >
                    {flow.isActive ? <><Pause className="w-4 h-4 inline mr-1" /> Desativar</> : <><Play className="w-4 h-4 inline mr-1" /> Ativar</>}
                  </button>
                  <button
                    onClick={() => handleEdit(flow)}
                    className="px-3 py-2 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(flow.id)}
                    className="px-3 py-2 bg-red-100 text-red-700 rounded hover:bg-red-200"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal de criação/edição */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold">
                  {editingFlow ? 'Editar Fluxo' : 'Criar Novo Fluxo'}
                </h2>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nome do Fluxo
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Ex: URA Principal"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Número WhatsApp
                  </label>
                  <select
                    required
                    value={formData.whatsappNumberId}
                    onChange={(e) => setFormData({ ...formData, whatsappNumberId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Selecione um número</option>
                    {whatsappNumbers.map((num) => (
                      <option key={num.id} value={num.id}>
                        {num.name} ({num.phoneNumber || num.instanceId})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mensagem Inicial
                  </label>
                  <textarea
                    required
                    value={formData.initialMessage}
                    onChange={(e) => setFormData({ ...formData, initialMessage: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    placeholder="Olá! Bem-vindo ao atendimento..."
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Steps do Menu
                    </label>
                    <button
                      type="button"
                      onClick={addMenuStep}
                      className="text-sm text-blue-600 hover:text-blue-700"
                    >
                      + Adicionar Step
                    </button>
                  </div>

                  {formData.menuSteps.map((step, stepIndex) => (
                    <div key={stepIndex} className="mb-4 p-4 border border-gray-200 rounded-lg">
                      <div className="mb-2">
                        <input
                          type="text"
                          value={step.key}
                          onChange={(e) => updateMenuStep(stepIndex, 'key', e.target.value)}
                          placeholder="Chave do step (ex: initial, menu1)"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        />
                      </div>
                      <div className="mb-2">
                        <textarea
                          value={step.message}
                          onChange={(e) => updateMenuStep(stepIndex, 'message', e.target.value)}
                          placeholder="Mensagem do step"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                          rows={2}
                        />
                      </div>
                      <div className="mb-2">
                        <button
                          type="button"
                          onClick={() => addOptionToStep(stepIndex)}
                          className="text-xs text-blue-600 hover:text-blue-700"
                        >
                          + Adicionar Opção
                        </button>
                      </div>
                      {step.options?.map((option: any, optIndex: number) => (
                        <div key={optIndex} className="ml-4 mb-2 flex gap-2">
                          <input
                            type="text"
                            value={option.key}
                            onChange={(e) => {
                              const newSteps = [...formData.menuSteps];
                              newSteps[stepIndex].options[optIndex].key = e.target.value;
                              setFormData({ ...formData, menuSteps: newSteps });
                            }}
                            placeholder="Tecla (1, 2, 3...)"
                            className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                          />
                          <input
                            type="text"
                            value={option.text}
                            onChange={(e) => {
                              const newSteps = [...formData.menuSteps];
                              newSteps[stepIndex].options[optIndex].text = e.target.value;
                              setFormData({ ...formData, menuSteps: newSteps });
                            }}
                            placeholder="Texto da opção"
                            className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                          />
                          <select
                            value={option.action || 'next'}
                            onChange={(e) => {
                              const newSteps = [...formData.menuSteps];
                              newSteps[stepIndex].options[optIndex].action = e.target.value;
                              setFormData({ ...formData, menuSteps: newSteps });
                            }}
                            className="px-2 py-1 border border-gray-300 rounded text-sm"
                          >
                            <option value="next">Próximo Step</option>
                            <option value="transfer">Transferir para Atendente</option>
                            <option value="end">Finalizar</option>
                          </select>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>

                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      className="rounded"
                    />
                    <span className="text-sm text-gray-700">Ativo</span>
                  </label>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      resetForm();
                    }}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    {editingFlow ? 'Atualizar' : 'Criar'}
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

