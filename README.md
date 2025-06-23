# TCC Monorepo - Sistema de Assistência Estudantil com DREX

Este monorepo contém a implementação completa do TCC sobre **Sistema de Assistência Estudantil utilizando DREX (Real Digital)**.

## 📦 Packages

### 🏦 [@tcc-monorepo/drex-piloto](./packages/drex-piloto)
Implementação funcional do DREX (Real Digital) com contratos oficiais Wire Labs.

**Funcionalidades:**
- ✅ Hyperledger Besu configurado
- ✅ Contratos oficiais Wire Labs (RealDigital, STR, AddressDiscovery, KeyDictionary)
- ✅ Sistema completo de deploy automatizado
- ✅ Integração com sistema TCC

### 🏛️ [@tcc-monorepo/student-assistance-vault](./packages/student-assistance-vault)
Smart contracts para gestão do vault de assistência estudantil.

**Funcionalidades:**
- ✅ Contratos para gestão de auxílios estudantis
- ✅ Sistema de cadastro de estudantes e estabelecimentos
- ✅ Distribuição automatizada de recursos via DREX
- ✅ Controle de gastos por categoria (Alimentação, Moradia, Material, Transporte)
- ✅ Limites de gastos configuráveis
- ✅ Rastreabilidade e auditoria completa

### 🖥️ [@tcc-monorepo/student-assistance-server](./packages/student-assistance-server)
Backend server Node.js/Express para gerenciamento de dados, tipos de despesas e metadados de transações.

**Funcionalidades:**
- ✅ API RESTful para gerenciamento completo do sistema
- ✅ Autenticação JWT com controle de acesso baseado em roles
- ✅ Gerenciamento de estudantes e estabelecimentos
- ✅ Controle de tipos de despesas e limites de gastos
- ✅ Metadados de transações e rastreabilidade
- ✅ Integração com PostgreSQL

### 📊 [@tcc-monorepo/student-assistance-indexer](./packages/student-assistance-indexer)
Indexador blockchain para eventos do StudentAssistanceVault construído com Ponder.

**Funcionalidades:**
- ✅ Indexação em tempo real de eventos do contrato
- ✅ API GraphQL para consulta de dados históricos
- ✅ Rastreamento de registros, depósitos e distribuições
- ✅ Estatísticas agregadas do vault
- ✅ Armazenamento em PostgreSQL

### 🎛️ [@tcc-monorepo/student-assistance-dashboard](./packages/student-assistance-dashboard)
Dashboard React moderno com interfaces para administradores, funcionários e estudantes.

**Funcionalidades:**
- ✅ Interface intuitiva para múltiplos tipos de usuários
- ✅ Painel administrativo completo para gestão do sistema
- ✅ Interface para estudantes visualizarem saldos e transações
- ✅ Gerenciamento de estabelecimentos e tipos de despesas
- ✅ Monitoramento de transações em tempo real
- ✅ Design responsivo com Tailwind CSS
- ✅ Integração direta com backend e blockchain

## 🚀 Deploy Rápido

### Opção 1: Deploy Completo (Recomendado)
```bash
# Clonar repositório
git clone <repo-url>
cd student-assistance-drex

# Deploy completo com Docker
docker-compose up -d
```

### Opção 2: Deploy Manual
```bash
# Executar script de deploy
./deploy-student-assistance.sh
```

## 📋 Serviços Disponíveis

Após o deploy bem-sucedido:

| Serviço | URL | Descrição |
|---------|-----|-----------|
| Besu RPC | http://localhost:8545 | Endpoint blockchain |
| Server API | http://localhost:3001 | Backend REST API |
| Dashboard | http://localhost:3000 | Interface web (admin/staff/student) |
| Indexer GraphQL | http://localhost:42069 | API GraphQL para dados históricos |
| PostgreSQL (Server) | localhost:5434 | Banco de dados do servidor |
| PostgreSQL (Indexer) | localhost:5433 | Banco de dados do indexador |

## 🔧 Comandos de Gerenciamento

