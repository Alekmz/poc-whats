# 🤖 Como Funciona o URA (Bot de Atendimento)

## 📋 Visão Geral

O URA (Unidade de Resposta Audível) é um sistema de bot automatizado que processa mensagens recebidas via WhatsApp e direciona os clientes através de menus interativos antes de transferir para um atendente humano.

## 🔄 Fluxo de Funcionamento

### 1. **Recepção da Mensagem**

```
Cliente envia mensagem → Z-API recebe → Webhook chama /webhook/zapi
```

Quando uma mensagem chega:
1. A Z-API envia um webhook para o backend
2. O sistema identifica o número WhatsApp que recebeu a mensagem
3. **Verifica se há um bot ativo** para aquele número

### 2. **Processamento pelo Bot**

Se houver um bot ativo:

```
Mensagem recebida → Bot processa → Responde automaticamente OU Transfere para Chatwoot
```

O bot:
- Busca ou cria uma **sessão ativa** para o telefone do cliente
- Verifica em qual **step** (etapa) o cliente está no fluxo
- Processa a mensagem do cliente
- Responde automaticamente ou transfere para atendente

### 3. **Estrutura de um Fluxo de Bot**

Um fluxo de bot é composto por:

#### **Mensagem Inicial**
Mensagem que o cliente recebe quando inicia a conversa.

#### **Menu Steps (Etapas do Menu)**
Cada step contém:
- **key**: Identificador único (ex: "initial", "menu1", "suporte")
- **message**: Mensagem a ser enviada ao cliente
- **options**: Opções que o cliente pode escolher
  - **key**: Tecla/número (ex: "1", "2", "3")
  - **text**: Texto da opção
  - **action**: Ação a executar (`transfer`, `end`, `next`)
  - **nextStep**: Próximo step (se action for `next`)

## 📝 Exemplo Prático

### Exemplo de Configuração de Fluxo

```json
{
  "name": "URA Principal",
  "initialMessage": "Olá! Bem-vindo ao atendimento. Como posso ajudar?",
  "menuSteps": [
    {
      "key": "initial",
      "message": "Escolha uma opção:\n\n1 - Suporte Técnico\n2 - Vendas\n3 - Financeiro\n4 - Falar com Atendente",
      "options": [
        {
          "key": "1",
          "text": "Suporte Técnico",
          "action": "next",
          "nextStep": "suporte"
        },
        {
          "key": "2",
          "text": "Vendas",
          "action": "next",
          "nextStep": "vendas"
        },
        {
          "key": "3",
          "text": "Financeiro",
          "action": "next",
          "nextStep": "financeiro"
        },
        {
          "key": "4",
          "text": "Falar com Atendente",
          "action": "transfer"
        }
      ]
    },
    {
      "key": "suporte",
      "message": "Você está no setor de Suporte Técnico.\n\n1 - Problema com produto\n2 - Instalação\n3 - Voltar ao menu principal\n4 - Falar com atendente",
      "options": [
        {
          "key": "1",
          "text": "Problema com produto",
          "action": "transfer"
        },
        {
          "key": "2",
          "text": "Instalação",
          "action": "transfer"
        },
        {
          "key": "3",
          "text": "Voltar",
          "action": "next",
          "nextStep": "initial"
        },
        {
          "key": "4",
          "text": "Falar com atendente",
          "action": "transfer"
        }
      ]
    }
  ]
}
```

### Exemplo de Conversa

```
Cliente: Oi
Bot: Olá! Bem-vindo ao atendimento. Como posso ajudar?

Escolha uma opção:

1 - Suporte Técnico
2 - Vendas
3 - Financeiro
4 - Falar com Atendente

Cliente: 1
Bot: Você está no setor de Suporte Técnico.

1 - Problema com produto
2 - Instalação
3 - Voltar ao menu principal
4 - Falar com atendente

Cliente: 4
[Bot transfere para atendente humano no Chatwoot]
```

## 🔧 Tipos de Ações

### 1. **`next`** - Ir para próximo step
- O cliente escolhe uma opção
- O bot avança para o próximo step definido em `nextStep`
- A sessão continua ativa

### 2. **`transfer`** - Transferir para atendente
- O cliente escolhe transferir
- O bot:
  - Cria/encontra conversa no Chatwoot
  - Desativa a sessão do bot
  - Envia mensagem de transferência
  - A partir daí, o atendente humano responde

### 3. **`end`** - Finalizar conversa
- O bot envia mensagem de despedida
- A sessão é desativada
- Não transfere para atendente

## 💾 Sessões do Bot

O sistema mantém **sessões ativas** para cada cliente:

- **phoneNumber**: Telefone do cliente
- **botFlowId**: ID do fluxo de bot
- **currentStep**: Step atual no fluxo
- **context**: Dados coletados (pode ser usado para armazenar informações)
- **isActive**: Se a sessão está ativa
- **conversationId**: ID da conversa no Chatwoot (quando transferido)

### Comportamento das Sessões

