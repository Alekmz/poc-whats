'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Layout from '@/components/Layout';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';
import { Send, ArrowLeft, User } from 'lucide-react';
import Link from 'next/link';

export default function ConversationPage() {
  const params = useParams();
  const router = useRouter();
  const conversationId = parseInt(params.id as string);

  const [conversation, setConversation] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [messageContent, setMessageContent] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const isUserScrollingRef = useRef(false);
  const shouldAutoScrollRef = useRef(true);

  useEffect(() => {
    if (conversationId) {
      loadConversation();
      loadMessages();
      
      // Obter token para autenticação SSE
      const getToken = () => {
        if (typeof document !== 'undefined') {
          const cookies = document.cookie.split(';');
          const tokenCookie = cookies.find(c => c.trim().startsWith('token='));
          return tokenCookie ? tokenCookie.split('=')[1] : null;
        }
        return null;
      };

      const token = getToken();
      if (!token) {
        console.warn('⚠️ Token não encontrado, SSE não será conectado');
        return;
      }

      // Conectar ao SSE para receber mensagens em tempo real
      const eventSource = new EventSource(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/events?conversationId=${conversationId}&token=${token}`
      );

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.type === 'new_message') {
            // Adicionar nova mensagem à lista
            setMessages((prev) => {
              // Verificar se a mensagem já existe (evitar duplicatas)
              const exists = prev.some((msg: any) => msg.id === data.data.message.id);
              if (exists) {
                return prev;
              }
              const newMessages = [...prev, data.data.message];
              
              // Scroll automático para a última mensagem após atualizar (forçar)
              setTimeout(() => scrollToBottom(true, true), 100);
              
              return newMessages;
            });
            
            // Mostrar notificação se a conversa não estiver em foco
            if (document.hidden) {
              toast.success('Nova mensagem recebida!');
            }
          } else if (data.type === 'conversation_update') {
            // Atualizar dados da conversa se necessário
            if (data.data.conversation) {
              setConversation(data.data.conversation);
            }
          } else if (data.type === 'connected') {
            console.log('✅ Conectado ao stream de eventos em tempo real');
          }
        } catch (error) {
          console.error('Erro ao processar evento SSE:', error);
        }
      };

      eventSource.onerror = (error) => {
        console.error('Erro na conexão SSE:', error);
        // Tentar reconectar após 3 segundos
        setTimeout(() => {
          eventSource.close();
          // O useEffect vai reconectar automaticamente
        }, 3000);
      };

      // Limpar conexão quando componente desmontar ou conversationId mudar
      return () => {
        eventSource.close();
      };
    }
  }, [conversationId]);

  // Efeito para manter scroll no final quando mensagens mudarem
  // Mas só se não estiver carregando (para evitar scroll durante loadMessages)
  useEffect(() => {
    if (!loading && messages.length > 0 && shouldAutoScrollRef.current) {
      // Usar um pequeno delay para garantir que o DOM foi atualizado
      const timeoutId = setTimeout(() => {
        scrollToBottom(false, true);
      }, 50);
      return () => clearTimeout(timeoutId);
    }
  }, [messages.length, loading]); // Usar messages.length ao invés de messages para evitar re-renders desnecessários

  const loadConversation = async () => {
    try {
      const data = await api.getConversation(conversationId);
      setConversation(data);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erro ao carregar conversa');
    }
  };

  // Função para fazer scroll para o final
  const scrollToBottom = (smooth = false, force = false) => {
    // Só fazer scroll automático se o usuário não estiver fazendo scroll manual
    if (!force && !shouldAutoScrollRef.current) {
      return;
    }
    
    setTimeout(() => {
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto', block: 'end' });
      } else if (messagesContainerRef.current) {
        messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
      }
      shouldAutoScrollRef.current = true;
    }, 100);
  };

  const loadMessages = async () => {
    try {
      setLoading(true);
      const data = await api.getMessages(conversationId);
      // Garantir que data é um array
      let loadedMessages: any[] = [];
      if (Array.isArray(data)) {
        loadedMessages = data;
      } else if (data && Array.isArray(data.payload)) {
        loadedMessages = data.payload;
      } else if (data && Array.isArray(data.messages)) {
        loadedMessages = data.messages;
      } else {
        console.warn('Resposta de mensagens não é um array:', data);
        loadedMessages = [];
      }
      
      setMessages(loadedMessages);
      
      // Scroll para o final após carregar mensagens (usar requestAnimationFrame para garantir que o DOM foi atualizado)
      requestAnimationFrame(() => {
        scrollToBottom(false, true);
      });
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erro ao carregar mensagens');
      setMessages([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageContent.trim()) return;

    try {
      setSending(true);
      const sentMessage = await api.sendMessage(conversationId, messageContent);
      setMessageContent('');
      
      // Adicionar mensagem enviada à lista imediatamente (otimista)
      if (sentMessage) {
        setMessages((prev) => {
          // Verificar se a mensagem já existe (evitar duplicatas)
          const exists = prev.some((msg: any) => msg.id === sentMessage.id);
          if (exists) {
            return prev;
          }
          const newMessages = [...prev, sentMessage];
          // Scroll para o final após adicionar mensagem (forçar)
          setTimeout(() => scrollToBottom(true, true), 50);
          return newMessages;
        });
      }
      
      toast.success('Mensagem enviada!');
      
      // Não recarregar mensagens - a mensagem otimista já foi adicionada
      // O SSE vai atualizar quando a mensagem for confirmada pelo backend
    } catch (error: any) {
      console.error('Erro ao enviar mensagem:', error);
      toast.error(error.response?.data?.error || 'Erro ao enviar mensagem');
      // Recarregar mensagens mesmo em caso de erro para garantir estado correto
      loadMessages();
    } finally {
      setSending(false);
    }
  };

  const formatDate = (dateString: string | number) => {
    if (!dateString) return 'Data não disponível';
    
    // Se for timestamp Unix (em segundos), converter para milissegundos
    let date: Date;
    if (typeof dateString === 'number') {
      // Se for menor que um timestamp válido (antes de 2000), pode ser em segundos
      date = dateString < 946684800000 ? new Date(dateString * 1000) : new Date(dateString);
    } else {
      date = new Date(dateString);
    }
    
    // Verificar se a data é válida
    if (isNaN(date.getTime())) {
      return 'Data inválida';
    }
    
    return date.toLocaleString('pt-BR');
  };

  return (
    <Layout>
      <div className="flex flex-col h-[calc(100vh-4rem)]">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link
                href="/dashboard"
                className="text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  {conversation?.meta?.sender?.name || 'Conversa'}
                </h1>
                <p className="text-sm text-gray-600">
                  {conversation?.meta?.sender?.phone_number || 'Sem telefone'}
                </p>
              </div>
            </div>
            <div>
              <span
                className={`px-3 py-1 text-sm rounded-full ${
                  conversation?.status === 'open'
                    ? 'bg-blue-100 text-blue-800'
                    : conversation?.status === 'resolved'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-yellow-100 text-yellow-800'
                }`}
              >
                {conversation?.status || 'unknown'}
              </span>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div 
          ref={messagesContainerRef} 
          className="flex-1 overflow-y-auto bg-gray-100 p-4 space-y-2"
          onScroll={(e) => {
            const container = e.currentTarget;
            const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100;
            shouldAutoScrollRef.current = isNearBottom;
          }}
        >
          {loading ? (
            <div className="text-center text-gray-600 py-8">Carregando mensagens...</div>
          ) : messages.length === 0 ? (
            <div className="text-center text-gray-600 py-8">Nenhuma mensagem ainda</div>
          ) : (
            messages.map((message: any) => {
              // Detectar se é mensagem recebida (incoming) ou enviada (outgoing)
              // No Chatwoot:
              // - message_type: 0 = incoming (recebida), 1 = outgoing (enviada)  
              // - sender.type: 'contact' = incoming (recebida), 'user' = outgoing (enviada)
              
              // Log completo da mensagem para debug (apenas primeira vez)
              if (message.id === messages[0]?.id) {
                console.log('🔍 Primeira mensagem completa (exemplo):', JSON.stringify(message, null, 2));
              }
              
              // Definir senderType para uso no debug
              const senderType = message.sender?.type ? String(message.sender.type).toLowerCase() : '';
              
              // Lógica: verificar message_type primeiro (mais confiável)
              // message_type: 0 ou 'incoming' = recebida (incoming) → esquerda
              // message_type: 1 ou 'outgoing' = enviada (outgoing) → direita
              let isOutgoing = false;
              
              // Verificar message_type primeiro (número)
              if (message.message_type === 0) {
                isOutgoing = false; // incoming
                console.log(`✅ Msg ${message.id}: message_type=0 → INCOMING (esquerda)`);
              } else if (message.message_type === 1) {
                // PROBLEMA: Mensagens antigas foram criadas incorretamente com message_type=1
                // Vamos usar heurísticas para identificar mensagens recebidas:
                // 1. Se tem source_id null E conteúdo parece ser recebido (tem emoji, link de imagem, etc)
                // 2. Se o conteúdo tem padrões típicos de mensagens recebidas do WhatsApp
                const content = message.content || '';
                const hasWhatsAppLink = /whatsapp\.net|whatsapp\.com/.test(content);
                const hasEmoji = /[\u{1F300}-\u{1F9FF}]/u.test(content);
                const hasImageLink = /\.(jpg|jpeg|png|gif|webp)/i.test(content);
                
                // Se tem link do WhatsApp ou parece ser mídia recebida, provavelmente é incoming
                if (hasWhatsAppLink || (hasImageLink && hasEmoji)) {
                  isOutgoing = false; // incoming (recebida)
                  console.log(`🔧 Msg ${message.id}: message_type=1 mas parece recebida (tem link WhatsApp/mídia) → INCOMING (esquerda)`);
                } else {
                  isOutgoing = true; // outgoing
                  console.log(`✅ Msg ${message.id}: message_type=1 → OUTGOING (direita)`);
                }
              } else {
                // Verificar message_type como string
                const msgTypeStr = String(message.message_type || '').toLowerCase();
                if (msgTypeStr === 'incoming' || msgTypeStr === '0') {
                  isOutgoing = false;
                  console.log(`✅ Msg ${message.id}: message_type="${message.message_type}" → INCOMING (esquerda)`);
                } else if (msgTypeStr === 'outgoing' || msgTypeStr === '1') {
                  isOutgoing = true;
                  console.log(`✅ Msg ${message.id}: message_type="${message.message_type}" → OUTGOING (direita)`);
                } else {
                  // Se message_type não está claro, usar sender.type como fallback
                  if (senderType === 'user') {
                    isOutgoing = true;
                    console.log(`⚠️ Msg ${message.id}: Fallback sender.type="user" → OUTGOING (direita)`);
                  } else {
                    isOutgoing = false;
                    console.log(`⚠️ Msg ${message.id}: Fallback sender.type="${senderType}" → INCOMING (esquerda)`);
                  }
                }
              }
              
              const isIncoming = !isOutgoing;
              
              console.log(`🎯 Msg ${message.id} FINAL: ${isIncoming ? '⬅️ INCOMING (esquerda)' : '➡️ OUTGOING (direita)'} | message_type=${message.message_type} (${typeof message.message_type}) | sender.type=${message.sender?.type}`);
              
              return (
                <div
                  key={message.id}
                  className={`flex ${isIncoming ? 'justify-start' : 'justify-end'} mb-1 px-2`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-3 py-2 rounded-lg shadow-sm ${
                      isIncoming
                        ? 'bg-white text-gray-900 rounded-tl-none'
                        : 'bg-[#DCF8C6] text-gray-900 rounded-tr-none'
                    }`}
                    style={{
                      maxWidth: '70%',
                      wordWrap: 'break-word',
                    }}
                    title={`Debug: message_type=${message.message_type}, sender.type=${message.sender?.type}, detected=${isIncoming ? 'incoming' : 'outgoing'}`}
                  >
                  {/* Exibir anexos se houver */}
                  {message.attachments && message.attachments.length > 0 ? (
                    <div className="space-y-2">
                      {message.attachments.map((attachment: any, idx: number) => (
                        <div key={idx}>
                          {attachment.file_type === 'image' || attachment.file_type === 'sticker' ? (
                            <img
                              src={attachment.data_url || attachment.file_url || attachment.thumb_url}
                              alt="Anexo"
                              className="max-w-full h-auto rounded"
                              onError={(e) => {
                                // Se a imagem falhar ao carregar, tentar a URL original
                                const target = e.target as HTMLImageElement;
                                if (attachment.file_url && target.src !== attachment.file_url) {
                                  target.src = attachment.file_url;
                                }
                              }}
                            />
                          ) : attachment.file_type === 'video' ? (
                            <video
                              src={attachment.data_url || attachment.file_url}
                              controls
                              className="max-w-full h-auto rounded"
                            />
                          ) : attachment.file_type === 'audio' ? (
                            <audio
                              src={attachment.data_url || attachment.file_url}
                              controls
                              className="w-full"
                            />
                          ) : (
                            <a
                              href={attachment.data_url || attachment.file_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-500 underline"
                            >
                              📎 {attachment.file_name || 'Anexo'}
                            </a>
                          )}
                        </div>
                      ))}
                      {message.content && (
                        <p className="text-sm mt-2 whitespace-pre-wrap break-words">{message.content}</p>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {/* Detectar e renderizar URLs de imagens no conteúdo APENAS se for sticker/mídia explícita */}
                      {(() => {
                        const content = message.content || '';
                        
                        // Verificar se há indicadores EXPLÍCITOS de que é uma mídia
                        // Deve começar com [Sticker], [Imagem], etc. ou ter 📎 no início
                        const isExplicitMediaMessage = /^\[Sticker\]|^\[Imagem\]|^\[Vídeo\]|^\[Áudio\]|^\[Documento\]|^📎/i.test(content.trim());
                        
                        if (isExplicitMediaMessage) {
                          // Regex para detectar URLs de imagens (webp, jpg, jpeg, png, gif)
                          const imageUrlRegex = /(https?:\/\/[^\s]+\.(webp|jpg|jpeg|png|gif)(\?[^\s]*)?)/gi;
                          const imageUrls = content.match(imageUrlRegex);
                          
                          if (imageUrls && imageUrls.length > 0) {
                            // Remover URLs de imagens do texto
                            let textContent = content;
                            imageUrls.forEach((url: string) => {
                              textContent = textContent.replace(url, '').trim();
                            });
                            
                            // Remover prefixos como [Sticker] e 📎 se sobrar apenas a URL
                            textContent = textContent.replace(/^\[Sticker\]\s*📎?\s*/i, '').trim();
                            textContent = textContent.replace(/^\[Imagem\]\s*📎?\s*/i, '').trim();
                            textContent = textContent.replace(/^\[Vídeo\]\s*📎?\s*/i, '').trim();
                            textContent = textContent.replace(/^\[Áudio\]\s*📎?\s*/i, '').trim();
                            textContent = textContent.replace(/^\[Documento\]\s*📎?\s*/i, '').trim();
                            textContent = textContent.replace(/^📎\s*/, '').trim();
                            
                            return (
                              <>
                                {imageUrls.map((url: string, idx: number) => (
                                  <img
                                    key={idx}
                                    src={url}
                                    alt="Mídia"
                                    className="max-w-full h-auto rounded"
                                    style={{ maxHeight: '300px' }}
                                    onError={(e) => {
                                      // Se falhar, mostrar link
                                      const target = e.target as HTMLImageElement;
                                      target.style.display = 'none';
                                      const link = document.createElement('a');
                                      link.href = url;
                                      link.target = '_blank';
                                      link.rel = 'noopener noreferrer';
                                      link.textContent = '📎 Ver imagem';
                                      link.className = 'text-blue-500 underline';
                                      target.parentNode?.appendChild(link);
                                    }}
                                  />
                                ))}
                                {textContent && 
                                 textContent !== '[Sticker]' && 
                                 textContent !== '[Imagem]' &&
                                 textContent !== '[Vídeo]' &&
                                 textContent !== '[Áudio]' &&
                                 textContent !== '[Documento]' && (
                                  <p className="text-sm">{textContent}</p>
                                )}
                              </>
                            );
                          }
                        }
                        
                        // Para mensagens de texto normais, remover URLs de imagens do texto também
                        // para evitar que apareçam como links clicáveis
                        let displayContent = content;
                        // Remover URLs de imagens do texto se não for mídia explícita
                        if (!isExplicitMediaMessage) {
                          const imageUrlRegex = /(https?:\/\/[^\s]+\.(webp|jpg|jpeg|png|gif)(\?[^\s]*)?)/gi;
                          displayContent = displayContent.replace(imageUrlRegex, '').trim();
                        }
                        
                        // Se não for mídia ou não tiver URLs de imagem, mostrar conteúdo normal
                        return <p className="text-sm whitespace-pre-wrap break-words">{displayContent || content}</p>;
                      })()}
                    </div>
                  )}
                    <div className="flex items-center justify-end gap-1 mt-1">
                      <p
                        className={`text-xs ${
                          isIncoming ? 'text-gray-500' : 'text-gray-600'
                        }`}
                      >
                        {message.created_at ? formatDate(message.created_at) : 'Data não disponível'}
                      </p>
                      {isOutgoing && (
                        <svg
                          className="w-4 h-4 text-gray-600"
                          fill="currentColor"
                          viewBox="0 0 16 15"
                        >
                          <path d="M15.854.854a.5.5 0 0 0-.708-.708L7.707 7.293 4.854 4.44a.5.5 0 1 0-.708.708l3 3a.5.5 0 0 0 .708 0l8-8Z" />
                          <path d="M10.854 0.854a.5.5 0 0 0-.708-.708L2.707 7.293l-2.147-2.146a.5.5 0 1 0-.708.708l2.5 2.5a.5.5 0 0 0 .708 0l8-8Z" />
                        </svg>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          {/* Elemento invisível no final para scroll automático */}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="bg-white border-t border-gray-200 p-4">
          <form onSubmit={handleSendMessage} className="flex space-x-2">
            <input
              type="text"
              value={messageContent}
              onChange={(e) => setMessageContent(e.target.value)}
              placeholder="Digite sua mensagem..."
              className="flex-1 border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
              disabled={sending}
            />
            <button
              type="submit"
              disabled={sending || !messageContent.trim()}
              className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
        </div>
      </div>
    </Layout>
  );
}