### Docker
```bash
# Status dos serviços
docker-compose ps

# Ver logs
docker-compose logs -f

# Parar serviços
docker-compose down

# Limpeza completa
docker-compose down -v
```

### DREX
```bash
# Compilar contratos DREX
pnpm run --filter=drex-piloto compile

# Deploy DREX
pnpm run --filter=drex-piloto deploy

# Testes DREX
pnpm run --filter=drex-piloto test
```

### Vault (Smart Contracts)
```bash
# Compilar contratos Vault
pnpm run --filter=student-assistance-vault compile

# Deploy Vault
pnpm run --filter=student-assistance-vault deploy

# Testes Vault
pnpm run --filter=student-assistance-vault test

# Cobertura de testes
pnpm run --filter=student-assistance-vault coverage
```

### Server
```bash
# Executar servidor em desenvolvimento
pnpm run server dev

# Build servidor
pnpm run server build

# Migrations do banco
pnpm run server migrate
```

### Dashboard
```bash
# Executar dashboard em desenvolvimento
pnpm run dashboard dev

# Build dashboard
pnpm run dashboard build

# Preview do build
pnpm run dashboard preview
```

### Indexer
```bash
# Executar indexer em desenvolvimento
pnpm run indexer dev

# Build indexer
pnpm run indexer build

# Gerar tipos
pnpm run indexer codegen
```

## 🏗️ Arquitetura

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Dashboard     │    │  GraphQL API    │    │  REST API       │
│ (Admin/Staff/   │    │  (Indexer)      │    │  (Server)       │
│  Student)       │    │  Port 42069     │    │  Port 3001      │
└─────────┬───────┘    └─────────┬───────┘    └─────────┬───────┘
          │                      │                      │
          └──────────────────────┼──────────────────────┘
                                 │
                    ┌─────────────┴─────────────┐
                    │    Hyperledger Besu      │
                    │    (Blockchain Node)     │
                    │      Port 8545           │
                    └─────────────┬─────────────┘
                                  │
                    ┌─────────────┴─────────────┐
                    │      Smart Contracts     │
                    │                          │
                    │  ┌─────────────────────┐ │
                    │  │  DREX Infrastructure│ │
                    │  │  - RealDigital      │ │
                    │  │  - STR              │ │
                    │  │  - AddressDiscovery │ │
                    │  │  - KeyDictionary    │ │
                    │  └─────────────────────┘ │
                    │                          │
                    │  ┌─────────────────────┐ │
                    │  │  Student Vault      │ │
                    │  │  - StudentAssistance│ │
                    │  │  - Spending Limits  │ │
                    │  │  - Category Control │ │
                    │  └─────────────────────┘ │
                    └───────────────────────────┘
