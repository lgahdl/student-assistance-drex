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

### 🎓 [@tcc-monorepo/tcc-assistencia-estudantil](./packages/tcc-assistencia-estudantil)
Sistema de assistência estudantil construído sobre o DREX.

**Funcionalidades:**
- ✅ Contratos para gestão de auxílios estudantis
- ✅ Sistema de cadastro de estudantes e estabelecimentos
- ✅ Distribuição automatizada de recursos via DREX
- ✅ Controle de gastos por categoria (Alimentação, Moradia, Material, Transporte)
- ✅ Limites de gastos configuráveis
- ✅ Rastreabilidade e auditoria completa

### 📱 [@tcc-monorepo/student-assistance-mobile](./packages/student-assistance-mobile)
Aplicativo móvel React Native para interação com o sistema de assistência estudantil.

**Funcionalidades:**
- ✅ Interface intuitiva para estudantes e estabelecimentos
- ✅ Visualização de saldos e limites de gastos
- ✅ Processamento de despesas em tempo real
- ✅ Integração direta com contratos DREX
- ✅ Suporte a contas de teste para desenvolvimento
- ✅ Design responsivo com Material Design

## 🚀 Deploy Rápido

### Opção 1: Deploy Completo (Recomendado)
```bash
# Clonar repositório
git clone <repo-url>
cd tcc-monorepo

# Deploy completo com um comando
npm run deploy
```

### Opção 2: Deploy Manual
```bash
# Executar script de deploy
./deploy-student-assistance.sh
```

### Opção 3: Docker Compose
```bash
# Iniciar todos os serviços
docker-compose up -d

# Acompanhar logs
docker-compose logs -f
```

## 📋 Serviços Disponíveis

Após o deploy bem-sucedido:

| Serviço | URL | Descrição |
|---------|-----|-----------|
| Besu RPC | http://localhost:8545 | Endpoint blockchain |
| Blockscout | http://localhost:4000 | Explorer blockchain |
| PostgreSQL | localhost:5432 | Banco de dados |

## 🔧 Comandos de Gerenciamento

### Docker
```bash
# Status dos serviços
npm run docker:status

# Ver logs
npm run docker:logs

# Parar serviços
npm run docker:down

# Limpeza completa
npm run docker:clean
```

### DREX
```bash
# Compilar contratos DREX
npm run drex:compile

# Deploy integrado
npm run drex:deploy:integrated

# Testes DREX
npm run drex:test
```

### TCC
```bash
# Compilar contratos TCC
npm run tcc:compile

# Deploy TCC
npm run tcc:deploy

# Testes TCC
npm run tcc:test

# Cobertura de testes
npm run tcc:coverage
```

### Mobile App
```bash
# Iniciar app móvel
npm run mobile:start

# Executar no Android
npm run mobile:android

# Executar no iOS
npm run mobile:ios

# Executar no navegador
npm run mobile:web
```

## 🏗️ Arquitetura

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Blockscout    │    │  Student App    │    │  University     │
│   Explorer      │    │  (Frontend)     │    │  Admin Panel    │
└─────────┬───────┘    └─────────┬───────┘    └─────────┬───────┘
          │                      │                      │
          └──────────────────────┼──────────────────────┘
                                 │
                    ┌─────────────┴─────────────┐
                    │    Hyperledger Besu      │
                    │    (Blockchain Node)     │
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
                    │  │  TCC System         │ │
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
| tcc-assistencia-estudantil | ✅ Completo | Sistema completo de assistência | ✅ Integrado |
| student-assistance-mobile | ✅ Completo | App móvel React Native | ✅ Funcional |

## 💰 Sistema de Assistência Estudantil

### Funcionalidades Implementadas

- **👥 Gestão de Estudantes**: Cadastro e gerenciamento de estudantes
- **🏪 Gestão de Estabelecimentos**: Registro de estabelecimentos por categoria
- **💸 Distribuição de Auxílios**: Distribuição automática via DREX
- **📊 Controle de Gastos**: Limites por categoria configuráveis
- **🔍 Rastreabilidade**: Auditoria completa de todas as transações

### Categorias de Gastos

- **🍽️ Alimentação**: 40% do auxílio (padrão)
- **🏠 Moradia**: 35% do auxílio (padrão)
- **📚 Material Didático**: 15% do auxílio (padrão)
- **🚌 Transporte**: 10% do auxílio (padrão)
- **📦 Outros**: 0% (desabilitado por padrão)

### Contas de Teste

| Papel | Saldo Inicial | Função |
|-------|---------------|--------|
| BCB (Deployer) | 10.000 BRL | Autoridade central |
| Universidade | 9.000 BRL | Distribui auxílios |
| Estudante 1 | 450 BRL | Conta de teste |
| Estudante 2 | 500 BRL | Conta de teste |
| Restaurante | 50 BRL | Estabelecimento alimentação |

## 📚 Documentação

- **[Guia de Deploy](./DEPLOYMENT.md)**: Instruções completas de deployment
- **[DREX Package](./packages/drex-piloto/README.md)**: Documentação DREX
- **[TCC Package](./packages/tcc-assistencia-estudantil/README.md)**: Documentação TCC
- **[Mobile App](./apps/student-assistance-mobile/README.md)**: Documentação do app móvel

## 🛠️ Tecnologias

- **Blockchain**: Hyperledger Besu
- **Contratos**: Solidity + Hardhat
- **DREX**: Contratos oficiais Wire Labs
- **Monorepo**: Turborepo + npm workspaces
- **Testes**: Jest + Hardhat
- **Deploy**: Docker + Docker Compose
- **Explorer**: Blockscout

## 🧪 Testes e Validação

O sistema foi completamente testado e validado:

- ✅ Deploy de infraestrutura DREX
- ✅ Deploy do sistema TCC
- ✅ Registro de estudantes e estabelecimentos
- ✅ Distribuição de auxílios via DREX
- ✅ Processamento de gastos com validação de limites
- ✅ Controle de categorias de gastos
- ✅ Rastreabilidade de transações

## 🔗 Links Úteis

- **Besu RPC**: http://localhost:8545
- **Blockscout Explorer**: http://localhost:4000
- **Deployment Info**: `packages/drex-piloto/integrated-deployment.json`

## 📚 Referências Acadêmicas

- [PNAES - Programa Nacional de Assistência Estudantil](https://www.gov.br/mec/pt-br/acesso-a-informacao/institucional/secretarias/secretaria-de-educacao-superior/pnaes)
- [DREX - Real Digital do Banco Central](https://www.bcb.gov.br/estabilidadefinanceira/real_digital)
- [Wire Labs - Contratos Oficiais DREX](https://github.com/wireshape/real-digital-smart-contracts)
- [Hyperledger Besu Documentation](https://besu.hyperledger.org/)

---

**Desenvolvido por**: Luiz Gustavo  
**Projeto**: TCC - Sistema de Assistência Estudantil com DREX  
**Ano**: 2024  
**Status**: ✅ **Sistema Completo e Funcional**