- **Nova mensagem**: Se não houver sessão ativa, cria uma nova começando no step "initial"
- **Mensagem durante sessão**: Processa baseado no `currentStep` da sessão
- **Opção inválida**: Reenvia o menu atual
- **Transferência**: Desativa a sessão e cria conversa no Chatwoot

## 🎯 Como Configurar um URA

### 1. Acesse a Página de Bot Flows

```
http://localhost:3000/bot-flows
```

### 2. Clique em "Criar Fluxo"

### 3. Preencha os Dados

- **Nome**: Nome descritivo (ex: "URA Principal")
- **Número WhatsApp**: Selecione o número que usará o bot
- **Mensagem Inicial**: Primeira mensagem que o cliente recebe
- **Ativo**: Marque para ativar o bot

### 4. Configure os Steps

Para cada step:
- **Chave do Step**: Identificador único (ex: "initial", "menu1")
- **Mensagem**: Texto a ser enviado
- **Opções**: Adicione opções com:
  - Tecla (1, 2, 3...)
  - Texto da opção
  - Ação (Próximo Step, Transferir, Finalizar)
  - Próximo Step (se escolher "Próximo Step")

### 5. Salve e Ative

Após salvar, o bot estará ativo e começará a processar mensagens.

## 🔍 Processamento de Mensagens

### Lógica de Reconhecimento

O bot reconhece opções de várias formas:

1. **Número exato**: "1", "2", "3"
2. **Texto parcial**: Se o cliente digitar "suporte", reconhece a opção com "Suporte" no texto
3. **Case insensitive**: Não diferencia maiúsculas/minúsculas

### Exemplo de Reconhecimento

```
Opção configurada: key="1", text="Suporte Técnico"

Cliente pode digitar:
- "1" ✅
- "suporte" ✅
- "SUPORTE" ✅
- "Suporte Técnico" ✅
- "1 - Suporte Técnico" ✅
```

## 🔄 Integração com Chatwoot

Quando o bot transfere para atendente:

1. **Cria/Encontra conversa** no Chatwoot
2. **Envia mensagem automática** informando que foi transferido do bot
3. **Desativa sessão do bot**
4. **A partir daí**: Atendente humano responde normalmente

A mensagem de transferência inclui:
- Informação de que veio do bot
- Step em que o cliente estava quando transferiu

## ⚙️ Configurações Avançadas

### Múltiplos Bots

Você pode ter:
- **Diferentes bots** para diferentes números WhatsApp
- **Apenas um bot ativo** por número WhatsApp
- **Bots inativos** que não processam mensagens

### Desativar Bot

Para desativar temporariamente:
1. Acesse `/bot-flows`
2. Clique no botão de **Desativar** no card do bot
3. O bot para de processar novas mensagens
4. Mensagens vão direto para o Chatwoot

### Editar Bot

Você pode editar um bot a qualquer momento:
- Mudar mensagens
- Adicionar/remover steps
- Modificar opções
- As mudanças são aplicadas imediatamente

## 📊 Monitoramento

### Ver Sessões Ativas

Você pode ver sessões ativas através da API:

```
GET /api/bot/sessions?isActive=true
```

### Transferir Sessão Manualmente

Se necessário, você pode transferir uma sessão manualmente:

```
POST /api/bot/sessions/:id/transfer
```

## 🐛 Troubleshooting

### Bot não responde

1. Verifique se o bot está **ativo** (`isActive: true`)
2. Verifique se o **número WhatsApp** está correto
3. Verifique os **logs do backend** para erros

### Cliente fica preso em um step

1. Verifique se o step tem opções configuradas
2. Verifique se as opções têm `action` e `nextStep` corretos
3. O cliente pode digitar "voltar" se você configurar essa opção

### Transferência não funciona

1. Verifique se o número WhatsApp tem `inboxId` configurado
2. Verifique se o Chatwoot está acessível
3. Verifique os logs do backend

## 📚 Exemplos de Uso

### URA Simples (2 opções)

```json
{
  "key": "initial",
  "message": "Olá! Escolha:\n1 - Suporte\n2 - Vendas",
  "options": [
    { "key": "1", "text": "Suporte", "action": "transfer" },
    { "key": "2", "text": "Vendas", "action": "transfer" }
  ]
}
```

### URA com Múltiplos Níveis

```json
{
  "key": "initial",
  "message": "Menu Principal:\n1 - Produtos\n2 - Suporte\n3 - Sair",
  "options": [
    { "key": "1", "text": "Produtos", "action": "next", "nextStep": "produtos" },
    { "key": "2", "text": "Suporte", "action": "next", "nextStep": "suporte" },
    { "key": "3", "text": "Sair", "action": "end" }
  ]
}
```

### URA com Coleta de Informações

Você pode usar o campo `context` da sessão para armazenar informações coletadas durante o fluxo (funcionalidade futura).

## 🎉 Pronto!

Agora você entende como funciona o URA. Crie seu primeiro fluxo e teste com seu número WhatsApp!

