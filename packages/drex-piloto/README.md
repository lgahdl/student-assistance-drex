# Piloto DREX - Implementação Simples ✅

Este projeto implementa um **piloto funcional do DREX** (Real Digital), a moeda digital do Banco Central do Brasil, com os contratos essenciais para demonstrar o funcionamento básico do sistema.

## 🎯 Status do Projeto

✅ **IMPLEMENTADO E TESTADO** - Todos os contratos estão funcionando corretamente!

## 📋 Contratos Implementados

### 1. **CBDCAccessControl** 
- Controle de acesso base para todo o sistema
- Define roles: MINTER, BURNER, ACCESS, MOVER, FREEZER, PAUSER
- Gerencia contas autorizadas a receber tokens

### 2. **RealDigital** (Token do Banco Central)
- Token ERC-20 principal: "Real Digital" (BRL)
- 2 casas decimais conforme documentação oficial
- Funções de mint, burn, move (autoritativa)
- Sistema de saldos congelados (frozen balance)
- Controle de acesso integrado

### 3. **RealTokenizado** (Tokens dos Bancos)
- Tokens dos bancos participantes: "BRL@CNPJ8"
- Lastreado 1:1 em Real Digital
- Sistema de reservas com congelamento automático
- Verificação de lastro completo

### 4. **SwapOneStep** (Operações de Swap)
- Swaps atômicos entre Real Digital ↔ Real Tokenizado
- Swaps entre diferentes Real Tokenizados
- Verificação de viabilidade de swaps
- Eventos de auditoria completos

## 🚀 Como Usar

### Pré-requisitos
- Docker e Docker Compose
- Node.js (v16+)
- npm

### 1. Iniciar o Ambiente Blockchain
```bash
# Iniciar Hyperledger Besu
./scripts/start-besu.sh start

# Verificar status
./scripts/start-besu.sh status
```

### 2. Instalar Dependências
```bash
npm install
```

### 3. Compilar Contratos
```bash
npm run compile
```

### 4. Fazer Deploy
```bash
npm run deploy
```

### 5. Executar Testes
```bash
npm test
```

## 📊 Resultados dos Testes

Todos os 12 testes passaram com sucesso:

- ✅ **RealDigital**: Informações, mint, congelamento, transferências
- ✅ **RealTokenizado**: Informações, lastro, mint/burn
- ✅ **SwapOneStep**: Swaps bidirecionais, verificações
- ✅ **Integração**: Fluxo completo do DREX

## 🔗 Endereços dos Contratos (Última Deploy)

```
RealDigital:     0x9ab7CA8a88F8e351f9b0eEEA5777929210199295
RealTokenizado:  0xBeC8a9e485a4B75d3b14249de7CA6D124fE94795
SwapOneStep:     0x43D1F9096674B5722D359B6402381816d5B22F28
```

## 🧪 Fluxo de Teste Implementado

1. **Banco Central emite Real Digital** (1000 BRL)
2. **BC transfere para reserva do banco** (500 BRL)
3. **Banco emite Real Tokenizado para cliente** (200 BRL@12345678)
4. **Cliente faz swap** (100 BRL@12345678 → 100 BRL)
5. **Verificação de saldos finais**

## 🏗️ Arquitetura

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   RealDigital   │◄──►│ RealTokenizado   │◄──►│   SwapOneStep   │
│      (BRL)      │    │   (BRL@CNPJ8)    │    │   (Swaps)       │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         ▲                        ▲                        ▲
         │                        │                        │
         └────────────────────────┼────────────────────────┘
                                  │
                        ┌─────────▼──────────┐
                        │ CBDCAccessControl  │
                        │  (Controle Base)   │
                        └────────────────────┘
```

## 🔐 Permissões Configuradas

- **RealDigital**: FREEZER_ROLE → RealTokenizado
- **RealDigital**: MOVER_ROLE → SwapOneStep  
- **RealTokenizado**: MINTER_ROLE → SwapOneStep
- **RealTokenizado**: BURNER_ROLE → SwapOneStep

## 📈 Próximos Passos

Para expandir para o **DREX Completo**, adicionar:
- Contratos TPFt (Títulos Públicos)
- SwapTwoSteps e SwapTwoStepsReserve
- STR (Sistema de Transferência de Reservas)
- KeyDictionary (Diretório de Identificadores)
- Operações DVP avançadas

## 📚 Documentação Técnica

- [DREX.md](./DREX.md) - Documentação técnica completa
- [DREX-diagrama.md](./DREX-diagrama.md) - Diagramas de arquitetura
- [BESU-README.md](./BESU-README.md) - Configuração do ambiente

## 🎓 Uso Acadêmico

Este projeto foi desenvolvido como parte de um TCC sobre DREX e sistemas de assistência estudantil usando blockchain. A implementação demonstra os conceitos fundamentais do Real Digital de forma funcional e testável.

---

**Status**: ✅ Funcionando | **Testes**: 12/12 ✅ | **Deploy**: ✅ Sucesso 