# 💰 Orçamento Otimizado - Plataforma WhatsApp
## Meta WhatsApp Business API + AWS (Versão Otimizada)

**Data:** Dezembro 2024  
**Cliente:** Plataforma Corporativa de WhatsApp  
**Números WhatsApp:** 15 números  
**Região AWS:** sa-east-1 (São Paulo)  
**Estratégia:** Otimização de custos mantendo estabilidade e performance

---

## 📋 Resumo Executivo - Comparação

| Componente | Versão Original | Versão Otimizada | Economia |
|------------|-----------------|------------------|----------|
| **Meta WhatsApp Business API** | R$ 68,00 | R$ 68,00 | - |
| **Infraestrutura AWS** | R$ 1.000,00 | **R$ 650,00** | **R$ 350,00** |
| **TOTAL MENSAL** | **R$ 1.068,00** | **R$ 718,00** | **R$ 350,00 (33%)** |

**Economia Mensal:** R$ 350,00 (33% de redução)  
**Economia Anual:** R$ 4.200,00

---

## 🎯 Estratégias de Otimização Aplicadas

### 1. ✅ RDS PostgreSQL - Redução de Tamanho
- **Antes:** db.t3.medium (2 vCPU, 4 GB RAM) - R$ 350/mês
- **Depois:** db.t3.small (1 vCPU, 2 GB RAM) - R$ 200/mês
- **Economia:** R$ 150/mês
- **Justificativa:** Para 15 números WhatsApp e carga moderada, db.t3.small é suficiente. Pode escalar depois se necessário.

### 2. ✅ NAT Gateway → VPC Endpoints
- **Antes:** NAT Gateway - R$ 37,35/mês
- **Depois:** VPC Endpoints (S3, ECR, CloudWatch) - R$ 7,00/mês
- **Economia:** R$ 30,35/mês
- **Justificativa:** VPC Endpoints eliminam necessidade de NAT Gateway para serviços AWS, mantendo segurança.

### 3. ✅ Backup RDS - Redução de Retenção
- **Antes:** 7 dias de backup - R$ 10/mês
- **Depois:** 3 dias de backup - R$ 4,50/mês
- **Economia:** R$ 5,50/mês
- **Justificativa:** 3 dias é suficiente para recuperação. Backups semanais podem ser feitos manualmente.

### 4. ✅ Storage EBS - Consolidação
- **Antes:** 3 volumes separados (90 GB total) - R$ 9/mês
- **Depois:** 1 volume consolidado (50 GB) - R$ 5/mês
- **Economia:** R$ 4/mês
- **Justificativa:** Logs podem ser enviados para CloudWatch, reduzindo necessidade de volumes EBS.

### 5. ✅ CloudWatch - Otimização de Logs
- **Antes:** 15 GB/mês de logs - R$ 7,50/mês
- **Depois:** 7 GB/mês (retenção reduzida) - R$ 3,50/mês
- **Economia:** R$ 4/mês
- **Justificativa:** Retenção de 7 dias é suficiente. Logs importantes podem ser exportados para S3.

### 6. ✅ ALB - Otimização de LCU
- **Antes:** 15 LCU/hora - R$ 87,60/mês
- **Depois:** 10 LCU/hora (otimizado) - R$ 58,40/mês
- **Economia:** R$ 29,20/mês
- **Justificativa:** Com otimização de requisições e cache, LCU pode ser reduzido.

### 7. ✅ Data Transfer - Otimização
- **Antes:** 150 GB/mês - R$ 16,80/mês
- **Depois:** 100 GB/mês (CloudFront para frontend) - R$ 10,80/mês
- **Economia:** R$ 6/mês
- **Justificativa:** CloudFront reduz transferência de dados e melhora performance.

### 8. ✅ Secrets Manager - Remover
- **Antes:** 5 secrets - R$ 2/mês
- **Depois:** Usar Systems Manager Parameter Store (gratuito) - R$ 0
- **Economia:** R$ 2/mês
- **Justificativa:** Parameter Store é gratuito para até 10.000 parâmetros.

**Total de Economias:** R$ 350,00/mês

---

## 📊 Detalhamento de Custos Otimizados

### 1. Compute - ECS Fargate

#### Backend (Node.js/Express)
- **CPU:** 0.5 vCPU
- **Memória:** 1 GB
- **Quantidade:** 2 tasks (alta disponibilidade)
- **Custo:** R$ 58,40/mês
- **Status:** ✅ Mantido (necessário para performance)

#### Frontend (Next.js)
- **CPU:** 0.25 vCPU
- **Memória:** 0.5 GB
- **Quantidade:** 2 tasks (alta disponibilidade)
- **Custo:** R$ 29,20/mês
- **Status:** ✅ Mantido (já otimizado)

#### Chatwoot
- **CPU:** 1 vCPU
- **Memória:** 2 GB
- **Quantidade:** 2 tasks (alta disponibilidade)
- **Custo:** R$ 116,80/mês
- **Status:** ✅ Mantido (Chatwoot requer recursos)

**Subtotal ECS Fargate: R$ 204,40/mês** (sem mudanças)

### 2. Banco de Dados - RDS PostgreSQL

#### Instância RDS Otimizada
- **Tipo:** db.t3.small (1 vCPU, 2 GB RAM)
- **Armazenamento:** 50 GB gp3 (SSD) - reduzido
- **Backup:** 3 dias de retenção
- **Multi-AZ:** Não

| Item | Custo Mensal (R$) |
|------|-------------------|
| Instância db.t3.small | 200,00 |
| Storage 50 GB gp3 | 7,50 |
| Backup (50 GB × 3 dias) | 4,50 |
| I/O Requests | 3,00 |
| **Subtotal RDS** | **215,00** |

**Economia:** R$ 165/mês (vs original)

### 3. Cache - ElastiCache Redis

#### Instância Redis
- **Tipo:** cache.t3.micro
- **Especificações:** 0.5 vCPU, 0.5 GB RAM
- **Quantidade:** 1 instância

| Item | Custo Mensal (R$) |
|------|-------------------|
| Instância cache.t3.micro | 80,00 |
| **Subtotal ElastiCache** | **80,00** |

**Status:** ✅ Mantido (já é o menor tamanho disponível)

### 4. Load Balancer - Application Load Balancer

#### ALB Otimizado
- **Tipo:** Application Load Balancer
- **LCU:** 10 LCU/hora (otimizado com cache)
- **Preço:** R$ 0,008/LCU-hora
- **Cálculo:** R$ 0,008 × 10 × 730 = **R$ 58,40/mês**

**Economia:** R$ 29,20/mês

### 5. Storage - EBS e S3

#### EBS Volumes Consolidados
- **Volume único:** 50 GB gp3 (consolidado)
- **Custo:** R$ 5,00/mês

#### S3 (Backups e Arquivos)
- **Storage:** 30 GB (reduzido)
- **Requests:** ~5.000 PUT + 30.000 GET
- **Custo:** R$ 1,20/mês

**Subtotal Storage: R$ 6,20/mês**

**Economia:** R$ 4,80/mês

### 6. Networking - VPC Endpoints

#### VPC Endpoints (Substitui NAT Gateway)
- **S3 Endpoint:** Gratuito
- **ECR Endpoint:** R$ 0,007/hora = R$ 5,11/mês
- **CloudWatch Endpoint:** R$ 0,01/hora = R$ 7,30/mês
- **Total:** R$ 12,41/mês

**Economia:** R$ 24,94/mês (vs NAT Gateway)

### 7. Monitoramento - Clo