```

## 📊 Status dos Projetos

| Package | Status | Funcionalidades | Deploy |
|---------|--------|----------------|--------|
| drex-piloto | ✅ Completo | Contratos oficiais Wire Labs | ✅ Integrado |
| student-assistance-vault | ✅ Completo | Smart contracts do vault | ✅ Integrado |
| student-assistance-server | ✅ Completo | Backend REST API | ✅ Funcional |
| student-assistance-indexer | ✅ Completo | Indexador blockchain GraphQL | ✅ Funcional |
| student-assistance-dashboard | ✅ Completo | Interface web multi-usuário | ✅ Funcional |

## 💰 Sistema de Assistência Estudantil

### Funcionalidades Implementadas

- **👥 Gestão de Estudantes**: Cadastro e gerenciamento de estudantes
- **🏪 Gestão de Estabelecimentos**: Registro de estabelecimentos por categoria
- **💸 Distribuição de Auxílios**: Distribuição automática via DREX
- **📊 Controle de Gastos**: Limites por categoria configuráveis
- **🔍 Rastreabilidade**: Auditoria completa de todas as transações
- **📈 Dashboard Completo**: Interface para admin, staff e estudantes
- **📊 Análise Histórica**: GraphQL API para consulta de dados históricos

### Categorias de Gastos

- **🍽️ Alimentação**: 40% do auxílio (padrão)
- **🏠 Moradia**: 35% do auxílio (padrão)
- **📚 Material Didático**: 15% do auxílio (padrão)
- **🚌 Transporte**: 10% do auxílio (padrão)
- **📦 Outros**: 0% (desabilitado por padrão)

### Tipos de Usuários

| Tipo | Acesso | Funcionalidades |
|------|--------|----------------|
| **Admin** | Completo | Gerenciamento total do sistema |
| **Staff** | Limitado | Cadastro de estudantes e estabelecimentos |
| **Student** | Próprios dados | Consulta de saldos, limites e transações |

### Contas de Teste

| Papel | Credenciais | Função |
|-------|-------------|--------|
| Admin | admin / admin123 | Administração completa |
| Staff | staff / staff123 | Operações limitadas |
| BCB (Deployer) | 10.000 BRL | Autoridade central |
| Universidade | 9.000 BRL | Distribui auxílios |
| Estudante 1 | 450 BRL | Conta de teste |
| Estudante 2 | 500 BRL | Conta de teste |
| Restaurante | 50 BRL | Estabelecimento alimentação |

## 📚 Documentação

- **[Guia de Deploy](./DEPLOYMENT.md)**: Instruções completas de deployment
- **[DREX Package](./packages/drex-piloto/README.md)**: Documentação DREX
- **[Vault Package](./packages/student-assistance-vault/README.md)**: Documentação Smart Contracts
- **[Server Package](./packages/student-assistance-server/README.md)**: Documentação Backend API
- **[Indexer Package](./packages/student-assistance-indexer/README.md)**: Documentação Indexador
- **[Dashboard Package](./packages/student-assistance-dashboard/README.md)**: Documentação Interface Web

## 🛠️ Tecnologias

### Blockchain & Smart Contracts
- **Blockchain**: Hyperledger Besu
- **Contratos**: Solidity + Hardhat
- **DREX**: Contratos oficiais Wire Labs

### Backend & APIs
- **Server**: Node.js + Express + TypeScript
- **Database**: PostgreSQL (2 instâncias)
- **Indexer**: Ponder Framework
- **API**: REST + GraphQL

### Frontend
- **Dashboard**: React + TypeScript + Vite
- **Styling**: Tailwind CSS
- **State**: React Query + React Hook Form
- **Authentication**: JWT

### DevOps & Tools
- **Monorepo**: Turborepo + pnpm workspaces
- **Containerization**: Docker + Docker Compose
- **Testes**: Jest + Hardhat
- **Validation**: Zod

## 🧪 Testes e Validação

O sistema foi completamente testado e validado:

- ✅ Deploy de infraestrutura DREX
- ✅ Deploy do sistema Vault
- ✅ Registro de estudantes e estabelecimentos
- ✅ Distribuição de auxílios via DREX
- ✅ Processamento de gastos com validação de limites
- ✅ Controle de categorias de gastos
- ✅ Rastreabilidade de transações
- ✅ Interface web para múltiplos usuários
- ✅ API GraphQL para dados históricos

## 📚 Referências Acadêmicas

- [PNAES - Programa Nacional de Assistência Estudantil](https://www.gov.br/mec/pt-br/acesso-a-informacao/institucional/secretarias/secretaria-de-educacao-superior/pnaes)
- [DREX - Real Digital do Banco Central](https://www.bcb.gov.br/estabilidadefinanceira/real_digital)
- [Wire Labs - Contratos Oficiais DREX](https://github.com/wireshape/real-digital-smart-contracts)
- [Hyperledger Besu Documentation](https://besu.hyperledger.org/)
- [Ponder Framework](https://ponder.sh/)

---

**Desenvolvido por**: Luiz Gustavo  
**Projeto**: TCC - Sistema de Assistência Estudantil com DREX  
**Ano**: 2025  
**Status**: ✅ **Servidor e Indexer completos e funcionais, Dashboard incompleto, com alguns bugs e sem todas as funcionalidades propostas**
